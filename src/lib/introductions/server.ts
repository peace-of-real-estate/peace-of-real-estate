import { createServerFn } from '@tanstack/react-start'
import { and, count, eq } from 'drizzle-orm'
import { z } from 'zod'

import { db } from '@/db/connection'
import { agentProfiles, clientProfiles, introductions } from '@/db/tables'
import { requireUserId } from '@/lib/auth/session'

import { Agent, Client } from './db'
import {
	retryIntroductionNotifications,
	retryConnectedNotifications,
} from './notify'

const clientProfileIdSchema = z.object({
	clientProfileId: z.string().min(1),
})

const sendIntroductionsSchema = clientProfileIdSchema.extend({
	agentProfileIds: z.array(z.string().min(1)).min(1).max(3),
})

const introductionIdSchema = z.object({
	introductionId: z.string().min(1),
})

async function requireFirst<Row>(
	rows: PromiseLike<Row[]>,
	message: string,
): Promise<Row> {
	const [row] = await rows
	if (!row) throw new Error(message)
	return row
}

function requireOwnedClientProfile(userId: string, clientProfileId: string) {
	return requireFirst(
		db
			.select({ id: clientProfiles.id })
			.from(clientProfiles)
			.where(
				and(
					eq(clientProfiles.id, clientProfileId),
					eq(clientProfiles.userId, userId),
				),
			)
			.limit(1),
		'Client profile not found',
	)
}

function requireOwnedAgentProfile(userId: string) {
	return requireFirst(
		db
			.select({ id: agentProfiles.id })
			.from(agentProfiles)
			.where(eq(agentProfiles.userId, userId))
			.limit(1),
		'Agent profile not found',
	)
}

function requireIntroForAgent(introductionId: string, agentProfileId: string) {
	return requireFirst(
		db
			.select({ id: introductions.id })
			.from(introductions)
			.where(
				and(
					eq(introductions.id, introductionId),
					eq(introductions.agentProfileId, agentProfileId),
				),
			)
			.limit(1),
		'Introduction not found',
	)
}

function requireIntroForClient(introductionId: string, userId: string) {
	return requireFirst(
		db
			.select({ id: introductions.id })
			.from(introductions)
			.innerJoin(
				clientProfiles,
				eq(introductions.clientProfileId, clientProfiles.id),
			)
			.where(
				and(
					eq(introductions.id, introductionId),
					eq(clientProfiles.userId, userId),
				),
			)
			.limit(1),
		'Introduction not found',
	)
}

export const sendIntroductions = createServerFn({ method: 'POST' })
	.validator((data: unknown) => sendIntroductionsSchema.parse(data))
	.handler(async ({ data }) => {
		const userId = await requireUserId()
		await requireOwnedClientProfile(userId, data.clientProfileId)
		const result = await Client.send(db, data)
		if (result.ok) {
			void retryIntroductionNotifications(db, {
				introductionIds: result.ids,
			})
		}
		return result
	})

export const getClientIntroductions = createServerFn({ method: 'GET' })
	.validator((data: unknown) => clientProfileIdSchema.parse(data))
	.handler(async ({ data }) => {
		const userId = await requireUserId()
		await requireOwnedClientProfile(userId, data.clientProfileId)
		void retryConnectedNotifications(db, {
			clientProfileId: data.clientProfileId,
		})
		void retryIntroductionNotifications(db, {
			clientProfileId: data.clientProfileId,
		})
		return Client.list(db, data.clientProfileId)
	})

export const getAgentIntroductions = createServerFn({ method: 'GET' }).handler(
	async () => {
		const userId = await requireUserId()
		const agent = await requireOwnedAgentProfile(userId)
		void retryConnectedNotifications(db, { agentProfileId: agent.id })
		void retryIntroductionNotifications(db, { agentProfileId: agent.id })
		return Agent.list(db, agent.id)
	},
)

export const acceptIntroduction = createServerFn({ method: 'POST' })
	.validator((data: unknown) => introductionIdSchema.parse(data))
	.handler(async ({ data }) => {
		const userId = await requireUserId()
		const agent = await requireOwnedAgentProfile(userId)
		await requireIntroForAgent(data.introductionId, agent.id)
		const result = await Agent.accept(db, data)
		if (result.ok) {
			if (result.status === 'connected') {
				void retryConnectedNotifications(db, { agentProfileId: agent.id })
			} else {
				void retryIntroductionNotifications(db, {
					introductionIds: [data.introductionId],
				})
			}
		}
		return result
	})

export const declineIntroduction = createServerFn({ method: 'POST' })
	.validator((data: unknown) => introductionIdSchema.parse(data))
	.handler(async ({ data }) => {
		const userId = await requireUserId()
		const agent = await requireOwnedAgentProfile(userId)
		await requireIntroForAgent(data.introductionId, agent.id)
		const result = await Agent.decline(db, {
			introductionId: data.introductionId,
		})
		if (result.ok) {
			void retryIntroductionNotifications(db, {
				introductionIds: [data.introductionId],
			})
		}
		return result
	})

export const withdrawIntroduction = createServerFn({ method: 'POST' })
	.validator((data: unknown) => introductionIdSchema.parse(data))
	.handler(async ({ data }) => {
		const userId = await requireUserId()
		await requireIntroForClient(data.introductionId, userId)
		return Client.withdraw(db, data)
	})

export const getPendingIntroCount = createServerFn({ method: 'GET' }).handler(
	async () => {
		const userId = await requireUserId()
		const agent = await requireOwnedAgentProfile(userId)
		const [row] = await db
			.select({ value: count() })
			.from(introductions)
			.where(
				and(
					eq(introductions.agentProfileId, agent.id),
					eq(introductions.status, 'pending'),
				),
			)
		return row?.value ?? 0
	},
)
