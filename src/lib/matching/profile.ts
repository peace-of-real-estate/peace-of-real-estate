import { createServerFn } from '@tanstack/react-start'
import { eq } from 'drizzle-orm'
import { db } from '@/db/connection'
import { agentProfiles, buyerProfiles, sellerProfiles, user } from '@/db/tables'
import { requireUserId } from '@/lib/auth/session'
import { calculateFitScore, type AgentMatchData } from '@/lib/matching/scoring'
import { getAvatarUrl } from '@/lib/s3'
import {
	agentProfileCreateSchema,
	buyerProfileCreateSchema,
	sellerProfileCreateSchema,
	type BuyerProfile,
	type BuyerProfileUpdate,
	type SellerProfile,
	type SellerProfileUpdate,
} from '@/lib/matching/profile.types'

export type {
	ProfileStatus,
	RepresentationSide,
} from '@/lib/matching/profile.db'

export {
	agentProfileCreateSchema,
	buyerProfileCreateSchema,
	sellerProfileCreateSchema,
} from '@/lib/matching/profile.types'

export type {
	AgentDraft,
	AgentProfile,
	AgentProfileCreateInput,
	AgentProfileUpdate,
	BuyerClientProfile,
	BuyerDraft,
	BuyerProfile,
	BuyerProfileCreateInput,
	BuyerProfileUpdate,
	ClientProfile,
	SellerClientProfile,
	SellerDraft,
	SellerProfile,
	SellerProfileCreateInput,
	SellerProfileUpdate,
} from '@/lib/matching/profile.types'

export {
	buyerClientProfileSchema,
	sellerClientProfileSchema,
} from '@/lib/matching/profile.types'

export const loadBuyerProfile = createServerFn({ method: 'GET' }).handler(
	async () => {
		const userId = await requireUserId()
		const [profile] = await db
			.select()
			.from(buyerProfiles)
			.where(eq(buyerProfiles.userId, userId))
			.limit(1)
		return profile ?? null
	},
)

export const createBuyerProfileFromDraft = createServerFn({ method: 'POST' })
	.validator((data: BuyerProfileUpdate) => data)
	.handler(async ({ data }) => {
		const userId = await requireUserId()
		const now = new Date()

		const existing = await db
			.select({ id: buyerProfiles.id })
			.from(buyerProfiles)
			.where(eq(buyerProfiles.userId, userId))
			.limit(1)

		if (existing[0]) {
			throw new Error('Buyer profile already exists')
		}

		// role is a client-only discriminator with no DB column; drafts never
		// include it, so validate the insert payload without it.
		const insert = buyerProfileCreateSchema.omit({ role: true }).parse({
			...data,
			status: 'active',
		})

		await db.insert(buyerProfiles).values({
			id: crypto.randomUUID(),
			userId,
			...insert,
			createdAt: now,
			updatedAt: now,
		})

		return { success: true }
	})

export const loadSellerProfile = createServerFn({ method: 'GET' }).handler(
	async () => {
		const userId = await requireUserId()
		const [profile] = await db
			.select()
			.from(sellerProfiles)
			.where(eq(sellerProfiles.userId, userId))
			.limit(1)
		return profile ?? null
	},
)

export const createSellerProfileFromDraft = createServerFn({ method: 'POST' })
	.validator((data: SellerProfileUpdate) => data)
	.handler(async ({ data }) => {
		const userId = await requireUserId()
		const now = new Date()

		const existing = await db
			.select({ id: sellerProfiles.id })
			.from(sellerProfiles)
			.where(eq(sellerProfiles.userId, userId))
			.limit(1)

		if (existing[0]) {
			throw new Error('Seller profile already exists')
		}

		const insert = sellerProfileCreateSchema.omit({ role: true }).parse({
			...data,
			status: 'active',
		})

		await db.insert(sellerProfiles).values({
			id: crypto.randomUUID(),
			userId,
			...insert,
			createdAt: now,
			updatedAt: now,
		})

		return { success: true }
	})

export const completeAgentSignup = createServerFn({ method: 'POST' })
	.validator((data: unknown) =>
		agentProfileCreateSchema.omit({ role: true }).parse(data),
	)
	.handler(async ({ data }) => {
		const userId = await requireUserId()
		const now = new Date()

		const existing = await db
			.select({ id: agentProfiles.id })
			.from(agentProfiles)
			.where(eq(agentProfiles.userId, userId))
			.limit(1)

		if (existing[0]) {
			throw new Error('Agent profile already exists')
		}

		const insert = {
			id: crypto.randomUUID(),
			userId,
			...data,
			createdAt: now,
			updatedAt: now,
		}

		await db.insert(agentProfiles).values(insert)
		return { success: true }
	})

export const loadAgentProfile = createServerFn({ method: 'GET' }).handler(
	async () => {
		const userId = await requireUserId()
		const [profile] = await db
			.select()
			.from(agentProfiles)
			.where(eq(agentProfiles.userId, userId))
			.limit(1)
		return profile ?? null
	},
)

export const getUserDashboardPath = createServerFn({ method: 'GET' }).handler(
	async () => {
		const userId = await requireUserId()

		const [[agent], [buyer], [seller]] = await Promise.all([
			db
				.select({ id: agentProfiles.id })
				.from(agentProfiles)
				.where(eq(agentProfiles.userId, userId))
				.limit(1),
			db
				.select({ id: buyerProfiles.id })
				.from(buyerProfiles)
				.where(eq(buyerProfiles.userId, userId))
				.limit(1),
			db
				.select({ id: sellerProfiles.id })
				.from(sellerProfiles)
				.where(eq(sellerProfiles.userId, userId))
				.limit(1),
		])

		if (agent) return '/agent/introductions'
		if (buyer) return '/buyer/matches'
		if (seller) return '/seller/matches'

		return '/buyer/matches'
	},
)

type MatchPageParam = { offset: number; limit: number }

const defaultMatchPageParam: MatchPageParam = { offset: 0, limit: 10 }

function resolveMatchPageParam(
	data: MatchPageParam | undefined,
): MatchPageParam {
	return {
		offset: data?.offset ?? defaultMatchPageParam.offset,
		limit: data?.limit ?? defaultMatchPageParam.limit,
	}
}

export const loadBuyerAgentMatches = createServerFn({ method: 'GET' })
	.validator((data: MatchPageParam | undefined) => resolveMatchPageParam(data))
	.handler(async ({ data }): Promise<AgentMatchData[]> => {
		const userId = await requireUserId()

		const [profile] = await db
			.select()
			.from(buyerProfiles)
			.where(eq(buyerProfiles.userId, userId))
			.limit(1)

		return loadAgentMatchesForProfile(profile, 'buying', data)
	})

export const loadSellerAgentMatches = createServerFn({ method: 'GET' })
	.validator((data: MatchPageParam | undefined) => resolveMatchPageParam(data))
	.handler(async ({ data }): Promise<AgentMatchData[]> => {
		const userId = await requireUserId()

		const [profile] = await db
			.select()
			.from(sellerProfiles)
			.where(eq(sellerProfiles.userId, userId))
			.limit(1)

		return loadAgentMatchesForProfile(profile, 'selling', data)
	})

async function loadAgentMatchesForProfile(
	profile: BuyerProfile | SellerProfile | undefined,
	side: 'buying' | 'selling',
	pageParam: MatchPageParam = defaultMatchPageParam,
): Promise<AgentMatchData[]> {
	const results = await db
		.select({
			agent: agentProfiles,
			user,
		})
		.from(agentProfiles)
		.innerJoin(user, eq(agentProfiles.userId, user.id))

	const scored = results.map((row) => ({
		row,
		score: calculateFitScore(row.agent, profile, side),
	}))

	// computedScore is the weighted dimension total before the disqualifier
	// gate — fitScore is 0 for every disqualified agent, so ranking by
	// computedScore is what keeps ordering meaningful in debug mode.
	const byComputedScore = (
		a: (typeof scored)[number],
		b: (typeof scored)[number],
	) => b.score.trace.computedScore - a.score.trace.computedScore

	const qualified = scored.filter(({ score }) => !score.disqualified)
	qualified.sort(byComputedScore)

	const { offset, limit } = pageParam
	const top = qualified.slice(offset, offset + limit)

	const scoreDistribution = buildScoreDistribution(
		scored.map(({ score }) => score),
	)

	return Promise.all(
		top.map(async ({ row, score }, index) => {
			const avatar = await getAvatarUrl(row.user.image)

			return {
				id: row.agent.id,
				name: row.user.name,
				role: 'agent' as const,
				location: `${row.agent.city}, ${row.agent.state}`,
				zipCodes: row.agent.zipCodes,
				fitScore: score.fitScore,
				status: 'new' as const,
				date: new Date(row.agent.updatedAt).toLocaleDateString(),
				experience: row.agent.yearsLicensed ?? '',
				agency: row.agent.brokerageName ?? '',
				specialties: row.agent.bestClientTypes,
				about:
					'Experienced real estate professional serving the local community.',
				scores: score.scores,
				contact: {
					email: row.user.email,
				},
				stats: {
					transactions: Number(row.agent.averageTransactions) || 50,
					avgDays: 14,
					satisfaction: row.agent.peacePactSigned ? 4.9 : 4.7,
				},
				debug: {
					rank: offset + index + 1,
					totalAgents: scored.length,
					qualifiedCount: qualified.length,
					scoreDistribution,
					trace: score.trace,
					agentProfile: row.agent,
					clientProfile: profile ?? null,
				},
				...(avatar ? { avatar } : {}),
			}
		}),
	)
}

/**
 * Buckets every scored agent by public fitScore. Disqualified agents have a
 * public fitScore of 0, so they naturally land in the 0-9 bucket alongside
 * genuine low scorers.
 */
function buildScoreDistribution(
	scores: { fitScore: number }[],
): { range: string; count: number }[] {
	const buckets = Array.from({ length: 10 }, (_, i) => ({
		range: i === 9 ? '90-100' : `${i * 10}-${i * 10 + 9}`,
		count: 0,
	}))
	for (const score of scores) {
		const index = Math.min(9, Math.max(0, Math.floor(score.fitScore / 10)))
		buckets[index]!.count += 1
	}
	return buckets
}
