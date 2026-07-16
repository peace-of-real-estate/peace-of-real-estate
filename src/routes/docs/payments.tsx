import { createFileRoute } from '@tanstack/react-router'

import {
	BulletList,
	CodeBlock,
	DocPage,
	DocSection,
	DocSubSection,
	StepList,
	Table,
	TableCell,
	TableRow,
} from '@/routes/docs/-components/doc-ui'

export const Route = createFileRoute('/docs/payments')({
	component: Payments,
})

const envCode = `// src/env.server.ts
STRIPE_SECRET_KEY: z.string(),
STRIPE_WEBHOOK_SECRET: z.string(),
STRIPE_INTRO_UNLOCK_PRICE_ID: z.string(),`

const stripeClientCode = `// src/lib/payments/stripe.server.ts
import { Stripe } from 'stripe'
import { serverEnv as env } from '@/env.server'

export const stripe = new Stripe(env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-06-30.basil',
  typescript: true,
})

export type StripeMeta = { kind: 'intro_unlock'; userId: string; role: string }`

const checkoutCode = `// src/lib/payments/intro-unlock.ts
import { stripe } from './stripe.server'

export async function createIntroUnlockCheckout(input: {
  userId: string
  role: 'buyer' | 'seller'
  origin: string
  returnPath: string
}): Promise<{ url: string; sessionId: string }> {
  const [accepted] = await tx((t) =>
    countAcceptedIntros(t, input.userId, input.role),
  )
  if (accepted === 0) throw new IntroError('NO_ACCEPTED_INTRO')
  if (await hasActiveWindow(input.userId, input.role)) {
    throw new IntroError('WINDOW_ACTIVE')
  }

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    line_items: [{ price: env.STRIPE_INTRO_UNLOCK_PRICE_ID, quantity: 1 }],
    metadata: { kind: 'intro_unlock', userId: input.userId, role: input.role },
    success_url: \`\${input.origin}\${input.returnPath}?unlock=success\`,
    cancel_url: \`\${input.origin}\${input.returnPath}\`,
  })

  return { url: session.url!, sessionId: session.id }
}`

const webhookCode = `// src/routes/api/stripe-webhook.$.ts
import { stripe } from '@/lib/payments/stripe.server'
import { fulfillIntroUnlock } from '@/lib/payments/intro-unlock'
import { serverEnv as env } from '@/env.server'

export const APIRoute = createAPIFileRoute('/api/stripe-webhook')({
  POST: async ({ request }) => {
    const payload = await request.text()
    const sig = request.headers.get('stripe-signature')
    const event = stripe.webhooks.constructEvent(
      payload,
      sig!,
      env.STRIPE_WEBHOOK_SECRET,
    )

    if (
      event.type === 'checkout.session.completed' &&
      event.data.object.metadata?.kind === 'intro_unlock'
    ) {
      await fulfillIntroUnlock(event.data.object)
    }

    return new Response(JSON.stringify({ received: true }), { status: 200 })
  },
})`

const fulfillmentCode = `// src/lib/payments/intro-unlock.ts
export async function fulfillIntroUnlock(
  session: Stripe.Checkout.Session,
): Promise<void> {
  const paymentIntentId = session.payment_intent as string
  const { userId, role } = session.metadata as StripeMeta

  await db.transaction(async (tx) => {
    const fulfilled = await tx
      .select({ id: userEntitlements.id })
      .from(userEntitlements)
      .where(
        and(
          eq(userEntitlements.userId, userId),
          eq(userEntitlements.key, \`intro_access_\${role}\`),
          eq(userEntitlements.stripePaymentIntentId, paymentIntentId),
        ),
      )
    if (fulfilled.length) return // idempotent

    const startsAt = new Date()
    const endsAt = addMonths(startsAt, 6)

    await tx
      .insert(userEntitlements)
      .values({
        userId,
        key: \`intro_access_\${role}\`,
        startsAt,
        endsAt,
        stripePaymentIntentId: paymentIntentId,
      })
      .onConflictDoUpdate({
        target: [userEntitlements.userId, userEntitlements.key],
        set: { startsAt, endsAt, stripePaymentIntentId: paymentIntentId },
      })

    await connectAcceptedIntros(tx, { userId, role })
  })

  await queueConnectedEmails({ userId, role })
}`

function Payments() {
	return (
		<DocPage
			path="/docs/payments"
			lede={
				<>
					<b>$20 buys a 6-month access window, scoped per role</b> (buyer or
					seller profile); a returning user later simply pays again. The window
					is purchasable only after the first acceptance — paying at the moment
					of proven value keeps refund pressure near zero. Stripe Checkout,{' '}
					<code>mode: payment</code>, fulfilled by a webhook route.
				</>
			}
		>
			<DocSection title="Checkout and fulfillment flow">
				<StepList
					steps={[
						<>
							Client calls <code>createIntroUnlockCheckout(role)</code>.
						</>,
						<>Server guards: at least 1 accepted intro, no active window.</>,
						<>
							Server creates a Stripe Checkout Session ($20, metadata:{' '}
							<code>kind=intro_unlock</code>, userId, role).
						</>,
						<>Stripe hosts the checkout page; client pays.</>,
						<>
							Stripe sends <code>checkout.session.completed</code> to the
							webhook route.
						</>,
						<>
							Webhook verifies the signature and matches{' '}
							<code>metadata.kind</code>.
						</>,
						<>
							Fulfillment runs in a transaction, idempotent on{' '}
							<code>paymentIntentId</code>: upsert entitlement{' '}
							<code>endsAt = now + 6mo</code>, transition accepted intros to
							connected, queue "You're connected" emails.
						</>,
						<>
							Client redirects back and polls until the entitlement is visible.
						</>,
					]}
				/>
			</DocSection>

			<DocSection title="Code">
				<p className="text-muted-foreground text-sm">
					Stripe wiring is split into a client singleton, checkout/fulfillment
					domain module, and the webhook API route.
				</p>

				<DocSubSection title="src/env.server.ts">
					<CodeBlock code={envCode} language="typescript" />
				</DocSubSection>

				<DocSubSection title="src/lib/payments/stripe.server.ts">
					<CodeBlock code={stripeClientCode} language="typescript" />
				</DocSubSection>

				<DocSubSection title="src/lib/payments/intro-unlock.ts — checkout">
					<CodeBlock code={checkoutCode} language="typescript" />
				</DocSubSection>

				<DocSubSection title="src/routes/api/stripe-webhook.$.ts">
					<CodeBlock code={webhookCode} language="typescript" />
				</DocSubSection>

				<DocSubSection title="src/lib/payments/intro-unlock.ts — fulfillment">
					<CodeBlock code={fulfillmentCode} language="typescript" />
				</DocSubSection>
			</DocSection>

			<DocSection title="Database — user_entitlements">
				<p className="text-muted-foreground text-[13px]">
					Repurposed for the access window; no DDL changes.
				</p>
				<Table headers={['Column / field', 'Value / rule']}>
					<TableRow>
						<TableCell>
							<code>key</code>
						</TableCell>
						<TableCell>
							<code>intro_access_buyer</code> / <code>intro_access_seller</code>
							. In the EntitlementKey type, these replace the unused{' '}
							<code>client_lifetime_premium</code>.
						</TableCell>
					</TableRow>
					<TableRow>
						<TableCell>Active window</TableCell>
						<TableCell>
							<code>ends_at &gt;= now()</code>; ends_at = starts_at + 6 months.
						</TableCell>
					</TableRow>
					<TableRow>
						<TableCell>Repeat purchase</TableCell>
						<TableCell>
							Updates the (user_id, key) row; purchase history lives in Stripe.
						</TableCell>
					</TableRow>
				</Table>
			</DocSection>

			<DocSection title="Window semantics">
				<BulletList>
					<li>
						While a window is active, an agent's accept transitions{' '}
						<code>pending → connected</code> directly — no second paywall
						moment.
					</li>
					<li>
						Window expires with <code>accepted</code> intros outstanding → they
						stay <code>accepted</code>; buying a new window connects them.
					</li>
					<li>
						Already-<code>connected</code> intros are untouched by expiry —
						connections are permanent.
					</li>
					<li>
						Buyer and seller windows are fully independent purchases; a user
						with both profiles buys each separately.
					</li>
				</BulletList>
			</DocSection>

			<DocSection title="Operational notes">
				<BulletList>
					<li>
						<b>No saved payment methods / auto-charge</b> — plain Stripe
						Checkout per purchase.
					</li>
					<li>
						<b>Idempotency:</b> fulfillment keyed on{' '}
						<code>stripePaymentIntentId</code>; duplicate/replayed webhooks are
						no-ops.
					</li>
					<li>
						<b>Webhook lag:</b> the success redirect shows "processing payment…"
						and refetches for up to ~30s.
					</li>
					<li>
						<b>Refunds:</b> manual via Stripe dashboard for v1; entitlement
						revocation is a manual DB operation.
					</li>
				</BulletList>
			</DocSection>

			<DocSection title="Oddities & race cases">
				<BulletList>
					<li>
						<b>Checkout completed after guards changed</b> — e.g. the only
						accepted intro got connected another way. Fulfill anyway; the window
						is never lost money.
					</li>
					<li>
						<b>Window expires between agent's accept click and commit</b> —
						whatever the transaction reads wins; both outcomes are valid states.
					</li>
				</BulletList>
			</DocSection>
		</DocPage>
	)
}
