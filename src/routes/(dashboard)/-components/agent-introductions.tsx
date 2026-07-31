import { ArrowsLeftRightIcon, EnvelopeIcon } from '@phosphor-icons/react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useServerFn } from '@tanstack/react-start'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'

import { Badge } from '@/components/ui/badge'
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
import {
	acceptIntroduction,
	declineIntroduction,
	getAgentIntroductions,
} from '@/lib/introductions/server'
import type { ClientRole } from '@/lib/introductions/types'
import type { AgentIntroView } from '@/lib/introductions/views'
import {
	buyerQuestions,
	propertyType,
	sellerQuestions,
	timeline,
	type ClientWorkStyle,
} from '@/lib/profile'
import {
	DashboardPage,
	DashboardPageMobileNav,
} from '@/routes/(dashboard)/-components/dashboard'
import { IntroductionStatusBadge } from '@/routes/(dashboard)/-components/introduction-status-badge'
import {
	formatIntroductionDate as formatDate,
	groupIntroductions,
} from '@/routes/(dashboard)/-components/introduction-utils'
import { QueryErrorCard } from '@/routes/(dashboard)/-components/query-error-card'

export const agentIntroductionsQueryKey = ['agent-introductions'] as const
export const agentPendingIntroCountQueryKey = [
	'agent-pending-intro-count',
] as const
const EMPTY_INTRODUCTIONS: AgentIntroView[] = []

export function AgentIntroductions() {
	const queryClient = useQueryClient()

	const getIntrosFn = useServerFn(getAgentIntroductions)
	const acceptFn = useServerFn(acceptIntroduction)
	const declineFn = useServerFn(declineIntroduction)

	const introsQuery = useQuery({
		queryKey: agentIntroductionsQueryKey,
		queryFn: () => getIntrosFn(),
	})
	const introductions = introsQuery.data ?? EMPTY_INTRODUCTIONS

	const [acceptTarget, setAcceptTarget] = useState<AgentIntroView | null>(null)
	const [declineTarget, setDeclineTarget] = useState<AgentIntroView | null>(
		null,
	)

	const groups = useMemo(
		() => groupIntroductions(introductions),
		[introductions],
	)

	const invalidate = async () => {
		await Promise.all([
			queryClient.invalidateQueries({ queryKey: agentIntroductionsQueryKey }),
			queryClient.invalidateQueries({
				queryKey: agentPendingIntroCountQueryKey,
			}),
		])
	}

	const acceptMutation = useMutation({
		mutationFn: (introductionId: string) =>
			acceptFn({ data: { introductionId } }),
		onSuccess: async (result) => {
			setAcceptTarget(null)
			await invalidate()
			if (!result.ok) {
				toast.error(result.error.message)
			} else if (result.status === 'connected') {
				toast.success("You're connected — client contact info is now visible.")
			} else {
				toast.success('Accepted — the client unlocks contact info on payment.')
			}
		},
		onError: () => {
			setAcceptTarget(null)
			toast.error('Could not accept the introduction. Try again.')
		},
	})

	const declineMutation = useMutation({
		mutationFn: (introductionId: string) =>
			declineFn({ data: { introductionId } }),
		onSuccess: async (result) => {
			setDeclineTarget(null)
			await invalidate()
			if (result.ok) {
				toast.success('Introduction declined')
			} else {
				toast.error(result.error.message)
			}
		},
		onError: () => {
			setDeclineTarget(null)
			toast.error('Could not decline the introduction. Try again.')
		},
	})

	const pendingCount = groups.pending.length + groups.accepted.length
	const empty =
		pendingCount === 0 &&
		groups.connected.length === 0 &&
		groups.history.length === 0

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

				{introsQuery.isError ? (
					<QueryErrorCard
						message="Could not load introductions."
						onRetry={() => void introsQuery.refetch()}
					/>
				) : introsQuery.isLoading ? (
					<Card className="py-16 text-center">
						<p className="text-muted-foreground text-sm">
							Loading introductions...
						</p>
					</Card>
				) : empty ? (
					<Card className="py-16 text-center">
						<p className="text-muted-foreground text-sm">
							No introductions yet. When clients choose you, their requests
							appear here.
						</p>
					</Card>
				) : (
					<div className="space-y-6">
						{groups.pending.length > 0 && (
							<section className="space-y-2">
								<h2 className="text-sm font-semibold">
									Pending
									<span className="text-muted-foreground ml-1 text-xs font-normal">
										{pendingCount}
									</span>
								</h2>
								<div className="space-y-2">
									{groups.pending.map((intro) => (
										<PendingIntroCard
											key={intro.id}
											intro={intro}
											onAccept={() => setAcceptTarget(intro)}
											onDecline={() => setDeclineTarget(intro)}
										/>
									))}
								</div>
							</section>
						)}

						{groups.accepted.length > 0 && (
							<section className="space-y-2">
								<h2 className="text-sm font-semibold">
									Accepted
									<span className="text-muted-foreground ml-1 text-xs font-normal">
										{groups.accepted.length}
									</span>
								</h2>
								<div className="space-y-2">
									{groups.accepted.map((intro) => (
										<AcceptedIntroCard key={intro.id} intro={intro} />
									))}
								</div>
							</section>
						)}

						{groups.connected.length > 0 && (
							<section className="space-y-2">
								<h2 className="text-sm font-semibold">Connected</h2>
								<div className="space-y-2">
									{groups.connected.map((intro) => (
										<ConnectedIntroCard key={intro.id} intro={intro} />
									))}
								</div>
							</section>
						)}

						{groups.history.length > 0 && (
							<section className="space-y-2">
								<h2 className="text-sm font-semibold">History</h2>
								<div className="space-y-2">
									{groups.history.map((intro) => (
										<HistoryIntroCard key={intro.id} intro={intro} />
									))}
								</div>
							</section>
						)}
					</div>
				)}
			</div>

			<Dialog
				open={acceptTarget !== null}
				onOpenChange={(open) => {
					if (!open) setAcceptTarget(null)
				}}
			>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Accept introduction</DialogTitle>
						<DialogDescription>
							Accept {acceptTarget?.client.displayName}'s introduction? If
							they've unlocked access you'll connect immediately and see their
							contact info. Otherwise they'll be notified to unlock it.
						</DialogDescription>
					</DialogHeader>
					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => setAcceptTarget(null)}
							disabled={acceptMutation.isPending}
						>
							Cancel
						</Button>
						<Button
							onClick={() =>
								acceptTarget && acceptMutation.mutate(acceptTarget.id)
							}
							disabled={acceptMutation.isPending || !acceptTarget}
						>
							{acceptMutation.isPending ? 'Accepting…' : 'Accept'}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			<Dialog
				open={declineTarget !== null}
				onOpenChange={(open) => {
					if (!open) setDeclineTarget(null)
				}}
			>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Decline introduction</DialogTitle>
						<DialogDescription>
							{declineTarget?.client.displayName} sees a neutral "declined" and
							their intro slot frees up.
						</DialogDescription>
					</DialogHeader>

					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => setDeclineTarget(null)}
							disabled={declineMutation.isPending}
						>
							Cancel
						</Button>
						<Button
							variant="destructive"
							onClick={() =>
								declineTarget && declineMutation.mutate(declineTarget.id)
							}
							disabled={declineMutation.isPending || !declineTarget}
						>
							{declineMutation.isPending ? 'Declining…' : 'Decline'}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</DashboardPage>
	)
}

// ============================================================
// Cards
// ============================================================

function PendingIntroCard({
	intro,
	onAccept,
	onDecline,
}: {
	intro: AgentIntroView
	onAccept: () => void
	onDecline: () => void
}) {
	const { client } = intro
	return (
		<div className="rounded-xl border p-4">
			<div className="flex items-center gap-2">
				<span className="text-sm font-semibold">{client.displayName}</span>
				<Badge className="border-emerald-600/40 bg-emerald-600/10 text-emerald-700">
					{client.fitScore}% fit
				</Badge>
			</div>
			<div className="text-muted-foreground text-xs">
				{roleLabel(client.role)} · {client.city}, {client.state} · Sent{' '}
				{formatDate(intro.createdAt)}
			</div>
			<div className="mt-3 grid grid-cols-2 gap-2 text-xs">
				<FitCell
					label="Timeline"
					value={lookupLabel(timeline.labels, client.timeline)}
				/>
				<FitCell label="Price" value={client.priceRange} />
				<FitCell
					label="Type"
					value={client.propertyTypes
						.map((slug) => lookupLabel(propertyType.labels, slug))
						.join(', ')}
				/>
				{workStyleEntries(client.role, client.workStyle).map((entry) => (
					<FitCell key={entry.label} label={entry.label} value={entry.value} />
				))}
			</div>
			<div className="mt-3 flex gap-2">
				<Button size="sm" onClick={onAccept}>
					Accept
				</Button>
				<Button variant="outline" size="sm" onClick={onDecline}>
					Decline
				</Button>
			</div>
		</div>
	)
}

function FitCell({ label, value }: { label: string; value: string }) {
	return (
		<div className="bg-muted rounded-md p-2">
			<div className="text-muted-foreground">{label}</div>
			<div className="font-medium">{value}</div>
		</div>
	)
}

function AcceptedIntroCard({ intro }: { intro: AgentIntroView }) {
	return (
		<div className="flex items-center justify-between gap-3 rounded-lg border p-3">
			<div className="min-w-0">
				<div className="truncate text-sm font-semibold">
					{intro.client.displayName}
				</div>
				<div className="text-muted-foreground text-xs">
					{roleLabel(intro.client.role)} · {intro.client.city},{' '}
					{intro.client.state}
				</div>
				<div className="text-muted-foreground mt-1 text-xs">
					Waiting on the client — they unlock contact info on payment.
				</div>
			</div>
			<IntroductionStatusBadge status="accepted" />
		</div>
	)
}

function ConnectedIntroCard({ intro }: { intro: AgentIntroView }) {
	const contact = intro.client.contact
	return (
		<div className="rounded-xl border p-4">
			<div className="flex items-center justify-between gap-3">
				<div className="min-w-0">
					<div className="truncate text-sm font-semibold">
						{contact?.fullName ?? intro.client.displayName}
					</div>
					<div className="text-muted-foreground text-xs">
						{roleLabel(intro.client.role)} · {intro.client.city},{' '}
						{intro.client.state} · Connected {formatDate(intro.createdAt)}
					</div>
				</div>
				<IntroductionStatusBadge status="connected" />
			</div>
			{contact && (
				<div className="mt-2">
					<a
						href={`mailto:${contact.email}`}
						className="flex w-fit items-center gap-1 text-xs font-medium underline underline-offset-4"
					>
						<EnvelopeIcon className="h-3 w-3" />
						{contact.email}
					</a>
				</div>
			)}
		</div>
	)
}

function HistoryIntroCard({ intro }: { intro: AgentIntroView }) {
	return (
		<div className="flex items-center justify-between gap-3 rounded-lg border p-3">
			<div className="min-w-0">
				<div className="truncate text-sm font-semibold">
					{intro.client.displayName}
				</div>
				<div className="text-muted-foreground text-xs">
					{roleLabel(intro.client.role)} · {intro.client.city},{' '}
					{intro.client.state} · {formatDate(intro.createdAt)}
				</div>
			</div>
			<IntroductionStatusBadge status={intro.status} />
		</div>
	)
}

// ============================================================
// Helpers
// ============================================================

function roleLabel(role: ClientRole): string {
	return role === 'buyer' ? 'Buyer' : 'Seller'
}

function lookupLabel(
	labels: Readonly<Record<string, string>>,
	slug: string,
): string {
	return labels[slug] ?? slug
}

function workStyleEntries(
	role: ClientRole,
	workStyle: ClientWorkStyle,
): Array<{ label: string; value: string }> {
	const questions = Object.values(
		role === 'buyer' ? buyerQuestions : sellerQuestions,
	)
	return Object.entries(workStyle).flatMap(([key, value]) => {
		if (!value || (Array.isArray(value) && value.length === 0)) return []
		const question = questions.find((entry) => entry.id === key)
		if (!question) {
			return [
				{ label: key, value: Array.isArray(value) ? value.join(', ') : value },
			]
		}
		const displayValue = Array.isArray(value)
			? value
					.map((slug) => lookupLabel(question.options.labels, slug))
					.join(', ')
			: lookupLabel(question.options.labels, value)
		return [
			{
				label: question.label,
				value: displayValue,
			},
		]
	})
}
