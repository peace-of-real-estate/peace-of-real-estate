import {
	BriefcaseIcon,
	CaretDownIcon,
	ChatCircleIcon,
	ClockIcon,
	MapPinIcon,
	MoneyIcon,
	ReceiptIcon,
	UsersIcon,
} from '@phosphor-icons/react'
import { useMemo, useState, type ElementType } from 'react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { MAX_ACTIVE_INTROS } from '@/lib/introductions/guards'
import type { ClientIntroductionsPayload } from '@/lib/introductions/views'
import type { DimensionId } from '@/lib/matching/affinities'
import type { AgentMatchData } from '@/lib/matching/match.view'
import type { ScoreBucket } from '@/lib/matching/scoring/types'
import { cn } from '@/lib/utils/ui'
import { InitialsAvatar } from '@/routes/(dashboard)/-components/agent-preview-card'
import { IntroductionStatusBadge } from '@/routes/(dashboard)/-components/introduction-status-badge'

// ============================================================
// Row state
// ============================================================

export type MatchRowState =
	| { kind: 'available' }
	| { kind: 'active'; status: 'pending' | 'accepted' }
	| { kind: 'connected' }
	| { kind: 'cooldown'; retryAt: Date | null }

function resolveRowState(
	agentProfileId: string,
	payload: ClientIntroductionsPayload | null,
): MatchRowState {
	const entry = payload?.agentStates.find(
		(state) => state.agentProfileId === agentProfileId,
	)
	if (!entry || entry.state === 'available') return { kind: 'available' }
	if (entry.state === 'connected') return { kind: 'connected' }
	if (entry.state === 'cooldown') {
		return { kind: 'cooldown', retryAt: entry.retryAt }
	}
	const intro = payload?.introductions.find(
		(row) =>
			row.agent.profileId === agentProfileId &&
			(row.status === 'pending' || row.status === 'accepted'),
	)
	return {
		kind: 'active',
		status: intro?.status === 'accepted' ? 'accepted' : 'pending',
	}
}

function cooldownLabel(retryAt: Date | null): string {
	if (!retryAt) return 'Cooldown'
	const days = Math.max(
		1,
		Math.ceil((new Date(retryAt).getTime() - Date.now()) / 86_400_000),
	)
	return `Retry in ${days}d`
}

// ============================================================
// Match list
// ============================================================

export function MatchList({
	matches,
	payload,
	availabilityLoaded,
	selectedIds,
	onToggleSelect,
	onRequestSend,
	isSending,
}: {
	matches: AgentMatchData[]
	payload: ClientIntroductionsPayload | null
	availabilityLoaded: boolean
	selectedIds: ReadonlySet<string>
	onToggleSelect: (agentProfileId: string) => void
	onRequestSend: () => void
	isSending: boolean
}) {
	const [expandedIds, setExpandedIds] = useState<ReadonlySet<string>>(new Set())

	const slots = payload?.slots ?? { used: 0, max: MAX_ACTIVE_INTROS }
	const remainingSlots = Math.max(0, slots.max - slots.used)
	const slotsLeftAfterSelection = Math.max(0, remainingSlots - selectedIds.size)

	const rows = useMemo(
		() =>
			matches.map((match) => ({
				match,
				state: resolveRowState(match.id, payload),
			})),
		[matches, payload],
	)

	const availableCount = useMemo(
		() => rows.filter((row) => row.state.kind === 'available').length,
		[rows],
	)

	const toggleExpanded = (id: string) => {
		setExpandedIds((prev) => {
			const next = new Set(prev)
			if (next.has(id)) next.delete(id)
			else next.add(id)
			return next
		})
	}

	return (
		<div className="space-y-3">
			<div className="flex items-center gap-3">
				{selectedIds.size > 0 ? (
					<section
						aria-label="Send introductions"
						className="bg-background sticky top-4 z-10 flex flex-1 items-center justify-between rounded-xl border p-3 shadow-sm"
					>
						<div aria-live="polite" className="text-sm">
							<span className="font-semibold">{selectedIds.size} selected</span>
							<span className="text-muted-foreground">
								{' '}
								· {slotsLeftAfterSelection}{' '}
								{slotsLeftAfterSelection === 1 ? 'slot' : 'slots'} remaining
							</span>
						</div>
						<Button
							size="sm"
							onClick={onRequestSend}
							disabled={isSending || !availabilityLoaded}
						>
							{isSending ? 'Sending…' : 'Send introductions'}
						</Button>
					</section>
				) : remainingSlots === 0 ? (
					<span className="text-muted-foreground ml-auto text-xs">
						Introduction capacity full — no slots available
					</span>
				) : (
					<span className="text-muted-foreground ml-auto text-xs">
						{rows.length} matches · {availableCount} available
					</span>
				)}
			</div>

			<div className="divide-y rounded-xl border">
				{rows.map(({ match, state }, index) => (
					<MatchRow
						key={match.id}
						match={match}
						state={state}
						rank={index + 1}
						checked={selectedIds.has(match.id)}
						disabled={
							!availabilityLoaded ||
							(!selectedIds.has(match.id) && selectedIds.size >= remainingSlots)
						}
						expanded={expandedIds.has(match.id)}
						onToggleExpand={() => toggleExpanded(match.id)}
						onToggleSelect={() => onToggleSelect(match.id)}
					/>
				))}
				{rows.length === 0 && (
					<p className="text-muted-foreground p-6 text-center text-sm">
						No matches yet.
					</p>
				)}
			</div>
		</div>
	)
}

// ============================================================
// Dimension slots
// ============================================================

const DIMENSION_ICONS: Record<DimensionId, ElementType> = {
	location: MapPinIcon,
	priceFit: MoneyIcon,
	specialization: BriefcaseIcon,
	workingStyle: UsersIcon,
	communication: ChatCircleIcon,
	businessTerms: ReceiptIcon,
}

const DIMENSION_SCORE_KEYS: Record<DimensionId, ScoreBucket> = {
	location: 'Location',
	priceFit: 'Price Fit',
	specialization: 'Specialization',
	workingStyle: 'Working Style',
	communication: 'Communication',
	businessTerms: 'Business Terms',
}

const DIMENSION_ORDER: DimensionId[] = [
	'location',
	'priceFit',
	'specialization',
	'workingStyle',
	'communication',
	'businessTerms',
]

/** Score at or above which a dimension slot lights up amber. */
const HOT_DIMENSION_THRESHOLD = 90

function DimensionSlots({ match }: { match: AgentMatchData }) {
	return (
		<div className="hidden shrink-0 gap-1 sm:flex">
			{DIMENSION_ORDER.map((dimensionId) => {
				const Icon = DIMENSION_ICONS[dimensionId]
				const scoreKey = DIMENSION_SCORE_KEYS[dimensionId]
				const score = match.scores[scoreKey] ?? 0
				const hot = score >= HOT_DIMENSION_THRESHOLD
				return (
					<span
						key={dimensionId}
						title={`${scoreKey}: ${score}`}
						className={cn(
							'flex h-7 w-7 items-center justify-center rounded-sm border',
							hot
								? 'border-amber/40 bg-amber/15 text-amber-foreground'
								: 'bg-muted text-muted-foreground border-border',
						)}
					>
						<Icon className="h-3.5 w-3.5" weight={hot ? 'fill' : 'regular'} />
					</span>
				)
			})}
		</div>
	)
}

// ============================================================
// Score dial
// ============================================================

const DIAL_RADIUS = 16
const DIAL_CIRCUMFERENCE = 2 * Math.PI * DIAL_RADIUS

/** Fit score at or above which the dial renders in amber. */
const HOT_SCORE_THRESHOLD = 90

function ScoreDial({ score }: { score: number }) {
	const clamped = Math.min(100, Math.max(0, score))
	const hot = clamped >= HOT_SCORE_THRESHOLD
	return (
		<svg
			viewBox="0 0 40 40"
			className="h-10 w-10 shrink-0"
			// oxlint-disable-next-line jsx-a11y/prefer-tag-over-role
			role="img"
			aria-label={`Fit score ${clamped}`}
		>
			<circle
				cx="20"
				cy="20"
				r={DIAL_RADIUS}
				fill="none"
				className="stroke-border"
				strokeWidth="4"
			/>
			<circle
				cx="20"
				cy="20"
				r={DIAL_RADIUS}
				fill="none"
				className={hot ? 'stroke-amber' : 'stroke-brand'}
				strokeWidth="4"
				strokeLinecap="round"
				strokeDasharray={`${(clamped / 100) * DIAL_CIRCUMFERENCE} ${DIAL_CIRCUMFERENCE}`}
				transform="rotate(-90 20 20)"
			/>
			<text
				x="20"
				y="24"
				textAnchor="middle"
				className={cn(
					'fill-foreground text-[11px] font-bold tabular-nums',
					!hot && 'fill-muted-foreground',
				)}
			>
				{clamped}
			</text>
		</svg>
	)
}

// ============================================================
// Match row
// ============================================================

function MatchRow({
	match,
	state,
	rank,
	checked,
	disabled,
	expanded,
	onToggleExpand,
	onToggleSelect,
}: {
	match: AgentMatchData
	state: MatchRowState
	rank: number
	checked: boolean
	disabled: boolean
	expanded: boolean
	onToggleExpand: () => void
	onToggleSelect: () => void
}) {
	const [failedAvatar, setFailedAvatar] = useState<string>()
	const showAvatar = Boolean(match.avatar) && match.avatar !== failedAvatar
	const selectable = state.kind === 'available'

	return (
		<div className="group hover:bg-muted/40 transition-colors">
			<div className="flex items-center gap-3 p-2.5">
				<div className="flex shrink-0 flex-col items-center gap-1.5">
					{selectable ? (
						<Checkbox
							checked={checked}
							disabled={disabled}
							onCheckedChange={onToggleSelect}
							aria-label={`Select ${match.name}`}
						/>
					) : (
						<StateBadge state={state} />
					)}
				</div>

				<span
					className={cn(
						'w-7 shrink-0 text-center text-sm font-bold tabular-nums',
						rank === 1 ? 'text-brand' : 'text-muted-foreground',
					)}
				>
					#{rank}
				</span>

				<div className="relative shrink-0">
					{showAvatar ? (
						<img
							src={match.avatar}
							alt={`${match.name} headshot`}
							className="h-9 w-9 rounded-md object-cover"
							onError={() => setFailedAvatar(match.avatar)}
						/>
					) : (
						<InitialsAvatar
							name={match.name}
							className="h-9 w-9 rounded-md text-xs"
						/>
					)}
				</div>

				<button
					type="button"
					onClick={onToggleExpand}
					aria-expanded={expanded}
					aria-label={`Toggle details for ${match.name}`}
					className="focus-visible:ring-ring/50 flex min-w-0 flex-1 cursor-pointer items-center gap-3 rounded-md text-left outline-none focus-visible:ring-[3px]"
				>
					<div className="w-36 shrink-0">
						<div className="flex items-center gap-1.5">
							<span className="truncate text-sm font-semibold">
								{match.name}
							</span>
						</div>
						<div className="text-muted-foreground truncate text-[11px]">
							{match.location}
						</div>
					</div>

					<ScoreDial score={match.fitScore} />
					<DimensionSlots match={match} />

					<span
						className={cn(
							'text-muted-foreground group-hover:text-foreground group-hover:border-foreground/25 ml-auto flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-all duration-200 md:ml-0',
							expanded && 'border-foreground/25 text-foreground',
						)}
					>
						<CaretDownIcon
							className={cn(
								'h-3 w-3 transition-transform duration-200',
								expanded && 'rotate-180',
							)}
						/>
					</span>
				</button>
			</div>

			<div
				aria-hidden={!expanded}
				className={cn(
					'grid transition-all duration-200 ease-out',
					expanded
						? 'grid-rows-[1fr] opacity-100'
						: 'grid-rows-[0fr] opacity-0',
				)}
			>
				<div className="overflow-hidden">
					<MatchRowDetails match={match} />
				</div>
			</div>
		</div>
	)
}

function StateBadge({ state }: { state: MatchRowState }) {
	switch (state.kind) {
		case 'active':
			return <IntroductionStatusBadge status={state.status} />
		case 'connected':
			return <IntroductionStatusBadge status="connected" />
		case 'cooldown':
			return <Badge variant="muted">{cooldownLabel(state.retryAt)}</Badge>
		default:
			return null
	}
}

// ============================================================
// Expanded details
// ============================================================

function MatchRowDetails({ match }: { match: AgentMatchData }) {
	return (
		<div className="bg-muted/30 space-y-3 border-t px-3 py-3">
			<div className="text-muted-foreground flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
				<span className="flex items-center gap-1">
					<MapPinIcon className="h-3 w-3" />
					Serves {match.zipCodes.slice(0, 3).join(', ')}
					{match.zipCodes.length > 3 && '…'}
				</span>
				{match.experience && (
					<span className="flex items-center gap-1">
						<ClockIcon className="h-3 w-3" />
						{match.experience}
					</span>
				)}
			</div>

			<span className="bg-secondary text-secondary-foreground inline-block rounded-sm px-2 py-0.5 text-xs font-medium">
				{match.bestClientType}
			</span>
		</div>
	)
}
