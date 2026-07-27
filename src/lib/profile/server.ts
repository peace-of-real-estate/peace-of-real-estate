import { createServerFn } from '@tanstack/react-start'
import { eq } from 'drizzle-orm'
import type { z } from 'zod'

import { db } from '@/db/connection'
import { agentProfiles, clientProfiles } from '@/db/tables'
import { requireUserId } from '@/lib/auth/session'

import { Agent, Buyer, Seller } from './repository'
import {
	agentInsertSchema,
	buyerCompletedDraftSchema,
	buyerDetailsInsertSchema,
	buyerInsertSchema,
	clientProfileInsertSchema,
	sellerCompletedDraftSchema,
	sellerDetailsInsertSchema,
	sellerInsertSchema,
} from './types'

async function insertProfileOnce(
	roleName: string,
	insert: () => Promise<boolean>,
) {
	const inserted = await insert()
	if (!inserted) throw new Error(`${roleName} profile already exists`)
}

// One create-from-draft flow for both client roles: parse the completed
// draft, then re-parse it with each table's own schema to split base from
// details — zod strips unknown keys, so each table's columns (and only
// those) land in its insert. Adding a quiz field touches the table and the
// UI — never this function.
function makeClientProfileCreator<
	S extends z.ZodType,
	B extends z.ZodType<{ zipCodes: string[] }>,
	D extends z.ZodType,
>(config: {
	insertSchema: S
	baseSchema: B
	detailsSchema: D
	label: string
	insert: (input: {
		id: string
		userId: string
		now: Date
		base: Omit<z.output<B>, 'zipCodes'>
		details: z.output<D>
		zipCodes: string[]
	}) => Promise<boolean>
}) {
	return async (userId: string, data: object) => {
		const parsed = config.insertSchema.parse({ ...data, status: 'active' })
		const { zipCodes, ...base } = config.baseSchema.parse(parsed)
		const details = config.detailsSchema.parse(parsed)
		await insertProfileOnce(config.label, () =>
			config.insert({
				id: crypto.randomUUID(),
				userId,
				now: new Date(),
				base,
				details,
				zipCodes,
			}),
		)
		return { success: true }
	}
}

const createBuyerProfile = makeClientProfileCreator({
	insertSchema: buyerInsertSchema,
	baseSchema: clientProfileInsertSchema,
	detailsSchema: buyerDetailsInsertSchema,
	label: 'Buyer',
	insert: (input) => Buyer.insert(input),
})

const createSellerProfile = makeClientProfileCreator({
	insertSchema: sellerInsertSchema,
	baseSchema: clientProfileInsertSchema,
	detailsSchema: sellerDetailsInsertSchema,
	label: 'Seller',
	insert: (input) => Seller.insert(input),
})

const loadBuyerProfile = createServerFn({ method: 'GET' }).handler(async () => {
	const userId = await requireUserId()
	return (await Buyer.loadByUserId(userId)) ?? null
})

const createBuyerProfileFromDraft = createServerFn({ method: 'POST' })
	.validator((data: unknown) => buyerCompletedDraftSchema.parse(data))
	.handler(async ({ data }) => createBuyerProfile(await requireUserId(), data))

const loadSellerProfile = createServerFn({ method: 'GET' }).handler(
	async () => {
		const userId = await requireUserId()
		return (await Seller.loadByUserId(userId)) ?? null
	},
)

const createSellerProfileFromDraft = createServerFn({ method: 'POST' })
	.validator((data: unknown) => sellerCompletedDraftSchema.parse(data))
	.handler(async ({ data }) => createSellerProfile(await requireUserId(), data))

const loadAgentProfile = createServerFn({ method: 'GET' }).handler(async () => {
	const userId = await requireUserId()
	return (await Agent.loadByUserId(userId)) ?? null
})

const createAgentProfile = createServerFn({ method: 'POST' })
	.validator((data: unknown) => agentInsertSchema.parse(data))
	.handler(async ({ data }) => {
		const userId = await requireUserId()
		const { zipCodes, ...values } = data
		await insertProfileOnce('Agent', () =>
			Agent.insert({
				id: crypto.randomUUID(),
				userId,
				now: new Date(),
				values,
				zipCodes,
			}),
		)
		return { success: true }
	})

export const buyer = {
	loadProfile: loadBuyerProfile,
	createProfileFromDraft: createBuyerProfileFromDraft,
}

export const seller = {
	loadProfile: loadSellerProfile,
	createProfileFromDraft: createSellerProfileFromDraft,
}

export const agent = {
	loadProfile: loadAgentProfile,
	createProfile: createAgentProfile,
}

export type ProfileRole = 'buyer' | 'seller' | 'agent'

async function findExistingProfileRoles(
	userId: string,
): Promise<ProfileRole[]> {
	const roles: ProfileRole[] = []
	const [agentRow] = await db
		.select({ id: agentProfiles.id })
		.from(agentProfiles)
		.where(eq(agentProfiles.userId, userId))
		.limit(1)
	if (agentRow) {
		roles.push('agent')
	}
	const clientRoles = await db
		.select({ role: clientProfiles.role })
		.from(clientProfiles)
		.where(eq(clientProfiles.userId, userId))
	for (const row of clientRoles) {
		roles.push(row.role)
	}
	return roles
}

export const loadExistingProfileRoles = createServerFn({
	method: 'GET',
}).handler(async () => findExistingProfileRoles(await requireUserId()))

export const getUserDashboardPath = createServerFn({ method: 'GET' }).handler(
	async () => {
		const userId = await requireUserId()
		const [role] = await findExistingProfileRoles(userId)
		if (role) {
			return role === 'agent' ? '/agent/introductions' : `/${role}/matches`
		}
		return '/buyer/matches'
	},
)
