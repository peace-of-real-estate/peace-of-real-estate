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
	['New York', 'NY'],
	['Los Angeles', 'CA'],
	['Chicago', 'IL'],
	['Houston', 'TX'],
	['Phoenix', 'AZ'],
	['Philadelphia', 'PA'],
	['San Antonio', 'TX'],
	['San Diego', 'CA'],
	['Dallas', 'TX'],
	['Jacksonville', 'FL'],
] as const

export type CitySuggestion = { id: string; city: string; state: string }

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
	return or(
		...TOP_US_CITIES.map(([city, state]) =>
			and(eq(cities.city, city), eq(cities.state, state)),
		),
	)
}

function escapeLikePattern(value: string): string {
	return value.replace(/[\\%_]/g, '\\$&')
}

const citySuggestionColumns = {
	id: cities.id,
	city: cities.city,
	state: cities.state,
}

const loadCitySuggestions = createServerFn({ method: 'GET' })
	.validator((query: string) => z.string().parse(query))
	.handler(async ({ data }): Promise<CitySuggestion[]> => {
		const normalizedQuery = data.trim().toLowerCase()
		if (normalizedQuery.length < 2) {
			return db
				.select(citySuggestionColumns)
				.from(cities)
				.where(buildTopCitiesWhereClause())
				.orderBy(cities.city)
				.limit(10)
		}

		const escapedQuery = escapeLikePattern(normalizedQuery)
		return db
			.select(citySuggestionColumns)
			.from(cities)
			.where(
				or(
					ilike(cities.city, `%${escapedQuery}%`),
					ilike(cities.state, `${escapedQuery}%`),
					ilike(
						sql`${cities.city} || ', ' || ${cities.state}`,
						`%${escapedQuery}%`,
					),
				),
			)
			.orderBy(cities.city)
			.limit(10)
	})

const loadCityLabel = createServerFn({ method: 'GET' })
	.validator((cityId: string) => z.string().parse(cityId))
	.handler(async ({ data }): Promise<CitySuggestion | undefined> => {
		const [row] = await db
			.select(citySuggestionColumns)
			.from(cities)
			.where(eq(cities.id, data))
			.limit(1)
		return row
	})

// Normalizes the raw, nullable result of a `cities` lookup (no matching city
// row, or a city with no computed center) into a CityCenter, when possible.
export type CityCenter = { lat: number; lng: number }

export function toCityCenter(
	raw: { lat: number | null; lng: number | null } | null | undefined,
): CityCenter | undefined {
	if (!raw || raw.lat == null || raw.lng == null) return undefined
	return { lat: raw.lat, lng: raw.lng }
}

const loadCityCenter = createServerFn({ method: 'GET' })
	.validator((cityId: string) => z.string().parse(cityId))
	.handler(async ({ data }) => {
		const [row] = await db
			.select({ lat: cities.centerLat, lng: cities.centerLng })
			.from(cities)
			.where(eq(cities.id, data))
			.limit(1)

		const center = toCityCenter(row)
		return center && { latitude: center.lat, longitude: center.lng }
	})

const loadZipCodeBoundaries = createServerFn({ method: 'GET' })
	.validator((cityId: string) => z.string().parse(cityId))
	.handler(async ({ data }) => {
		const zipRows = await db
			.select({ zip: cityZips.zip })
			.from(cityZips)
			.where(eq(cityZips.cityId, data))
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

export {
	loadCitySuggestions,
	loadCityLabel,
	loadCityCenter,
	loadZipCodeBoundaries,
}
