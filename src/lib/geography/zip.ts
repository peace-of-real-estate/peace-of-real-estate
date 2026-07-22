import { createServerFn } from '@tanstack/react-start'
import { and, eq, ilike, or, sql } from 'drizzle-orm'
import type { FeatureCollection } from 'geojson'
import { z } from 'zod'

import { db } from '@/db/connection'
import { cities, cityZips } from '@/db/tables'

const TIGERWEB_ZCTA_URL =
	'https://tigerweb.geo.census.gov/arcgis/rest/services/TIGERweb/tigerWMS_Current/MapServer/2/query'

const BATCH_SIZE = 50
const MAX_ZIPS = 500

const TOP_US_CITIES = [
	'New York, NY',
	'Los Angeles, CA',
	'Chicago, IL',
	'Houston, TX',
	'Phoenix, AZ',
	'Philadelphia, PA',
	'San Antonio, TX',
	'San Diego, CA',
	'Dallas, TX',
	'Jacksonville, FL',
]

const cityStateSchema = z.object({
	city: z.string(),
	state: z.string(),
})

type CityState = z.infer<typeof cityStateSchema>

export function parseCityState(
	location: string,
): { city: string; state: string } | undefined {
	const [cityName, rest] = location.split(',').map((part) => part.trim())
	if (!cityName || !rest) return undefined
	const state = rest.split(/\s+/)[0]
	if (!state || state.length !== 2) return undefined
	return { city: cityName, state: state.toUpperCase() }
}

export function isValidZipCode(zipCode: string) {
	return /^\d{5}$/.test(zipCode)
}

async function fetchZipBoundaryBatch(
	zipCodes: string[],
): Promise<FeatureCollection> {
	const list = zipCodes.map((zipCode) => `'${zipCode}'`).join(',')
	const url = new URL(TIGERWEB_ZCTA_URL)
	url.searchParams.set('where', `ZCTA5 IN (${list})`)
	url.searchParams.set('outFields', 'ZCTA5,BASENAME')
	url.searchParams.set('returnGeometry', 'true')
	url.searchParams.set('f', 'geojson')
	url.searchParams.set('outSR', '4326')
	url.searchParams.set('geometryPrecision', '4')
	url.searchParams.set('maxAllowableOffset', '0.0005')

	const response = await fetch(url)
	if (!response.ok) {
		throw new Error(
			`TIGERweb request failed with status ${response.status}: ${await response.text()}`,
		)
	}

	const data: FeatureCollection = await response.json()
	return data
}

function buildTopCitiesWhereClause() {
	const values = TOP_US_CITIES.map((city) => `'${city}'`).join(', ')
	return sql`${cities.city} || ', ' || ${cities.state} in (${sql.raw(values)})`
}

function escapeLikePattern(value: string): string {
	return value.replace(/[\\%_]/g, '\\$&')
}

const loadCitySuggestions = createServerFn({ method: 'GET' })
	.validator((query: string) => z.string().parse(query))
	.handler(async ({ data }) => {
		const normalizedQuery = escapeLikePattern(data.trim().toLowerCase())
		if (normalizedQuery.length < 2) {
			const topCities = await db
				.select({
					label: sql<string>`concat(${cities.city}, ', ', ${cities.state})`,
				})
				.from(cities)
				.where(buildTopCitiesWhereClause())
				.orderBy(cities.city)
				.limit(10)

			return topCities.map((row) => row.label)
		}

		const matches = await db
			.select({
				label: sql<string>`concat(${cities.city}, ', ', ${cities.state})`,
			})
			.from(cities)
			.where(
				or(
					ilike(cities.city, `%${normalizedQuery}%`),
					ilike(cities.state, `${normalizedQuery}%`),
					ilike(
						sql`${cities.city} || ', ' || ${cities.state}`,
						`%${normalizedQuery}%`,
					),
				),
			)
			.orderBy(cities.city)
			.limit(10)

		return matches.map((row) => row.label)
	})

const loadCityCenter = createServerFn({ method: 'GET' })
	.validator((data: CityState) => cityStateSchema.parse(data))
	.handler(async ({ data }) => {
		const [row] = await db
			.select({ centerLat: cities.centerLat, centerLng: cities.centerLng })
			.from(cities)
			.where(and(eq(cities.city, data.city), eq(cities.state, data.state)))
			.limit(1)

		if (!row) return undefined
		return { latitude: row.centerLat, longitude: row.centerLng }
	})

const loadZipCodeBoundaries = createServerFn({ method: 'GET' })
	.validator((data: CityState) => cityStateSchema.parse(data))
	.handler(async ({ data }) => {
		const zipRows = await db
			.select({ zip: cityZips.zip })
			.from(cityZips)
			.innerJoin(cities, eq(cityZips.cityId, cities.id))
			.where(and(eq(cities.city, data.city), eq(cities.state, data.state)))
			.orderBy(cityZips.zip)
			.limit(MAX_ZIPS)

		const zipCodes = zipRows.map((row) => row.zip)

		if (zipCodes.length === 0) {
			return {
				type: 'FeatureCollection',
				features: [],
			} satisfies FeatureCollection
		}

		const batches: string[][] = []
		for (let index = 0; index < zipCodes.length; index += BATCH_SIZE) {
			batches.push(zipCodes.slice(index, index + BATCH_SIZE))
		}

		const results = await Promise.all(batches.map(fetchZipBoundaryBatch))

		return {
			type: 'FeatureCollection',
			features: results.flatMap((collection) => collection.features),
		} satisfies FeatureCollection
	})

export { loadCitySuggestions, loadCityCenter, loadZipCodeBoundaries }
