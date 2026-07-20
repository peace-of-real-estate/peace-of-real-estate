import { and, eq, gt, inArray, sql } from 'drizzle-orm'

import {
	clientProfiles,
	introAccessWindows,
	introCheckoutReservations,
	introductions,
	introUnlockFulfillments,
} from '@/db/tables'
import { serverEnv as env } from '@/env.server'
import { Client, System, type Db, type DbOrTx } from '@/lib/introductions/db'
import { retryConnectedNotifications } from '@/lib/introductions/notify'
import type { ClientRole } from '@/lib/introductions/types'

import { INTRO_WINDOW_MONTHS } from './intro-unlock.config'
import { getStripe } from './stripe.server'

export type IntroErrorCode =
	| 'NO_PROFILE'
	| 'NO_ACCEPTED_INTRO'
	| 'INVALID_SELECTION'
	| 'WINDOW_ACTIVE'

export class IntroError extends Error {
	readonly code: IntroErrorCode

	constructor(code: IntroErrorCode, message: string) {
		super(message)
		this.name = 'IntroError'
		this.code = code
	}
}

export class MalformedIntroUnlockSessionError extends Error {
	constructor(message: string) {
		super(message)
		this.name = 'MalformedIntroUnlockSessionError'
	}
}

export type IntroUnlockSession = {
	payment_intent: string | { id: string } | null
	payment_status: string
	metadata: Record<string, string> | null
}

const CHECKOUT_RESERVATION_MS = 24 * 60 * 60 * 1_000

async function findClientProfile(db: DbOrTx, userId: string, role: ClientRole) {
	const [profile] = await db
		.select({ id: clientProfiles.id })
		.from(clientProfiles)
		.where(
			and(eq(clientProfiles.userId, userId), eq(clientProfiles.role, role)),
		)
		.limit(1)
	return profile
}

async function findAcceptedIntros(
	db: DbOrTx,
	clientProfileId: string,
	introductionIds: string[],
) {
	return db
		.select({ id: introductions.id })
		.from(introductions)
		.where(
			and(
				eq(introductions.clientProfileId, clientProfileId),
				eq(introductions.status, 'accepted'),
				inArray(introductions.id, introductionIds),
			),
		)
}

export async function createIntroUnlockCheckout(
	db: Db,
	input: {
		userId: string
		role: ClientRole
		origin: string
		returnPath: string
		introductionIds: string[]
	},
): Promise<{ url: string; sessionId: string }> {
	const profile = await findClientProfile(db, input.userId, input.role)
	if (!profile) {
		throw new IntroError('NO_PROFILE', 'Client profile not found.')
	}

	const priceId = env.STRIPE_INTRO_UNLOCK_PRICE_ID
	if (!priceId) {
		throw new Error('STRIPE_INTRO_UNLOCK_PRICE_ID is not configured.')
	}

	const introductionIds = [...new Set(input.introductionIds)]
	if (introductionIds.length === 0) {
		throw new IntroError(
			'INVALID_SELECTION',
			'Select at least one accepted agent to unlock.',
		)
	}

	const reservation = await db.transaction(async (tx) => {
		await System.lockProfile(tx, profile.id)
		const accepted = await findAcceptedIntros(tx, profile.id, introductionIds)
		if (accepted.length === 0) {
			throw new IntroError(
				'NO_ACCEPTED_INTRO',
				'An agent must accept an introduction before you can unlock.',
			)
		}
		if (accepted.length !== introductionIds.length) {
			throw new IntroError(
				'INVALID_SELECTION',
				'Every selected introduction must be accepted.',
			)
		}
		if (await Client.getActiveWindow(tx, profile.id)) {
			throw new IntroError(
				'WINDOW_ACTIVE',
				'Your access window is still active.',
			)
		}

		const now = new Date()
		const [existing] = await tx
			.select()
			.from(introCheckoutReservations)
			.where(
				and(
					eq(introCheckoutReservations.clientProfileId, profile.id),
					gt(introCheckoutReservations.expiresAt, now),
				),
			)
			.limit(1)
		if (existing) {
			const [updated] = await tx
				.update(introCheckoutReservations)
				.set({ selectedIntroductionIds: introductionIds, updatedAt: now })
				.where(eq(introCheckoutReservations.id, existing.id))
				.returning()
			return updated!
		}

		await tx
			.delete(introCheckoutReservations)
			.where(eq(introCheckoutReservations.clientProfileId, profile.id))
		const [created] = await tx
			.insert(introCheckoutReservations)
			.values({
				id: crypto.randomUUID(),
				clientProfileId: profile.id,
				selectedIntroductionIds: introductionIds,
				expiresAt: new Date(now.getTime() + CHECKOUT_RESERVATION_MS),
				updatedAt: now,
			})
			.returning()
		return created!
	})

	const stripe = getStripe()
	if (reservation.stripeSessionId) {
		const existingSession = await stripe.checkout.sessions.retrieve(
			reservation.stripeSessionId,
		)
		if (existingSession.url) {
			return { url: existingSession.url, sessionId: existingSession.id }
		}
	}

	const session = await stripe.checkout.sessions.create(
		{
			mode: 'payment',
			line_items: [{ price: priceId, quantity: 1 }],
			metadata: {
				kind: 'intro_unlock',
				clientProfileId: profile.id,
				reservationId: reservation.id,
			},
			success_url: `${input.origin}${input.returnPath}?unlock=success`,
			cancel_url: `${input.origin}${input.returnPath}`,
		},
		{ idempotencyKey: `intro-unlock-${reservation.id}` },
	)

	if (!session.url) {
		throw new Error('Stripe did not return a checkout URL.')
	}
	await db
		.update(introCheckoutReservations)
		.set({ stripeSessionId: session.id, updatedAt: new Date() })
		.where(eq(introCheckoutReservations.id, reservation.id))
	return { url: session.url, sessionId: session.id }
}

export async function fulfillIntroUnlock(
	db: Db,
	session: IntroUnlockSession,
): Promise<void> {
	const paymentIntent = session.payment_intent
	const paymentIntentId =
		typeof paymentIntent === 'string' ? paymentIntent : paymentIntent?.id
	const clientProfileId = session.metadata?.clientProfileId
	if (
		!paymentIntentId ||
		!clientProfileId ||
		session.metadata?.kind !== 'intro_unlock'
	) {
		throw new MalformedIntroUnlockSessionError(
			'Malformed intro_unlock checkout session.',
		)
	}
	if (session.payment_status !== 'paid') {
		throw new MalformedIntroUnlockSessionError(
			'Intro unlock checkout session is not paid.',
		)
	}

	await db.transaction(async (tx) => {
		await System.lockProfile(tx, clientProfileId)
		const recorded = await tx
			.insert(introUnlockFulfillments)
			.values({ stripePaymentIntentId: paymentIntentId, clientProfileId })
			.onConflictDoNothing()
			.returning({ id: introUnlockFulfillments.stripePaymentIntentId })
		if (!recorded.length) return

		const now = new Date()
		const [reservation] = await tx
			.select({
				selectedIntroductionIds:
					introCheckoutReservations.selectedIntroductionIds,
			})
			.from(introCheckoutReservations)
			.where(eq(introCheckoutReservations.clientProfileId, clientProfileId))
			.limit(1)
		await tx
			.insert(introAccessWindows)
			.values({
				id: crypto.randomUUID(),
				clientProfileId,
				startsAt: now,
				endsAt: sql`${now}::timestamptz + make_interval(months => ${INTRO_WINDOW_MONTHS})`,
				stripePaymentIntentId: paymentIntentId,
				updatedAt: now,
			})
			.onConflictDoUpdate({
				target: introAccessWindows.clientProfileId,
				set: {
					startsAt: sql`case when ${introAccessWindows.endsAt} > ${now}::timestamptz then ${introAccessWindows.startsAt} else ${now}::timestamptz end`,
					endsAt: sql`greatest(${introAccessWindows.endsAt}, ${now}::timestamptz) + make_interval(months => ${INTRO_WINDOW_MONTHS})`,
					stripePaymentIntentId: paymentIntentId,
					updatedAt: now,
				},
			})

		await System.connectAccepted(
			tx,
			clientProfileId,
			reservation?.selectedIntroductionIds ?? undefined,
		)
		await tx
			.delete(introCheckoutReservations)
			.where(eq(introCheckoutReservations.clientProfileId, clientProfileId))
	})

	void retryConnectedNotifications(db, { clientProfileId })
}
