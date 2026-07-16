import { Link, createFileRoute } from '@tanstack/react-router'

import {
	BulletList,
	DocPage,
	DocSection,
	DocSubSection,
	Table,
	TableCell,
	TableRow,
} from '@/routes/docs/-components/doc-ui'
import {
	AgentIntroductionsMockup,
	ClientIntroductionsMockup,
	MatchListMockup,
} from '@/routes/docs/-components/ui-mocks'

export const Route = createFileRoute('/docs/ui')({
	component: Ui,
})

function Ui() {
	return (
		<DocPage
			path="/docs/ui"
			lede="Three surfaces change. The match list becomes a compact decision surface, and the client/agent introductions pages become first-class flows."
		>
			<DocSection
				title={
					<>
						Matches page{' '}
						<span className="font-mono text-[11px]">
							/buyer/matches · /seller/matches
						</span>
					</>
				}
			>
				<MatchListMockup />
				<BulletList>
					<li>
						Compact rows with inline expand; selection capped at remaining
						slots.
					</li>
					<li>
						Confirm dialog before sending: "You can't withdraw for 24 hours."
					</li>
					<li>
						Cards reflect live state: selectable / pending / accepted /
						connected / cooldown-locked.
					</li>
				</BulletList>
			</DocSection>

			<DocSection
				title={
					<>
						Client introductions{' '}
						<span className="font-mono text-[11px]">
							/buyer/introductions · /seller/introductions
						</span>
					</>
				}
			>
				<ClientIntroductionsMockup />
				<BulletList>
					<li>Tabs: Pending · Accepted · Connected · History.</li>
					<li>
						Paywall only after first acceptance; active window shown as a chip.
					</li>
					<li>
						Withdraw appears at the 24h mark; unlock-success returns to a poll
						state.
					</li>
				</BulletList>
			</DocSection>

			<DocSection
				title={
					<>
						Agent introductions{' '}
						<span className="font-mono text-[11px]">/agent/introductions</span>
					</>
				}
			>
				<AgentIntroductionsMockup />
				<BulletList>
					<li>
						Anonymous fit cards: first-name initial, role, location, timeline,
						price, work style.
					</li>
					<li>
						Accept / Decline with an internal-only reason modal. The client sees
						only a neutral "declined".
					</li>
					<li>Sidebar badge shows pending count so requests don't rot.</li>
				</BulletList>
			</DocSection>

			<DocSection title="Implementation">
				<DocSubSection title="Routes & components">
					<BulletList>
						<li>
							<code>client-matches.tsx</code>: slot meter, selection, sticky
							send bar, confirm dialog.
						</li>
						<li>
							<code>match-list.tsx</code>: toolbar, dense rows, inline expand,
							qualitative dimension indicators.
						</li>
						<li>
							<code>client-introductions.tsx</code>: tabs, paywall, withdraw,
							unlock-success poll.
						</li>
						<li>
							<code>intro-paywall.tsx</code>: unlock banner + checkout redirect.
						</li>
						<li>
							<code>buyer/introductions.tsx</code> and{' '}
							<code>seller/introductions.tsx</code>: render
							client-introductions.
						</li>
						<li>
							<code>agent/introductions.tsx</code>: fit cards, accept/decline
							modal.
						</li>
						<li>
							<code>agent/route.tsx</code>: sidebar pending badge.
						</li>
					</BulletList>
				</DocSubSection>

				<DocSubSection title="Server-function contracts">
					<BulletList>
						<li>
							<code>loadClientIntroductions({'{ role }'})</code> →
							ClientIntroductionsPayload.
						</li>
						<li>
							<code>loadAgentIntroductions()</code> → {'{ '}
							introductions: AgentIntroView[]; pendingCount: number {' }'}.
						</li>
					</BulletList>
					<p className="text-muted-foreground text-[13px]">
						Full lifecycle function definitions live in{' '}
						<Link to="/docs/lifecycle" className="underline">
							Lifecycle
						</Link>
						.
					</p>
				</DocSubSection>
			</DocSection>

			<DocSection title="Notification matrix">
				<p className="text-muted-foreground text-[13px]">
					All email (Resend infra exists). One in-app signal: the agent sidebar
					badge. No notification center, no push. Decline emails are deliberate
					— silence plus an unnoticed freed slot is worse than a gentle decline.
					Email templates live in{' '}
					<Link to="/docs/lifecycle" className="underline">
						Lifecycle
					</Link>
					.
				</p>
				<Table headers={['Event', '→ Agent', '→ Client']}>
					<TableRow>
						<TableCell>Intro sent</TableCell>
						<TableCell>
							✉️ "Jane D., a buyer in Austin, wants to connect" —{' '}
							<b>anonymized</b>. Links to pending list.
						</TableCell>
						<TableCell>—</TableCell>
					</TableRow>
					<TableRow>
						<TableCell>Agent accepts (no window)</TableCell>
						<TableCell>—</TableCell>
						<TableCell>✉️ "Sarah accepted — unlock contact info"</TableCell>
					</TableRow>
					<TableRow>
						<TableCell>Agent declines</TableCell>
						<TableCell>—</TableCell>
						<TableCell>
							✉️ Neutral, optionally softened by reason category; nudges that a
							slot is free.
						</TableCell>
					</TableRow>
					<TableRow>
						<TableCell>Client withdraws</TableCell>
						<TableCell>Nothing — request disappears from pending</TableCell>
						<TableCell>—</TableCell>
					</TableRow>
					<TableRow>
						<TableCell>Connected (payment or accept-during-window)</TableCell>
						<TableCell>
							✉️ "You're connected with Jane Doe" <b>+ client contact info</b>.
						</TableCell>
						<TableCell>
							✉️ "You're connected with Sarah Smith" <b>+ agent contact info</b>
							.
						</TableCell>
					</TableRow>
				</Table>
			</DocSection>
		</DocPage>
	)
}
