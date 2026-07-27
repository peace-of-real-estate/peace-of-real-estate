import { makeIntroUser } from '@tests/support/fixtures/data/user'
import {
	describe,
	expect,
	test,
	type Database,
} from '@tests/support/fixtures/db'
import { eq } from 'drizzle-orm'

import {
	cities,
	cityZips,
	clientProfiles,
	clientProfileZips,
	user,
} from '@/db/tables'
import type { UsPostalCode } from '@/lib/geography/states'
import { Buyer, Seller } from '@/lib/profile/repository'

type TestCity = {
	id: string
	name: string
	state: UsPostalCode
	centerLat: number
	centerLng: number
}

function uniqueCity(overrides: Partial<TestCity> = {}): TestCity {
	return {
		id: crypto.randomUUID(),
		name: `City-${crypto.randomUUID()}`,
		state: 'TX',
		centerLat: 30.2672,
		centerLng: -97.7431,
		...overrides,
	}
}

async function seedCity(db: Database, testCity: TestCity) {
	await db.insert(cities).values(testCity)
}

function buyerInsert(cityId: string) {
	return {
		base: {
			status: 'active' as const,
			cityId,
			timeline: 'exploring' as const,
			priceMin: 400_000,
			priceMax: 750_000,
			propertyTypes: ['singleFamily' as const],
			quickCommunicationChannel: 'text' as const,
			updateDeliveryMethod: 'email' as const,
			responseTimeExpectation: 'within30Min' as const,
			involvementLevel: 'veryInvolved' as const,
			commissionComfort: 'openOptions' as const,
			matchPriorities: null,
			matchDetails: null,
		},
		details: {
			experienceLevel: 'firstTime' as const,
			idealAgentRelationship: 'trustedAdvisor' as const,
			decisionMakingNeed: 'numbersData' as const,
			biddingWarResponse: 'factsOptions' as const,
		},
		zipCodes: [],
	}
}

function sellerInsert(cityId: string) {
	return {
		base: {
			...buyerInsert(cityId).base,
			priceMin: 500_000,
			priceMax: 900_000,
		},
		details: {
			saleMotivation: 'relocation' as const,
			successfulSaleLooksLike: 'speedCertainty' as const,
			homeConnection: 'asset' as const,
			agentSilencePreference: 'milestones' as const,
			representationPreference: 'broadConnections' as const,
		},
		zipCodes: [],
	}
}

describe('client profile loading', () => {
	test('resolves city and center for a buyer profile', async ({ db }) => {
		const testCity = uniqueCity()
		await seedCity(db, testCity)
		const account = makeIntroUser()
		await db.insert(user).values(account)

		await Buyer.insert(
			{
				id: crypto.randomUUID(),
				userId: account.id,
				now: new Date(),
				...buyerInsert(testCity.id),
			},
			db,
		)

		const profile = await Buyer.loadByUserId(account.id, db)
		expect(profile?.city.id).toBe(testCity.id)
		expect(profile?.city.center.lat).toBeCloseTo(testCity.centerLat)
		expect(profile?.city.center.lng).toBeCloseTo(testCity.centerLng)
		expect(profile?.geography).toEqual([])
	})

	test('resolves city and center for a seller profile', async ({ db }) => {
		const testCity = uniqueCity()
		await seedCity(db, testCity)
		const account = makeIntroUser()
		await db.insert(user).values(account)

		await Seller.insert(
			{
				id: crypto.randomUUID(),
				userId: account.id,
				now: new Date(),
				...sellerInsert(testCity.id),
			},
			db,
		)

		const profile = await Seller.loadByUserId(account.id, db)
		expect(profile?.city.center.lat).toBeCloseTo(testCity.centerLat)
		expect(profile?.city.center.lng).toBeCloseTo(testCity.centerLng)
	})
})

describe('profile insert conflicts', () => {
	test('returns false instead of inserting a duplicate buyer profile', async ({
		db,
	}) => {
		const testCity = uniqueCity()
		await seedCity(db, testCity)
		const account = makeIntroUser()
		await db.insert(user).values(account)

		const insert = () =>
			Buyer.insert(
				{
					id: crypto.randomUUID(),
					userId: account.id,
					now: new Date(),
					...buyerInsert(testCity.id),
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

describe('zip scoping', () => {
	test('rejects zips that do not belong to the selected city', async ({
		db,
	}) => {
		const testCity = uniqueCity()
		await seedCity(db, testCity)
		const account = makeIntroUser()
		await db.insert(user).values(account)

		await expect(
			Buyer.insert(
				{
					id: crypto.randomUUID(),
					userId: account.id,
					now: new Date(),
					...buyerInsert(testCity.id),
					zipCodes: ['99999'],
				},
				db,
			),
		).rejects.toThrow('zipCodes must belong to the selected city')

		const rows = await db
			.select({ id: clientProfiles.id })
			.from(clientProfiles)
			.where(eq(clientProfiles.userId, account.id))
		expect(rows).toHaveLength(0)
	})

	test('the database rejects a zip row pointing at another city', async ({
		db,
	}) => {
		const profileCity = uniqueCity()
		const otherCity = uniqueCity()
		await seedCity(db, profileCity)
		await seedCity(db, otherCity)
		const foreignZip = {
			id: crypto.randomUUID(),
			cityId: otherCity.id,
			zip: '00501',
			lat: 40.81,
			lng: -73.04,
		}
		const localZip = {
			...foreignZip,
			id: crypto.randomUUID(),
			zip: '00502',
			cityId: profileCity.id,
		}
		await db.insert(cityZips).values([foreignZip, localZip])
		const account = makeIntroUser()
		await db.insert(user).values(account)
		await Buyer.insert(
			{
				id: crypto.randomUUID(),
				userId: account.id,
				now: new Date(),
				...buyerInsert(profileCity.id),
			},
			db,
		)
		const [profile] = await db
			.select({ id: clientProfiles.id })
			.from(clientProfiles)
			.where(eq(clientProfiles.userId, account.id))
		if (!profile) throw new Error('expected a client profile row')

		await expect(
			db.insert(clientProfileZips).values({
				id: crypto.randomUUID(),
				profileId: profile.id,
				cityZipId: foreignZip.id,
				cityId: profileCity.id,
			}),
		).rejects.toThrow()

		await db.insert(clientProfileZips).values({
			id: crypto.randomUUID(),
			profileId: profile.id,
			cityZipId: localZip.id,
			cityId: profileCity.id,
		})
	})
})
