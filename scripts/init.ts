import { db } from '../src/db/connection'
import { cities, cityZips } from '../src/db/tables'
import * as zipcodes from 'zipcodes'

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
			state: string
			lats: number[]
			lngs: number[]
			zips: string[]
		}
	>()

	for (const record of Object.values(zipcodes.codes)) {
		if (record.country !== 'US') continue
		const key = `${record.city}|${record.state}`
		let group = cityGroups.get(key)
		if (!group) {
			group = {
				city: record.city,
				state: record.state,
				lats: [],
				lngs: [],
				zips: [],
			}
			cityGroups.set(key, group)
		}
		if (
			typeof record.latitude === 'number' &&
			typeof record.longitude === 'number'
		) {
			group.lats.push(record.latitude)
			group.lngs.push(record.longitude)
		}
		group.zips.push(record.zip)

		if (
			record.state === 'NY' &&
			record.city !== 'New York' &&
			isNycZip(record.zip)
		) {
			const nycKey = 'New York|NY'
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
			if (
				typeof record.latitude === 'number' &&
				typeof record.longitude === 'number'
			) {
				nycGroup.lats.push(record.latitude)
				nycGroup.lngs.push(record.longitude)
			}
			nycGroup.zips.push(record.zip)
		}
	}

	const cityRows = []
	const zipRows = []
	for (const group of cityGroups.values()) {
		const id = crypto.randomUUID()
		const centerLat =
			group.lats.length > 0
				? String(group.lats.reduce((a, b) => a + b, 0) / group.lats.length)
				: '0'
		const centerLng =
			group.lngs.length > 0
				? String(group.lngs.reduce((a, b) => a + b, 0) / group.lngs.length)
				: '0'

		cityRows.push({
			id,
			city: group.city,
			state: group.state,
			centerLat,
			centerLng,
			createdAt: now,
		})

		for (const zip of group.zips) {
			zipRows.push({
				id: crypto.randomUUID(),
				city: group.city,
				state: group.state,
				zip,
				createdAt: now,
			})
		}
	}

	for (let i = 0; i < cityRows.length; i += BATCH_SIZE_CITIES) {
		await db
			.insert(cities)
			.values(cityRows.slice(i, i + BATCH_SIZE_CITIES))
			.onConflictDoNothing({
				target: [cities.city, cities.state],
			})
		console.log(
			`  cities ${Math.min(i + BATCH_SIZE_CITIES, cityRows.length)}/${cityRows.length}`,
		)
	}

	for (let i = 0; i < zipRows.length; i += BATCH_SIZE_ZIPS) {
		await db
			.insert(cityZips)
			.values(zipRows.slice(i, i + BATCH_SIZE_ZIPS))
			.onConflictDoNothing({
				target: [cityZips.city, cityZips.state, cityZips.zip],
			})
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
