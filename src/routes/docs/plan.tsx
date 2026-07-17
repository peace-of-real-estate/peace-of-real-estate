import type { ReactNode } from 'react'
import { createFileRoute } from '@tanstack/react-router'

import {
	BulletList,
	DocPage,
	DocSection,
} from '@/routes/docs/-components/doc-ui'

export const Route = createFileRoute('/docs/plan')({ component: Plan })

type Phase = {
	num: string
	title: string
	body: ReactNode
	files?: string[]
	commit?: string
	gate: string
	dependsOn?: string
}

const phases: Phase[] = [
	{
		num: '1',
		title: 'Schema hygiene',
		body: (
			<>
				cityZips gets a <code>cityId</code> FK to cities; all coordinates move
				to double precision; entitlement key/source become real pgEnums (drop{' '}
				<code>client_lifetime_premium</code>); <code>defaultNow()</code> on
				createdAt columns; CHECK <code>ends_at &gt; starts_at</code>; explicit
				onDelete policies. Agent identity columns stay — public business card,
				intentionally decoupled from login identity. Hand-write migration 0009.
			</>
		),
		files: [
			'src/db/tables.ts',
			'src/db/migrations/0009_*.sql',
			'src/lib/geography/zip.ts',
		],
		commit: 'refactor(db): schema hygiene — fks, coord types, enums, defaults',
		gate: 'vp check · vp test',
	},
	{
		num: '2',
		title: 'Client profile supertype',
		body: (
			<>
				Merge buyer/seller_profiles into{' '}
				<code>client_profiles(userId, role)</code> + role-checked{' '}
				<code>buyer/seller_details</code> quiz tables. Backfill preserving ids;
				no detail row = quiz skipped. Rewire profile and matching readers; wire
				shape stays flat (split base/detail at the repository). Migration 0010.
			</>
		),
		files: [
			'src/db/tables.ts',
			'src/db/migrations/0010_*.sql',
			'src/lib/profile/db.ts',
			'src/lib/profile/types.ts',
			'src/lib/profile/server.ts',
			'src/lib/matching/server.ts',
			'src/lib/matching/debug.ts',
		],
		commit: 'refactor(db): unify client profiles into supertype + details',
		gate: 'vp check · vp test — existing scoring tests pass unchanged',
		dependsOn: '1',
	},
	{
		num: '3',
		title: 'Introductions schema',
		body: (
			<>
				<code>introductions</code> with a single clientProfileId FK,{' '}
				<code>intro_access_windows</code>, enums, indexes, partial unique on
				active pairs. Hand-write migration 0011.
			</>
		),
		files: ['src/db/tables.ts', 'src/db/migrations/0011_*.sql'],
		commit: 'feat(intros): introductions + access window schema',
		gate: 'vp check · vp test',
		dependsOn: '2',
	},
	{
		num: '4',
		title: 'Domain library',
		body: (
			<>
				Pure guard predicates G1–G5, wire-safe view mappers, and db operations
				with advisory locking.
			</>
		),
		files: [
			'src/lib/introductions/types.ts',
			'src/lib/introductions/guards.ts',
			'src/lib/introductions/views.ts',
			'src/lib/introductions/db.ts',
		],
		commit: 'feat(intros): domain library with guards and view shaping',
		gate: 'vp check · vp test',
		dependsOn: '3',
	},
	{
		num: '5',
		title: 'Server functions',
		body: (
			<>
				<code>server.ts</code> wrappers, auth checks, zod validators, plus
				db/view tests.
			</>
		),
		files: [
			'src/lib/introductions/server.ts',
			'src/lib/introductions/db.test.ts',
			'src/lib/introductions/views.test.ts',
		],
		commit: 'feat(intros): server functions',
		gate: 'vp check · vp test',
		dependsOn: '4',
	},
	{
		num: '6',
		title: 'Payments & fulfillment',
		body: (
			<>
				Stripe client, checkout, webhook dispatch, and transactional fulfillment
				— intent-guarded upsert into intro_access_windows connects accepted
				intros and queues the connected emails.
			</>
		),
		files: [
			'src/lib/payments/stripe.server.ts',
			'src/lib/payments/intro-unlock.ts',
			'src/lib/payments/server.ts',
			'src/lib/payments/intro-unlock.db.test.ts',
			'src/lib/email.server.ts',
		],
		commit: 'feat(intros): $20 unlock window with Stripe fulfillment',
		gate: 'vp check · vp test',
		dependsOn: '5',
	},
	{
		num: '7',
		title: 'Match list redesign & send flow',
		body: (
			<>
				Compact decision surface with selection and sticky send bar; sends the
				first intro email and updates slot math live.
			</>
		),
		files: [
			'src/routes/(dashboard)/_components/client-matches.tsx',
			'src/routes/(dashboard)/_components/match-list.tsx',
		],
		commit: 'feat(intros): match list redesign with selection and send flow',
		gate: 'vp check · vp test',
		dependsOn: '5',
	},
	{
		num: '8',
		title: 'Client introductions page',
		body: <>Tabs, paywall, withdraw countdown, unlock-success poll.</>,
		files: [
			'src/routes/(dashboard)/_components/client-introductions.tsx',
			'src/routes/(dashboard)/_components/intro-paywall.tsx',
			'src/routes/(dashboard)/buyer/introductions.tsx',
			'src/routes/(dashboard)/seller/introductions.tsx',
		],
		commit: 'feat(intros): client introductions page with unlock flow',
		gate: 'vp check · vp test',
		dependsOn: '6',
	},
	{
		num: '9',
		title: 'Agent introductions UI',
		body: <>Anonymous fit cards, accept/decline modal, pending badge.</>,
		files: [
			'src/routes/(dashboard)/_components/agent-introductions.tsx',
			'src/routes/(dashboard)/agent/introductions.tsx',
			'src/routes/(dashboard)/agent/route.tsx',
		],
		commit: 'feat(intros): agent introductions UI',
		gate: 'vp check · vp test',
		dependsOn: '5',
	},
	{
		num: '10',
		title: 'E2E & cleanup',
		body: (
			<>
				Playwright happy path: send → agent accepts → stubbed pay → both sides
				see contact info. knip clean; no dead exports.
			</>
		),
		files: ['tests/e2e/introductions.spec.ts', 'knip.config.ts'],
		commit: 'feat(intros): e2e coverage and cleanup',
		gate: 'vp check · vp test · vp run e2e',
		dependsOn: '7 · 8 · 9',
	},
]

function PhaseRow({ phase }: { phase: Phase }) {
	const isDone = phase.num === '✓'
	return (
		<div className="flex gap-4 border-b border-dashed py-5 last:border-b-0">
			<div
				className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-sm font-extrabold ${
					isDone
						? 'border border-emerald-600/40 bg-emerald-600/10 text-emerald-700'
						: 'bg-primary text-primary-foreground'
				}`}
			>
				{phase.num}
			</div>
			<div className="min-w-0 flex-1">
				<h3 className="text-base font-bold">{phase.title}</h3>
				<p className="mt-1 text-sm leading-relaxed">{phase.body}</p>
				{phase.files ? (
					<div className="mt-3 flex flex-wrap gap-1.5">
						{phase.files.map((file) => (
							<code
								key={file}
								className="bg-muted text-muted-foreground rounded px-1.5 py-0.5 text-[11px]"
							>
								{file}
							</code>
						))}
					</div>
				) : null}
				{phase.commit ? (
					<div className="mt-3 inline-flex items-center rounded-md border border-emerald-600/40 bg-emerald-600/10 px-2.5 py-1 font-mono text-xs text-emerald-700">
						{phase.commit}
					</div>
				) : null}
				<div className="text-muted-foreground mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-xs">
					<span>gate: {phase.gate}</span>
					{phase.dependsOn ? <span>depends on: {phase.dependsOn}</span> : null}
				</div>
			</div>
		</div>
	)
}

function Plan() {
	return (
		<DocPage
			path="/docs/plan"
			lede="How the spec gets built on this branch: 10 phases — one commit each. Schema hygiene and the client-profile supertype land first, then the introductions feature: domain and monetization, the three UI surfaces in parallel, then e2e."
		>
			<DocSection title="Phases — one commit each">
				<div className="divide-y">
					{phases.map((phase) => (
						<PhaseRow key={phase.num} phase={phase} />
					))}
				</div>
			</DocSection>

			<DocSection title="Risks & notes">
				<BulletList>
					<li>
						<b>Supertype backfill:</b> migration 0010 must backfill
						client_profiles + details from live buyer/seller rows and preserve
						ids; the existing scoring test suite is the regression net.
					</li>
					<li>
						<b>Price-bucket fix:</b> G4 eligibility depends on the matching
						engine's price-bucket calculation being fixed before Phase 4.
					</li>
					<li>
						<b>Match list refactor:</b> Phase 7 is the largest UI change; it
						runs after the domain is stable so it isn't rebuilt against a moving
						server contract.
					</li>
					<li>
						<b>Stripe environment:</b> Phase 6 needs a working test price and
						webhook secret before the happy-path e2e in Phase 10 can pass.
					</li>
				</BulletList>
			</DocSection>
		</DocPage>
	)
}
