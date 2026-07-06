import { createFileRoute } from '@tanstack/react-router'
import {
	Banknote,
	Briefcase,
	Clock,
	Home,
	MapPin,
	Shield,
	Star,
	User,
	Zap,
} from 'lucide-react'
import { z } from 'zod'

import { AgentPreviewCard } from '@/routes/(dashboard)/-components/agent-preview-card'
import type { MatchDetails } from '@/routes/(dashboard)/-components/agent-preview-card'
import { SignupPreviewShell } from './-components/signup-preview-shell'
import { Card } from '@/components/ui/card'
import {
	agentProfileCreateSchema,
	completeAgentSignup,
} from '@/lib/matching/profile'
import type { AgentDraft } from '@/lib/matching/profile'
import { bestClientTypeLabels } from '@/lib/matching/questions'
import { formatPriceRange, parsePriceRange } from '@/lib/matching/price-range'
import { agentDraftStorage } from '../(quiz)/agent/route'

export const Route = createFileRoute('/signup/preview/agent')({
	component: AgentPreviewRoute,
})

function AgentPreviewRoute() {
	const state = agentDraftStorage.load() ?? {}
	const parsed = agentProfileCreateSchema.safeParse(state)
	const profile = draftToPreviewProfile(parsed.success ? parsed.data : state)

	return <AgentPreview profile={profile} />
}

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

const agentPreviewProfileSchema = agentProfileCreateSchema.partial().extend({
	zipCodes: z.array(z.string()).default([]),
	bestClientTypes: z.array(z.string()).default([]),
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
			createProfile={completeAgentSignup}
			loadDraft={agentDraftStorage.load}
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
					<h2 className="font-heading text-3xl tracking-tight text-slate-950 md:text-4xl">
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

function statIcon(label: string) {
	const normalized = label.toLowerCase()
	if (normalized.includes('price') || normalized.includes('budget'))
		return Banknote
	if (normalized.includes('side') || normalized.includes('clients'))
		return Briefcase
	if (normalized.includes('area') || normalized.includes('location'))
		return MapPin
	if (normalized.includes('license') || normalized.includes('insured'))
		return Shield
	if (normalized.includes('experience') || normalized.includes('years'))
		return Star
	if (normalized.includes('transaction') || normalized.includes('volume'))
		return Home
	if (normalized.includes('contact') || normalized.includes('response'))
		return Clock
	if (normalized.includes('brokerage') || normalized.includes('work'))
		return Briefcase
	return Zap
}

function getProfileStats(profile: AgentPreviewProfile) {
	const stats: { label: string; value: string }[] = []

	if (profile.typicalPriceRange) {
		stats.push({
			label: 'Typical price range',
			value: formatPriceRange(parsePriceRange(profile.typicalPriceRange)),
		})
	}

	if (profile.representationSide) {
		const labels: Record<string, string> = {
			buying: 'Buyer representation',
			selling: 'Seller representation',
			both: 'Buyers & sellers',
		}
		stats.push({
			label: 'Representation',
			value: labels[profile.representationSide] ?? profile.representationSide,
		})
	}

	if (profile.zipCodes.length > 0) {
		stats.push({
			label: 'Service areas',
			value: profile.zipCodes.slice(0, 3).join(', '),
		})
	}

	if (profile.bestClientTypes.length > 0) {
		stats.push({
			label: 'Best clients',
			value: profile.bestClientTypes
				.map((slug) => bestClientTypeLabels[slug] ?? slug)
				.join(', '),
		})
	}

	if (profile.yearsLicensed) {
		const labels: Record<string, string> = {
			'0-2': '0-2 years',
			'3-5': '3-5 years',
			'6-10': '6-10 years',
			'10+': '10+ years',
		}
		stats.push({
			label: 'Experience',
			value: labels[profile.yearsLicensed] ?? profile.yearsLicensed,
		})
	}

	if (profile.averageTransactions) {
		const labels: Record<string, string> = {
			'0-5': '0-5 per year',
			'6-15': '6-15 per year',
			'16-30': '16-30 per year',
			'30+': '30+ per year',
		}
		stats.push({
			label: 'Transaction volume',
			value: labels[profile.averageTransactions] ?? profile.averageTransactions,
		})
	}

	if (profile.eoInsuranceStatus) {
		stats.push({
			label: 'E&O insurance',
			value: profile.eoInsuranceStatus,
		})
	}

	return stats
}

function AgentProfileCard({ profile }: { profile: AgentPreviewProfile }) {
	const summaryItems = getProfileStats(profile)
	const fullName = [profile.firstName, profile.lastName]
		.filter(Boolean)
		.join(' ')
	const title = fullName || 'Your Agent Profile'
	const subtitle = profile.brokerageName
		? `${profile.brokerageName}${profile.zipCodes[0] ? ` · ${profile.zipCodes[0]}` : ''}`
		: profile.zipCodes[0]

	return (
		<Card className="gap-0 rounded-2xl border-slate-200 bg-white p-0 shadow-sm">
			<div className="flex items-center gap-4 px-5 pt-5 pb-4">
				<div className="bg-primary/8 text-primary flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl">
					<User className="h-5 w-5" />
				</div>
				<div className="min-w-0 flex-1">
					<h3 className="font-heading text-xl font-bold tracking-tight text-slate-950">
						{title}
					</h3>
					{subtitle ? (
						<p className="text-muted-foreground text-sm">{subtitle}</p>
					) : null}
				</div>
			</div>

			{summaryItems.length > 0 ? (
				<div className="grid grid-cols-1 gap-3 border-t border-slate-100 px-5 pt-4 pb-5 sm:grid-cols-2">
					{summaryItems.map((item) => {
						const Icon = statIcon(item.label)
						return (
							<div key={item.label} className="flex items-start gap-3">
								<div className="text-primary mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-slate-50">
									<Icon className="h-4 w-4" />
								</div>
								<div className="min-w-0 flex-1">
									<p className="text-muted-foreground text-[10px] font-bold tracking-[0.15em] uppercase">
										{item.label}
									</p>
									<p className="text-sm font-semibold text-slate-950">
										{item.value}
									</p>
								</div>
							</div>
						)
					})}
				</div>
			) : null}
		</Card>
	)
}

function AgentMatchesPreview() {
	const previewMatches = agentPreviewMatches.slice(0, 3)

	return (
		<div className="pt-2">
			<div className="mb-3 px-1">
				<h3 className="font-heading text-lg font-bold tracking-tight text-slate-950">
					Your buyer/seller matches will look like this
				</h3>
				<p className="text-muted-foreground mt-0.5 text-sm">
					Create your account to start appearing in buyer/seller matches.
				</p>
			</div>
			<div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
				{previewMatches.map((match) => (
					<AgentPreviewCard key={match.id} match={match} />
				))}
			</div>
		</div>
	)
}
