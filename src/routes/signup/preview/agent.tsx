import { createFileRoute, ClientOnly } from '@tanstack/react-router'
import { User } from 'lucide-react'
import { z } from 'zod'

import {
	AgentPreviewCard,
	type MatchDetails,
} from '@/routes/(dashboard)/-components/agent-preview-card'
import { SignupPreviewShell } from './-components/signup-preview-shell'
import { Card } from '@/components/ui/card'
import {
	agentDraftSchema,
	agentInsertSchema,
	completeAgentSignup,
} from '@/lib/profile'
import type { AgentDraft } from '@/lib/profile'
import { bestClientType } from '@/lib/profile'
import {
	getProfileSummary,
	ProfileSummaryGrid,
} from '@/components/profile-summary'
import { agentDraftStorage } from '../(steps)/agent/route'

const agentPreviewMatches: MatchDetails[] = [
	{
		id: 'preview-client-1',
		name: 'Alex Morgan',
		role: 'agent',
		location: 'Austin, TX',
		zipCodes: ['78704', '78745'],
		fitScore: 97,
		status: 'new',
		date: 'Today',
		experience: 'Ready now',
		agency: 'Buyer profile',
		specialties: ['First-time buyer', 'Fast timeline', 'Clear communication'],
		about: 'Preview of the matched client cards agents will see.',
		scores: {
			'Working Style': 4.9,
			Communication: 4.8,
			Transparency: 4.9,
			Fit: 5,
		},
	},
	{
		id: 'preview-client-2',
		name: 'Jordan Lee',
		role: 'agent',
		location: 'Austin, TX',
		zipCodes: ['78701', '78703'],
		fitScore: 94,
		status: 'new',
		date: 'Today',
		experience: 'Exploring',
		agency: 'Seller profile',
		specialties: ['Listing prep', 'Pricing strategy', 'Transparency'],
		about: 'Preview of the matched client cards agents will see.',
		scores: {
			'Working Style': 4.7,
			Communication: 4.9,
			Transparency: 4.7,
			Fit: 4.8,
		},
	},
	{
		id: 'preview-client-3',
		name: 'Sam Rivera',
		role: 'agent',
		location: 'Austin, TX',
		zipCodes: ['78731', '78757'],
		fitScore: 91,
		status: 'new',
		date: 'Today',
		experience: '3 months',
		agency: 'Buyer profile',
		specialties: ['Move-up buyer', 'Negotiation', 'Local expertise'],
		about: 'Preview of the matched client cards agents will see.',
		scores: {
			'Working Style': 4.6,
			Communication: 4.6,
			Transparency: 4.8,
			Fit: 4.7,
		},
	},
]

export const Route = createFileRoute('/signup/preview/agent')({
	component: AgentPreviewRoute,
})

function AgentPreviewRoute() {
	const state = agentDraftStorage.load() ?? {}
	const parsed = agentInsertSchema.safeParse(state)
	const profile = draftToPreviewProfile(parsed.success ? parsed.data : state)

	return (
		<ClientOnly fallback={null}>
			<AgentPreview profile={profile} />
		</ClientOnly>
	)
}

const agentPreviewProfileSchema = agentDraftSchema.extend({
	zipCodes: z.array(z.string()).default([]),
	bestClientTypes: z.array(z.enum(bestClientType.slugs)).default([]),
})

export type AgentPreviewProfile = z.infer<typeof agentPreviewProfileSchema>

export function draftToPreviewProfile(draft: AgentDraft): AgentPreviewProfile {
	return agentPreviewProfileSchema.parse(draft)
}

export function AgentPreview({ profile }: { profile: AgentPreviewProfile }) {
	return (
		<SignupPreviewShell
			redirect="/agent/introductions"
			oauthRedirect="/auth/complete?role=agent"
			quizPath="/signup/agent/identity"
			createProfile={completeAgentSignup}
			loadDraft={agentDraftStorage.load}
			validateDraft={(draft) => agentInsertSchema.safeParse(draft).success}
			clearDraft={agentDraftStorage.clear}
			submitLabel="Activate profile"
			showTerms={false}
			panelTitle={
				<>
					Create your profile to{' '}
					<span className="text-accent">start matching</span> with clients
				</>
			}
			panelDescription="Save your agent profile, appear in buyer/seller matches, and build your reputation over time."
			mobileTitle="Activate your profile"
			mobileSubtitle="Create your account to start matching with clients."
		>
			<div className="mx-auto w-full max-w-2xl space-y-6">
				<div>
					<span className="mb-2 inline-flex rounded-full border border-amber-300 bg-amber-100 px-3 py-1 text-xs font-bold tracking-[0.16em] text-amber-900 uppercase">
						Preview
					</span>
					<h2 className="font-heading text-foreground text-3xl tracking-tight md:text-4xl">
						Your Agent Profile
					</h2>
					<p className="text-muted-foreground mt-2 max-w-md text-base leading-relaxed">
						Based on your essentials. Buyers and sellers will see this when you
						match.
					</p>
				</div>

				<AgentProfileCard profile={profile} />
				<AgentMatchesPreview />
			</div>
		</SignupPreviewShell>
	)
}

function AgentProfileCard({ profile }: { profile: AgentPreviewProfile }) {
	const summaryItems = getProfileSummary({ role: 'agent', profile })
	const fullName = [profile.firstName, profile.lastName]
		.filter(Boolean)
		.join(' ')
	const title = fullName || 'Your Agent Profile'
	const subtitle = profile.brokerageName
		? `${profile.brokerageName}${profile.zipCodes[0] ? ` · ${profile.zipCodes[0]}` : ''}`
		: profile.zipCodes[0]

	return (
		<Card className="border-border bg-card gap-0 rounded-2xl p-0 shadow-sm">
			<div className="flex items-center gap-4 px-5 pt-5 pb-4">
				<div className="bg-primary/8 text-primary flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl">
					<User className="h-5 w-5" />
				</div>
				<div className="min-w-0 flex-1">
					<h3 className="font-heading text-foreground text-xl font-bold tracking-tight">
						{title}
					</h3>
					{subtitle ? (
						<p className="text-muted-foreground text-sm">{subtitle}</p>
					) : null}
				</div>
			</div>

			{summaryItems.length > 0 ? (
				<div className="border-border border-t px-5 pt-4 pb-5">
					<ProfileSummaryGrid items={summaryItems} variant="preview" />
				</div>
			) : null}
		</Card>
	)
}

function AgentMatchesPreview() {
	return (
		<div className="pt-2">
			<div className="mb-3 px-1">
				<h3 className="font-heading text-foreground text-lg font-bold tracking-tight">
					Your buyer/seller matches will look like this
				</h3>
				<p className="text-muted-foreground mt-0.5 text-sm">
					Create your account to start appearing in buyer/seller matches.
				</p>
			</div>
			<div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
				{agentPreviewMatches.map((match) => (
					<AgentPreviewCard key={match.id} match={match} />
				))}
			</div>
		</div>
	)
}
