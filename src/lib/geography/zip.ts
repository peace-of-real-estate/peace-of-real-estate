import { createServerFn } from '@tanstack/react-start'
import { and, eq, ilike, or, sql } from 'drizzle-orm'
import type { FeatureCollection } from 'geojson'
import { z } from 'zod'

import { db } from '@/db/connection'
import { cities, cityZips } from '@/db/schema'

import type { UsPostalCode } from './states'

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

export type City = { id: string; name: string; state: UsPostalCode }

export function formatCityName(city: City): string {
	return `${city.name}, ${city.state}`
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
	return or(
		...TOP_US_CITIES.map(([name, state]) =>
			and(eq(cities.name, name), eq(cities.state, state)),
		),
	)
}

function escapeLikePattern(value: string): string {
	return value.replace(/[\\%_]/g, '\\$&')
}

const cityColumns = {
	id: cities.id,
	name: cities.name,
	state: cities.state,
}

export async function searchCities(
	database: typeof db,
	query: string,
): Promise<City[]> {
	if (query.length < 2) {
		return database
			.select(cityColumns)
			.from(cities)
			.where(buildTopCitiesWhereClause())
			.orderBy(cities.name)
			.limit(10)
	}

	const escapedQuery = escapeLikePattern(query)
	return database
		.select(cityColumns)
		.from(cities)
		.where(
			or(
				ilike(sql`${cities.state}::text`, `${escapedQuery}%`),
				ilike(
					sql`${cities.name} || ', ' || ${cities.state}::text`,
					`%${escapedQuery}%`,
				),
			),
		)
		.orderBy(cities.name)
		.limit(10)
}

const loadCitySuggestions = createServerFn({ method: 'GET' })
	.validator((query: string) => z.string().trim().parse(query))
	.handler(async ({ data }): Promise<City[]> => searchCities(db, data))

const loadCityById = createServerFn({ method: 'GET' })
	.validator((cityId: string) => z.uuid().parse(cityId))
	.handler(async ({ data }): Promise<City | null> => {
		const [row] = await db
			.select(cityColumns)
			.from(cities)
			.where(eq(cities.id, data))
			.limit(1)
		return row ?? null
	})

export type CityCenter = { lat: number; lng: number }

// A resolved `cities` row: the canonical identity of a city plus its
// computed center. Profiles carry a `cityId` FK; loaders join and hand this
// object to anything that needs city facts, so logic never compares
// free-text city/state strings.
export type ResolvedCity = City & { center: CityCenter }

export type ZipGeography = { zip: string; center: CityCenter }[]

export function toZipGeography(
	rows: { zip: string; lat: number; lng: number }[],
): ZipGeography {
	return rows.map((row) => ({
		zip: row.zip,
		center: { lat: row.lat, lng: row.lng },
	}))
}

const loadCityCenter = createServerFn({ method: 'GET' })
	.validator((cityId: string) => z.uuid().parse(cityId))
	.handler(async ({ data }) => {
		const [row] = await db
			.select({ lat: cities.centerLat, lng: cities.centerLng })
			.from(cities)
			.where(eq(cities.id, data))
			.limit(1)

		return row ?? null
	})

const loadZipCodeBoundaries = createServerFn({ method: 'GET' })
	.validator((cityId: string) => z.uuid().parse(cityId))
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
	loadCityById,
	loadCityCenter,
	loadZipCodeBoundaries,
}
