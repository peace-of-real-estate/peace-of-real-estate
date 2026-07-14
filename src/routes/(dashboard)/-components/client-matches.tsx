import { Link } from '@tanstack/react-router'
import { ArrowRightLeft, MapPin, Pencil, Users } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { useServerFn } from '@tanstack/react-start'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
	DashboardPage,
	DashboardPageMobileNav,
} from '@/routes/(dashboard)/-components/dashboard'
import { MatchList } from '@/routes/(dashboard)/-components/match-list'
import { authClient } from '@/lib/auth/client'
import { loadBuyerProfile, loadSellerProfile } from '@/lib/profile'
import type { BuyerProfile, SellerProfile } from '@/lib/profile'
import {
	loadBuyerAgentMatches,
	loadSellerAgentMatches,
} from '@/lib/matching/server'
import type { AgentMatchData } from '@/lib/matching/match.view'
import {
	getProfileSummary,
	ProfileSummaryGrid,
	type SummaryItem,
} from '@/components/profile-summary'
import { resolveStateCode } from '@/lib/geography/states'

type ClientRole = 'buyer' | 'seller'

type ClientMatchesProfile = BuyerProfile | SellerProfile

type RoleConfig = {
	loadProfile: () => Promise<ClientMatchesProfile | null>
	loadMatches: () => Promise<AgentMatchData[]>
	searchPreferencesPath:
		| '/buyer/search-preferences'
		| '/seller/search-preferences'
}

const roleConfig: Record<ClientRole, RoleConfig> = {
	buyer: {
		loadProfile: loadBuyerProfile,
		loadMatches: loadBuyerAgentMatches,
		searchPreferencesPath: '/buyer/search-preferences',
	},
	seller: {
		loadProfile: loadSellerProfile,
		loadMatches: loadSellerAgentMatches,
		searchPreferencesPath: '/seller/search-preferences',
	},
}

export function ClientMatches({
	clientRole: role,
}: {
	clientRole: ClientRole
}) {
	const { loadProfile, loadMatches } = roleConfig[role]
	const { data: session } = authClient.useSession()

	const loadMatchesFn = useServerFn(loadMatches)
	const loadProfileFn = useServerFn(loadProfile)

	const { data: matches = [], isLoading } = useQuery({
		queryKey: ['agent-matches', role],
		queryFn: () => loadMatchesFn(),
	})
	const { data: profile } = useQuery({
		queryKey: ['client-profile', role],
		queryFn: () => loadProfileFn(),
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
	const locationItems: SummaryItem[] = []
	if (profile?.city) {
		locationItems.push({ label: 'City', value: profile.city, icon: MapPin })
	}
	if (profile?.state) {
		locationItems.push({ label: 'State', value: profile.state, icon: MapPin })
	}
	const summaryItems = getProfileSummary({ role, profile })
	const items = [...locationItems, ...summaryItems]
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

					<ProfileSummaryGrid items={items} variant="dashboard" />
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
