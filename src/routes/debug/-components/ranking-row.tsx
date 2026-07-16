import {
	ArrowsLeftRightIcon as GitCompareArrows,
	ShuffleIcon as Shuffle,
} from '@phosphor-icons/react'

import { Badge } from '@/components/ui/badge'
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from '@/components/ui/tooltip'
import type { DebugMatch } from '@/lib/matching/debug'
import { cn } from '@/lib/utils/ui'
import { FitScoreBadge } from '@/routes/debug/-components/fit-score-badge'
import { failedGateLabels } from '@/routes/debug/-components/ranking-model'

interface RankingRowProps {
	match: DebugMatch
	selected: boolean
	pinnedForCompare: boolean
	onSelect: () => void
	disqualified?: boolean
}

export function RankingRow({
	match,
	selected,
	pinnedForCompare,
	onSelect,
	disqualified = false,
}: RankingRowProps) {
	const shuffled = match.displayRank !== match.preShuffleRank

	return (
		<button
			type="button"
			data-agent-id={match.agentId}
			onClick={onSelect}
			className={cn(
				'flex w-full items-center gap-3 border-l-2 border-transparent px-3 py-2 text-left transition',
				selected ? 'border-primary bg-primary/10' : 'hover:bg-muted/50',
				disqualified && !selected && 'bg-red-500/[0.02] hover:bg-red-500/5',
			)}
			aria-label={`Select ${match.name ?? 'agent'}`}
			aria-current={selected ? 'true' : undefined}
		>
			<FitScoreBadge
				fitScore={match.fitScore}
				disqualified={disqualified}
				computedScore={match.trace.computedScore}
				size="sm"
			/>

			<div className="min-w-0 flex-1">
				<div className="flex items-center gap-1.5">
					<span className="text-muted-foreground w-6 shrink-0 font-mono text-[10px] tabular-nums">
						#{match.displayRank}
					</span>
					<span className="truncate text-sm font-semibold">
						{match.name ?? 'Unknown'}
					</span>
					{shuffled && (
						<Tooltip>
							<TooltipTrigger asChild>
								<Badge
									variant="muted"
									className="gap-0.5 font-mono text-[10px]"
								>
									<Shuffle className="size-2.5" />#{match.preShuffleRank}
								</Badge>
							</TooltipTrigger>
							<TooltipContent>
								Tie-band shuffle moved this agent from pre-shuffle rank #
								{match.preShuffleRank} to #{match.displayRank}
							</TooltipContent>
						</Tooltip>
					)}
					{pinnedForCompare && (
						<GitCompareArrows className="text-primary size-3.5 shrink-0" />
					)}
				</div>
				<div className="flex items-center gap-1.5">
					<span className="text-muted-foreground min-w-0 truncate text-xs">
						{match.brokerage ?? 'No brokerage'} · {match.location}
					</span>
					{disqualified &&
						failedGateLabels(match).map((gate) => (
							<Badge
								key={gate}
								variant="outline"
								className="shrink-0 border-red-500/30 px-1 text-[10px] text-red-600 dark:text-red-400"
							>
								{gate}
							</Badge>
						))}
				</div>
			</div>
		</button>
	)
}
