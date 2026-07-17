import { ArrowRightIcon as ArrowRight } from '@phosphor-icons/react'

import {
	BulletList,
	CodeBlock,
	DocSection,
	Pill,
	Table,
	TableCell,
	TableRow,
	type PillTone,
} from '@/routes/docs/-components/doc-ui'

const statusTone: Record<string, PillTone> = {
	start: 'navy',
	pending: 'gold',
	accepted: 'gold',
	declined: 'muted',
	withdrawn: 'muted',
	connected: 'green',
}

const transitions = [
	{ from: 'start', to: 'pending', label: 'client sends (guards pass)' },
	{ from: 'pending', to: 'accepted', label: 'agent accepts, no active window' },
	{ from: 'pending', to: 'connected', label: 'agent accepts, window active' },
	{
		from: 'pending',
		to: 'declined',
		label: 'agent declines (reason internal)',
	},
	{
		from: 'pending',
		to: 'withdrawn',
		label: 'client withdraws (only after 24h pending)',
	},
	{
		from: 'accepted',
		to: 'connected',
		label: 'client pays $20 (window fulfilled)',
	},
]

const schemaCode = `// src/db/tables.ts
import {
  check,
  foreignKey,
  index,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  sql,
} from 'drizzle-orm/pg-core'

export const clientRole = pgEnum('client_role', ['buyer', 'seller'])

export const introductionStatus = pgEnum('introduction_status', [
  'pending',
  'accepted',
  'declined',
  'withdrawn',
  'connected',
])

export const introductionDeclineReason = pgEnum(
  'introduction_decline_reason',
  ['not_available', 'not_a_fit', 'out_of_area', 'other'],
)

// One row per (user, role) — replaces buyer_profiles + seller_profiles.
// Shared lifecycle/matching/work-style/tuning columns live here.
export const clientProfiles = pgTable(
  'client_profiles',
  {
    id: text().primaryKey().notNull(),
    userId: text().notNull(),
    role: clientRole().notNull(),
    // ...clientLifecycleColumns
    // ...clientMatchingColumns
    // ...clientWorkStyleColumns
    // ...clientMatchTuningColumns
    createdAt: timestamp({ withTimezone: true }).notNull(),
    updatedAt: timestamp({ withTimezone: true }).notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.userId],
      foreignColumns: [user.id],
      name: 'client_profiles_user_id_fk',
      onDelete: 'cascade',
    }),
    uniqueIndex('client_profiles_user_role_index').on(
      table.userId,
      table.role,
    ),
    // FK target for the role-checked detail tables
    uniqueIndex('client_profiles_id_role_index').on(table.id, table.role),
  ],
)

// Role-specific quiz answers. No row = quiz skipped (G4 allows sending
// without the quiz); scoring treats a missing detail row as neutral.
export const buyerDetails = pgTable(
  'buyer_details',
  {
    clientProfileId: text().primaryKey().notNull(),
    role: clientRole().notNull().default('buyer'),
    // ...buyerQuizColumns
  },
  (table) => [
    check('buyer_details_role_check', sql\`\${table.role} = 'buyer'\`),
    foreignKey({
      columns: [table.clientProfileId, table.role],
      foreignColumns: [clientProfiles.id, clientProfiles.role],
      name: 'buyer_details_profile_role_fk',
      onDelete: 'cascade',
    }),
  ],
)
// seller_details mirrors buyer_details with role = 'seller'.

export const introductions = pgTable(
  'introductions',
  {
    id: text().primaryKey().notNull(),
    clientProfileId: text().notNull(),
    agentProfileId: text().notNull(),
    status: introductionStatus().default('pending').notNull(),
    declineReason: introductionDeclineReason(),
    declineNote: text(),
    acceptedAt: timestamp({ withTimezone: true }),
    connectedAt: timestamp({ withTimezone: true }),
    // set on declined/withdrawn — drives the 30-day cooldown (G2)
    closedAt: timestamp({ withTimezone: true }),
    createdAt: timestamp({ withTimezone: true }).notNull(),
    updatedAt: timestamp({ withTimezone: true }).notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.clientProfileId],
      foreignColumns: [clientProfiles.id],
      name: 'introductions_client_profile_id_fk',
    }),
    foreignKey({
      columns: [table.agentProfileId],
      foreignColumns: [agentProfiles.id],
      name: 'introductions_agent_profile_id_fk',
    }),
    uniqueIndex('introductions_active_pair_index')
      .on(table.agentProfileId, table.clientProfileId)
      .where(sql\`\${table.status} in ('pending', 'accepted', 'connected')\`),
    index('introductions_client_created_index').on(
      table.clientProfileId,
      table.createdAt,
    ),
    index('introductions_agent_status_index').on(
      table.agentProfileId,
      table.status,
    ),
  ],
)

export const introAccessWindows = pgTable(
  'intro_access_windows',
  {
    id: text().primaryKey().notNull(),
    clientProfileId: text().notNull(),
    stripePaymentIntentId: text().notNull(),
    startsAt: timestamp({ withTimezone: true }).notNull(),
    endsAt: timestamp({ withTimezone: true }).notNull(),
    createdAt: timestamp({ withTimezone: true }).notNull(),
    updatedAt: timestamp({ withTimezone: true }).notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.clientProfileId],
      foreignColumns: [clientProfiles.id],
      name: 'intro_access_windows_client_profile_id_fk',
    }),
    // one window row per profile; renewal replaces startsAt/endsAt
    uniqueIndex('intro_access_windows_profile_index').on(table.clientProfileId),
    // webhook idempotency via intent-guarded upsert (see payments doc)
    uniqueIndex('intro_access_windows_payment_intent_index').on(
      table.stripePaymentIntentId,
    ),
    check(
      'intro_access_windows_range_check',
      sql\`\${table.endsAt} > \${table.startsAt}\`,
    ),
  ],
)`

const typesCode = `// src/lib/introductions/types.ts
export type Introduction = typeof introductions.$inferSelect
export type IntroductionStatus = Introduction['status']
export type ClientRole = (typeof clientRole.enumValues)[number]
export type DeclineReason = NonNullable<Introduction['declineReason']>`

const viewsCode = `// src/lib/introductions/views.ts
/** Client's view of an agent. contact != null ⟺ status === 'connected' */
export type ClientIntroView = Pick<
  Introduction,
  'id' | 'status' | 'createdAt' | 'acceptedAt'
> & {
  withdrawableAt: Date
  agent: {
    profileId: string
    name: string
    contact: { email: string; phone: string | null } | null
  }
}

export type ClientIntroductionsPayload = {
  introductions: ClientIntroView[]
  slots: { used: number; max: number }
  window: { endsAt: Date | null }
  canPurchase: boolean
  agentStates: Array<{
    agentProfileId: string
    state: 'available' | 'active' | 'connected' | 'cooldown'
    retryAt: Date | null
  }>
}

/** Agent's view of a client. contact != null ⟺ status === 'connected' */
export type AgentIntroView = Pick<Introduction, 'id' | 'status' | 'createdAt'> & {
  client: {
    displayName: string
    role: ClientRole // from the client_profiles join
    city: string
    state: string
    timeline: string
    priceRange: string
    propertyTypes: string[]
    workStyle: Record<string, string | null>
    fitScore: number
    contact: { fullName: string; email: string } | null
  }
}`

const serverCode = `// src/lib/introductions/server.ts
import { createServerFn } from '@tanstack/react-start'
import { type ClientRole, type DeclineReason } from './types'

export const sendIntroductions = createServerFn({ method: 'POST' })
  .validator((data: { role: ClientRole; agentProfileIds: string[] }) => data)
  .handler(async ({ data }) => {
    /* TODO */
  })

export const withdrawIntroduction = createServerFn({ method: 'POST' })
  .validator((data: { introductionId: string }) => data)
  .handler(async ({ data }) => {
    /* TODO */
  })

export const loadClientIntroductions = createServerFn({ method: 'GET' })
  .handler(async () => {
    /* TODO */
  })

export const loadAgentIntroductions = createServerFn({ method: 'GET' })
  .handler(async () => {
    /* TODO */
  })

export const respondToIntroduction = createServerFn({ method: 'POST' })
  .validator((data: {
    introductionId: string
    response: 'accept' | 'decline'
    declineReason?: DeclineReason
    declineNote?: string
  }) => data)
  .handler(async ({ data }) => {
    /* TODO */
  })`

const emailCode = `// src/lib/email.server.ts — existing Resend setup; one entry point, 5 templates
export type IntroEmail =
  | { kind: 'sent'; to: 'agent'; data: IntroEmailData }
  | { kind: 'accepted' | 'declined'; to: 'client'; data: IntroEmailData }
  | { kind: 'connected'; to: 'agent' | 'client'; data: ConnectedEmailData }

export async function sendIntroEmail(email: IntroEmail): Promise<void>`

export function LifecycleContent() {
	return (
		<>
			<DocSection title="Transitions">
				<div className="space-y-2">
					{transitions.map((t) => (
						<div
							key={`${t.from}-${t.to}`}
							className="flex flex-wrap items-center gap-2 text-sm"
						>
							<span className="w-24 shrink-0 text-right">
								{t.from === 'start' ? (
									<span className="text-muted-foreground font-mono text-xs">
										●
									</span>
								) : (
									<Pill tone={statusTone[t.from]}>{t.from}</Pill>
								)}
							</span>
							<ArrowRight className="text-muted-foreground size-3.5 shrink-0" />
							<Pill tone={statusTone[t.to]}>{t.to}</Pill>
							<span className="text-muted-foreground text-[13px]">
								{t.label}
							</span>
						</div>
					))}
				</div>
			</DocSection>

			<DocSection title="Status groups">
				<Table headers={['Group', 'Statuses', 'Behavior']}>
					<TableRow>
						<TableCell>
							<Pill tone="gold">Active</Pill>
						</TableCell>
						<TableCell>
							<code>pending</code>, <code>accepted</code>
						</TableCell>
						<TableCell>
							Each holds one of the client's 3 slots. Also blocks a duplicate
							intro to the same agent via a partial unique index.
						</TableCell>
					</TableRow>
					<TableRow>
						<TableCell>
							<Pill tone="muted">Terminal, retryable</Pill>
						</TableCell>
						<TableCell>
							<code>declined</code>, <code>withdrawn</code>
						</TableCell>
						<TableCell>
							Slot freed immediately; same agent re-requestable after the 30-day
							cooldown.
						</TableCell>
					</TableRow>
					<TableRow>
						<TableCell>
							<Pill tone="green">Terminal, permanent</Pill>
						</TableCell>
						<TableCell>
							<code>connected</code>
						</TableCell>
						<TableCell>
							Slot freed; contact info stays visible after the window lapses
							(the window gates <i>new</i> unlocks). Never re-requestable —
							you're already connected.
						</TableCell>
					</TableRow>
				</Table>
			</DocSection>

			<DocSection title="Visibility matrix">
				<p className="text-muted-foreground text-[13px]">
					<b>Enforcement is server-side response shaping</b>: loaders return
					Pick-derived view types per state, never spread DB rows, so contact
					fields physically don't leave the server before <code>connected</code>
					.
				</p>
				<Table
					headers={[
						'Status',
						'Client sees about agent',
						'Agent sees about client',
					]}
				>
					<TableRow>
						<TableCell>
							<Pill tone="gold">pending</Pill>
						</TableCell>
						<TableCell>
							Match card as on matches page (name, fit, profile) — agent
							identity is already public there. <b>No email/phone.</b>
						</TableCell>
						<TableCell>
							Anonymous fit card: "Jane D.", role, city/state, timeline, price
							range, property types, work-style answers when present, fit score.{' '}
							<b>No email/phone/last name.</b>
						</TableCell>
					</TableRow>
					<TableRow>
						<TableCell>
							<Pill tone="gold">accepted</Pill>
						</TableCell>
						<TableCell>
							Same + "accepted — unlock to connect" CTA.{' '}
							<b>Still no contact info.</b>
						</TableCell>
						<TableCell>
							Same anonymous card + "waiting for client to unlock" state.{' '}
							<b>Still no contact info.</b>
						</TableCell>
					</TableRow>
					<TableRow>
						<TableCell>
							<Pill tone="green">connected</Pill>
						</TableCell>
						<TableCell>
							Full business card: name, email, phone, brokerage/identity fields.
						</TableCell>
						<TableCell>Full name + email.</TableCell>
					</TableRow>
					<TableRow>
						<TableCell>
							<Pill tone="muted">declined</Pill> /{' '}
							<Pill tone="muted">withdrawn</Pill>
						</TableCell>
						<TableCell>
							Neutral "declined" (optionally softened category) / their own
							withdrawal.
						</TableCell>
						<TableCell>
							Row disappears from pending; history shows the anonymous card
							only.
						</TableCell>
					</TableRow>
				</Table>
				<p className="text-muted-foreground text-[13px]">
					Client phone is deliberately not collected — email is enough, and
					pre-need phones are friction plus liability.
				</p>
			</DocSection>

			<DocSection title="No auto-expiry">
				<p className="text-sm leading-relaxed">
					A pending intro never expires — no <code>expired</code> status;
					withdrawal (G5) is the only exit.
				</p>
			</DocSection>

			<DocSection title="People change">
				<BulletList>
					<li>
						<b>Client edits preferences after sending</b> — existing intros keep
						their snapshot-in-time validity; fit is only checked at send.
					</li>
					<li>
						<b>Agent deactivates or deletes with intros outstanding</b> — out of
						scope for v1; noted for the account-deletion feature to sweep intros
						to a <code>declined</code>-equivalent.
					</li>
					<li>
						<b>User with both buyer and seller profiles</b> — fully independent
						slots, caps, and windows per role.
					</li>
				</BulletList>
			</DocSection>

			<DocSection title="src/db/tables.ts">
				<CodeBlock code={schemaCode} language="typescript" />
			</DocSection>

			<DocSection title="src/lib/introductions/types.ts">
				<CodeBlock code={typesCode} language="typescript" />
			</DocSection>

			<DocSection title="src/lib/introductions/views.ts">
				<CodeBlock code={viewsCode} language="typescript" />
			</DocSection>

			<DocSection title="src/lib/introductions/server.ts">
				<CodeBlock code={serverCode} language="typescript" />
			</DocSection>

			<DocSection title="src/lib/email.server.ts">
				<CodeBlock code={emailCode} language="typescript" />
			</DocSection>
		</>
	)
}
