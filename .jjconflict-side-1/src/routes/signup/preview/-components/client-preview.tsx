import { MapPinIcon, UserIcon } from '@phosphor-icons/react'

import {
	getProfileSummary,
	ProfileSummaryGrid,
} from '@/components/profile-summary'
import { Card } from '@/components/ui/card'
import {
	buyerClientProfileSchema,
	sellerClientProfileSchema,
	type ClientProfile,
	type ClientRole,
} from '@/lib/profile'
import {
	AgentPreviewCard,
	type MatchDetails,
} from '@/routes/(dashboard)/-components/agent-preview-card'

const clientPreviewMatches: MatchDetails[] = [
	{
		id: 'preview-1',
		name: 'Alex Morgan',
		role: 'agent',
		location: 'Austin, TX',
		zipCodes: ['78704', '78745'],
		fitScore: 97,
		status: 'new',
		date: 'Today',
		experience: '12 years',
		agency: 'PRE Partner Realty',
		specialties: ['First-time buyers', 'Fast timelines', 'Negotiation'],
		about: 'Calm, responsive agent focused on clear expectations.',
		scores: {
			'Working Style': 4.9,
			Communication: 4.8,
			Transparency: 4.9,
			Fit: 5,
		},
	},
	{
		id: 'preview-2',
		name: 'Jordan Lee',
		role: 'agent',
		location: 'Austin, TX',
		zipCodes: ['78701', '78703'],
		fitScore: 94,
		status: 'new',
		date: 'Today',
		experience: '9 years',
		agency: 'Urban Nest Realty',
		specialties: ['Condos', 'Relocation', 'Offer strategy'],
		about: 'Data-driven agent with a direct communication style.',
		scores: {
			'Working Style': 4.7,
			Communication: 4.9,
			Transparency: 4.7,
			Fit: 4.8,
		},
	},
	{
		id: 'preview-3',
		name: 'Sam Rivera',
		role: 'agent',
		location: 'Austin, TX',
		zipCodes: ['78731', '78757'],
		fitScore: 91,
		status: 'new',
		date: 'Today',
		experience: '15 years',
		agency: 'Local Key Realty',
		specialties: ['Move-up buyers', 'Listings', 'Pricing'],
		about: 'Experienced local advisor with strong pricing instincts.',
		scores: {
			'Working Style': 4.6,
			Communication: 4.6,
			Transparency: 4.8,
			Fit: 4.7,
		},
	},
]

export function draftToClientPreviewProfile(
	role: ClientRole,
	draft: Record<string, unknown> | null | undefined,
): ClientProfile {
	const input = draft ?? {}
	if (role === 'buyer') {
		return buyerClientProfileSchema.parse({ role, ...input })
	}
	return sellerClientProfileSchema.parse({ role, ...input })
}

export function ClientPreviewHeader({ title }: { title: string }) {
	return (
		<div>
			<span className="border-amber/40 bg-amber/15 text-amber-foreground mb-2 inline-flex rounded-md border px-2.5 py-0.5 text-xs font-semibold tracking-[0.08em] uppercase">
				Preview
			</span>
			<h2 className="font-heading text-foreground text-3xl tracking-tight md:text-4xl">
				{title}
			</h2>
			<p className="text-muted-foreground mt-2 max-w-md text-base leading-relaxed">
				Based on your quiz answers.
			</p>
		</div>
	)
}

export function ClientProfilePreviewCard({
	profile,
}: {
	profile: ClientProfile
}) {
	const stateSvgPath = profile.state
		? `/states/${profile.state}.svg`
		: undefined
	const summaryItems = getProfileSummary({ role: profile.role, profile })
	const profileTitle =
		profile.city ??
		profile.state ??
		(profile.role === 'buyer' ? 'Buyer' : 'Seller')

	return (
		<Card className="border-border bg-card gap-0 rounded-lg p-0 shadow-sm">
			<div className="flex items-center gap-4 px-5 pt-5 pb-4">
				<div className="bg-primary/8 text-primary flex h-12 w-12 shrink-0 items-center justify-center rounded-lg">
					{stateSvgPath ? (
						<img
							src={stateSvgPath}
							alt={`${profile.state} state icon`}
							className="h-8 w-8 object-contain opacity-85"
						/>
					) : profile.city ? (
						<MapPinIcon className="h-5 w-5" />
					) : (
						<UserIcon className="h-5 w-5" />
					)}
				</div>
				<div className="min-w-0 flex-1">
					<h3 className="font-heading text-foreground text-xl font-bold tracking-tight">
						{profileTitle}
					</h3>
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

export function ClientMatchesPreview() {
	return (
		<div className="pt-2">
			<div className="mb-3 px-1">
				<h3 className="font-heading text-foreground text-lg font-bold tracking-tight">
					Your Top Matches
				</h3>
				<p className="text-muted-foreground mt-0.5 text-sm">
					Create an account to unlock full profiles and connect.
				</p>
			</div>
			<div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
				{clientPreviewMatches.map((match) => (
					<AgentPreviewCard key={match.id} match={match} />
				))}
			</div>
		</div>
	)
}
