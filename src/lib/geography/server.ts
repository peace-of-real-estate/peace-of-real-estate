import { createServerFn } from '@tanstack/react-start'
import { and, count, eq, ilike, inArray, or, sql } from 'drizzle-orm'
import type { FeatureCollection } from 'geojson'
import { z } from 'zod'

import { db } from '@/db/connection'
import { agentProfiles, cities, cityZips } from '@/db/schema'

import {
	BETA_CITIES,
	betaCityFor,
	formatCommunityLabel,
	isBetaCity,
	matchCommunities,
} from './communities'
import { dissolveToCommunityBoundaries } from './community-boundaries'
import type { LocationSuggestion } from './location-search'
import type { City } from './zip'

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

const cityColumns = {
	id: cities.id,
	name: cities.name,
	state: cities.state,
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
	// No maxAllowableOffset: per-polygon simplification makes adjacent ZCTA
	// borders diverge, which shows up as hairline gaps between communities.
	// Coordinates are quantized to a shared grid before dissolving instead.
	url.searchParams.set('geometryPrecision', '5')

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

const MAX_CITY_SUGGESTIONS = 10
const MAX_COMMUNITY_SUGGESTIONS = 5

async function loadBetaCityRows(
	database: typeof db,
	names: readonly { name: string; state: City['state'] }[],
): Promise<City[]> {
	if (names.length === 0) return []
	return database
		.select(cityColumns)
		.from(cities)
		.where(
			or(
				...names.map(({ name, state }) =>
					and(eq(cities.name, name), eq(cities.state, state)),
				),
			),
		)
}

export async function searchLocations(
	database: typeof db,
	query: string,
): Promise<LocationSuggestion[]> {
	const cityRows = await searchCities(database, query)

	// Beta cities always lead: prepended on the default list, sorted first
	// among search matches.
	let orderedCities: City[]
	if (query.length < 2) {
		const betaRows = await loadBetaCityRows(database, BETA_CITIES)
		const betaIds = new Set(betaRows.map((row) => row.id))
		orderedCities = [
			...betaRows,
			...cityRows.filter((row) => !betaIds.has(row.id)),
		].slice(0, MAX_CITY_SUGGESTIONS)
	} else {
		orderedCities = [...cityRows].sort(
			(a, b) => Number(isBetaCity(b)) - Number(isBetaCity(a)),
		)
	}

	const agentCountByCityId = new Map<string, number>()
	if (orderedCities.length > 0) {
		const rows = await database
			.select({ cityId: agentProfiles.cityId, count: count() })
			.from(agentProfiles)
			.where(
				inArray(
					agentProfiles.cityId,
					orderedCities.map((city) => city.id),
				),
			)
			.groupBy(agentProfiles.cityId)
		for (const row of rows) agentCountByCityId.set(row.cityId, row.count)
	}

	const suggestions: LocationSuggestion[] = []

	const communityMatches = matchCommunities(query).slice(
		0,
		MAX_COMMUNITY_SUGGESTIONS,
	)
	if (communityMatches.length > 0) {
		const betaRows = await loadBetaCityRows(
			database,
			communityMatches.map((match) => match.city),
		)
		const betaRowByIdentity = new Map(
			betaRows.map((row) => [`${row.name}|${row.state}`, row] as const),
		)
		for (const { city, community } of communityMatches) {
			const row = betaRowByIdentity.get(`${city.name}|${city.state}`)
			// Skip communities whose beta city row is missing (unseeded DB).
			if (!row) continue
			suggestions.push({
				kind: 'community',
				key: community.key,
				name: community.name,
				label: formatCommunityLabel(community, city),
				city: row,
			})
		}
	}

	for (const city of orderedCities) {
		suggestions.push({
			kind: 'city',
			city,
			agentCount: agentCountByCityId.get(city.id) ?? 0,
			enabled: isBetaCity(city),
		})
	}

	return suggestions
}

const searchLocationSuggestions = createServerFn({ method: 'GET' })
	.validator((query: string) => z.string().trim().parse(query))
	.handler(
		async ({ data }): Promise<LocationSuggestion[]> =>
			searchLocations(db, data),
	)

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

const loadCommunityBoundaries = createServerFn({ method: 'GET' })
	.validator((cityId: string) => z.uuid().parse(cityId))
	.handler(async ({ data }): Promise<FeatureCollection> => {
		const empty: FeatureCollection = {
			type: 'FeatureCollection',
			features: [],
		}

		const [city] = await db
			.select(cityColumns)
			.from(cities)
			.where(eq(cities.id, data))
			.limit(1)
		if (!city) return empty

		const zipRows = await db
			.select({ zip: cityZips.zip })
			.from(cityZips)
			.where(eq(cityZips.cityId, data))
			.orderBy(cityZips.zip)
			.limit(MAX_ZIPS)

		const zipCodes = zipRows.map((row) => row.zip)
		if (zipCodes.length === 0) return empty

		const batches: string[][] = []
		for (let index = 0; index < zipCodes.length; index += BATCH_SIZE) {
			batches.push(zipCodes.slice(index, index + BATCH_SIZE))
		}

		const results = await Promise.all(batches.map(fetchZipBoundaryBatch))
		const zipBoundaries: FeatureCollection = {
			type: 'FeatureCollection',
			features: results.flatMap((collection) => collection.features),
		}

		const betaCity = betaCityFor(city)
		return betaCity
			? dissolveToCommunityBoundaries(betaCity, zipBoundaries)
			: empty
	})

export {
	searchLocationSuggestions,
	loadCityById,
	loadCityCenter,
	loadCommunityBoundaries,
}
