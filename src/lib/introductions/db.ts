import {
	and,
	count,
	desc,
	eq,
	gt,
	gte,
	inArray,
	isNull,
	sql,
} from 'drizzle-orm'

import type { db } from '@/db/connection'
import {
	agentProfiles,
	cities,
	clientProfiles,
	connectionNotificationJobs,
	introAccessWindows,
	introductionNotificationJobs,
	introductions,
	user,
} from '@/db/tables'
import { calculateFitScore } from '@/lib/matching/scoring'
import { formatPriceRange } from '@/lib/price-range'
import { Agent as AgentRepo, Buyer, Seller } from '@/lib/profile/repository'
import type { ClientProfile } from '@/lib/profile/types'

import {
	checkAgentEligible,
	checkCooldown,
	checkPending,
	checkProfileEligible,
	checkSlotCap,
	checkVelocity,
	checkWithdrawable,
	VELOCITY_WINDOW_MS,
	type GuardError,
} from './guards'
import {
	ACTIVE_STATUSES,
	decodeData,
	encodeData,
	isClosedStatus,
	PAIR_BLOCKING_STATUSES,
} from './intro-data'
import type { IntroAccessWindow } from './types'
import {
	agentDisplayName,
	buildAgentStates,
	toAgentIntroView,
	toClientIntroductionsPayload,
	toClientIntroView,
	type AgentIntroView,
	type ClientIntroductionsPayload,
} from './views'

// ===== Types =================================================================

export type Db = typeof db
export type Tx = Parameters<Parameters<Db['transaction']>[0]>[0]
export type DbOrTx = Db | Tx

export type SendResult =
	| { ok: true; ids: string[] }
	| { ok: false; error: GuardError }

export type AcceptResult =
	| { ok: true; status: 'accepted' | 'connected' }
	| { ok: false; error: GuardError }

export type MutationResult = { ok: true } | { ok: false; error: GuardError }

// ===== Client ================================================================

export const Client = {
	async countActiveIntros(
		executor: DbOrTx,
		clientProfileId: string,
	): Promise<number> {
		const [row] = await executor
			.select({ value: count() })
			.from(introductions)
			.where(
				and(
					eq(introductions.clientProfileId, clientProfileId),
					inArray(introductions.status, ACTIVE_STATUSES),
				),
			)
		return row?.value ?? 0
	},

	async countSentLast30Days(
		executor: DbOrTx,
		clientProfileId: string,
	): Promise<number> {
		const since = new Date(Date.now() - VELOCITY_WINDOW_MS)
		const [row] = await executor
			.select({ value: count() })
			.from(introductions)
			.where(
				and(
					eq(introductions.clientProfileId, clientProfileId),
					gte(introductions.createdAt, since),
				),
			)
		return row?.value ?? 0
	},

	async getActiveWindow(
		executor: DbOrTx,
		clientProfileId: string,
	): Promise<IntroAccessWindow | null> {
		const [window] = await executor
			.select()
			.from(introAccessWindows)
			.where(
				and(
					eq(introAccessWindows.clientProfileId, clientProfileId),
					gt(introAccessWindows.endsAt, new Date()),
				),
			)
			.limit(1)
		return window ?? null
	},

	async send(
		db: Db,
		input: { agentProfileIds: string[]; clientProfileId: string },
	): Promise<SendResult> {
		const agentProfileIds = [...new Set(input.agentProfileIds)]
		if (agentProfileIds.length === 0) {
			return {
				ok: false,
				error: { code: 'NO_AGENTS', message: 'Select at least one agent.' },
			}
		}

		return db.transaction(async (tx) => {
			await System.lockProfile(tx, input.clientProfileId)

			const [profile] = await tx
				.select()
				.from(clientProfiles)
				.where(eq(clientProfiles.id, input.clientProfileId))
				.limit(1)
			if (!profile) {
				return {
					ok: false,
					error: {
						code: 'PROFILE_NOT_FOUND',
						message: 'Client profile not found.',
					},
				}
			}

			const profileGuard = checkProfileEligible(profile.status)
			if (profileGuard) return { ok: false, error: profileGuard }

			const active = await Client.countActiveIntros(tx, input.clientProfileId)
			const velocity = await Client.countSentLast30Days(
				tx,
				input.clientProfileId,
			)

			const guard =
				checkSlotCap(active, agentProfileIds.length) ??
				checkVelocity(velocity, agentProfileIds.length)
			if (guard) return { ok: false, error: guard }

			const agents = await AgentRepo.loadByIds(agentProfileIds, tx)
			if (agents.length !== agentProfileIds.length) {
				return {
					ok: false,
					error: { code: 'AGENT_NOT_FOUND', message: 'Agent not found.' },
				}
			}

			const pairRows = await tx
				.select({
					agentProfileId: introductions.agentProfileId,
					status: introductions.status,
					data: introductions.data,
				})
				.from(introductions)
				.where(
					and(
						eq(introductions.clientProfileId, input.clientProfileId),
						inArray(introductions.agentProfileId, agentProfileIds),
					),
				)

			const flatProfile = await loadFlatProfile(profile, tx)
			if (!flatProfile) {
				return {
					ok: false,
					error: {
						code: 'PROFILE_NOT_FOUND',
						message: 'Client profile not found.',
					},
				}
			}
			const now = new Date()

			for (const agent of agents) {
				const rows = pairRows.filter((row) => row.agentProfileId === agent.id)
				if (rows.some((row) => PAIR_BLOCKING_STATUSES.includes(row.status))) {
					return {
						ok: false,
						error: {
							code: 'ALREADY_ACTIVE',
							message:
								'An introduction with this agent is already in progress.',
						},
					}
				}

				let terminal: { closedAt: Date } | null = null
				for (const row of rows) {
					if (!isClosedStatus(row.status)) {
						continue
					}
					const { closedAt } = decodeData(row.status, row.data)
					if (
						closedAt !== null &&
						(terminal === null || closedAt > terminal.closedAt)
					) {
						terminal = { closedAt }
					}
				}
				const cooldownGuard = checkCooldown(terminal, now)
				if (cooldownGuard) return { ok: false, error: cooldownGuard }

				const fit = calculateFitScore(agent, flatProfile)
				const eligibilityGuard = checkAgentEligible(fit.disqualified)
				if (eligibilityGuard) return { ok: false, error: eligibilityGuard }
			}

			const ids = agents.map(() => crypto.randomUUID())
			await tx.insert(introductions).values(
				agents.map((agent, index) => ({
					id: ids[index]!,
					clientProfileId: input.clientProfileId,
					agentProfileId: agent.id,
					status: 'pending' as const,
					createdAt: now,
					updatedAt: now,
				})),
			)
			await queueNotifications(tx, ids, 'sent')
			return { ok: true, ids }
		})
	},

	async withdraw(
		db: Db,
		input: { introductionId: string },
	): Promise<MutationResult> {
		const loaded = await loadIntroductionForUpdate(db, input.introductionId)
		if (!loaded.ok) return loaded

		return loaded.run(async (tx, intro) => {
			const now = new Date()
			const withdrawGuard = checkWithdrawable(intro, now)
			if (withdrawGuard) return { ok: false as const, error: withdrawGuard }

			await tx
				.update(introductions)
				.set({
					status: 'withdrawn',
					data: encodeData.closed(now),
					updatedAt: now,
				})
				.where(eq(introductions.id, intro.id))
			await tx
				.delete(introductionNotificationJobs)
				.where(
					and(
						eq(introductionNotificationJobs.introductionId, intro.id),
						eq(introductionNotificationJobs.kind, 'sent'),
						isNull(introductionNotificationJobs.sentAt),
					),
				)
			return { ok: true as const }
		})
	},

	async list(
		db: Db,
		clientProfileId: string,
	): Promise<ClientIntroductionsPayload> {
		const rows = await db
			.select({
				intro: introductions,
				agent: agentProfiles,
				agentUserEmail: user.email,
			})
			.from(introductions)
			.innerJoin(
				agentProfiles,
				eq(introductions.agentProfileId, agentProfiles.id),
			)
			.innerJoin(user, eq(agentProfiles.userId, user.id))
			.where(eq(introductions.clientProfileId, clientProfileId))
			.orderBy(desc(introductions.createdAt))

		const [activeCount, window] = await Promise.all([
			Client.countActiveIntros(db, clientProfileId),
			Client.getActiveWindow(db, clientProfileId),
		])

		return toClientIntroductionsPayload({
			introductions: rows.map((row) =>
				toClientIntroView(row.intro, {
					profileId: row.agent.id,
					name: agentDisplayName(row.agent),
					contact: {
						email: row.agent.email ?? row.agentUserEmail,
						phone: row.agent.phone,
						brokerageName: row.agent.brokerageName,
						licenseNumberState: row.agent.licenseNumberState,
						businessAddress: row.agent.businessAddress,
					},
				}),
			),
			activeCount,
			windowEndsAt: window?.endsAt ?? null,
			agentStates: buildAgentStates(
				rows.map((row) => row.intro),
				new Date(),
			),
		})
	},
}

// ===== Agent =================================================================

export const Agent = {
	async accept(
		db: Db,
		input: { introductionId: string },
	): Promise<AcceptResult> {
		const loaded = await loadIntroductionForUpdate(db, input.introductionId)
		if (!loaded.ok) return loaded

		return loaded.run(async (tx, intro) => {
			const pendingGuard = checkPending(intro.status)
			if (pendingGuard) return { ok: false as const, error: pendingGuard }

			const window = await Client.getActiveWindow(tx, intro.clientProfileId)
			const now = new Date()
			const connect = window !== null
			const status = connect ? ('connected' as const) : ('accepted' as const)

			await tx
				.update(introductions)
				.set({
					status,
					data: connect ? encodeData.connected(now) : encodeData.accepted(now),
					updatedAt: now,
				})
				.where(eq(introductions.id, intro.id))
			if (connect) await queueConnectedNotifications(tx, [intro.id])
			else await queueNotifications(tx, [intro.id], 'accepted')
			return { ok: true as const, status }
		})
	},

	async decline(
		db: Db,
		input: { introductionId: string },
	): Promise<MutationResult> {
		const loaded = await loadIntroductionForUpdate(db, input.introductionId)
		if (!loaded.ok) return loaded

		return loaded.run(async (tx, intro) => {
			const pendingGuard = checkPending(intro.status)
			if (pendingGuard) return { ok: false as const, error: pendingGuard }

			const now = new Date()
			await tx
				.update(introductions)
				.set({
					status: 'declined',
					data: encodeData.closed(now),
					updatedAt: now,
				})
				.where(eq(introductions.id, intro.id))
			await queueNotifications(tx, [intro.id], 'declined')
			return { ok: true as const }
		})
	},

	async list(db: Db, agentProfileId: string): Promise<AgentIntroView[]> {
		const [agent] = await AgentRepo.loadByIds([agentProfileId], db)
		if (!agent) return []

		const rows = await db
			.select({
				intro: introductions,
				profile: clientProfiles,
				city: cities,
				clientName: user.name,
				clientEmail: user.email,
			})
			.from(introductions)
			.innerJoin(
				clientProfiles,
				eq(introductions.clientProfileId, clientProfiles.id),
			)
			.innerJoin(cities, eq(clientProfiles.cityId, cities.id))
			.innerJoin(user, eq(clientProfiles.userId, user.id))
			.where(eq(introductions.agentProfileId, agentProfileId))
			.orderBy(desc(introductions.createdAt))

		const flatProfiles = new Map<string, ClientProfile | undefined>()
		for (const row of rows) {
			if (!flatProfiles.has(row.profile.id)) {
				flatProfiles.set(row.profile.id, await loadFlatProfile(row.profile, db))
			}
		}

		return rows.flatMap((row) => {
			const flatProfile = flatProfiles.get(row.profile.id)
			if (!flatProfile) return []
			const fit = calculateFitScore(agent, flatProfile)
			return toAgentIntroView(row.intro, {
				fullName: row.clientName,
				email: row.clientEmail,
				role: row.profile.role,
				city: row.city.name,
				state: row.city.state,
				timeline: row.profile.timeline,
				priceRange: formatPriceRange({
					min: row.profile.priceMin,
					max: row.profile.priceMax,
				}),
				propertyTypes: row.profile.propertyTypes,
				workStyle: {
					quickCommunicationChannel: row.profile.quickCommunicationChannel,
					updateDeliveryMethod: row.profile.updateDeliveryMethod,
					responseTimeExpectation: row.profile.responseTimeExpectation,
					involvementLevel: row.profile.involvementLevel,
					commissionComfort: row.profile.commissionComfort,
				},
				fitScore: fit.fitScore,
			})
		})
	},
}

// ===== System ================================================================

export const System = {
	async lockProfile(tx: Tx, clientProfileId: string): Promise<void> {
		await tx.execute(
			sql`select pg_advisory_xact_lock(hashtextextended(${clientProfileId}, 0))`,
		)
	},

	async connectAccepted(
		tx: Tx,
		clientProfileId: string,
		introductionIds?: string[],
	): Promise<string[]> {
		const now = new Date()
		const rows = await tx
			.update(introductions)
			.set({
				status: 'connected',
				data: sql`${introductions.data} || jsonb_build_object('connectedAt', ${now.toISOString()}::text)`,
				updatedAt: now,
			})
			.where(
				and(
					eq(introductions.clientProfileId, clientProfileId),
					eq(introductions.status, 'accepted'),
					introductionIds?.length
						? inArray(introductions.id, introductionIds)
						: undefined,
				),
			)
			.returning({ id: introductions.id })
		const connectedIds = rows.map((row) => row.id)
		await queueConnectedNotifications(tx, connectedIds)
		return connectedIds
	},
}

// ===== Internals (unexported) ================================================

async function queueConnectedNotifications(
	tx: Tx,
	introductionIds: string[],
): Promise<void> {
	if (introductionIds.length === 0) return
	await tx
		.insert(connectionNotificationJobs)
		.values(introductionIds.map((introductionId) => ({ introductionId })))
		.onConflictDoNothing()
}

async function queueNotifications(
	tx: Tx,
	introductionIds: string[],
	kind: 'sent' | 'accepted' | 'declined',
): Promise<void> {
	if (introductionIds.length === 0) return
	await tx
		.insert(introductionNotificationJobs)
		.values(
			introductionIds.map((introductionId) => ({
				id: crypto.randomUUID(),
				introductionId,
				kind,
			})),
		)
		.onConflictDoNothing()
}

async function loadIntroductionForUpdate(
	db: Db,
	introductionId: string,
): Promise<
	| {
			ok: true
			intro: typeof introductions.$inferSelect
			run: <T>(
				fn: (tx: Tx, intro: typeof introductions.$inferSelect) => Promise<T>,
			) => Promise<T>
	  }
	| { ok: false; error: GuardError }
> {
	const [intro] = await db
		.select()
		.from(introductions)
		.where(eq(introductions.id, introductionId))
		.limit(1)
	if (!intro) {
		return {
			ok: false,
			error: { code: 'NOT_FOUND', message: 'Introduction not found.' },
		}
	}
	return {
		ok: true,
		intro,
		run: (fn) =>
			db.transaction(async (tx) => {
				await System.lockProfile(tx, intro.clientProfileId)
				const [locked] = await tx
					.select()
					.from(introductions)
					.where(eq(introductions.id, introductionId))
					.limit(1)
				return fn(tx, locked ?? intro)
			}),
	}
}

async function loadFlatProfile(
	profile: typeof clientProfiles.$inferSelect,
	executor: DbOrTx,
): Promise<ClientProfile | undefined> {
	return profile.role === 'buyer'
		? Buyer.loadById(profile.id, executor)
		: Seller.loadById(profile.id, executor)
}
