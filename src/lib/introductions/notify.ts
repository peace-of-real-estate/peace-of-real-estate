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
} from '@/db/schema'
import {
	sendConnectedAgentEmail,
	sendConnectedClientEmail,
	sendIntroAcceptedEmail,
	sendIntroDeclinedEmail,
	sendIntroSentEmail,
} from '@/lib/email.server'

import type { Db } from './db'
import {
	INTRODUCTION_NOTIFICATION_KINDS,
	type IntroductionNotificationKind,
} from './lifecycle'
import { anonymizeName } from './views'

// Caps each retry scan so a large backlog cannot turn one read request into
// an unbounded batch of email sends; the remainder drains on later scans.
const PENDING_JOB_SCAN_LIMIT = 100

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
			agentUserName: agentUser.name,
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

type IntroductionNotificationJob =
	typeof introductionNotificationJobs.$inferSelect

async function deliverLifecycleNotifications(
	db: Db,
	jobs: IntroductionNotificationJob[],
	kind: IntroductionNotificationKind,
): Promise<void> {
	if (jobs.length === 0) return
	const rows = await loadIntroParties(
		db,
		jobs.map((job) => job.introductionId),
	)
	const byIntroductionId = new Map(rows.map((row) => [row.intro.id, row]))
	const errors: unknown[] = []
	// Claim-before-send: only the reader that flips sentAt from null may
	// deliver, so concurrent readers cannot invoke the email provider twice.
	// A failed delivery releases the claim so the job stays retryable.
	const claimJob = async (jobId: string) => {
		const claimed = await db
			.update(introductionNotificationJobs)
			.set({ sentAt: new Date() })
			.where(
				and(
					eq(introductionNotificationJobs.id, jobId),
					isNull(introductionNotificationJobs.sentAt),
				),
			)
			.returning({ id: introductionNotificationJobs.id })
		return claimed.length > 0
	}
	const releaseJob = (jobId: string) =>
		db
			.update(introductionNotificationJobs)
			.set({ sentAt: null })
			.where(eq(introductionNotificationJobs.id, jobId))
	for (const job of jobs) {
		const row = byIntroductionId.get(job.introductionId)
		if (!row) {
			// The introduction no longer resolves; leave the job pending so a
			// later run can still resolve it instead of marking it sent.
			continue
		}
		if (!(await claimJob(job.id))) continue
		try {
			if (kind === 'sent' && row.intro.status === 'pending') {
				await sendIntroSentEmail({
					to: row.agentUserEmail,
					clientDisplayName: anonymizeName(row.clientName),
					role: row.profile.role,
					city: row.clientCity.name,
					state: row.clientCity.state,
					idempotencyKey: `intro-sent-${row.intro.id}`,
				})
			} else if (kind === 'accepted' && row.intro.status === 'accepted') {
				await sendIntroAcceptedEmail({
					to: row.clientEmail,
					agentName: row.agentUserName,
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
				// The status moved past this kind; the job is stale.
				continue
			}
		} catch (error) {
			try {
				await releaseJob(job.id)
			} catch (releaseError) {
				console.error(
					`Intro notification claim release failed (${job.id}):`,
					releaseError,
				)
			}
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
	await bestEffort('introduction-pending', async () => {
		const jobs = await db
			.select({ job: introductionNotificationJobs })
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
			.orderBy(introductionNotificationJobs.createdAt)
			.limit(PENDING_JOB_SCAN_LIMIT)
		for (const kind of INTRODUCTION_NOTIFICATION_KINDS) {
			const kindJobs = jobs.flatMap(({ job }) =>
				job.kind === kind ? [job] : [],
			)
			await bestEffort(`${kind}-pending`, () =>
				deliverLifecycleNotifications(db, kindJobs, kind),
			)
		}
	})
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
				isNull(connectionNotificationJobs.canceledAt),
				or(
					isNull(connectionNotificationJobs.agentSentAt),
					isNull(connectionNotificationJobs.clientSentAt),
				),
			),
		)
		.orderBy(connectionNotificationJobs.createdAt)
		.limit(PENDING_JOB_SCAN_LIMIT)
	if (jobs.length === 0) return
	const rows = await loadIntroParties(
		db,
		jobs.map(({ job }) => job.introductionId),
	)
	const byIntroductionId = new Map(rows.map((row) => [row.intro.id, row]))
	const errors: unknown[] = []
	for (const { job } of jobs) {
		const row = byIntroductionId.get(job.introductionId)
		if (!row) {
			// Parties failed to load; leave the job pending so a later run
			// can still resolve it instead of retiring it unsent.
			console.error(
				`Connection notification job unresolved (${job.introductionId}): parties not found`,
			)
			continue
		}
		if (row.intro.status !== 'connected') {
			// No longer connected; cancel the job so it does not stay pending
			// for future selections. The delivery timestamps stay null because
			// no email was sent.
			await db
				.update(connectionNotificationJobs)
				.set({ canceledAt: new Date() })
				.where(
					eq(connectionNotificationJobs.introductionId, job.introductionId),
				)
			continue
		}
		const agentName = row.agentUserName
		const agentEmail = row.agentUserEmail
		// Claim-before-send: flip the side's timestamp under an isNull guard
		// before calling the provider so concurrent callers cannot both send.
		// A failed delivery releases the claim so the side stays retryable.
		const claimSide = async (column: 'agentSentAt' | 'clientSentAt') => {
			const claimed = await db
				.update(connectionNotificationJobs)
				.set({ [column]: new Date() })
				.where(
					and(
						eq(connectionNotificationJobs.introductionId, job.introductionId),
						isNull(connectionNotificationJobs[column]),
					),
				)
				.returning({
					introductionId: connectionNotificationJobs.introductionId,
				})
			return claimed.length > 0
		}
		const releaseSide = async (column: 'agentSentAt' | 'clientSentAt') => {
			try {
				await db
					.update(connectionNotificationJobs)
					.set({ [column]: null })
					.where(
						eq(connectionNotificationJobs.introductionId, job.introductionId),
					)
			} catch (releaseError) {
				console.error(
					`Connection notification claim release failed (${job.introductionId}, ${column}):`,
					releaseError,
				)
			}
		}
		if (!job.agentSentAt && (await claimSide('agentSentAt'))) {
			try {
				await sendConnectedAgentEmail({
					to: agentEmail,
					clientName: row.clientName,
					clientEmail: row.clientEmail,
					idempotencyKey: `intro-connected-agent-${row.intro.id}`,
				})
			} catch (error) {
				await releaseSide('agentSentAt')
				errors.push(error)
			}
		}
		if (!job.clientSentAt && (await claimSide('clientSentAt'))) {
			try {
				await sendConnectedClientEmail({
					to: row.clientEmail,
					agentName,
					agentEmail,
					role: row.profile.role,
					idempotencyKey: `intro-connected-client-${row.intro.id}`,
				})
			} catch (error) {
				await releaseSide('clientSentAt')
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
