import { mockBuyerProfile } from '@tests/support/fixtures/data/buyer-profile'
import { mockSellerProfile } from '@tests/support/fixtures/data/seller-profile'
import { makeIntroUser } from '@tests/support/fixtures/data/user'
import {
	describe,
	expect,
	test,
	type Database,
} from '@tests/support/fixtures/db'
import { eq } from 'drizzle-orm'

import { cities, clientProfiles, user } from '@/db/tables'
import {
	insertBuyerProfile,
	insertSellerProfile,
} from '@/lib/profile/repository'

type TestCity = {
	city: string
	state: string
	centerLat: number
	centerLng: number
}

function uniqueCity(): TestCity {
	return {
		city: `City-${crypto.randomUUID()}`,
		state: 'TX',
		centerLat: 30.2672,
		centerLng: -97.7431,
	}
}

async function seedCity(db: Database, testCity: TestCity) {
	await db.insert(cities).values({ id: crypto.randomUUID(), ...testCity })
}

function buyerInsert() {
	const {
		experienceLevel,
		idealAgentRelationship,
		decisionMakingNeed,
		biddingWarResponse,
		id: _id,
		userId: _userId,
		createdAt: _createdAt,
		updatedAt: _updatedAt,
		...base
	} = mockBuyerProfile
	return {
		base: { ...base, status: 'active' as const },
		details: {
			experienceLevel,
			idealAgentRelationship,
			decisionMakingNeed,
			biddingWarResponse,
		},
	}
}

async function loadProfile(db: Database, id: string) {
	const [row] = await db
		.select()
		.from(clientProfiles)
		.where(eq(clientProfiles.id, id))
		.limit(1)
	if (!row) throw new Error(`profile ${id} not found`)
	return row
}

describe('profile location defaults', () => {
	test('persists the city center when the draft has none', async ({ db }) => {
		const testCity = uniqueCity()
		await seedCity(db, testCity)
		const account = makeIntroUser()
		await db.insert(user).values(account)

		const id = crypto.randomUUID()
		const { base, details } = buyerInsert()
		await insertBuyerProfile(
			{
				id,
				userId: account.id,
				now: new Date(),
				base: {
					...base,
					city: testCity.city,
					state: testCity.state,
					zipCodes: [],
				},
				details,
			},
			db,
		)

		const profile = await loadProfile(db, id)
		expect(profile.cityCenterLatitude).toBeCloseTo(testCity.centerLat)
		expect(profile.cityCenterLongitude).toBeCloseTo(testCity.centerLng)
		expect(profile.zipCodes).toEqual([])
	})

	test('keeps an explicitly provided city center', async ({ db }) => {
		const testCity = uniqueCity()
		await seedCity(db, testCity)
		const account = makeIntroUser()
		await db.insert(user).values(account)

		const id = crypto.randomUUID()
		const { base, details } = buyerInsert()
		await insertBuyerProfile(
			{
				id,
				userId: account.id,
				now: new Date(),
				base: {
					...base,
					city: testCity.city,
					state: testCity.state,
					cityCenterLatitude: 1,
					cityCenterLongitude: 2,
				},
				details,
			},
			db,
		)

		const profile = await loadProfile(db, id)
		expect(profile.cityCenterLatitude).toBe(1)
		expect(profile.cityCenterLongitude).toBe(2)
	})

	test('leaves the center null for an unknown city', async ({ db }) => {
		const account = makeIntroUser()
		await db.insert(user).values(account)

		const id = crypto.randomUUID()
		const { base, details } = buyerInsert()
		await insertBuyerProfile(
			{
				id,
				userId: account.id,
				now: new Date(),
				base: { ...base, city: `Missing-${crypto.randomUUID()}`, state: 'ZZ' },
				details,
			},
			db,
		)

		const profile = await loadProfile(db, id)
		expect(profile.cityCenterLatitude).toBeNull()
		expect(profile.cityCenterLongitude).toBeNull()
	})

	test('applies the same default to seller profiles', async ({ db }) => {
		const testCity = uniqueCity()
		await seedCity(db, testCity)
		const account = makeIntroUser()
		await db.insert(user).values(account)

		const {
			saleMotivation,
			successfulSaleLooksLike,
			homeConnection,
			agentSilencePreference,
			representationPreference,
			agentDeliveryExpectations,
			id: _id,
			userId: _userId,
			createdAt: _createdAt,
			updatedAt: _updatedAt,
			...base
		} = mockSellerProfile

		const id = crypto.randomUUID()
		await insertSellerProfile(
			{
				id,
				userId: account.id,
				now: new Date(),
				base: {
					...base,
					status: 'active',
					city: testCity.city,
					state: testCity.state,
					zipCodes: [],
				},
				details: {
					saleMotivation,
					successfulSaleLooksLike,
					homeConnection,
					agentSilencePreference,
					representationPreference,
					agentDeliveryExpectations,
				},
			},
			db,
		)

		const profile = await loadProfile(db, id)
		expect(profile.cityCenterLatitude).toBeCloseTo(testCity.centerLat)
		expect(profile.cityCenterLongitude).toBeCloseTo(testCity.centerLng)
	})
})

describe('profile insert conflicts', () => {
	test('returns false instead of inserting a duplicate buyer profile', async ({
		db,
	}) => {
		const account = makeIntroUser()
		await db.insert(user).values(account)

		const { base, details } = buyerInsert()
		const insert = () =>
			insertBuyerProfile(
				{
					id: crypto.randomUUID(),
					userId: account.id,
					now: new Date(),
					base,
					details,
				},
				db,
			)

		expect(await insert()).toBe(true)
		expect(await insert()).toBe(false)

		const rows = await db
			.select({ id: clientProfiles.id })
			.from(clientProfiles)
			.where(eq(clientProfiles.userId, account.id))
		expect(rows).toHaveLength(1)
	})
})
