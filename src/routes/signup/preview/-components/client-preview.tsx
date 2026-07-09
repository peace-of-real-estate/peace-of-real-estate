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
import { clientPreviewMatches } from '@/lib/matching/preview-matches'
import {
	buyerClientProfileSchema,
	sellerClientProfileSchema,
	type ClientProfile,
} from '@/lib/matching/profile'
import {
	buyerAnswerLabels,
	getPropertyTypeLabel,
	sellerAnswerLabels,
	type AnswerLabelConfig,
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
	const summaryItems = getProfileStats(profile)
	const profileTitle =
		profile.city ??
		profile.state ??
		(profile.role === 'buyer' ? 'Buyer' : 'Seller')

	return (
		<Card className="border-border bg-card gap-0 rounded-2xl p-0 shadow-sm">
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
					<h3 className="font-heading text-foreground text-xl font-bold tracking-tight">
						{profileTitle}
					</h3>
				</div>
			</div>
			{summaryItems.length > 0 ? (
				<div className="border-border grid grid-cols-1 gap-3 border-t px-5 pt-4 pb-5 sm:grid-cols-2">
					{summaryItems.map((item) => {
						const Icon = statIcon(item.label)
						return (
							<div key={item.label} className="flex items-start gap-3">
								<div className="text-primary bg-muted mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl">
									<Icon className="h-4 w-4" />
								</div>
								<div className="min-w-0 flex-1">
									<p className="text-muted-foreground text-[10px] font-bold tracking-[0.15em] uppercase">
										{item.label}
									</p>
									<p className="text-foreground text-sm font-semibold">
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

function buildOptionsMap(
	labels: Record<string, AnswerLabelConfig>,
): Record<string, string> {
	const optionsMap: Record<string, string> = {}
	for (const config of Object.values(labels)) {
		for (const [slug, label] of Object.entries(config.options)) {
			optionsMap[slug] = label
		}
	}
	return optionsMap
}

function formatAnswer(
	value: string | string[] | null | undefined,
	optionsMap: Record<string, string>,
): string {
	if (value === undefined || value === null || value === '__skipped__')
		return 'Not answered'
	if (Array.isArray(value))
		return value.map((slug) => optionsMap[slug] ?? slug).join(', ')
	return optionsMap[value] ?? value
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
				.map((type) => getPropertyTypeLabel(type))
				.join(', '),
		})

	const isBuyer = profile.role === 'buyer'
	const labels = isBuyer ? buyerAnswerLabels : sellerAnswerLabels
	const optionsMap = buildOptionsMap(labels)
	for (const [id, config] of Object.entries(labels)) {
		const value = Reflect.get(profile, id)
		if (value === undefined || value === null || value === '__skipped__')
			continue
		stats.push({ label: config.label, value: formatAnswer(value, optionsMap) })
	}
	return stats
}
