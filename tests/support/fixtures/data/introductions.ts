import { eq } from 'drizzle-orm'

import {
	agentProfiles,
	agentProfileZips,
	buyerDetails,
	cities,
	cityZips,
	clientProfiles,
	clientProfileZips,
	introAccessWindows,
	introductions,
	user,
} from '@/db/tables'
import type { ResolvedCity, ZipGeography } from '@/lib/geography/zip'
import {
	encodeData,
	type IntroductionData,
} from '@/lib/introductions/intro-data'
import type { IntroductionStatus } from '@/lib/introductions/types'
import type { AgentProfile, BuyerProfile } from '@/lib/profile/types'

import type { Database } from '../db'
import { makeAgent } from './agent-profile'
import { makeBuyerProfile } from './buyer-profile'
import { makeIntroUser, type IntroUser } from './user'

const DAY_MS = 86_400_000

export function daysAgo(days: number, from: Date = new Date()): Date {
	return new Date(from.getTime() - days * DAY_MS)
}

export function hoursAgo(hours: number, from: Date = new Date()): Date {
	return new Date(from.getTime() - hours * 3_600_000)
}

// Seeded clients and agents share the Baltimore market so location and state
// disqualifiers don't fire unless a test opts into them.
const INTRO_CITY: ResolvedCity = {
	id: 'city-fixture-baltimore-md',
	name: 'Baltimore',
	state: 'MD',
	center: { lat: 39.2904, lng: -76.6122 },
}

const INTRO_GEOGRAPHY: ZipGeography = [
	{ zip: '21201', center: { lat: 39.2946, lng: -76.6239 } },
]

export type IntroClientSeed = {
	user: IntroUser
	profile: BuyerProfile
}

export function makeIntroClient(
	overrides: Partial<BuyerProfile> = {},
): IntroClientSeed {
	const account = makeIntroUser()
	const profile = makeBuyerProfile({
		id: crypto.randomUUID(),
		userId: account.id,
		status: 'active',
		city: INTRO_CITY,
		geography: INTRO_GEOGRAPHY,
		priceMin: 400_000,
		priceMax: 600_000,
		...overrides,
	})
	return { user: account, profile }
}

export type IntroAgentSeed = {
	user: IntroUser
	profile: AgentProfile
}

export function makeIntroAgent(
	overrides: Partial<AgentProfile> = {},
): IntroAgentSeed {
	const profile = makeAgent({
		id: crypto.randomUUID(),
		userId: crypto.randomUUID(),
		...overrides,
	})
	return { user: makeIntroUser({ id: profile.userId }), profile }
}

export function introDataFor(
	status: IntroductionStatus,
	at: Date = new Date(),
): IntroductionData {
	switch (status) {
		case 'pending':
			return encodeData.pending()
		case 'accepted':
			return encodeData.accepted(at)
		case 'connected':
			return encodeData.connected(at)
		case 'declined':
		case 'withdrawn':
			return encodeData.closed(at)
	}
}

export function makeIntroduction(input: {
	clientProfileId: string
	agentProfileId: string
	overrides?: Partial<typeof introductions.$inferInsert>
}): typeof introductions.$inferInsert {
	const now = new Date()
	const status = input.overrides?.status ?? 'pending'
	return {
		id: crypto.randomUUID(),
		clientProfileId: input.clientProfileId,
		agentProfileId: input.agentProfileId,
		status,
		data: introDataFor(status, now),
		createdAt: now,
		updatedAt: now,
		...input.overrides,
	}
}

export function makeAccessWindow(
	clientProfileId: string,
	overrides: Partial<typeof introAccessWindows.$inferInsert> = {},
): typeof introAccessWindows.$inferInsert {
	const now = new Date()
	return {
		id: crypto.randomUUID(),
		clientProfileId,
		stripePaymentIntentId: `pi_${crypto.randomUUID()}`,
		startsAt: daysAgo(1, now),
		endsAt: new Date(now.getTime() + 180 * DAY_MS),
		createdAt: now,
		updatedAt: now,
		...overrides,
	}
}

async function seedCity(db: Database, city: ResolvedCity): Promise<void> {
	await db
		.insert(cities)
		.values({
			id: city.id,
			name: city.name,
			state: city.state,
			centerLat: city.center?.lat ?? null,
			centerLng: city.center?.lng ?? null,
		})
		.onConflictDoNothing()
}

async function seedCityZips(
	db: Database,
	cityId: string,
	geography: ZipGeography,
): Promise<string[]> {
	const ids: string[] = []
	for (const { zip, center } of geography) {
		const [inserted] = await db
			.insert(cityZips)
			.values({
				id: crypto.randomUUID(),
				cityId,
				zip,
				lat: center.lat,
				lng: center.lng,
			})
			.onConflictDoNothing({ target: cityZips.zip })
			.returning({ id: cityZips.id })
		if (inserted) {
			ids.push(inserted.id)
			continue
		}
		const [existing] = await db
			.select({ id: cityZips.id })
			.from(cityZips)
			.where(eq(cityZips.zip, zip))
		if (existing) ids.push(existing.id)
	}
	return ids
}

export async function seedClient(
	db: Database,
	overrides: Partial<BuyerProfile> = {},
): Promise<IntroClientSeed> {
	const seed = makeIntroClient(overrides)
	const { city, geography, ...flat } = seed.profile
	const {
		experienceLevel,
		idealAgentRelationship,
		decisionMakingNeed,
		biddingWarResponse,
		...base
	} = flat
	await db.insert(user).values(seed.user)
	await seedCity(db, city)
	await db.insert(clientProfiles).values({ ...base, cityId: city.id })
	await db.insert(buyerDetails).values({
		clientProfileId: seed.profile.id,
		experienceLevel,
		idealAgentRelationship,
		decisionMakingNeed,
		biddingWarResponse,
	})
	const cityZipIds = await seedCityZips(db, city.id, geography)
	if (cityZipIds.length > 0) {
		await db.insert(clientProfileZips).values(
			cityZipIds.map((cityZipId) => ({
				id: crypto.randomUUID(),
				profileId: seed.profile.id,
				cityZipId,
				cityId: city.id,
			})),
		)
	}
	return seed
}

export async function seedAgent(
	db: Database,
	overrides: Partial<AgentProfile> = {},
): Promise<IntroAgentSeed> {
	const seed = makeIntroAgent(overrides)
	const { city, geography, ...values } = seed.profile
	await db.insert(user).values(seed.user)
	await seedCity(db, city)
	await db.insert(agentProfiles).values({ ...values, cityId: city.id })
	const cityZipIds = await seedCityZips(db, city.id, geography)
	if (cityZipIds.length > 0) {
		await db.insert(agentProfileZips).values(
			cityZipIds.map((cityZipId) => ({
				id: crypto.randomUUID(),
				profileId: seed.profile.id,
				cityZipId,
				cityId: city.id,
			})),
		)
	}
	return seed
}
