import {
	ArrowsLeftRightIcon,
	EnvelopeIcon,
	SpinnerIcon,
} from '@phosphor-icons/react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useServerFn } from '@tanstack/react-start'
import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'

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
import { MAX_ACTIVE_INTROS } from '@/lib/introductions/lifecycle'
import {
	getClientIntroductions,
	withdrawIntroduction,
} from '@/lib/introductions/server'
import type { ClientIntroView } from '@/lib/introductions/views'
import { buyer, seller } from '@/lib/profile'
import { ClientRole } from '@/lib/profile/types'
import { cn } from '@/lib/utils/ui'
import {
	DashboardPage,
	DashboardPageMobileNav,
} from '@/routes/(dashboard)/-components/dashboard'
import { IntroPaywall } from '@/routes/(dashboard)/-components/intro-paywall'
import { IntroductionStatusBadge } from '@/routes/(dashboard)/-components/introduction-status-badge'
import {
	formatIntroductionDate as formatDate,
	groupIntroductions,
	type IntroGroupKey,
	type IntroGroups,
} from '@/routes/(dashboard)/-components/introduction-utils'
import { QueryErrorCard } from '@/routes/(dashboard)/-components/query-error-card'

export const clientRoleConfig: Record<
	ClientRole,
	{
		loadProfile: () => Promise<{ id: string } | null>
		returnPath: '/buyer/introductions' | '/seller/introductions'
		signupPath: '/signup/buyer/location' | '/signup/seller/location'
	}
> = {
	buyer: {
		loadProfile: buyer.loadProfile,
		returnPath: '/buyer/introductions',
		signupPath: '/signup/buyer/location',
	},
	seller: {
		loadProfile: seller.loadProfile,
		returnPath: '/seller/introductions',
		signupPath: '/signup/seller/location',
	},
}

const UNLOCK_POLL_INTERVAL_MS = 1_500
const UNLOCK_POLL_TIMEOUT_MS = 30_000

export function ClientIntroductions({
	clientRole: role,
	unlock,
	onClearUnlock,
}: {
	clientRole: ClientRole
	unlock?: string | undefined
	onClearUnlock: () => void
}) {
	const { loadProfile, returnPath } = clientRoleConfig[role]
	const queryClient = useQueryClient()

	const loadProfileFn = useServerFn(loadProfile)
	const getIntrosFn = useServerFn(getClientIntroductions)
	const withdrawFn = useServerFn(withdrawIntroduction)

	const profileQuery = useQuery({
		queryKey: ['client-profile', role],
		queryFn: () => loadProfileFn(),
	})
	const profile = profileQuery.data
	const clientProfileId = profile?.id
	const queryKey = useMemo(
		() => ['client-introductions', clientProfileId] as const,
		[clientProfileId],
	)
	const introQuery = useQuery({
		queryKey,
		enabled: Boolean(clientProfileId),
		queryFn: () => getIntrosFn({ data: { clientProfileId: clientProfileId! } }),
	})
	const payload = introQuery.data ?? null

	const windowActive = Boolean(payload?.window.endsAt)
	const [unlockTimedOut, setUnlockTimedOut] = useState(false)
	const processingUnlock = unlock === 'success' && !windowActive

	useEffect(() => {
		if (unlock !== 'success' || windowActive) return
		const interval = setInterval(() => {
			void queryClient.invalidateQueries({ queryKey })
		}, UNLOCK_POLL_INTERVAL_MS)
		const timeout = setTimeout(() => {
			setUnlockTimedOut(true)
			onClearUnlock()
		}, UNLOCK_POLL_TIMEOUT_MS)
		return () => {
			clearInterval(interval)
			clearTimeout(timeout)
		}
	}, [unlock, windowActive, queryClient, queryKey, onClearUnlock])

	useEffect(() => {
		if (unlock === 'success' && windowActive) {
			toast.success('Contact info unlocked')
			onClearUnlock()
		}
	}, [unlock, windowActive, onClearUnlock])

	const now = useNow()
	const [tab, setTab] = useState<TabKey>('pending')
	const [withdrawTarget, setWithdrawTarget] = useState<ClientIntroView | null>(
		null,
	)

	const groups = useMemo(
		() => groupIntroductions(payload?.introductions ?? []),
		[payload],
	)
	const slots = payload?.slots ?? { used: 0, max: MAX_ACTIVE_INTROS }

	const withdrawMutation = useMutation({
		mutationFn: (introductionId: string) =>
			withdrawFn({ data: { introductionId } }),
		onSuccess: async (result) => {
			setWithdrawTarget(null)
			await queryClient.invalidateQueries({ queryKey })
			if (result.ok) {
				toast.success('Introduction withdrawn')
			} else {
				toast.error(result.error.message)
			}
		},
		onError: () => {
			setWithdrawTarget(null)
			toast.error('Could not withdraw the introduction. Try again.')
		},
	})

	return (
		<DashboardPage>
			<DashboardPageMobileNav label="Menu" />
			<div className="mx-auto w-full max-w-4xl">
				<div className="mb-8 flex items-center gap-4">
					<div className="bg-primary text-primary-foreground flex h-12 w-12 items-center justify-center rounded-md">
						<ArrowsLeftRightIcon className="h-5 w-5" />
					</div>
					<div>
						<h1 className="text-3xl">Introductions</h1>
					</div>
				</div>

				{processingUnlock && (
					<Card className="mb-6 flex items-center gap-2 p-3 text-sm">
						<SpinnerIcon className="h-4 w-4 animate-spin" />
						Processing payment…
					</Card>
				)}
				{unlockTimedOut && !windowActive && (
					<Card className="mb-6 p-3 text-sm">
						Still processing your payment — refresh shortly to see your access.
					</Card>
				)}

				<div className="mb-6 space-y-3">
					{payload && (
						<IntroPaywall
							payload={payload}
							role={role}
							returnPath={returnPath}
							queryKey={queryKey}
						/>
					)}
					<SlotMeter used={slots.used} max={slots.max} />
				</div>

				{profileQuery.isError || introQuery.isError ? (
					<QueryErrorCard
						message="Could not load introductions."
						onRetry={() => {
							void Promise.all([profileQuery.refetch(), introQuery.refetch()])
						}}
					/>
				) : introQuery.isLoading || profileQuery.isLoading ? (
					<Card className="py-16 text-center">
						<p className="text-muted-foreground text-sm">
							Loading introductions...
						</p>
					</Card>
				) : (
					<div className="space-y-3">
						<TabBar groups={groups} tab={tab} onChange={setTab} />
						<div className="space-y-2">
							{groups[tab].length === 0 ? (
								<Card className="py-16 text-center">
									<p className="text-muted-foreground text-sm">
										{emptyLabel(tab)}
									</p>
								</Card>
							) : (
								groups[tab].map((intro) => (
									<IntroCard
										key={intro.id}
										intro={intro}
										now={now}
										onRequestWithdraw={() => setWithdrawTarget(intro)}
									/>
								))
							)}
						</div>
					</div>
				)}
			</div>

			<Dialog
				open={withdrawTarget !== null}
				onOpenChange={(open) => {
					if (!open) setWithdrawTarget(null)
				}}
			>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Withdraw introduction</DialogTitle>
						<DialogDescription>
							Withdraw your introduction to {withdrawTarget?.agent.name}? This
							can't be undone, and you'll need to wait 30 days before matching
							with this agent again.
						</DialogDescription>
					</DialogHeader>
					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => setWithdrawTarget(null)}
							disabled={withdrawMutation.isPending}
						>
							Cancel
						</Button>
						<Button
							variant="destructive"
							onClick={() =>
								withdrawTarget && withdrawMutation.mutate(withdrawTarget.id)
							}
							disabled={withdrawMutation.isPending || !withdrawTarget}
						>
							{withdrawMutation.isPending ? 'Withdrawing…' : 'Withdraw'}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</DashboardPage>
	)
}

// ============================================================
// Tabs
// ============================================================

type TabKey = IntroGroupKey

const TAB_LABELS: Record<TabKey, string> = {
	pending: 'Pending',
	accepted: 'Accepted',
	connected: 'Connected',
	history: 'History',
}

const TAB_KEYS: TabKey[] = ['pending', 'accepted', 'connected', 'history']

function TabBar({
	groups,
	tab,
	onChange,
}: {
	groups: IntroGroups<ClientIntroView>
	tab: TabKey
	onChange: (tab: TabKey) => void
}) {
	return (
		<div
			role="tablist"
			aria-label="Introduction status"
			className="flex gap-1 border-b pb-2 text-sm font-medium"
		>
			{TAB_KEYS.map((key) => (
				<button
					key={key}
					type="button"
					role="tab"
					aria-selected={tab === key}
					onClick={() => onChange(key)}
					className={cn(
						'rounded-t-md px-3 py-1.5',
						tab === key
							? 'border-primary bg-muted/30 border-b-2'
							: 'text-muted-foreground hover:text-foreground',
					)}
				>
					{TAB_LABELS[key]}
					{groups[key].length > 0 && (
						<span className="text-muted-foreground ml-1 text-xs">
							{groups[key].length}
						</span>
					)}
				</button>
			))}
		</div>
	)
}

function emptyLabel(tab: TabKey): string {
	switch (tab) {
		case 'pending':
			return 'No pending introductions.'
		case 'accepted':
			return 'No accepted introductions yet.'
		case 'connected':
			return 'No connected agents yet.'
		case 'history':
			return 'No past introductions.'
	}
}

// ============================================================
// Slot meter
// ============================================================

function SlotMeter({ used, max }: { used: number; max: number }) {
	return (
		<div className="text-muted-foreground flex items-center gap-2 text-xs">
			<div className="bg-muted h-1.5 w-24 overflow-hidden rounded-full">
				<div
					className="bg-primary h-full rounded-full"
					style={{
						width: `${Math.min(100, (used / Math.max(1, max)) * 100)}%`,
					}}
				/>
			</div>
			<span>
				{used} of {max} intro slots used
			</span>
		</div>
	)
}

// ============================================================
// Intro card
// ============================================================

function IntroCard({
	intro,
	now,
	onRequestWithdraw,
}: {
	intro: ClientIntroView
	now: number
	onRequestWithdraw: () => void
}) {
	const withdrawableIn = new Date(intro.withdrawableAt).getTime() - now

	return (
		<div className="flex items-center justify-between gap-3 rounded-lg border p-3">
			<div className="min-w-0">
				<div className="truncate text-sm font-semibold">{intro.agent.name}</div>
				<div className="text-muted-foreground text-xs">
					Sent {formatDate(intro.createdAt)}
					{intro.acceptedAt && ` · Accepted ${formatDate(intro.acceptedAt)}`}
				</div>
				{intro.status === 'accepted' && (
					<div className="text-muted-foreground mt-1 text-xs">
						Waiting on unlock — unlock contact info to connect.
					</div>
				)}
				{intro.agent.contact && (
					<div className="mt-2 space-y-1 text-xs">
						<div className="text-muted-foreground">
							{intro.agent.contact.brokerageName} · License{' '}
							{intro.agent.contact.licenseNumberState}
						</div>
						<div className="flex flex-wrap gap-x-4 gap-y-1">
							<a
								href={`mailto:${intro.agent.contact.email}`}
								className="flex items-center gap-1 font-medium underline underline-offset-4"
							>
								<EnvelopeIcon className="h-3 w-3" />
								{intro.agent.contact.email}
							</a>
						</div>
					</div>
				)}
			</div>

			<div className="flex shrink-0 flex-col items-end gap-1.5">
				<IntroductionStatusBadge status={intro.status} />
				{intro.status === 'pending' &&
					(withdrawableIn > 0 ? (
						<span className="text-muted-foreground text-[10px]">
							Withdraw available in {formatCountdown(withdrawableIn)}
						</span>
					) : (
						<Button variant="outline" size="xs" onClick={onRequestWithdraw}>
							Withdraw
						</Button>
					))}
			</div>
		</div>
	)
}

// ============================================================
// Helpers
// ============================================================

function useNow(intervalMs = 30_000): number {
	const [now, setNow] = useState(() => Date.now())
	useEffect(() => {
		const id = setInterval(() => setNow(Date.now()), intervalMs)
		return () => clearInterval(id)
	}, [intervalMs])
	return now
}

function formatCountdown(ms: number): string {
	const totalMinutes = Math.ceil(ms / 60_000)
	const hours = Math.floor(totalMinutes / 60)
	const minutes = totalMinutes % 60
	return `${hours}h ${minutes}m`
}
