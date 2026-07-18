import { createServerFn } from '@tanstack/react-start'
import { eq } from 'drizzle-orm'
import { db } from '@/db/connection'
import { agentProfiles, buyerProfiles, sellerProfiles } from '@/db/tables'
import { requireUserId } from '@/lib/auth/session'
import {
	agentInsertSchema,
	buyerInsertSchema,
	sellerInsertSchema,
	type BuyerDraft,
	type SellerDraft,
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

function isUniqueViolation(error: unknown): boolean {
	return (
		typeof error === 'object' &&
		error !== null &&
		'code' in error &&
		error.code === '23505'
	)
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
	try {
		await insert({ id: crypto.randomUUID(), userId, now })
	} catch (error) {
		if (isUniqueViolation(error)) {
			throw new Error(`${roleName} profile already exists`)
		}
		throw error
	}
}

/**
 * Matching falls back to city-centroid distance when a profile has no usable
 * zips, so persist the city center at creation time. Without this the column
 * stays NULL, the fallback never fires, and zip-less profiles score 0 on
 * location and are disqualified from every match. Dynamic import keeps the
 * db-backed helper out of the client bundle (this module is re-exported
 * through '@/lib/profile').
 */
async function withCityCenter<
	T extends { city?: string | undefined; state?: string | undefined },
>(values: T): Promise<T> {
	if (!values.city || !values.state) return values
	const { resolveCityCenter } = await import('@/lib/geography/zip.server')
	const center = await resolveCityCenter({
		city: values.city,
		state: values.state,
	})
	return {
		...values,
		cityCenterLatitude: center?.latitude ?? null,
		cityCenterLongitude: center?.longitude ?? null,
	}
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
	.validator((data: BuyerDraft) => data)
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
			async ({ id, userId, now }) =>
				db.insert(buyerProfiles).values(
					await withCityCenter({
						id,
						userId,
						...insert,
						createdAt: now,
						updatedAt: now,
					}),
				),
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
	.validator((data: SellerDraft) => data)
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
			async ({ id, userId, now }) =>
				db.insert(sellerProfiles).values(
					await withCityCenter({
						id,
						userId,
						...insert,
						createdAt: now,
						updatedAt: now,
					}),
				),
		)

		return { success: true }
	})

export const completeAgentSignup = createServerFn({ method: 'POST' })
	.validator((data: unknown) => agentInsertSchema.parse(data))
	.handler(async ({ data }) => {
		const userId = await requireUserId()
		const values = await withCityCenter(data)
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
					...values,
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
