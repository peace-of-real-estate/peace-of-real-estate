import {
	ChatCircleIcon,
	CompassIcon,
	HandshakeIcon,
	MapPinIcon as MapPin,
	SealCheckIcon,
	UsersIcon,
} from '@phosphor-icons/react'
import type { Icon } from '@phosphor-icons/react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useServerFn } from '@tanstack/react-start'
import { useState } from 'react'
import { toast } from 'sonner'

import {
	getProfileSummary,
	type SummaryItem,
} from '@/components/profile-summary'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog'
import { authClient } from '@/lib/auth/client'
import { MAX_ACTIVE_INTROS } from '@/lib/introductions/guards'
import {
	getClientIntroductions,
	sendIntroductions,
} from '@/lib/introductions/server'
import type { AgentMatchData } from '@/lib/matching/match.view'
import {
	loadBuyerAgentMatches,
	loadSellerAgentMatches,
} from '@/lib/matching/server'
import { buyer, seller } from '@/lib/profile'
import type { ClientProfile, ClientRole } from '@/lib/profile/types'
import { cn } from '@/lib/utils/ui'
import {
	DashboardPage,
	DashboardPageMobileNav,
} from '@/routes/(dashboard)/-components/dashboard'
import { MatchList } from '@/routes/(dashboard)/-components/match-list'
import { QueryErrorCard } from '@/routes/(dashboard)/-components/query-error-card'

type ClientMatchesProfile = ClientProfile

const EMPTY_MATCHES: AgentMatchData[] = []

type RoleConfig = {
	loadProfile: () => Promise<ClientMatchesProfile | null>
	loadMatches: () => Promise<AgentMatchData[]>
	searchPreferencesPath:
		| '/buyer/search-preferences'
		| '/seller/search-preferences'
}

const roleConfig: Record<ClientRole, RoleConfig> = {
	buyer: {
		loadProfile: buyer.loadProfile,
		loadMatches: loadBuyerAgentMatches,
		searchPreferencesPath: '/buyer/search-preferences',
	},
	seller: {
		loadProfile: seller.loadProfile,
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
	const getIntrosFn = useServerFn(getClientIntroductions)
	const sendIntrosFn = useServerFn(sendIntroductions)
	const queryClient = useQueryClient()

	const matchesQuery = useQuery({
		queryKey: ['agent-matches', role],
		queryFn: () => loadMatchesFn(),
	})
	const profileQuery = useQuery({
		queryKey: ['client-profile', role],
		queryFn: () => loadProfileFn(),
	})
	const matches = matchesQuery.data ?? EMPTY_MATCHES
	const profile = profileQuery.data
	const clientProfileId = profile?.id
	const introQuery = useQuery({
		queryKey: ['client-introductions', clientProfileId],
		enabled: Boolean(clientProfileId),
		queryFn: () => getIntrosFn({ data: { clientProfileId: clientProfileId! } }),
	})
	const introPayload = introQuery.data ?? null
	const availabilityLoaded = introQuery.isSuccess

	const [rawSelectedIds, setSelectedIds] = useState<ReadonlySet<string>>(
		new Set(),
	)
	const [confirmOpen, setConfirmOpen] = useState(false)

	const slots = introPayload?.slots ?? { used: 0, max: MAX_ACTIVE_INTROS }
	const remainingSlots = Math.max(0, slots.max - slots.used)

	// Clamp so a refetch reporting fewer slots can never leave the selection
	// (and the send button) wider than the server allows. Pruning stored
	// state keeps toggleSelect and the rendered list on the same selection.
	const selectedIds = new Set([...rawSelectedIds].slice(0, remainingSlots))
	if (selectedIds.size !== rawSelectedIds.size) {
		setSelectedIds(selectedIds)
	}

	const selectedMatches = matches.filter((match) => selectedIds.has(match.id))

	const toggleSelect = (agentProfileId: string) => {
		setSelectedIds((prev) => {
			const next = new Set(prev)
			if (next.has(agentProfileId)) {
				next.delete(agentProfileId)
			} else if (next.size < remainingSlots) {
				next.add(agentProfileId)
			}
			return next
		})
	}

	const sendMutation = useMutation({
		mutationFn: (agentProfileIds: string[]) => {
			if (!clientProfileId) throw new Error('Profile not loaded')
			return sendIntrosFn({ data: { clientProfileId, agentProfileIds } })
		},
		onSuccess: async (result) => {
			setConfirmOpen(false)
			await queryClient.invalidateQueries({
				queryKey: ['client-introductions', clientProfileId],
			})
			if (result.ok) {
				const count = selectedIds.size
				toast.success(
					count === 1 ? 'Introduction sent' : `${count} introductions sent`,
				)
				setSelectedIds(new Set())
			} else {
				toast.error(result.error.message)
			}
		},
		onError: () => {
			setConfirmOpen(false)
			toast.error('Could not send introductions. Try again.')
		},
	})

	return (
		<DashboardPage>
			<DashboardPageMobileNav label="Menu" />
			<div className="mx-auto w-full max-w-4xl">
				<div className="mb-4 flex items-center gap-2">
					<UsersIcon className="text-primary h-4 w-4" />
					<h1 className="text-xl">Matches</h1>
				</div>

				<div className="mb-6">
					<PreferencesSummaryCard
						role={role}
						profile={profile}
						name={session?.user?.name}
					/>
				</div>

				<div>
					{matchesQuery.isError ||
					profileQuery.isError ||
					introQuery.isError ? (
						<QueryErrorCard
							message="Could not load matches and introduction availability."
							onRetry={() => {
								void Promise.all([
									matchesQuery.refetch(),
									profileQuery.refetch(),
									introQuery.refetch(),
								])
							}}
						/>
					) : matchesQuery.isLoading || profileQuery.isLoading ? (
						<Card className="py-16 text-center">
							<p className="text-muted-foreground text-sm">
								Loading matches...
							</p>
						</Card>
					) : matches.length === 0 ? (
						<Card className="py-16 text-center">
							<UsersIcon className="text-muted-foreground mx-auto mb-4 h-12 w-12" />
							<p className="text-muted-foreground text-sm">
								No matches available yet.
							</p>
						</Card>
					) : (
						<MatchList
							matches={matches}
							payload={introPayload}
							availabilityLoaded={availabilityLoaded}
							selectedIds={selectedIds}
							onToggleSelect={toggleSelect}
							onRequestSend={() => setConfirmOpen(true)}
							isSending={sendMutation.isPending}
						/>
					)}
				</div>
			</div>

			<Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Send introductions</DialogTitle>
						<DialogDescription>
							You're about to send an introduction to:
						</DialogDescription>
					</DialogHeader>
					<ul className="space-y-1 text-sm font-medium">
						{selectedMatches.map((match) => (
							<li key={match.id}>
								{match.name}
								<span className="text-muted-foreground font-normal">
									{' '}
									· {match.location}
								</span>
							</li>
						))}
					</ul>
					<p className="text-muted-foreground text-sm">
						You can't withdraw for 24 hours.
					</p>
					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => setConfirmOpen(false)}
							disabled={sendMutation.isPending}
						>
							Cancel
						</Button>
						<Button
							onClick={() => sendMutation.mutate([...selectedIds])}
							disabled={sendMutation.isPending || selectedIds.size === 0}
						>
							{sendMutation.isPending ? 'Sending…' : 'Send introductions'}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</DashboardPage>
	)
}
const COMMUNICATION_KEYS = new Set([
	'quickCommunicationChannel',
	'updateDeliveryMethod',
	'responseTimeExpectation',
	'responseTime',
	'communicationFrequency',
	'agentSilencePreference',
])

const TERMS_KEYS = new Set([
	'commissionComfort',
	'commissionApproach',
	'representationPreference',
	'biddingWarResponse',
	'difficultDealInstinct',
	'unrepresentedBuyerApproach',
])

const BASIC_KEYS = new Set(['budget', 'homeType'])

/** Items whose value gets a small pictograph icon (Text → phone, Email → envelope, …). */
const VALUE_ICON_KEYS = new Set([
	'location',
	'homeType',
	'quickCommunicationChannel',
	'updateDeliveryMethod',
	'responseTimeExpectation',
	'responseTime',
])

/** Items rendered in amber — the traits that drive matching hardest. */
const SIGNATURE_KEYS = new Set([
	'budget',
	'responseTimeExpectation',
	'responseTime',
	'decisionMakingNeed',
])

const GROUP_BANDS = {
	comms: 'bg-brand/10 text-brand',
	approach: 'bg-success-tint text-success',
	terms: 'bg-amber/15 text-amber-foreground',
} as const

function KeyedRow({ item }: { item: SummaryItem }) {
	const signature = SIGNATURE_KEYS.has(item.key)
	const showIcon = VALUE_ICON_KEYS.has(item.key)
	const ValueIcon = item.icon
	return (
		<div className="flex items-start justify-between gap-2 text-xs">
			<span className="text-muted-foreground shrink-0 pt-px">{item.label}</span>
			<span
				className={cn(
					'flex min-w-0 items-center gap-1 text-right leading-tight font-semibold tabular-nums',
					signature ? 'text-amber-foreground' : 'text-foreground',
				)}
			>
				{showIcon && (
					<ValueIcon
						className={cn(
							'h-3 w-3 shrink-0',
							!signature && 'text-muted-foreground',
						)}
					/>
				)}
				<span>{item.value}</span>
			</span>
		</div>
	)
}

function PreferenceGroup({
	title,
	icon: GroupIcon,
	items,
	band,
}: {
	title: string
	icon: Icon
	items: SummaryItem[]
	band: string
}) {
	if (items.length === 0) return null
	return (
		<div className="border-border border-dashed sm:border-r sm:last:border-r-0">
			<h3
				className={cn(
					'border-border flex items-center gap-1 border-b px-3 py-1.5 text-[10px] font-bold tracking-[0.2em] uppercase',
					band,
				)}
			>
				<GroupIcon className="h-3 w-3 shrink-0" />
				{title}
			</h3>
			<div className="space-y-1.5 p-3">
				{items.map((item) => (
					<KeyedRow key={item.key} item={item} />
				))}
			</div>
		</div>
	)
}

function PreferencesSummaryCard({
	role,
	profile,
	name,
}: {
	role: ClientRole
	profile: ClientMatchesProfile | null | undefined
	name?: string | null | undefined
}) {
	const location = [profile?.city.name, profile?.city.state]
		.filter(Boolean)
		.join(', ')
	const locationItems: SummaryItem[] = location
		? [{ key: 'location', label: 'Location', value: location, icon: MapPin }]
		: []
	const summaryItems = profile ? getProfileSummary({ role, profile }) : []

	const basicItems = [
		...locationItems,
		...summaryItems.filter((item) => BASIC_KEYS.has(item.key)),
	]
	const communicationItems = summaryItems.filter((item) =>
		COMMUNICATION_KEYS.has(item.key),
	)
	const termsItems = summaryItems.filter((item) => TERMS_KEYS.has(item.key))
	const approachItems = summaryItems.filter(
		(item) =>
			!BASIC_KEYS.has(item.key) &&
			!COMMUNICATION_KEYS.has(item.key) &&
			!TERMS_KEYS.has(item.key),
	)

	const hasStats =
		communicationItems.length > 0 ||
		approachItems.length > 0 ||
		termsItems.length > 0

	return (
		<Card className="border-border bg-card gap-0 overflow-hidden rounded-lg p-0 shadow-sm">
			<div className="flex flex-col sm:flex-row">
				<div className="bg-muted/40 border-border flex shrink-0 flex-col border-b p-3.5 sm:w-48 sm:border-r sm:border-b-0">
					<p className="max-w-full truncate text-sm leading-tight font-bold">
						{name ?? 'Your profile'}
					</p>
					<div className="mt-1.5 flex items-center gap-1.5">
						<span className="bg-brand rounded-sm px-1.5 py-0.5 text-[9px] font-bold tracking-[0.2em] text-white uppercase">
							{role}
						</span>
						<span className="border-success/40 bg-success-tint text-success flex items-center gap-1 rounded-sm border px-1.5 py-0.5 text-[9px] font-bold">
							<SealCheckIcon className="h-3 w-3" weight="fill" />
							{summaryItems.length} prefs
						</span>
					</div>
					{basicItems.length > 0 ? (
						<div className="border-border mt-3 space-y-1.5 border-t border-dashed pt-3">
							{basicItems.map((item) => (
								<KeyedRow key={item.key} item={item} />
							))}
						</div>
					) : null}
				</div>

				{hasStats ? (
					<div className="grid min-w-0 flex-1 sm:grid-cols-3">
						<PreferenceGroup
							title="Comms"
							icon={ChatCircleIcon}
							items={communicationItems}
							band={GROUP_BANDS.comms}
						/>
						<PreferenceGroup
							title="Approach"
							icon={CompassIcon}
							items={approachItems}
							band={GROUP_BANDS.approach}
						/>
						<PreferenceGroup
							title="Terms"
							icon={HandshakeIcon}
							items={termsItems}
							band={GROUP_BANDS.terms}
						/>
					</div>
				) : null}
			</div>
		</Card>
	)
}
