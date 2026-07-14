import { GitCompareArrows, X } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { DebugMatch, DebugMatchesPayload } from '@/lib/matching/debug'
import { CohortOverview } from '@/routes/debug/-components/cohort-overview'
import { CompareView } from '@/routes/debug/-components/compare-view'
import { CopyJsonButton } from '@/routes/debug/-components/copy-json-button'
import { DimensionTable } from '@/routes/debug/-components/dimension-table'
import { FallbackCard } from '@/routes/debug/-components/fallback-card'
import { FitScoreBadge } from '@/routes/debug/-components/fit-score-badge'
import { GatesSection } from '@/routes/debug/-components/gates-section'
import { RawJsonSection } from '@/routes/debug/-components/raw-json-section'
import { ScoreInternals } from '@/routes/debug/-components/score-internals'

interface InspectorProps {
	matches: DebugMatchesPayload
	selectedAgentId: string | undefined
	selectedMatch: DebugMatch | undefined
	compareAgentId: string | undefined
	compareMatch: DebugMatch | undefined
	onSelectAgent: (agentId: string | undefined) => void
	onSetCompare: (agentId: string | undefined) => void
	onFilterByGate: (gate: string) => void
}

export function Inspector({
	matches,
	selectedAgentId,
	selectedMatch,
	compareAgentId,
	compareMatch,
	onSelectAgent,
	onSetCompare,
	onFilterByGate,
}: InspectorProps) {
	const staleSelection = Boolean(selectedAgentId && !selectedMatch)
	const staleCompare = Boolean(compareAgentId && !compareMatch)

	if (!selectedMatch) {
		return (
			<div className="flex min-h-0 flex-col">
				{staleSelection && (
					<StaleNotice
						label={`Agent "${selectedAgentId}" is not in the current result set.`}
						onClear={() => onSelectAgent(undefined)}
					/>
				)}
				{staleCompare && (
					<StaleNotice
						label={`Compare agent "${compareAgentId}" is not in the current result set.`}
						onClear={() => onSetCompare(undefined)}
					/>
				)}
				<CohortOverview matches={matches} onFilterByGate={onFilterByGate} />
			</div>
		)
	}

	if (compareMatch && compareMatch.agentId !== selectedMatch.agentId) {
		return (
			<CompareView
				selected={selectedMatch}
				pinned={compareMatch}
				onUnpin={() => onSetCompare(undefined)}
			/>
		)
	}

	return (
		<div className="min-h-0 overflow-y-auto p-4">
			{staleCompare && (
				<StaleNotice
					label={`Compare agent "${compareAgentId}" is not in the current result set.`}
					onClear={() => onSetCompare(undefined)}
				/>
			)}

			<PairHeader
				match={selectedMatch}
				pinned={compareMatch?.agentId === selectedMatch.agentId}
				onTogglePin={() =>
					onSetCompare(
						compareMatch?.agentId === selectedMatch.agentId
							? undefined
							: selectedMatch.agentId,
					)
				}
				onClear={() => onSelectAgent(undefined)}
			/>

			<div className="space-y-3">
				{selectedMatch.disqualified && (
					<GatesSection trace={selectedMatch.trace} />
				)}
				{selectedMatch.trace.mode === 'fallback' ? (
					<FallbackCard trace={selectedMatch.trace} />
				) : (
					<DimensionTable trace={selectedMatch.trace} />
				)}
				{!selectedMatch.disqualified && (
					<GatesSection trace={selectedMatch.trace} />
				)}
				<ScoreInternals
					trace={selectedMatch.trace}
					fitScore={selectedMatch.fitScore}
				/>
				<RawJsonSection
					sections={[
						{ label: 'formula', value: selectedMatch.trace.formula },
						{ label: 'score trace', value: selectedMatch.trace },
						{ label: 'agent profile', value: selectedMatch.agentProfile },
						{ label: 'client profile', value: matches.clientProfile },
					]}
				/>
			</div>
		</div>
	)
}

function PairHeader({
	match,
	pinned,
	onTogglePin,
	onClear,
}: {
	match: DebugMatch
	pinned: boolean
	onTogglePin: () => void
	onClear: () => void
}) {
	const shuffled = match.displayRank !== match.preShuffleRank

	return (
		<div className="mb-4 flex items-start justify-between gap-3">
			<div className="min-w-0">
				<h2 className="truncate text-xl font-semibold">
					{match.name ?? 'Unknown'}
				</h2>
				<p className="text-muted-foreground truncate text-sm">
					{match.brokerage ?? 'No brokerage'} · {match.location}
				</p>
				<div className="mt-1.5 flex flex-wrap items-center gap-1.5">
					<Badge variant="muted" className="font-mono text-[10px]">
						display #{match.displayRank}
					</Badge>
					{shuffled && (
						<Badge variant="muted" className="font-mono text-[10px]">
							sorted #{match.preShuffleRank}
						</Badge>
					)}
					{match.bandSize > 1 && (
						<Badge variant="muted" className="font-mono text-[10px]">
							band {match.bandIndex + 1} · {match.bandSize} agents · rot +
							{match.bandOffset}
						</Badge>
					)}
					{match.trace.mode === 'fallback' && (
						<Badge variant="muted" className="font-mono text-[10px]">
							fallback
						</Badge>
					)}
				</div>
			</div>

			<div className="flex shrink-0 items-center gap-2">
				<FitScoreBadge
					fitScore={match.fitScore}
					disqualified={match.disqualified}
					size="xl"
					label={match.disqualified ? 'Disqualified' : 'Final fitScore'}
					className="mr-1"
				/>
				<CopyJsonButton value={match} label="Copy" />
				<Button
					variant={pinned ? 'secondary' : 'outline'}
					size="xs"
					onClick={onTogglePin}
					title="Pin for compare (c)"
				>
					<GitCompareArrows />
					{pinned ? 'Pinned' : 'Compare'}
				</Button>
				<Button
					variant="ghost"
					size="icon-xs"
					onClick={onClear}
					aria-label="Clear selection"
				>
					<X />
				</Button>
			</div>
		</div>
	)
}

function StaleNotice({
	label,
	onClear,
}: {
	label: string
	onClear: () => void
}) {
	return (
		<div className="m-4 mb-0 flex items-center justify-between gap-2 rounded-md border border-amber-500/30 bg-amber-500/5 px-3 py-2 text-xs">
			<span className="truncate">{label}</span>
			<Button variant="outline" size="xs" onClick={onClear}>
				Clear
			</Button>
		</div>
	)
}
