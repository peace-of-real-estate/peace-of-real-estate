import { and, eq, inArray, isNull, or } from 'drizzle-orm'
import { alias } from 'drizzle-orm/pg-core'

import {
	agentProfiles,
	cities,
	clientProfiles,
	connectionNotificationJobs,
	introductionNotificationJobs,
	introductions,
	user,
} from '@/db/tables'
import {
	sendConnectedAgentEmail,
	sendConnectedClientEmail,
	sendIntroAcceptedEmail,
	sendIntroDeclinedEmail,
	sendIntroSentEmail,
} from '@/lib/email.server'

import type { Db } from './db'
import { agentDisplayName, anonymizeName } from './views'

async function bestEffort(label: string, send: () => Promise<void>) {
	try {
		await send()
	} catch (error) {
		console.error(`Intro notification failed (${label}):`, error)
	}
}

async function loadIntroParties(db: Db, introductionIds: string[]) {
	if (introductionIds.length === 0) return []
	const agentUser = alias(user, 'agent_user')
	return db
		.select({
			intro: introductions,
			agent: agentProfiles,
			agentUserEmail: agentUser.email,
			profile: clientProfiles,
			clientCity: cities,
			clientName: user.name,
			clientEmail: user.email,
		})
		.from(introductions)
		.innerJoin(
			agentProfiles,
			eq(introductions.agentProfileId, agentProfiles.id),
		)
		.innerJoin(agentUser, eq(agentProfiles.userId, agentUser.id))
		.innerJoin(
			clientProfiles,
			eq(introductions.clientProfileId, clientProfiles.id),
		)
		.innerJoin(cities, eq(clientProfiles.cityId, cities.id))
		.innerJoin(user, eq(clientProfiles.userId, user.id))
		.where(inArray(introductions.id, introductionIds))
}

type NotificationScope =
	| { introductionIds: string[] }
	| { clientProfileId: string }
	| { agentProfileId: string }

type NotificationIntroductionId =
	| typeof introductionNotificationJobs.introductionId
	| typeof connectionNotificationJobs.introductionId

function notificationScopeFilter(
	scope: NotificationScope,
	introductionId: NotificationIntroductionId,
) {
	if ('introductionIds' in scope) {
		return inArray(introductionId, scope.introductionIds)
	}
	if ('clientProfileId' in scope) {
		return eq(introductions.clientProfileId, scope.clientProfileId)
	}
	return eq(introductions.agentProfileId, scope.agentProfileId)
}

async function deliverLifecycleNotifications(
	db: Db,
	introductionIds: string[],
	kind: 'sent' | 'accepted' | 'declined',
): Promise<void> {
	if (introductionIds.length === 0) return
	const jobs = await db
		.select()
		.from(introductionNotificationJobs)
		.where(
			and(
				inArray(introductionNotificationJobs.introductionId, introductionIds),
				eq(introductionNotificationJobs.kind, kind),
				isNull(introductionNotificationJobs.sentAt),
			),
		)
	if (jobs.length === 0) return
	const rows = await loadIntroParties(
		db,
		jobs.map((job) => job.introductionId),
	)
	const byIntroductionId = new Map(rows.map((row) => [row.intro.id, row]))
	const errors: unknown[] = []
	for (const job of jobs) {
		const row = byIntroductionId.get(job.introductionId)
		if (!row) continue
		try {
			if (kind === 'sent' && row.intro.status === 'pending') {
				await sendIntroSentEmail({
					to: row.agent.email ?? row.agentUserEmail,
					clientDisplayName: anonymizeName(row.clientName),
					role: row.profile.role,
					city: row.clientCity.name,
					state: row.clientCity.state,
					idempotencyKey: `intro-sent-${row.intro.id}`,
				})
			} else if (kind === 'accepted' && row.intro.status === 'accepted') {
				await sendIntroAcceptedEmail({
					to: row.clientEmail,
					agentName: agentDisplayName(row.agent),
					role: row.profile.role,
					idempotencyKey: `intro-accepted-${row.intro.id}`,
				})
			} else if (kind === 'declined' && row.intro.status === 'declined') {
				await sendIntroDeclinedEmail({
					to: row.clientEmail,
					role: row.profile.role,
					idempotencyKey: `intro-declined-${row.intro.id}`,
				})
			} else if (kind === 'accepted' && row.intro.status === 'connected') {
				// The connected notification supersedes an acceptance email.
			} else {
				continue
			}
			await db
				.update(introductionNotificationJobs)
				.set({ sentAt: new Date() })
				.where(eq(introductionNotificationJobs.id, job.id))
		} catch (error) {
			errors.push(error)
		}
	}
	if (errors.length > 0) {
		throw new AggregateError(
			errors,
			'Introduction notification delivery failed.',
		)
	}
}

export async function retryIntroductionNotifications(
	db: Db,
	scope: NotificationScope,
): Promise<void> {
	if ('introductionIds' in scope && scope.introductionIds.length === 0) return
	const jobs = await db
		.select({
			introductionId: introductionNotificationJobs.introductionId,
			kind: introductionNotificationJobs.kind,
		})
		.from(introductionNotificationJobs)
		.innerJoin(
			introductions,
			eq(introductionNotificationJobs.introductionId, introductions.id),
		)
		.where(
			and(
				notificationScopeFilter(
					scope,
					introductionNotificationJobs.introductionId,
				),
				isNull(introductionNotificationJobs.sentAt),
			),
		)
	for (const kind of ['sent', 'accepted', 'declined'] as const) {
		const introductionIds = jobs
			.filter((job) => job.kind === kind)
			.map((job) => job.introductionId)
		await bestEffort(`${kind}-pending`, () =>
			deliverLifecycleNotifications(db, introductionIds, kind),
		)
	}
}

export async function notifyConnected(
	db: Db,
	scope: NotificationScope,
): Promise<void> {
	if ('introductionIds' in scope && scope.introductionIds.length === 0) return
	const jobs = await db
		.select({ job: connectionNotificationJobs })
		.from(connectionNotificationJobs)
		.innerJoin(
			introductions,
			eq(connectionNotificationJobs.introductionId, introductions.id),
		)
		.where(
			and(
				notificationScopeFilter(
					scope,
					connectionNotificationJobs.introductionId,
				),
				or(
					isNull(connectionNotificationJobs.agentSentAt),
					isNull(connectionNotificationJobs.clientSentAt),
				),
			),
		)
	if (jobs.length === 0) return
	const rows = await loadIntroParties(
		db,
		jobs.map(({ job }) => job.introductionId),
	)
	const byIntroductionId = new Map(rows.map((row) => [row.intro.id, row]))
	const errors: unknown[] = []
	for (const { job } of jobs) {
		const row = byIntroductionId.get(job.introductionId)
		if (!row || row.intro.status !== 'connected') continue
		const agentName = agentDisplayName(row.agent)
		const agentEmail = row.agent.email ?? row.agentUserEmail
		if (!job.agentSentAt) {
			try {
				await sendConnectedAgentEmail({
					to: agentEmail,
					clientName: row.clientName,
					clientEmail: row.clientEmail,
					idempotencyKey: `intro-connected-agent-${row.intro.id}`,
				})
				await db
					.update(connectionNotificationJobs)
					.set({ agentSentAt: new Date() })
					.where(eq(connectionNotificationJobs.introductionId, row.intro.id))
			} catch (error) {
				errors.push(error)
			}
		}
		if (!job.clientSentAt) {
			try {
				await sendConnectedClientEmail({
					to: row.clientEmail,
					agentName,
					agentEmail,
					agentPhone: row.agent.phone,
					role: row.profile.role,
					idempotencyKey: `intro-connected-client-${row.intro.id}`,
				})
				await db
					.update(connectionNotificationJobs)
					.set({ clientSentAt: new Date() })
					.where(eq(connectionNotificationJobs.introductionId, row.intro.id))
			} catch (error) {
				errors.push(error)
			}
		}
	}
	if (errors.length > 0) {
		throw new AggregateError(errors, 'Connection notification delivery failed.')
	}
}

export async function retryConnectedNotifications(
	db: Db,
	scope: { clientProfileId: string } | { agentProfileId: string },
): Promise<void> {
	await bestEffort('connected-pending', () => notifyConnected(db, scope))
}
