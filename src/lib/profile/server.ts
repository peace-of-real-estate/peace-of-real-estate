import { createServerFn } from '@tanstack/react-start'
import { eq } from 'drizzle-orm'

import { db } from '@/db/connection'
import { agentProfiles, buyerProfiles, sellerProfiles } from '@/db/tables'
import { requireUserId } from '@/lib/auth/session'

import {
	agentInsertSchema,
	buyerCompletedDraftSchema,
	buyerInsertSchema,
	sellerCompletedDraftSchema,
	sellerInsertSchema,
} from './types'

const roleTables = {
	buyer: buyerProfiles,
	seller: sellerProfiles,
	agent: agentProfiles,
} as const

async function loadOwnProfile<T>(load: () => Promise<T[]>): Promise<T | null> {
	const [profile] = await load()
	return profile ?? null
}

async function insertProfileOnce(
	userId: string,
	roleName: string,
	findExisting: () => Promise<{ id: string }[]>,
	insert: (values: {
		id: string
		userId: string
		now: Date
	}) => Promise<unknown>,
) {
	const [existing] = await findExisting()
	if (existing) throw new Error(`${roleName} profile already exists`)

	const now = new Date()
	await insert({ id: crypto.randomUUID(), userId, now })
}

export const loadBuyerProfile = createServerFn({ method: 'GET' }).handler(
	async () => {
		const userId = await requireUserId()
		return loadOwnProfile(() =>
			db
				.select()
				.from(buyerProfiles)
				.where(eq(buyerProfiles.userId, userId))
				.limit(1),
		)
	},
)

export const createBuyerProfileFromDraft = createServerFn({ method: 'POST' })
	.validator((data: unknown) => buyerCompletedDraftSchema.parse(data))
	.handler(async ({ data }) => {
		const userId = await requireUserId()
		const insert = buyerInsertSchema.parse({
			...data,
			status: 'active',
		})

		await insertProfileOnce(
			userId,
			'Buyer',
			() =>
				db
					.select({ id: buyerProfiles.id })
					.from(buyerProfiles)
					.where(eq(buyerProfiles.userId, userId))
					.limit(1),
			({ id, userId, now }) =>
				db.insert(buyerProfiles).values({
					id,
					userId,
					...insert,
					createdAt: now,
					updatedAt: now,
				}),
		)

		return { success: true }
	})

export const loadSellerProfile = createServerFn({ method: 'GET' }).handler(
	async () => {
		const userId = await requireUserId()
		return loadOwnProfile(() =>
			db
				.select()
				.from(sellerProfiles)
				.where(eq(sellerProfiles.userId, userId))
				.limit(1),
		)
	},
)

export const createSellerProfileFromDraft = createServerFn({ method: 'POST' })
	.validator((data: unknown) => sellerCompletedDraftSchema.parse(data))
	.handler(async ({ data }) => {
		const userId = await requireUserId()
		const insert = sellerInsertSchema.parse({
			...data,
			status: 'active',
		})

		await insertProfileOnce(
			userId,
			'Seller',
			() =>
				db
					.select({ id: sellerProfiles.id })
					.from(sellerProfiles)
					.where(eq(sellerProfiles.userId, userId))
					.limit(1),
			({ id, userId, now }) =>
				db.insert(sellerProfiles).values({
					id,
					userId,
					...insert,
					createdAt: now,
					updatedAt: now,
				}),
		)

		return { success: true }
	})

export const completeAgentSignup = createServerFn({ method: 'POST' })
	.validator((data: unknown) => agentInsertSchema.parse(data))
	.handler(async ({ data }) => {
		const userId = await requireUserId()
		await insertProfileOnce(
			userId,
			'Agent',
			() =>
				db
					.select({ id: agentProfiles.id })
					.from(agentProfiles)
					.where(eq(agentProfiles.userId, userId))
					.limit(1),
			({ id, userId, now }) =>
				db.insert(agentProfiles).values({
					id,
					userId,
					...data,
					createdAt: now,
					updatedAt: now,
				}),
		)
		return { success: true }
	})

export const loadAgentProfile = createServerFn({ method: 'GET' }).handler(
	async () => {
		const userId = await requireUserId()
		return loadOwnProfile(() =>
			db
				.select()
				.from(agentProfiles)
				.where(eq(agentProfiles.userId, userId))
				.limit(1),
		)
	},
)

export const getUserDashboardPath = createServerFn({ method: 'GET' }).handler(
	async () => {
		const userId = await requireUserId()

		for (const [role, table] of [
			['agent', roleTables.agent],
			['buyer', roleTables.buyer],
			['seller', roleTables.seller],
		] as const) {
			const [profile] = await db
				.select({ id: table.id })
				.from(table)
				.where(eq(table.userId, userId))
				.limit(1)
			if (profile) {
				return role === 'agent' ? '/agent/introductions' : `/${role}/matches`
			}
		}

		return '/buyer/matches'
	},
)
