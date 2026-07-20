import { createServerFn } from '@tanstack/react-start'
import { eq } from 'drizzle-orm'

import { db } from '@/db/connection'
import { agentProfiles, clientProfiles } from '@/db/tables'
import { requireUserId } from '@/lib/auth/session'
import { resolveCityCenter } from '@/lib/geography/zip.server'

import {
	insertBuyerProfile,
	insertSellerProfile,
	loadBuyerProfileByUserId,
	loadSellerProfileByUserId,
} from './repository'
import {
	agentInsertSchema,
	buyerInsertSchema,
	sellerInsertSchema,
	type BuyerDraft,
	type SellerDraft,
} from './types'

async function insertProfileOnce(
	roleName: string,
	insert: () => Promise<boolean>,
) {
	const inserted = await insert()
	if (!inserted) throw new Error(`${roleName} profile already exists`)
}

export const loadBuyerProfile = createServerFn({ method: 'GET' }).handler(
	async () => {
		const userId = await requireUserId()
		return (await loadBuyerProfileByUserId(userId)) ?? null
	},
)

export const createBuyerProfileFromDraft = createServerFn({ method: 'POST' })
	.validator((data: BuyerDraft) => data)
	.handler(async ({ data }) => {
		const userId = await requireUserId()
		const {
			experienceLevel,
			idealAgentRelationship,
			decisionMakingNeed,
			biddingWarResponse,
			...base
		} = buyerInsertSchema.parse({
			...data,
			status: 'active',
		})

		await insertProfileOnce('Buyer', () =>
			insertBuyerProfile({
				id: crypto.randomUUID(),
				userId,
				now: new Date(),
				base,
				details: {
					experienceLevel,
					idealAgentRelationship,
					decisionMakingNeed,
					biddingWarResponse,
				},
			}),
		)

		return { success: true }
	})

export const loadSellerProfile = createServerFn({ method: 'GET' }).handler(
	async () => {
		const userId = await requireUserId()
		return (await loadSellerProfileByUserId(userId)) ?? null
	},
)

export const createSellerProfileFromDraft = createServerFn({ method: 'POST' })
	.validator((data: SellerDraft) => data)
	.handler(async ({ data }) => {
		const userId = await requireUserId()
		const {
			saleMotivation,
			successfulSaleLooksLike,
			homeConnection,
			agentSilencePreference,
			representationPreference,
			agentDeliveryExpectations,
			...base
		} = sellerInsertSchema.parse({
			...data,
			status: 'active',
		})

		await insertProfileOnce('Seller', () =>
			insertSellerProfile({
				id: crypto.randomUUID(),
				userId,
				now: new Date(),
				base,
				details: {
					saleMotivation,
					successfulSaleLooksLike,
					homeConnection,
					agentSilencePreference,
					representationPreference,
					agentDeliveryExpectations,
				},
			}),
		)

		return { success: true }
	})

export const completeAgentSignup = createServerFn({ method: 'POST' })
	.validator((data: unknown) => agentInsertSchema.parse(data))
	.handler(async ({ data }) => {
		const userId = await requireUserId()
		const center = await resolveCityCenter({
			city: data.city,
			state: data.state,
		})
		await insertProfileOnce('Agent', async () => {
			const [profile] = await db
				.insert(agentProfiles)
				.values({
					id: crypto.randomUUID(),
					userId,
					...data,
					cityCenterLatitude: data.cityCenterLatitude ?? center?.latitude,
					cityCenterLongitude: data.cityCenterLongitude ?? center?.longitude,
					createdAt: new Date(),
					updatedAt: new Date(),
				})
				.onConflictDoNothing({ target: agentProfiles.userId })
				.returning({ id: agentProfiles.id })
			return profile !== undefined
		})
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

		const [agent] = await db
			.select({ id: agentProfiles.id })
			.from(agentProfiles)
			.where(eq(agentProfiles.userId, userId))
			.limit(1)
		if (agent) return '/agent/introductions'

		const roles = await db
			.select({ role: clientProfiles.role })
			.from(clientProfiles)
			.where(eq(clientProfiles.userId, userId))

		if (roles.some((row) => row.role === 'buyer')) return '/buyer/matches'
		if (roles.some((row) => row.role === 'seller')) return '/seller/matches'

		return '/buyer/matches'
	},
)
