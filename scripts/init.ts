import { sql } from 'drizzle-orm'
import * as zipcodes from 'zipcodes'

import { db } from '../src/db/connection'
import { cities, cityZips } from '../src/db/tables'
import {
	usPostalCodeSchema,
	type UsPostalCode,
} from '../src/lib/geography/states'
import { cityKey } from './city-key'

const BATCH_SIZE_CITIES = 1000
const BATCH_SIZE_ZIPS = 2000

// Official NYC borough ZIP ranges. Records in these ranges are ALSO added to
// the "New York, NY" city group so the whole city shows all five boroughs,
// while boroughs/neighborhoods stay searchable under their own city labels.
// Careful: 110xx (except 11004-11005) and 115xx are Nassau County, not NYC.
const NYC_ZIP_RANGES: Array<[number, number]> = [
	[10001, 10282], // Manhattan
	[10301, 10314], // Staten Island
	[10451, 10475], // Bronx
	[11004, 11005], // Queens (Glen Oaks / Floral Park border)
	[11101, 11109], // Queens (Long Island City / Astoria)
	[11201, 11256], // Brooklyn
	[11351, 11499], // Queens (Flushing, Bayside, Jamaica, JFK)
	[11691, 11697], // Queens (the Rockaways)
]

function isNycZip(zip: string): boolean {
	const value = Number.parseInt(zip, 10)
	if (!Number.isFinite(value)) return false
	return NYC_ZIP_RANGES.some(([min, max]) => value >= min && value <= max)
}

async function seedCityData() {
	const now = new Date()

	console.log('Seeding cities and city_zips...')

	const cityGroups = new Map<
		string,
		{
			city: string
			state: UsPostalCode
			lats: number[]
			lngs: number[]
			zips: string[]
		}
	>()

	// Per-zip centroids, captured alongside the city groups so scoring can
	// resolve zip distances from `city_zips` alone at runtime.
	const zipCoords = new Map<string, { lat: number; lng: number }>()

	for (const record of Object.values(zipcodes.codes)) {
		if (record.country !== 'US') continue
		// Throws on a code outside US_POSTAL_CODES: if the dataset ever adds
		// one, seeding fails loudly here rather than silently writing
		// non-canonical state values that scoring compares with `!==`.
		const state = usPostalCodeSchema.parse(record.state)
		// Zips without coordinates are excluded entirely: they can't
		// participate in distance scoring, and city_zips.lat/lng are NOT NULL.
		const hasCoords =
			Number.isFinite(record.latitude) && Number.isFinite(record.longitude)
		const key = cityKey(record.city, state)
		let group = cityGroups.get(key)
		if (!group) {
			group = {
				city: record.city,
				state,
				lats: [],
				lngs: [],
				zips: [],
			}
			cityGroups.set(key, group)
		}
		if (hasCoords) {
			group.lats.push(record.latitude)
			group.lngs.push(record.longitude)
			zipCoords.set(record.zip, {
				lat: record.latitude,
				lng: record.longitude,
			})
			group.zips.push(record.zip)
		}

		if (
			hasCoords &&
			state === 'NY' &&
			record.city !== 'New York' &&
			isNycZip(record.zip)
		) {
			const nycKey = cityKey('New York', 'NY')
			let nycGroup = cityGroups.get(nycKey)
			if (!nycGroup) {
				nycGroup = {
					city: 'New York',
					state: 'NY',
					lats: [],
					lngs: [],
					zips: [],
				}
				cityGroups.set(nycKey, nycGroup)
			}
			nycGroup.lats.push(record.latitude)
			nycGroup.lngs.push(record.longitude)
			nycGroup.zips.push(record.zip)
		}
	}

	const cityRows = []
	const zipRows = []
	for (const group of cityGroups.values()) {
		if (group.lats.length === 0) {
			throw new Error(
				`No coordinates for any zip in ${group.city}, ${group.state} — a city center is required`,
			)
		}
		const id = crypto.randomUUID()
		const centerLat = group.lats.reduce((a, b) => a + b, 0) / group.lats.length
		const centerLng = group.lngs.reduce((a, b) => a + b, 0) / group.lngs.length

		cityRows.push({
			id,
			name: group.city,
			state: group.state,
			centerLat,
			centerLng,
			createdAt: now,
		})

		for (const zip of group.zips) {
			const coords = zipCoords.get(zip)
			if (!coords) throw new Error(`No coordinates for ${zip}`)
			zipRows.push({
				id: crypto.randomUUID(),
				city: group.city,
				state: group.state,
				zip,
				lat: coords.lat,
				lng: coords.lng,
				createdAt: now,
			})
		}
	}

	const cityIdByKey = new Map<string, string>()

	for (let i = 0; i < cityRows.length; i += BATCH_SIZE_CITIES) {
		const batch = cityRows.slice(i, i + BATCH_SIZE_CITIES)
		// Centers are derived from the version-pinned zipcodes dataset, so a
		// re-seed should track the source: always overwrite with the freshly
		// computed center. DO UPDATE (not DO NOTHING) also makes Postgres run
		// every conflicting row through the UPDATE arm, so RETURNING reports
		// the id for every row in the batch — new or pre-existing — in one
		// query.
		const upserted = await db
			.insert(cities)
			.values(batch)
			.onConflictDoUpdate({
				target: [cities.name, cities.state],
				set: {
					centerLat: sql`excluded."center_lat"`,
					centerLng: sql`excluded."center_lng"`,
				},
			})
			.returning({ id: cities.id, name: cities.name, state: cities.state })
		for (const row of upserted) {
			cityIdByKey.set(cityKey(row.name, row.state), row.id)
		}
		console.log(
			`  cities ${Math.min(i + BATCH_SIZE_CITIES, cityRows.length)}/${cityRows.length}`,
		)
	}

	for (let i = 0; i < zipRows.length; i += BATCH_SIZE_ZIPS) {
		await db
			.insert(cityZips)
			.values(
				zipRows.slice(i, i + BATCH_SIZE_ZIPS).map((row) => {
					const key = cityKey(row.city, row.state)
					const cityId = cityIdByKey.get(key)
					if (!cityId) throw new Error(`No city row for ${key}`)
					return {
						id: row.id,
						cityId,
						zip: row.zip,
						lat: row.lat,
						lng: row.lng,
						createdAt: row.createdAt,
					}
				}),
			)
			.onConflictDoNothing()
		console.log(
			`  city_zips ${Math.min(i + BATCH_SIZE_ZIPS, zipRows.length)}/${zipRows.length}`,
		)
	}

	console.log(
		`Done. Seeded ${cityRows.length} cities and ${zipRows.length} city ZIP mappings.`,
	)
}

// =============================================================================
// Main
// =============================================================================

async function main() {
	try {
		console.log('Initializing reference data...')
		await seedCityData()
		console.log('Initialization complete.')
	} catch (error) {
		console.error('Initialization failed:', error)
		process.exit(1)
	}
}

void main()
