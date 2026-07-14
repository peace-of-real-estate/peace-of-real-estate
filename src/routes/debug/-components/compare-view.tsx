import { Check, GitCompareArrows, Pin, X } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import type { DebugMatch } from '@/lib/matching/debug'
import { cn } from '@/lib/utils/ui'
import { CompareDimensionTable } from '@/routes/debug/-components/compare-dimension-table'
import { DeltaValue } from '@/routes/debug/-components/delta-value'
import { SectionLabel } from '@/routes/debug/-components/section-label'
import {
	fitScoreTone,
	scoreToneClasses,
} from '@/routes/debug/-components/score-tone'

interface CompareViewProps {
	selected: DebugMatch
	pinned: DebugMatch
	onUnpin: () => void
}

export function CompareView({ selected, pinned, onUnpin }: CompareViewProps) {
	return (
		<div className="min-h-0 overflow-y-auto p-4">
			<div className="mb-4 flex items-center justify-between gap-3">
				<div className="flex items-center gap-2">
					<GitCompareArrows className="text-primary size-4" />
					<h2 className="text-xl font-semibold">Compare</h2>
				</div>
				<Button variant="outline" size="xs" onClick={onUnpin}>
					<X />
					Unpin
				</Button>
			</div>

			<div className="space-y-3">
				<div className="grid grid-cols-2 gap-3">
					<AgentSummary match={selected} kind="selected" />
					<AgentSummary match={pinned} kind="pinned" />
				</div>

				<StageComparison selected={selected} pinned={pinned} />

				<CompareDimensionTable selected={selected} pinned={pinned} />

				<GatesDiff selected={selected} pinned={pinned} />
			</div>
		</div>
	)
}

function AgentSummary({
	match,
	kind,
}: {
	match: DebugMatch
	kind: 'selected' | 'pinned'
}) {
	return (
		<Card className="p-3">
			<div className="flex items-start justify-between gap-2">
				<div className="min-w-0">
					<div className="flex items-center gap-1.5">
						{kind === 'pinned' && (
							<Pin className="text-primary size-3.5 shrink-0" />
						)}
						<span className="truncate text-sm font-semibold">
							{match.name ?? 'Unknown'}
						</span>
					</div>
					<p className="text-muted-foreground truncate text-xs">
						{match.brokerage ?? 'No brokerage'} · {match.location}
					</p>
					<div className="mt-1 flex flex-wrap gap-1">
						<Badge variant="muted" className="font-mono text-[10px]">
							#{match.displayRank}
						</Badge>
						{match.disqualified && (
							<Badge
								variant="outline"
								className="border-red-500/30 font-mono text-[10px] text-red-600 dark:text-red-400"
							>
								DQ
							</Badge>
						)}
					</div>
				</div>
				<div
					className={cn(
						'shrink-0 font-mono text-xl font-bold tabular-nums',
						match.disqualified
							? 'text-red-600 dark:text-red-400'
							: scoreToneClasses[fitScoreTone(match.fitScore)].text,
					)}
				>
					{match.fitScore}%
				</div>
			</div>
		</Card>
	)
}

function StageComparison({
	selected,
	pinned,
}: {
	selected: DebugMatch
	pinned: DebugMatch
}) {
	const rows: {
		label: string
		selected: number | undefined
		pinned: number | undefined
		digits?: number
	}[] = [
		{
			label: 'fitScore',
			selected: selected.fitScore,
			pinned: pinned.fitScore,
			digits: 0,
		},
		{
			label: 'computedScore',
			selected: selected.trace.computedScore,
			pinned: pinned.trace.computedScore,
		},
		{
			label: 'consumerScore',
			selected: selected.trace.stage2?.consumerScore,
			pinned: pinned.trace.stage2?.consumerScore,
		},
		{
			label: 'agentFit',
			selected: selected.trace.agentFit,
			pinned: pinned.trace.agentFit,
		},
		{
			label: 'reciprocalBlend',
			selected: selected.trace.reciprocalBlend,
			pinned: pinned.trace.reciprocalBlend,
		},
	]

	return (
		<Card className="p-3">
			<SectionLabel className="mb-2">Pipeline values</SectionLabel>
			<div className="space-y-1">
				{rows.map((row) => {
					const delta =
						row.selected !== undefined && row.pinned !== undefined
							? row.selected - row.pinned
							: undefined
					return (
						<div
							key={row.label}
							className="grid grid-cols-[minmax(7rem,1fr)_5rem_5rem_5rem] items-center gap-2 font-mono text-xs tabular-nums"
						>
							<span className="text-muted-foreground truncate">
								{row.label}
							</span>
							<span className="text-right">
								{formatValue(row.selected, row.digits)}
							</span>
							<span className="text-right">
								{formatValue(row.pinned, row.digits)}
							</span>
							<DeltaValue delta={delta} digits={row.digits} />
						</div>
					)
				})}
			</div>
		</Card>
	)
}

function formatValue(value: number | undefined, digits: number = 2): string {
	return value === undefined ? '—' : value.toFixed(digits)
}

function GatesDiff({
	selected,
	pinned,
}: {
	selected: DebugMatch
	pinned: DebugMatch
}) {
	const diffs = selected.trace.disqualifiers
		.map((gate) => ({
			gate,
			other: pinned.trace.disqualifiers.find(
				(candidate) => candidate.id === gate.id,
			),
		}))
		.filter(
			({ gate, other }) => other && gate.disqualified !== other.disqualified,
		)

	if (diffs.length === 0) return null

	return (
		<Card className="p-3">
			<SectionLabel className="mb-2">Gate differences</SectionLabel>
			<div className="space-y-1.5">
				{diffs.map(({ gate, other }) => (
					<div
						key={gate.id}
						className="grid grid-cols-[minmax(7rem,1fr)_1fr_1fr] items-center gap-2 text-xs"
					>
						<span className="font-medium">{gate.label}</span>
						<GateResult disqualified={gate.disqualified} />
						<GateResult disqualified={other?.disqualified ?? false} />
					</div>
				))}
			</div>
		</Card>
	)
}

function GateResult({ disqualified }: { disqualified: boolean }) {
	return disqualified ? (
		<span className="flex items-center gap-1 text-red-600 dark:text-red-400">
			<X className="size-3" /> failed
		</span>
	) : (
		<span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
			<Check className="size-3" /> passed
		</span>
	)
}
