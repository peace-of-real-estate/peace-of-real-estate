import { describe, expect, test } from '@tests/support/fixtures/db'
import { seedCities, uniqueCity } from '@tests/support/fixtures/geography'

import { searchCities } from '@/lib/geography/server'

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
