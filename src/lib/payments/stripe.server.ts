import { Stripe } from 'stripe'

import { serverEnv as env } from '@/env.server'

let stripe: Stripe | null = null

export function getStripe(): Stripe {
	if (!env.STRIPE_SECRET_KEY) {
		throw new Error('STRIPE_SECRET_KEY is not configured.')
	}
	stripe ??= new Stripe(env.STRIPE_SECRET_KEY, {
		apiVersion: '2026-05-27.dahlia',
		typescript: true,
	})
	return stripe
}
