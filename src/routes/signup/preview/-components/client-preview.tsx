import { MapPinIcon, UserIcon } from '@phosphor-icons/react'
import {
	Banknote,
	Home,
	MessageSquare,
	Scale,
	Shield,
	Star,
	Target,
	Zap,
} from 'lucide-react'

import { AgentPreviewCard } from '@/routes/(dashboard)/-components/agent-preview-card'
import { Card } from '@/components/ui/card'
import { formatPriceRange, parsePriceRange } from '@/lib/matching/price-range'
import {
	buyerClientProfileSchema,
	sellerClientProfileSchema,
	type ClientProfile,
} from '@/lib/matching/profile'
import {
	buyerAnswerLabels,
	isPropertyTypeSlug,
	propertyTypeOptions,
	sellerAnswerLabels,
} from '@/lib/matching/questions'

export function draftToClientPreviewProfile(
	role: 'buyer' | 'seller',
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
			<span className="mb-2 inline-flex rounded-full border border-amber-300 bg-amber-100 px-3 py-1 text-xs font-bold tracking-[0.16em] text-amber-900 uppercase">
				Preview
			</span>
			<h2 className="font-heading text-3xl tracking-tight text-slate-950 md:text-4xl">
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
	const summaryItems = getProfileStats(profile)
	const profileTitle =
		profile.city ??
		profile.state ??
		(profile.role === 'buyer' ? 'Buyer' : 'Seller')

	return (
		<Card className="gap-0 rounded-2xl border-slate-200 bg-white p-0 shadow-sm">
			<div className="flex items-center gap-4 px-5 pt-5 pb-4">
				<div className="bg-primary/8 text-primary flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl">
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
					<h3 className="font-heading text-xl font-bold tracking-tight text-slate-950">
						{profileTitle}
					</h3>
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

export function ClientMatchesPreview() {
	return (
		<div className="pt-2">
			<div className="mb-3 px-1">
				<h3 className="font-heading text-lg font-bold tracking-tight text-slate-950">
					Your Top Matches
				</h3>
				<p className="text-muted-foreground mt-0.5 text-sm">
					Create an account to unlock full profiles and connect.
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

function statIcon(label: string) {
	const normalized = label.toLowerCase()
	if (normalized.includes('budget') || normalized.includes('price'))
		return Banknote
	if (normalized.includes('communication')) return MessageSquare
	if (normalized.includes('involvement')) return Target
	if (normalized.includes('exclusiv')) return Shield
	if (normalized.includes('negotiation')) return Scale
	if (normalized.includes('experience') || normalized.includes('buyer'))
		return Star
	if (normalized.includes('property') || normalized.includes('home'))
		return Home
	return Zap
}

function formatAnswer(
	value: string | string[] | null | undefined,
	labels: Record<string, { options: Record<string, string> }>,
): string {
	if (value === undefined || value === null || value === '__skipped__')
		return 'Not answered'
	if (Array.isArray(value))
		return value.map((slug) => labels[slug]?.options[slug] ?? slug).join(', ')
	return (
		Object.values(labels).find((config) => config.options[value])?.options[
			value
		] ?? value
	)
}

function getProfileStats(profile: ClientProfile) {
	const stats: { label: string; value: string }[] = []
	if (profile.priceRange)
		stats.push({
			label: 'Budget',
			value: formatPriceRange(parsePriceRange(profile.priceRange)),
		})
	if (profile.propertyTypes?.length)
		stats.push({
			label: 'Home Type',
			value: profile.propertyTypes
				.map(
					(type) =>
						(isPropertyTypeSlug(type) ? propertyTypeOptions[type] : null) ??
						type,
				)
				.join(', '),
		})

	const isBuyer = 'idealAgentRelationship' in profile
	const labels = isBuyer ? buyerAnswerLabels : sellerAnswerLabels
	for (const [id, config] of Object.entries(labels)) {
		const value = Reflect.get(profile, id)
		if (value === undefined || value === null || value === '__skipped__')
			continue
		stats.push({ label: config.label, value: formatAnswer(value, labels) })
	}
	return stats
}

const previewMatches = [
	{
		id: 'preview-1',
		name: 'Alex Morgan',
		role: 'agent' as const,
		location: 'Austin, TX',
		zipCodes: ['78704', '78745'],
		fitScore: 97,
		status: 'new' as const,
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
		role: 'agent' as const,
		location: 'Austin, TX',
		zipCodes: ['78701', '78703'],
		fitScore: 94,
		status: 'new' as const,
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
		role: 'agent' as const,
		location: 'Austin, TX',
		zipCodes: ['78731', '78757'],
		fitScore: 91,
		status: 'new' as const,
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
