import { Link } from '@tanstack/react-router'
import {
	ArrowRightLeft,
	Banknote,
	Clock,
	Home,
	MapPin,
	MessageSquare,
	Pencil,
	Scale,
	Shield,
	Star,
	Target,
	Users,
	Zap,
} from 'lucide-react'
import { useQuery } from '@tanstack/react-query'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
	DashboardPage,
	DashboardPageMobileNav,
} from '@/routes/(dashboard)/-components/dashboard'
import { MatchDebugPanel } from '@/routes/(dashboard)/-components/match-debug-panel'
import { MatchList } from '@/routes/(dashboard)/-components/match-list'
import { authClient } from '@/lib/auth/client'
import {
	loadBuyerAgentMatches,
	loadBuyerProfile,
	loadSellerAgentMatches,
	loadSellerProfile,
} from '@/lib/matching/profile'
import type { BuyerProfile, SellerProfile } from '@/lib/matching/profile'
import type { AgentMatchData } from '@/lib/matching/scoring'
import {
	buyerAnswerLabels,
	getPropertyTypeLabel,
	sellerAnswerLabels,
	type AnswerLabels,
} from '@/lib/matching/questions'
import { formatPriceRange, parsePriceRange } from '@/lib/matching/price-range'

import { resolveStateCode } from '@/lib/geography/states'
import { clientEnv } from '@/env'

type ClientRole = 'buyer' | 'seller'

type ClientMatchesProfile = BuyerProfile | SellerProfile

type RoleConfig = {
	loadProfile: () => Promise<ClientMatchesProfile | null>
	loadMatches: () => Promise<AgentMatchData[]>
	answerLabels: AnswerLabels
	searchPreferencesPath:
		| '/buyer/search-preferences'
		| '/seller/search-preferences'
}

const roleConfig: Record<ClientRole, RoleConfig> = {
	buyer: {
		loadProfile: loadBuyerProfile,
		loadMatches: loadBuyerAgentMatches,
		answerLabels: buyerAnswerLabels,
		searchPreferencesPath: '/buyer/search-preferences',
	},
	seller: {
		loadProfile: loadSellerProfile,
		loadMatches: loadSellerAgentMatches,
		answerLabels: sellerAnswerLabels,
		searchPreferencesPath: '/seller/search-preferences',
	},
}

function statIcon(label: string) {
	const normalized = label.toLowerCase()
	if (
		normalized.includes('budget') ||
		normalized.includes('price') ||
		normalized.includes('commission')
	)
		return Banknote
	if (
		normalized.includes('communication') ||
		normalized.includes('chat') ||
		normalized.includes('updates')
	)
		return MessageSquare
	if (normalized.includes('involvement')) return Target
	if (normalized.includes('exclusiv')) return Shield
	if (normalized.includes('negotiation')) return Scale
	if (normalized.includes('response')) return Clock
	if (normalized.includes('experience') || normalized.includes('buyer'))
		return Star
	if (normalized.includes('property') || normalized.includes('home'))
		return Home
	if (normalized.includes('location')) return MapPin
	return Zap
}

export function ClientMatches({
	clientRole: role,
}: {
	clientRole: ClientRole
}) {
	const { loadProfile, loadMatches } = roleConfig[role]
	const { data: session } = authClient.useSession()

	const { data: matches = [], isLoading } = useQuery({
		queryKey: ['agent-matches', role],
		queryFn: loadMatches,
	})
	const { data: profile } = useQuery({
		queryKey: ['client-profile', role],
		queryFn: loadProfile,
	})
	const stateCode = resolveStateCode(profile?.state ?? undefined)

	return (
		<DashboardPage>
			<DashboardPageMobileNav label="Menu" />
			<div className="mx-auto w-full max-w-4xl">
				<div className="mb-8 flex items-center gap-4">
					<div className="from-primary to-primary/70 text-primary-foreground shadow-primary/20 ring-primary/20 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br shadow-sm ring-1">
						<ArrowRightLeft className="h-5 w-5" />
					</div>
					<div>
						<h1 className="text-3xl">Matches</h1>
					</div>
				</div>

				<div className="mb-6 space-y-3">
					<PreferencesSummaryCard
						role={role}
						profile={profile}
						name={session?.user?.name}
						state={stateCode}
					/>
				</div>

				<div>
					{isLoading ? (
						<Card className="py-16 text-center">
							<p className="text-muted-foreground text-sm">
								Loading matches...
							</p>
						</Card>
					) : matches.length === 0 ? (
						<Card className="py-16 text-center">
							<Users className="text-muted-foreground mx-auto mb-4 h-12 w-12" />
							<p className="text-muted-foreground text-sm">
								No matches available yet.
							</p>
						</Card>
					) : clientEnv.VITE_MATCH_DEBUG === 'true' ? (
						<MatchDebugPanel matches={matches} />
					) : (
						<MatchList matches={matches} />
					)}
				</div>
			</div>
		</DashboardPage>
	)
}

function PreferencesSummaryCard({
	role,
	profile,
	name,
	state,
}: {
	role: ClientRole
	profile: ClientMatchesProfile | null | undefined
	name?: string | null | undefined
	state?: string | undefined
}) {
	const items = getPreferenceSummaryItems(
		profile,
		roleConfig[role].answerLabels,
	)
	const stateSvgFile = state ? `/states/${state}.svg` : null

	return (
		<Card className="p-4">
			<div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
				<div>
					<div className="mb-5 flex items-center gap-3">
						<div className="bg-primary/8 text-primary flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl">
							{stateSvgFile ? (
								<img
									src={stateSvgFile}
									alt={`${state} state icon`}
									className="h-8 w-8 object-contain opacity-85"
								/>
							) : (
								<MapPin className="h-5 w-5" />
							)}
						</div>
						<div>
							<p className="font-heading text-xl font-bold tracking-tight">
								{name ?? 'Your profile'}
							</p>
						</div>
					</div>

					<div className="grid gap-x-8 gap-y-4 sm:grid-cols-2 lg:grid-cols-3">
						{items.map((item) => {
							const Icon = statIcon(item.label)
							return (
								<div
									key={item.label}
									className="flex min-w-0 items-start gap-3"
								>
									<div className="text-primary bg-secondary/70 mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg">
										<Icon className="h-3.5 w-3.5" />
									</div>
									<div className="min-w-0">
										<p className="text-muted-foreground text-[9px] font-bold tracking-[0.15em] uppercase">
											{item.label}
										</p>
										<p className="truncate text-sm font-semibold">
											{item.value}
										</p>
									</div>
								</div>
							)
						})}
					</div>
				</div>

				<Button asChild variant="outline" size="sm" className="shrink-0">
					<Link to={roleConfig[role].searchPreferencesPath}>
						<Pencil className="mr-1 h-3.5 w-3.5" />
						Edit Preferences
					</Link>
				</Button>
			</div>
		</Card>
	)
}

function getPreferenceSummaryItems(
	profile: ClientMatchesProfile | null | undefined,
	answerLabels: AnswerLabels,
) {
	if (!profile) return []

	const profileItems = [
		profile.city ? { label: 'City', value: profile.city } : null,
		profile.state ? { label: 'State', value: profile.state } : null,
		profile.priceRange
			? {
					label: 'Budget',
					value: formatPriceRange(parsePriceRange(profile.priceRange)),
				}
			: null,
		profile.propertyTypes?.length
			? {
					label: 'Home Type',
					value: profile.propertyTypes
						.map((type) => getPropertyTypeLabel(type))
						.join(', '),
				}
			: null,
	]

	const answerItems = Object.entries(answerLabels).map(([id, config]) => {
		const answer = Reflect.get(profile, id)
		if (Array.isArray(answer)) {
			const value = answer
				.map((slug: string) => config.options[slug] ?? slug)
				.join(', ')
			return value ? { label: config.label, value } : null
		}
		if (typeof answer !== 'string' || answer === '') return null
		return { label: config.label, value: config.options[answer] ?? answer }
	})

	const items: { label: string; value: string }[] = []
	for (const item of [...profileItems, ...answerItems]) {
		if (item) items.push(item)
	}
	return items
}
