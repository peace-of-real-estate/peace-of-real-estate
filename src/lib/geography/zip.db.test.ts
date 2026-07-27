import {
	describe,
	expect,
	test,
	type Database,
} from '@tests/support/fixtures/db'

import { cities } from '@/db/tables'
import type { UsPostalCode } from '@/lib/geography/states'
import { searchCities } from '@/lib/geography/zip'

type TestCity = {
	id: string
	name: string
	state: UsPostalCode
	centerLat: number
	centerLng: number
}

function uniqueCity(overrides: Pick<TestCity, 'name' | 'state'>): TestCity {
	return {
		id: crypto.randomUUID(),
		centerLat: 30.2672,
		centerLng: -97.7431,
		...overrides,
	}
}

async function seedCities(db: Database, rows: TestCity[]) {
	await db.insert(cities).values(rows)
}

describe('searchCities', () => {
	test('matches by city name', async ({ db }) => {
		const name = `Austburg-${crypto.randomUUID()}`
		await seedCities(db, [
			uniqueCity({ name, state: 'OR' }),
			uniqueCity({ name: `Other-${crypto.randomUUID()}`, state: 'OR' }),
		])

		const results = await searchCities(db, name.toLowerCase())

		expect(results.map((city) => city.name)).toEqual([name])
	})

	test('matches by state postal code', async ({ db }) => {
		await seedCities(db, [
			uniqueCity({ name: `Austin-${crypto.randomUUID()}`, state: 'TX' }),
			uniqueCity({ name: `Houston-${crypto.randomUUID()}`, state: 'TX' }),
			uniqueCity({ name: `LosAngeles-${crypto.randomUUID()}`, state: 'CA' }),
		])

		const results = await searchCities(db, 'tx')

		expect(results.every((city) => city.state === 'TX')).toBe(true)
		expect(results).toHaveLength(2)
	})

	test("matches by 'city, state' composite", async ({ db }) => {
		const name = `Austin-${crypto.randomUUID()}`
		await seedCities(db, [
			uniqueCity({ name, state: 'NM' }),
			uniqueCity({ name, state: 'NV' }),
		])

		const results = await searchCities(db, `${name}, nm`.toLowerCase())

		expect(results.map((city) => city.state)).toEqual(['NM'])
	})
})
