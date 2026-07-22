import {
	agentProfiles,
	buyerDetails,
	clientProfiles,
	introAccessWindows,
	introductions,
	user,
} from '@/db/tables'
import {
	encodeData,
	type IntroductionData,
} from '@/lib/introductions/intro-data'
import type { IntroductionStatus } from '@/lib/introductions/types'
import type { AgentProfile, BuyerProfile } from '@/lib/profile/types'

import type { Database } from '../db'
import { makeAgent } from './agent-profile'
import { mockBuyerProfile } from './buyer-profile'

const DAY_MS = 86_400_000

export function daysAgo(days: number, from: Date = new Date()): Date {
	return new Date(from.getTime() - days * DAY_MS)
}

export function hoursAgo(hours: number, from: Date = new Date()): Date {
	return new Date(from.getTime() - hours * 3_600_000)
}

import { makeIntroUser, type IntroUser } from './user'

export type IntroClientSeed = {
	user: IntroUser
	profile: typeof clientProfiles.$inferInsert
	details: typeof buyerDetails.$inferInsert
}

export function makeIntroClient(
	overrides: Partial<BuyerProfile> = {},
): IntroClientSeed {
	const user = makeIntroUser()
	const profileId = crypto.randomUUID()
	const merged: BuyerProfile = {
		...mockBuyerProfile,
		status: 'active',
		state: 'MD',
		city: 'Baltimore',
		zipCodes: ['21201'],
		priceRange: '400000-600000',
		...overrides,
	}
	const {
		experienceLevel,
		idealAgentRelationship,
		decisionMakingNeed,
		biddingWarResponse,
		...base
	} = merged
	return {
		user,
		profile: { ...base, id: profileId, userId: user.id, role: 'buyer' },
		details: {
			clientProfileId: profileId,
			experienceLevel,
			idealAgentRelationship,
			decisionMakingNeed,
			biddingWarResponse,
		},
	}
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

export async function seedClient(
	db: Database,
	overrides: Partial<BuyerProfile> = {},
): Promise<IntroClientSeed> {
	const seed = makeIntroClient(overrides)
	await db.insert(user).values(seed.user)
	await db.insert(clientProfiles).values(seed.profile)
	await db.insert(buyerDetails).values(seed.details)
	return seed
}

export async function seedAgent(
	db: Database,
	overrides: Partial<AgentProfile> = {},
): Promise<IntroAgentSeed> {
	const seed = makeIntroAgent(overrides)
	await db.insert(user).values(seed.user)
	await db.insert(agentProfiles).values(seed.profile)
	return seed
}
