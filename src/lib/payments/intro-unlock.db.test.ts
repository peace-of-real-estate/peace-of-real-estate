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
} from '@/db/tables'
import { Agent } from '@/lib/introductions/db'
import { encodeData } from '@/lib/introductions/intro-data'
import {
	createIntroUnlockCheckout,
	fulfillIntroUnlock,
	type IntroUnlockSession,
} from '@/lib/payments/intro-unlock'

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
			},
		},
	}),
}))

vi.mock('@/lib/introductions/notify', () => ({
	retryConnectedNotifications: mocks.retryConnectedNotifications,
}))

function makeSession(input: {
	paymentIntentId: string
	clientProfileId: string
}): IntroUnlockSession {
	return {
		payment_intent: input.paymentIntentId,
		payment_status: 'paid',
		metadata: { kind: 'intro_unlock', clientProfileId: input.clientProfileId },
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
		overrides: { status: 'accepted', data: encodeData.accepted(hoursAgo(2)) },
	})
	await db.insert(introductions).values(intro)
	return { client, agent, intro }
}

beforeEach(() => {
	mocks.retryConnectedNotifications.mockReset()
	mocks.retryConnectedNotifications.mockResolvedValue(undefined)
	mocks.createSession.mockReset()
	mocks.retrieveSession.mockReset()
	mocks.createSession.mockImplementation(
		async (_params: unknown, options: { idempotencyKey: string }) => ({
			id: `cs_${options.idempotencyKey}`,
			url: `https://checkout.test/${options.idempotencyKey}`,
		}),
	)
	mocks.retrieveSession.mockImplementation(async (sessionId: string) => ({
		id: sessionId,
		url: `https://checkout.test/existing/${sessionId}`,
	}))
})

describe('fulfillIntroUnlock', () => {
	test('first fulfillment creates a window and connects accepted intros', async ({
		db,
	}) => {
		const { client, intro } = await seedAcceptedPair(db)

		await fulfillIntroUnlock(
			db,
			makeSession({
				paymentIntentId: 'pi_first',
				clientProfileId: client.profile.id,
			}),
		)

		const windows = await getWindow(db, client.profile.id)
		expect(windows).toHaveLength(1)
		const window = windows[0]!
		expect(window.stripePaymentIntentId).toBe('pi_first')
		const sixMonths = new Date(window.startsAt)
		sixMonths.setUTCMonth(sixMonths.getUTCMonth() + 6)
		expect(window.endsAt.getTime()).toBe(sixMonths.getTime())

		const [row] = await db
			.select()
			.from(introductions)
			.where(eq(introductions.id, intro.id))
		expect(row?.status).toBe('connected')
		expect(row?.data).toEqual({
			acceptedAt: expect.any(String),
			connectedAt: expect.any(String),
		})
		const jobs = await db
			.select()
			.from(connectionNotificationJobs)
			.where(eq(connectionNotificationJobs.introductionId, intro.id))
		expect(jobs).toHaveLength(1)

		expect(mocks.retryConnectedNotifications).toHaveBeenCalledTimes(1)
		expect(mocks.retryConnectedNotifications).toHaveBeenCalledWith(db, {
			clientProfileId: client.profile.id,
		})
	})

	test('a replayed webhook with the same payment intent is a no-op', async ({
		db,
	}) => {
		const { client } = await seedAcceptedPair(db)
		const session = makeSession({
			paymentIntentId: 'pi_replay',
			clientProfileId: client.profile.id,
		})

		await fulfillIntroUnlock(db, session)
		const [first] = await getWindow(db, client.profile.id)
		mocks.retryConnectedNotifications.mockClear()

		await fulfillIntroUnlock(db, session)

		const windows = await getWindow(db, client.profile.id)
		expect(windows).toHaveLength(1)
		expect(windows[0]?.id).toBe(first?.id)
		expect(windows[0]?.startsAt.getTime()).toBe(first?.startsAt.getTime())
		expect(mocks.retryConnectedNotifications).toHaveBeenCalledWith(db, {
			clientProfileId: client.profile.id,
		})
	})

	test('an older payment intent stays fulfilled after a later purchase', async ({
		db,
	}) => {
		const { client } = await seedAcceptedPair(db)
		const firstSession = makeSession({
			paymentIntentId: 'pi_first_purchase',
			clientProfileId: client.profile.id,
		})
		await fulfillIntroUnlock(db, firstSession)
		await fulfillIntroUnlock(
			db,
			makeSession({
				paymentIntentId: 'pi_second_purchase',
				clientProfileId: client.profile.id,
			}),
		)

		const agent = await seedAgent(db)
		const accepted = makeIntroduction({
			clientProfileId: client.profile.id,
			agentProfileId: agent.profile.id,
			overrides: { status: 'accepted', data: encodeData.accepted(hoursAgo(1)) },
		})
		await db.insert(introductions).values(accepted)
		mocks.retryConnectedNotifications.mockClear()

		await fulfillIntroUnlock(db, firstSession)

		const [window] = await getWindow(db, client.profile.id)
		expect(window?.stripePaymentIntentId).toBe('pi_second_purchase')
		const [intro] = await db
			.select()
			.from(introductions)
			.where(eq(introductions.id, accepted.id))
		expect(intro?.status).toBe('accepted')
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
		vi.useFakeTimers()
		vi.setSystemTime(new Date('2026-08-31T12:00:00Z'))
		try {
			const client = await seedClient(db)
			await fulfillIntroUnlock(
				db,
				makeSession({
					paymentIntentId: 'pi_month_end',
					clientProfileId: client.profile.id,
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
			}),
		)

		const [window] = await getWindow(db, client.profile.id)
		expect(window?.startsAt).toEqual(active.startsAt)
		expect(window?.endsAt).toEqual(new Date('2027-03-30T12:00:00Z'))
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
	})
	test('checkout persists the selection and fulfillment connects only it', async ({
		db,
	}) => {
		const { client, intro } = await seedAcceptedPair(db)
		const otherAgent = await seedAgent(db)
		const otherIntro = makeIntroduction({
			clientProfileId: client.profile.id,
			agentProfileId: otherAgent.profile.id,
			overrides: { status: 'accepted', data: encodeData.accepted(hoursAgo(1)) },
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

	test('fulfillment without a reservation connects all accepted intros', async ({
		db,
	}) => {
		const { client, intro } = await seedAcceptedPair(db)

		await fulfillIntroUnlock(
			db,
			makeSession({
				paymentIntentId: 'pi_no_reservation',
				clientProfileId: client.profile.id,
			}),
		)

		const [row] = await db
			.select()
			.from(introductions)
			.where(eq(introductions.id, intro.id))
		expect(row?.status).toBe('connected')
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
