import { createServerFn } from '@tanstack/react-start'
import { eq } from 'drizzle-orm'
import { db } from '@/db/connection'
import { agentProfiles, buyerProfiles, sellerProfiles, user } from '@/db/tables'
import { requireUserId } from '@/lib/auth/functions'
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
	isBuyerClientProfile,
	isSellerClientProfile,
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

		const insert = buyerProfileCreateSchema.parse({
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

		const insert = sellerProfileCreateSchema.parse({
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
	.validator((data: unknown) => agentProfileCreateSchema.parse(data))
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

export const loadBuyerAgentMatches = createServerFn({ method: 'GET' }).handler(
	async (): Promise<AgentMatchData[]> => {
		const userId = await requireUserId()

		const [profile] = await db
			.select()
			.from(buyerProfiles)
			.where(eq(buyerProfiles.userId, userId))
			.limit(1)

		return loadAgentMatchesForProfile(profile, 'buying')
	},
)

export const loadSellerAgentMatches = createServerFn({ method: 'GET' }).handler(
	async (): Promise<AgentMatchData[]> => {
		const userId = await requireUserId()

		const [profile] = await db
			.select()
			.from(sellerProfiles)
			.where(eq(sellerProfiles.userId, userId))
			.limit(1)

		return loadAgentMatchesForProfile(profile, 'selling')
	},
)

async function loadAgentMatchesForProfile(
	profile: BuyerProfile | SellerProfile | undefined,
	side: 'buying' | 'selling',
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

	scored.sort((a, b) => b.score.fitScore - a.score.fitScore)
	const top = scored.slice(0, 5)

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
				isTopMatch: index === 0,
				...(avatar ? { avatar } : {}),
			}
		}),
	)
}
