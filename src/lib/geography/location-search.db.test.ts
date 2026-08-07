import { makeIntroUser } from '@tests/support/fixtures/data/user'
import { describe, expect, test } from '@tests/support/fixtures/db'
import type { Database } from '@tests/support/fixtures/db'
import { seedCities, uniqueCity } from '@tests/support/fixtures/geography'
import type { TestCity } from '@tests/support/fixtures/geography'
import { sql } from 'drizzle-orm'

import { agentProfiles, user } from '@/db/schema'
import { searchLocations } from '@/lib/geography/server'

// The db fixture resets per file, not per test — re-truncate so beta city
// seeds (canonical names like 'Baltimore, MD') don't collide across tests.
async function seedFreshCities(db: Database, rows: TestCity[]) {
	await db.execute(sql`truncate table cities cascade`)
	await seedCities(db, rows)
}

async function seedAgent(db: Database, cityId: string) {
	const account = makeIntroUser()
	await db.insert(user).values(account)
	const now = new Date()
	await db.insert(agentProfiles).values({
		id: crypto.randomUUID(),
		userId: account.id,
		cityId,
		representationSide: 'buyer',
		typicalPriceRange: '400kTo750k',
		enjoyedClients: ['firstTimeBuyers'],
		brokerageName: 'Test Brokerage',
		licenseNumberState: 'LIC-123456',
		yearsLicensed: '3-5',
		energyFocus: ['fightHard', 'calm'],
		clientDecisionStyle: 'theyLetMeLead',
		clientContactStyle: 'regularCheckins',
		riskAdviceComfort: 'lowRisk',
		commissionStyle: 'openToNegotiating',
		specialties: ['vaMilitary'],
		createdAt: now,
		updatedAt: now,
	})
}

const baltimore = () => uniqueCity({ name: 'Baltimore', state: 'MD' })
const newOrleans = () => uniqueCity({ name: 'New Orleans', state: 'LA' })
const newYork = () => uniqueCity({ name: 'New York', state: 'NY' })

describe('searchLocations', () => {
	test('default list leads with enabled beta cities, other cities disabled', async ({
		db,
	}) => {
		await seedFreshCities(db, [
			baltimore(),
			newOrleans(),
			newYork(),
			uniqueCity({ name: 'Austin', state: 'TX' }),
		])

		const results = await searchLocations(db, '')
		const cities = results.filter((r) => r.kind === 'city')

		expect(cities.map((c) => c.city.name)).toEqual([
			'Baltimore',
			'New Orleans',
			'New York',
		])
		expect(cities.every((c) => c.enabled)).toBe(true)
		expect(cities.map((c) => c.agentCount)).toEqual([0, 0, 0])
	})

	test('disabled non-beta cities still appear in search matches', async ({
		db,
	}) => {
		await seedFreshCities(db, [uniqueCity({ name: 'Austburg', state: 'TX' })])

		const results = await searchLocations(db, 'austburg')

		expect(results).toHaveLength(1)
		expect(results[0]).toMatchObject({
			kind: 'city',
			enabled: false,
			agentCount: 0,
		})
	})

	test('aggregates agent counts per city', async ({ db }) => {
		const bmore = baltimore()
		const austin = uniqueCity({ name: 'Austin', state: 'TX' })
		await seedFreshCities(db, [bmore, austin])
		await seedAgent(db, bmore.id)
		await seedAgent(db, bmore.id)
		await seedAgent(db, austin.id)

		const defaults = await searchLocations(db, '')
		const byName = new Map(
			defaults
				.filter((r) => r.kind === 'city')
				.map((r) => [r.city.name, r.agentCount]),
		)

		expect(byName.get('Baltimore')).toBe(2)

		const austinResults = await searchLocations(db, 'austin')
		expect(austinResults[0]).toMatchObject({ kind: 'city', agentCount: 1 })
	})

	test('matches communities and resolves their parent city row', async ({
		db,
	}) => {
		const bmore = baltimore()
		await seedFreshCities(db, [bmore])

		const results = await searchLocations(db, 'fells')
		const communities = results.filter((r) => r.kind === 'community')

		expect(communities).toHaveLength(1)
		expect(communities[0]).toMatchObject({
			kind: 'community',
			key: 'fells-point',
			label: 'Fells Point — Baltimore, MD',
		})
		expect(communities[0]?.city.id).toBe(bmore.id)
	})

	test('matches communities across beta cities', async ({ db }) => {
		await seedFreshCities(db, [baltimore(), newOrleans(), newYork()])

		const results = await searchLocations(db, 'heights')
		const keys = results.filter((r) => r.kind === 'community').map((r) => r.key)

		expect(keys).toContain('park-heights')
		expect(keys).toContain('crown-heights')
		expect(keys).toContain('washington-heights')
	})

	test('omits communities whose beta city row is not seeded', async ({
		db,
	}) => {
		await seedFreshCities(db, [uniqueCity({ name: 'Austin', state: 'TX' })])

		const results = await searchLocations(db, 'fells')

		expect(results.filter((r) => r.kind === 'community')).toEqual([])
	})

	test('returns no community suggestions for short queries', async ({ db }) => {
		await seedFreshCities(db, [baltimore()])

		const results = await searchLocations(db, 'f')

		expect(results.filter((r) => r.kind === 'community')).toEqual([])
	})

	test('beta cities sort first among search matches', async ({ db }) => {
		await seedFreshCities(db, [
			uniqueCity({ name: 'New Braunfels', state: 'TX' }),
			newYork(),
		])

		const results = await searchLocations(db, 'new')
		const cities = results.filter((r) => r.kind === 'city')

		expect(cities[0]?.city.name).toBe('New York')
		expect(cities[0]?.enabled).toBe(true)
		expect(cities[1]?.city.name).toBe('New Braunfels')
		expect(cities[1]?.enabled).toBe(false)
	})
})
