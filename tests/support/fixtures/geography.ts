import { cities } from '@/db/schema'
import type { UsPostalCode } from '@/lib/geography/states'
import type {
	CityCenter,
	ResolvedCity,
	ZipGeography,
} from '@/lib/geography/zip'

import type { Database } from './db'

export type TestCity = {
	id: string
	name: string
	state: UsPostalCode
	centerLat: number
	centerLng: number
}

export function uniqueCity(overrides: Partial<TestCity> = {}): TestCity {
	return {
		id: crypto.randomUUID(),
		name: `City-${crypto.randomUUID()}`,
		state: 'TX',
		centerLat: 30.2672,
		centerLng: -97.7431,
		...overrides,
	}
}

export async function seedCities(db: Database, rows: TestCity[]) {
	await db.insert(cities).values(rows)
}

export const austinCity: ResolvedCity = {
	id: '01936f00-0000-7000-8000-000000000aa1',
	name: 'Austin',
	state: 'TX',
	center: { lat: 30.2672, lng: -97.7431 },
}

export function geoOf(centroids: Record<string, CityCenter>): ZipGeography {
	return Object.entries(centroids).map(([zip, center]) => ({ zip, center }))
}
