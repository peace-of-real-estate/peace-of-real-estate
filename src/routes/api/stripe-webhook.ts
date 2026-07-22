import { createFileRoute } from '@tanstack/react-router'

import { db } from '@/db/connection'
import { serverEnv as env } from '@/env.server'
import {
	fulfillIntroUnlock,
	MalformedIntroUnlockSessionError,
} from '@/lib/payments/intro-unlock'
import { getStripe } from '@/lib/payments/stripe.server'

export const Route = createFileRoute('/api/stripe-webhook')({
	server: {
		handlers: {
			POST: async ({ request }) => {
				const signature = request.headers.get('stripe-signature')
				if (!signature || !env.STRIPE_WEBHOOK_SECRET) {
					return new Response('Missing stripe signature', { status: 400 })
				}

				const payload = await request.text()
				let event
				try {
					event = getStripe().webhooks.constructEvent(
						payload,
						signature,
						env.STRIPE_WEBHOOK_SECRET,
					)
				} catch {
					return new Response('Invalid stripe signature', { status: 400 })
				}

				if (
					event.type === 'checkout.session.completed' ||
					event.type === 'checkout.session.async_payment_succeeded'
				) {
					const session = event.data.object
					if (
						session.metadata?.kind === 'intro_unlock' &&
						session.payment_status === 'paid'
					) {
						try {
							await fulfillIntroUnlock(db, session)
						} catch (error) {
							if (error instanceof MalformedIntroUnlockSessionError) {
								console.error('Dropping malformed intro_unlock session:', error)
							} else {
								throw error
							}
						}
					}
				}

				return Response.json({ received: true })
			},
		},
	},
})
