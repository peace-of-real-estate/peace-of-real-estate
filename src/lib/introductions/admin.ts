import { createServerFn } from '@tanstack/react-start'
import { desc, eq } from 'drizzle-orm'
import { alias } from 'drizzle-orm/pg-core'
import { z } from 'zod'

import { db } from '@/db/connection'
import { agentProfiles, clientProfiles, introductions, user } from '@/db/tables'
import { serverEnv } from '@/env.server'
import { isSeededEmail } from '@/lib/auth/seed'
import { requireAdmin } from '@/lib/auth/session'

import { Agent } from './db'
import { notifyConnected, retryIntroductionNotifications } from './notify'

export type FakeAgentPendingIntroduction = {
	introductionId: string
	createdAt: Date
	clientName: string
	clientRole: 'buyer' | 'seller'
	agentName: string
	agentEmail: string
}

export const listFakeAgentPendingIntroductions = createServerFn({
	method: 'GET',
}).handler(async () => {
	await requireAdmin()

	const clientUser = alias(user, 'client_user')
	const rows = await db
		.select({
			introductionId: introductions.id,
			createdAt: introductions.createdAt,
			clientRole: clientProfiles.role,
			clientName: clientUser.name,
			agentName: user.name,
			agentEmail: user.email,
		})
		.from(introductions)
		.innerJoin(
			agentProfiles,
			eq(introductions.agentProfileId, agentProfiles.id),
		)
		.innerJoin(user, eq(agentProfiles.userId, user.id))
		.innerJoin(
			clientProfiles,
			eq(introductions.clientProfileId, clientProfiles.id),
		)
		.innerJoin(clientUser, eq(clientProfiles.userId, clientUser.id))
		.where(eq(introductions.status, 'pending'))
		.orderBy(desc(introductions.createdAt))

	return rows
		.filter((row) => isSeededEmail(row.agentEmail))
		.map((row) => ({
			introductionId: row.introductionId,
			createdAt: row.createdAt,
			clientName: row.clientName,
			clientRole: row.clientRole,
			agentName: row.agentName,
			agentEmail: row.agentEmail,
		}))
})

export const forceAcceptIntroduction = createServerFn({ method: 'POST' })
	.validator((data: unknown) =>
		z.object({ introductionId: z.string().min(1) }).parse(data),
	)
	.handler(async ({ data }) => {
		await requireAdmin()

		if (serverEnv.APP_ENV === 'production') {
			throw new Error('Force-accept is disabled in production')
		}

		const [row] = await db
			.select({ agentEmail: user.email })
			.from(introductions)
			.innerJoin(
				agentProfiles,
				eq(introductions.agentProfileId, agentProfiles.id),
			)
			.innerJoin(user, eq(agentProfiles.userId, user.id))
			.where(eq(introductions.id, data.introductionId))
			.limit(1)

		if (!row || !isSeededEmail(row.agentEmail)) {
			throw new Error(
				'Force-accept only allowed for seeded (@example.com) agents',
			)
		}

		const result = await Agent.accept(db, data)
		if (result.ok && result.status === 'accepted') {
			await retryIntroductionNotifications(db, {
				introductionIds: [data.introductionId],
			})
		}
		if (result.ok && result.status === 'connected') {
			await notifyConnected(db, { introductionIds: [data.introductionId] })
		}
		return result
	})
