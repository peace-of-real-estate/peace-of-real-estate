import {
	hoursAgo,
	makeAccessWindow,
	makeIntroduction,
	seedAgent,
	seedClient,
} from '@tests/support/fixtures/data/introductions'
import {
	beforeEach,
	describe,
	expect,
	test,
	type Database,
} from '@tests/support/fixtures/db'
import { eq } from 'drizzle-orm'
import { vi } from 'vite-plus/test'

import {
	connectionNotificationJobs,
	introAccessWindows,
	introCheckoutReservations,
	introductions,
} from '@/db/schema'
import { Agent } from '@/lib/introductions/db'
import {
	createIntroUnlockCheckout,
	fulfillIntroUnlock,
	type IntroUnlockSession,
} from '@/lib/payments/intro-unlock'
import {
	INTRO_UNLOCK_CURRENCY,
	INTRO_UNLOCK_PRICE_CENTS,
} from '@/lib/payments/intro-unlock.config'

const mocks = vi.hoisted(() => ({
	retryConnectedNotifications:
		vi.fn<
			(db: Database, scope: { clientProfileId: string }) => Promise<void>
		>(),
	createSession:
		vi.fn<
			(
				params: unknown,
				options: { idempotencyKey: string },
			) => Promise<{ id: string; url: string }>
		>(),
	retrieveSession: vi.fn(),
	updateSession: vi.fn(),
	expireSession: vi.fn(),
	retrievePrice: vi.fn(),
}))

vi.mock('@/env.server', () => ({
	serverEnv: { STRIPE_INTRO_UNLOCK_PRICE_ID: 'price_intro_test' },
}))

vi.mock('@/lib/payments/stripe.server', () => ({
	getStripe: () => ({
		checkout: {
			sessions: {
				create: mocks.createSession,
				retrieve: mocks.retrieveSession,
				update: mocks.updateSession,
				expire: mocks.expireSession,
			},
		},
		prices: {
			retrieve: mocks.retrievePrice,
		},
	}),
}))

vi.mock('@/lib/introductions/notify', () => ({
	retryConnectedNotifications: mocks.retryConnectedNotifications,
}))

function makeSession(input: {
	paymentIntentId: string
	clientProfileId: string
	reservationId?: string
	selectedIntroductionIds?: string[]
}): IntroUnlockSession {
	return {
		payment_intent: input.paymentIntentId,
		payment_status: 'paid',
		metadata: {
			kind: 'intro_unlock',
			clientProfileId: input.clientProfileId,
			reservationId: input.reservationId ?? crypto.randomUUID(),
			...(input.selectedIntroductionIds
				? { selectedIntroductionIds: input.selectedIntroductionIds.join(',') }
				: {}),
		},
	}
}

async function getWindow(db: Database, clientProfileId: string) {
	const rows = await db
		.select()
		.from(introAccessWindows)
		.where(eq(introAccessWindows.clientProfileId, clientProfileId))
	return rows
}

async function seedAcceptedPair(db: Database) {
	const client = await seedClient(db)
	const agent = await seedAgent(db)
	const intro = makeIntroduction({
		clientProfileId: client.profile.id,
		agentProfileId: agent.profile.id,
		overrides: { status: 'accepted', acceptedAt: hoursAgo(2) },
	})
	await db.insert(introductions).values(intro)
	return { client, agent, intro }
}

beforeEach(() => {
	mocks.retryConnectedNotifications.mockReset()
	mocks.retryConnectedNotifications.mockResolvedValue(undefined)
	mocks.createSession.mockReset()
	mocks.retrieveSession.mockReset()
	mocks.updateSession.mockReset()
	mocks.expireSession.mockReset()
	mocks.expireSession.mockResolvedValue({})
	mocks.retrievePrice.mockReset()
	mocks.createSession.mockImplementation(
		async (_params: unknown, options: { idempotencyKey: string }) => ({
			id: `cs_${options.idempotencyKey}`,
			url: `https://checkout.test/${options.idempotencyKey}`,
		}),
	)
	mocks.retrieveSession.mockImplementation(async (sessionId: string) => ({
		id: sessionId,
		status: 'open',
		url: `https://checkout.test/existing/${sessionId}`,
	}))
	mocks.updateSession.mockImplementation(async (sessionId: string) => ({
		id: sessionId,
	}))
	mocks.retrievePrice.mockImplementation(async (id: string) => ({
		id,
		unit_amount: INTRO_UNLOCK_PRICE_CENTS,
		currency: INTRO_UNLOCK_CURRENCY,
	}))
})

describe('fulfillIntroUnlock', () => {
	test('first fulfillment creates a window and connects accepted intros', async ({
		db,
	}) => {
		vi.useFakeTimers({ toFake: ['Date'] })
		vi.setSystemTime(new Date('2026-04-15T12:00:00Z'))
		try {
			const { client, intro } = await seedAcceptedPair(db)

			await fulfillIntroUnlock(
				db,
				makeSession({
					paymentIntentId: 'pi_first',
					clientProfileId: client.profile.id,
					selectedIntroductionIds: [intro.id],
				}),
			)

			const windows = await getWindow(db, client.profile.id)
			expect(windows).toHaveLength(1)
			const window = windows[0]!
			expect(window.stripePaymentIntentId).toBe('pi_first')
			expect(window.endsAt).toEqual(new Date('2026-10-15T12:00:00Z'))

			const [row] = await db
				.select()
				.from(introductions)
				.where(eq(introductions.id, intro.id))
			expect(row?.status).toBe('connected')
			expect(row?.acceptedAt).toEqual(expect.any(Date))
			expect(row?.connectedAt).toEqual(expect.any(Date))
			expect(row?.closedAt).toBeNull()
			const jobs = await db
				.select()
				.from(connectionNotificationJobs)
				.where(eq(connectionNotificationJobs.introductionId, intro.id))
			expect(jobs).toHaveLength(1)

			expect(mocks.retryConnectedNotifications).toHaveBeenCalledTimes(1)
			expect(mocks.retryConnectedNotifications).toHaveBeenCalledWith(db, {
				clientProfileId: client.profile.id,
			})
		} finally {
			vi.useRealTimers()
		}
	})

	test('a replayed webhook with the same payment intent is a no-op', async ({
		db,
	}) => {
		const { client, intro } = await seedAcceptedPair(db)
		const session = makeSession({
			paymentIntentId: 'pi_replay',
			clientProfileId: client.profile.id,
			selectedIntroductionIds: [intro.id],
		})

		await fulfillIntroUnlock(db, session)
		const [first] = await getWindow(db, client.profile.id)
		mocks.retryConnectedNotifications.mockClear()

		await fulfillIntroUnlock(db, session)

		const windows = await getWindow(db, client.profile.id)
		expect(windows).toHaveLength(1)
		expect(windows[0]?.id).toBe(first?.id)
		expect(windows[0]?.startsAt.getTime()).toBe(first?.startsAt.getTime())
		expect(windows[0]?.endsAt.getTime()).toBe(first?.endsAt.getTime())
		expect(mocks.retryConnectedNotifications).toHaveBeenCalledTimes(1)
		expect(mocks.retryConnectedNotifications).toHaveBeenCalledWith(db, {
			clientProfileId: client.profile.id,
		})
	})

	test('an older payment intent stays fulfilled after a later purchase', async ({
		db,
	}) => {
		const { client, intro } = await seedAcceptedPair(db)
		const firstSession = makeSession({
			paymentIntentId: 'pi_first_purchase',
			clientProfileId: client.profile.id,
			selectedIntroductionIds: [intro.id],
		})
		await fulfillIntroUnlock(db, firstSession)
		await fulfillIntroUnlock(
			db,
			makeSession({
				paymentIntentId: 'pi_second_purchase',
				clientProfileId: client.profile.id,
				selectedIntroductionIds: [intro.id],
			}),
		)

		const agent = await seedAgent(db)
		const accepted = makeIntroduction({
			clientProfileId: client.profile.id,
			agentProfileId: agent.profile.id,
			overrides: { status: 'accepted', acceptedAt: hoursAgo(1) },
		})
		await db.insert(introductions).values(accepted)
		mocks.retryConnectedNotifications.mockClear()

		await fulfillIntroUnlock(db, firstSession)

		const [window] = await getWindow(db, client.profile.id)
		expect(window?.stripePaymentIntentId).toBe('pi_second_purchase')
		const [laterAccepted] = await db
			.select()
			.from(introductions)
			.where(eq(introductions.id, accepted.id))
		expect(laterAccepted?.status).toBe('accepted')
		expect(mocks.retryConnectedNotifications).toHaveBeenCalledWith(db, {
			clientProfileId: client.profile.id,
		})
	})

	test('a repeat purchase updates the existing window row', async ({ db }) => {
		const client = await seedClient(db)
		const expired = makeAccessWindow(client.profile.id, {
			stripePaymentIntentId: 'pi_old',
			startsAt: hoursAgo(24 * 200),
			endsAt: hoursAgo(24 * 20),
		})
		await db.insert(introAccessWindows).values(expired)

		await fulfillIntroUnlock(
			db,
			makeSession({
				paymentIntentId: 'pi_new',
				clientProfileId: client.profile.id,
				selectedIntroductionIds: [crypto.randomUUID()],
			}),
		)

		const windows = await getWindow(db, client.profile.id)
		expect(windows).toHaveLength(1)
		expect(windows[0]?.id).toBe(expired.id)
		expect(windows[0]?.stripePaymentIntentId).toBe('pi_new')
		expect(windows[0]?.endsAt.getTime()).toBeGreaterThan(Date.now())
	})

	test('clamps a new six-month window to the end of the month', async ({
		db,
	}) => {
		vi.useFakeTimers({ toFake: ['Date'] })
		vi.setSystemTime(new Date('2026-08-31T12:00:00Z'))
		try {
			const client = await seedClient(db)
			await fulfillIntroUnlock(
				db,
				makeSession({
					paymentIntentId: 'pi_month_end',
					clientProfileId: client.profile.id,
					selectedIntroductionIds: [crypto.randomUUID()],
				}),
			)

			const [window] = await getWindow(db, client.profile.id)
			expect(window?.startsAt).toEqual(new Date('2026-08-31T12:00:00Z'))
			expect(window?.endsAt).toEqual(new Date('2027-02-28T12:00:00Z'))
		} finally {
			vi.useRealTimers()
		}
	})

	test('extends an active window from its current end', async ({ db }) => {
		vi.useFakeTimers({ toFake: ['Date'] })
		vi.setSystemTime(new Date('2026-05-15T12:00:00Z'))
		try {
			const client = await seedClient(db)
			const active = makeAccessWindow(client.profile.id, {
				stripePaymentIntentId: 'pi_active',
				startsAt: new Date('2026-01-31T12:00:00Z'),
				endsAt: new Date('2026-09-30T12:00:00Z'),
			})
			await db.insert(introAccessWindows).values(active)

			await fulfillIntroUnlock(
				db,
				makeSession({
					paymentIntentId: 'pi_extension',
					clientProfileId: client.profile.id,
					selectedIntroductionIds: [crypto.randomUUID()],
				}),
			)

			const [window] = await getWindow(db, client.profile.id)
			expect(window?.startsAt).toEqual(active.startsAt)
			expect(window?.endsAt).toEqual(new Date('2027-03-30T12:00:00Z'))
		} finally {
			vi.useRealTimers()
		}
	})

	test('fulfillment with no accepted intros still grants the window', async ({
		db,
	}) => {
		const client = await seedClient(db)

		await fulfillIntroUnlock(
			db,
			makeSession({
				paymentIntentId: 'pi_lonely',
				clientProfileId: client.profile.id,
				selectedIntroductionIds: [crypto.randomUUID()],
			}),
		)

		expect(await getWindow(db, client.profile.id)).toHaveLength(1)
		expect(mocks.retryConnectedNotifications).toHaveBeenCalledWith(db, {
			clientProfileId: client.profile.id,
		})
	})

	test('malformed sessions are rejected', async ({ db }) => {
		const client = await seedClient(db)
		await expect(
			fulfillIntroUnlock(db, {
				payment_intent: null,
				payment_status: 'paid',
				metadata: {
					kind: 'intro_unlock',
					clientProfileId: client.profile.id,
				},
			}),
		).rejects.toThrow('Malformed intro_unlock checkout session.')
		expect(await getWindow(db, client.profile.id)).toHaveLength(0)
	})

	test('unpaid sessions do not grant access', async ({ db }) => {
		const client = await seedClient(db)
		const session = makeSession({
			paymentIntentId: 'pi_unpaid',
			clientProfileId: client.profile.id,
			selectedIntroductionIds: [crypto.randomUUID()],
		})
		session.payment_status = 'unpaid'

		await expect(fulfillIntroUnlock(db, session)).rejects.toThrow('not paid')
		expect(await getWindow(db, client.profile.id)).toHaveLength(0)
	})
})

describe('checkout reservation', () => {
	test('concurrent checkout requests share one reservation and idempotency key', async ({
		db,
	}) => {
		vi.useFakeTimers({ toFake: ['Date'] })
		try {
			const { client, intro } = await seedAcceptedPair(db)
			const input = {
				userId: client.user.id,
				role: 'buyer' as const,
				origin: 'https://example.test',
				returnPath: '/buyer/introductions',
				introductionIds: [intro.id],
			}

			const sessions = await Promise.all([
				createIntroUnlockCheckout(db, input),
				createIntroUnlockCheckout(db, input),
			])

			const reservations = await db.select().from(introCheckoutReservations)
			expect(reservations).toHaveLength(1)
			expect(new Set(sessions.map((session) => session.sessionId)).size).toBe(1)
			const idempotencyKeys = mocks.createSession.mock.calls.map(
				(call) => call[1].idempotencyKey,
			)
			expect(new Set(idempotencyKeys).size).toBe(1)
		} finally {
			vi.useRealTimers()
		}
	})

	test('an open existing session is reused instead of creating another', async ({
		db,
	}) => {
		const { client, intro } = await seedAcceptedPair(db)
		const input = {
			userId: client.user.id,
			role: 'buyer' as const,
			origin: 'https://example.test',
			returnPath: '/buyer/introductions',
			introductionIds: [intro.id],
		}

		const first = await createIntroUnlockCheckout(db, input)
		const second = await createIntroUnlockCheckout(db, input)

		expect(mocks.createSession).toHaveBeenCalledTimes(1)
		expect(mocks.retrieveSession).toHaveBeenCalledWith(first.sessionId)
		expect(second.sessionId).toBe(first.sessionId)
		expect(second.url).toBe(`https://checkout.test/existing/${first.sessionId}`)
		expect(mocks.updateSession).toHaveBeenCalledWith(first.sessionId, {
			metadata: expect.objectContaining({
				kind: 'intro_unlock',
				clientProfileId: client.profile.id,
				selectedIntroductionIds: intro.id,
			}),
		})
	})

	test('checkout is rejected while an access window is active', async ({
		db,
	}) => {
		const { client, intro } = await seedAcceptedPair(db)
		await db
			.insert(introAccessWindows)
			.values(makeAccessWindow(client.profile.id))

		await expect(
			createIntroUnlockCheckout(db, {
				userId: client.user.id,
				role: 'buyer',
				origin: 'https://example.test',
				returnPath: '/buyer/introductions',
				introductionIds: [intro.id],
			}),
		).rejects.toThrow('Your access window is still active.')
		expect(mocks.createSession).not.toHaveBeenCalled()
	})
	test('checkout rejects a selection larger than the active-intro cap', async ({
		db,
	}) => {
		const { client, intro } = await seedAcceptedPair(db)
		void intro

		await expect(
			createIntroUnlockCheckout(db, {
				userId: client.user.id,
				role: 'buyer',
				origin: 'https://example.test',
				returnPath: '/buyer/introductions',
				introductionIds: [
					crypto.randomUUID(),
					crypto.randomUUID(),
					crypto.randomUUID(),
					crypto.randomUUID(),
				],
			}),
		).rejects.toThrow('Select at most 3 agents to unlock.')
		expect(mocks.createSession).not.toHaveBeenCalled()
	})

	test('an open session without a url is expired before replacement', async ({
		db,
	}) => {
		const { client, intro } = await seedAcceptedPair(db)
		const input = {
			userId: client.user.id,
			role: 'buyer' as const,
			origin: 'https://example.test',
			returnPath: '/buyer/introductions',
			introductionIds: [intro.id],
		}

		const first = await createIntroUnlockCheckout(db, input)
		mocks.retrieveSession.mockResolvedValueOnce({
			id: first.sessionId,
			status: 'open',
			url: null,
		})

		const second = await createIntroUnlockCheckout(db, input)

		expect(second.sessionId).not.toBe(first.sessionId)
		expect(mocks.expireSession).toHaveBeenCalledWith(first.sessionId)
		const [reservation] = await db
			.select()
			.from(introCheckoutReservations)
			.where(eq(introCheckoutReservations.clientProfileId, client.profile.id))
		expect(reservation?.stripeSessionId).toBe(second.sessionId)
	})

	test('checkout persists the selection and fulfillment connects only it', async ({
		db,
	}) => {
		const { client, intro } = await seedAcceptedPair(db)
		const otherAgent = await seedAgent(db)
		const otherIntro = makeIntroduction({
			clientProfileId: client.profile.id,
			agentProfileId: otherAgent.profile.id,
			overrides: { status: 'accepted', acceptedAt: hoursAgo(1) },
		})
		await db.insert(introductions).values(otherIntro)

		await createIntroUnlockCheckout(db, {
			userId: client.user.id,
			role: 'buyer',
			origin: 'https://example.test',
			returnPath: '/buyer/introductions',
			introductionIds: [intro.id],
		})

		const [reservation] = await db
			.select()
			.from(introCheckoutReservations)
			.where(eq(introCheckoutReservations.clientProfileId, client.profile.id))
		expect(reservation?.selectedIntroductionIds).toEqual([intro.id])

		await fulfillIntroUnlock(
			db,
			makeSession({
				paymentIntentId: 'pi_selected',
				clientProfileId: client.profile.id,
				reservationId: reservation!.id,
				selectedIntroductionIds: [intro.id],
			}),
		)

		const rows = await db
			.select()
			.from(introductions)
			.where(eq(introductions.clientProfileId, client.profile.id))
		const byId = new Map(rows.map((row) => [row.id, row.status]))
		expect(byId.get(intro.id)).toBe('connected')
		expect(byId.get(otherIntro.id)).toBe('accepted')
	})

	test('fulfillment for a replaced reservation connects only the original selection', async ({
		db,
	}) => {
		const { client, intro } = await seedAcceptedPair(db)
		const otherAgent = await seedAgent(db)
		const otherIntro = makeIntroduction({
			clientProfileId: client.profile.id,
			agentProfileId: otherAgent.profile.id,
			overrides: { status: 'accepted', acceptedAt: hoursAgo(1) },
		})
		await db.insert(introductions).values(otherIntro)

		const input = {
			userId: client.user.id,
			role: 'buyer' as const,
			origin: 'https://example.test',
			returnPath: '/buyer/introductions',
		}
		await createIntroUnlockCheckout(db, {
			...input,
			introductionIds: [intro.id],
		})
		const [stale] = await db.select().from(introCheckoutReservations)
		await db
			.update(introCheckoutReservations)
			.set({ expiresAt: hoursAgo(1) })
			.where(eq(introCheckoutReservations.id, stale!.id))
		await createIntroUnlockCheckout(db, {
			...input,
			introductionIds: [otherIntro.id],
		})

		await fulfillIntroUnlock(
			db,
			makeSession({
				paymentIntentId: 'pi_stale_reservation',
				clientProfileId: client.profile.id,
				reservationId: stale!.id,
				selectedIntroductionIds: [intro.id],
			}),
		)

		const reservations = await db
			.select()
			.from(introCheckoutReservations)
			.where(eq(introCheckoutReservations.clientProfileId, client.profile.id))
		expect(reservations).toHaveLength(1)
		expect(reservations[0]?.id).not.toBe(stale!.id)
		expect(reservations[0]?.selectedIntroductionIds).toEqual([otherIntro.id])
		const rows = await db
			.select()
			.from(introductions)
			.where(eq(introductions.clientProfileId, client.profile.id))
		const byId = new Map(rows.map((row) => [row.id, row.status]))
		expect(byId.get(intro.id)).toBe('connected')
		expect(byId.get(otherIntro.id)).toBe('accepted')
	})

	test('checkout rejects a selection with a non-accepted intro', async ({
		db,
	}) => {
		const { client, intro } = await seedAcceptedPair(db)
		const pendingAgent = await seedAgent(db)
		const pendingIntro = makeIntroduction({
			clientProfileId: client.profile.id,
			agentProfileId: pendingAgent.profile.id,
		})
		await db.insert(introductions).values(pendingIntro)

		await expect(
			createIntroUnlockCheckout(db, {
				userId: client.user.id,
				role: 'buyer',
				origin: 'https://example.test',
				returnPath: '/buyer/introductions',
				introductionIds: [intro.id, pendingIntro.id],
			}),
		).rejects.toThrow('Every selected introduction must be accepted.')
	})

	test('checkout rejects an empty selection', async ({ db }) => {
		const { client, intro } = await seedAcceptedPair(db)
		void intro

		await expect(
			createIntroUnlockCheckout(db, {
				userId: client.user.id,
				role: 'buyer',
				origin: 'https://example.test',
				returnPath: '/buyer/introductions',
				introductionIds: [],
			}),
		).rejects.toThrow('Select at least one accepted agent to unlock.')
	})

	test('fulfillment without a recorded selection fails closed', async ({
		db,
	}) => {
		const { client, intro } = await seedAcceptedPair(db)

		await expect(
			fulfillIntroUnlock(
				db,
				makeSession({
					paymentIntentId: 'pi_no_reservation',
					clientProfileId: client.profile.id,
				}),
			),
		).rejects.toThrow('Malformed intro_unlock checkout session.')

		const [row] = await db
			.select()
			.from(introductions)
			.where(eq(introductions.id, intro.id))
		expect(row?.status).toBe('accepted')
		expect(await getWindow(db, client.profile.id)).toHaveLength(0)
	})
})

describe('accept-during-window seam', () => {
	test('acceptance concurrent with fulfillment always connects', async ({
		db,
	}) => {
		const client = await seedClient(db)
		const agent = await seedAgent(db)
		const intro = makeIntroduction({
			clientProfileId: client.profile.id,
			agentProfileId: agent.profile.id,
		})
		await db.insert(introductions).values(intro)

		const [acceptResult] = await Promise.all([
			Agent.accept(db, { introductionId: intro.id }),
			fulfillIntroUnlock(
				db,
				makeSession({
					paymentIntentId: 'pi_concurrent',
					clientProfileId: client.profile.id,
					selectedIntroductionIds: [intro.id],
				}),
			),
		])

		expect(acceptResult.ok).toBe(true)
		const [row] = await db
			.select()
			.from(introductions)
			.where(eq(introductions.id, intro.id))
		expect(row?.status).toBe('connected')
		expect(await getWindow(db, client.profile.id)).toHaveLength(1)
	})

	test('accept connects directly without payment and the db layer sends no email', async ({
		db,
	}) => {
		const client = await seedClient(db)
		const agent = await seedAgent(db)
		await db
			.insert(introAccessWindows)
			.values(makeAccessWindow(client.profile.id))
		const intro = makeIntroduction({
			clientProfileId: client.profile.id,
			agentProfileId: agent.profile.id,
		})
		await db.insert(introductions).values(intro)

		const result = await Agent.accept(db, {
			introductionId: intro.id,
		})
		expect(result).toEqual({ ok: true, status: 'connected' })
		const jobs = await db
			.select()
			.from(connectionNotificationJobs)
			.where(eq(connectionNotificationJobs.introductionId, intro.id))
		expect(jobs).toHaveLength(1)
		expect(mocks.retryConnectedNotifications).not.toHaveBeenCalled()
	})
})
