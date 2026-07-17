import { createFileRoute } from '@tanstack/react-router'

import {
	CodeBlock,
	DocPage,
	DocSection,
	DocSubSection,
	Pill,
	Table,
	TableCell,
	TableRow,
} from '@/routes/docs/-components/doc-ui'

export const Route = createFileRoute('/docs/anti-abuse')({
	component: AntiAbuse,
})

const rules = [
	{
		id: 'G1',
		name: 'Slot cap',
		desc: (
			<>
				Active intros (<code>pending</code> + <code>accepted</code>) after this
				send must be ≤ 3 per profile. Terminal states free the slot.
			</>
		),
		why: 'Throughput cap by construction — a determined spammer reaches ~3 new agents/day at most.',
	},
	{
		id: 'G2',
		name: 'Per-agent uniqueness + cooldown',
		desc: (
			<>
				Partial unique index blocks a second active-or-connected intro to the
				same agent. A decline or withdrawal starts a <b>30-day cooldown</b>{' '}
				before that agent can be re-requested.
			</>
		),
		why: 'Protects individual agents from repeat pestering; kills "withdraw + immediately re-send" loops.',
	},
	{
		id: 'G3',
		name: 'Velocity cap',
		desc: (
			<>
				≤ 10 intros created per rolling 30 days per profile (counts every send,
				regardless of outcome).
			</>
		),
		why: 'The backstop against slot-cycling via withdraw — genuine users never hit it; a slot-cycler hits it on day 3.',
	},
	{
		id: 'G4',
		name: 'Eligibility',
		desc: (
			<>
				Sender's profile must be past <code>draft</code> (essentials are enough
				— the quiz is deliberately skippable). Each target agent must be a
				non-disqualified match via <code>calculateFitScore</code> at send time.
			</>
		),
		why: "No throwaway-draft spam; no intros the matching engine wouldn't have shown. Depends on the price-bucket fix.",
	},
	{
		id: 'G5',
		name: 'Withdraw timing',
		desc: (
			<>
				Withdraw allowed only when status is <code>pending</code> and{' '}
				<code>now − createdAt ≥ 24h</code>. Enforced server-side; UI shows a
				countdown before that.
			</>
		),
		why: "Agent gets a guaranteed day; withdraw can't be used for rapid-fire slot recycling.",
	},
	{
		id: 'G6',
		name: 'Structural (no payload to steal)',
		desc: (
			<>
				Because of the visibility rules, an intro carries no contact info in
				either direction until money moves — spam wastes attention but leaks
				nothing.
			</>
		),
		why: 'The visibility design itself is the last line of defense.',
	},
]

const guardsCode = `// src/lib/introductions/guards.ts
export type GuardError = { code: string; message: string }

export function checkSlotCap(
  active: number,
  requested: number,
): GuardError | null {
  if (active + requested > 3) {
    return { code: 'SLOT_CAP', message: 'Active intros cannot exceed 3.' }
  }
  return null
}

export function checkCooldown(
  terminalRow: { status: 'declined' | 'withdrawn'; closedAt: Date } | null,
  now: Date,
): GuardError | null {
  if (!terminalRow) return null
  const days = (now.getTime() - terminalRow.closedAt.getTime()) / 86_400_000
  if (days < 30) {
    return {
      code: 'COOLDOWN',
      message: \`Wait \${Math.ceil(30 - days)} more day(s).\`,
    }
  }
  return null
}

export function checkVelocity(
  sentLast30Days: number,
): GuardError | null {
  if (sentLast30Days >= 10) {
    return { code: 'VELOCITY', message: 'Monthly intro limit reached.' }
  }
  return null
}`

const txCode = `// src/lib/introductions/db.ts
export async function sendIntroductions(
  db: Db,
  input: { agentProfileIds: string[]; clientProfileId: string },
): Promise<SendResult> {
  return db.transaction(async (tx) => {
    await tx.execute(
      sql\`select pg_advisory_xact_lock(hashtextextended(\${input.clientProfileId}, 0))\`,
    )

    const active = await countActiveIntros(tx, input.clientProfileId)
    const velocity = await countSentLast30Days(tx, input.clientProfileId)

    const guard =
      checkSlotCap(active, input.agentProfileIds.length) ??
      checkVelocity(velocity)
    if (guard) return { ok: false, error: guard }

    // ... eligibility + uniqueness checks per agent, then inserts
    return { ok: true, ids }
  })
}`

const testCode = `// src/lib/introductions/db.test.ts
await expect(
  sendIntroductions(db, {
    agentProfileIds: [agent1, agent2, agent3, agent4],
    clientProfileId: client.id,
  }),
).resolves.toMatchObject({
  ok: false,
  error: { code: 'SLOT_CAP' },
})

// concurrent sends from two tabs: second wins the lock, first fails cleanly
const [a, b] = await Promise.all([
  sendIntroductions(db, { agentProfileIds: [agentX], clientProfileId: client.id }),
  sendIntroductions(db, { agentProfileIds: [agentX], clientProfileId: client.id }),
])
expect([a.ok, b.ok].filter(Boolean).length).toBe(1)`

function AntiAbuse() {
	return (
		<DocPage
			path="/docs/anti-abuse"
			lede={
				<>
					All guards run inside one transaction in the domain layer, serialized
					per client profile with a Postgres advisory lock so concurrent sends
					can't split-brain the caps. Every guard failure returns a distinct,
					user-readable error.
				</>
			}
		>
			<DocSection title="Guard rules">
				<Table headers={['Rule', 'Description', 'Rationale']}>
					{rules.map((rule) => (
						<TableRow key={rule.id}>
							<TableCell className="w-32">
								<span className="flex items-center gap-2">
									<Pill tone="navy">{rule.id}</Pill>
									<span className="text-sm font-medium">{rule.name}</span>
								</span>
							</TableCell>
							<TableCell className="text-sm leading-relaxed">
								{rule.desc}
							</TableCell>
							<TableCell className="text-muted-foreground text-[13px] leading-relaxed">
								{rule.why}
							</TableCell>
						</TableRow>
					))}
				</Table>
			</DocSection>

			<DocSection title="Implementation">
				<DocSubSection title="src/lib/introductions/guards.ts">
					<p className="text-muted-foreground text-sm">
						Pure predicates G1–G5. Each returns a typed <code>GuardError</code>{' '}
						or <code>null</code>.
					</p>
					<CodeBlock code={guardsCode} language="typescript" />
				</DocSubSection>

				<DocSubSection title="src/lib/introductions/db.ts">
					<p className="text-muted-foreground text-sm">
						Per-client-profile advisory lock inside the transaction. The lock is
						transaction-scoped, so it releases automatically on commit or
						rollback.
					</p>
					<CodeBlock code={txCode} language="typescript" />
				</DocSubSection>

				<DocSubSection title="src/lib/introductions/db.test.ts">
					<p className="text-muted-foreground text-sm">
						Guard boundaries and concurrent-send races.
					</p>
					<CodeBlock code={testCode} language="typescript" />
				</DocSubSection>
			</DocSection>
		</DocPage>
	)
}
