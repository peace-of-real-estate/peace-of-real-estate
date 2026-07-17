import { createFileRoute } from '@tanstack/react-router'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
	CodeBlock,
	DocPage,
	DocSection,
	StepList,
} from '@/routes/docs/-components/doc-ui'
import { LifecycleContent } from '@/routes/docs/-components/lifecycle-content'

export const Route = createFileRoute('/docs/')({
	component: Overview,
})

const moduleTree = `src/
  db/
    tables.ts                       # client_profiles supertype, introductions, intro_access_windows
    migrations/0009–0011_*.sql      # hand-written: hygiene → supertype → intros
  lib/
    profile/                        # rewired: split base/detail at the repository boundary
    geography/zip.ts                # join cities via cityId
    matching/match.view.ts          # existing — add dimensions (score · weight · boosted)
    introductions/
      types.ts                      # row-derived aliases via $inferSelect
      guards.ts                     # pure guard predicates G1–G5
      views.ts                      # wire-safe view types + mappers
      db.ts                         # db ops (tx + advisory lock)
      server.ts                     # createServerFn wrappers, thin
      db.test.ts                    # guard boundaries, transitions, races
      views.test.ts                 # visibility: pre-connected views have NO contact keys
    payments/
      stripe.server.ts              # Stripe client
      intro-unlock.ts               # checkout creation + transactional fulfillment
      server.ts                     # createIntroUnlockCheckout
      intro-unlock.db.test.ts       # fulfillment, idempotency, connect-on-pay
    email.server.ts                 # existing — add the 5 intro templates
  routes/
    api/stripe-webhook.$.ts         # dispatch on event type + metadata.kind
    (dashboard)/
      _components/
        client-matches.tsx          # slot meter, selection, sticky send bar
        match-list.tsx              # rebuilt: toolbar, dense rows, inline expand
        client-introductions.tsx    # tabs, paywall, withdraw, unlock-success poll
        intro-paywall.tsx           # unlock banner + checkout redirect
        agent-introductions.tsx     # anonymous fit cards, accept/decline modal
      buyer/introductions.tsx       # render client-introductions
      seller/introductions.tsx      # render client-introductions
      agent/introductions.tsx       # render agent-introductions
      agent/route.tsx               # add sidebar pending badge
    env.server.ts                   # add the 3 STRIPE_* vars
  tests/support/fixtures/data/      # add client/agent introduction fixtures
  e2e/introductions.spec.ts         # happy path`

function Overview() {
	return (
		<DocPage
			path="/docs"
			lede="Currently, matching is implemented. The introduction page and agent
			selection is missing. So only a list of matches is show but there's no way to interact with them. This doc focuses on implementing the intro features along with the stripe payment integration."
		>
			<Card>
				<CardHeader>
					<CardTitle>Product loop</CardTitle>
				</CardHeader>
				<CardContent>
					<StepList
						steps={[
							<>
								Client selects 1–3 agents from their matches and sends
								introduction requests.
							</>,
							<>
								Each agent reviews an <b>anonymous fit card</b> (no contact
								info) and accepts or declines.
							</>,
							<>
								On first acceptance, the client can pay{' '}
								<b>$20 for a 6-month access window</b>.
							</>,
							<>
								Every acceptance during an active window becomes{' '}
								<b>connected</b>: full mutual contact exchange, in-app and by
								email.
							</>,
						]}
					/>
				</CardContent>
			</Card>

			<LifecycleContent />

			<DocSection title="Module layout">
				<CodeBlock code={moduleTree} language="tree" />
			</DocSection>
		</DocPage>
	)
}
