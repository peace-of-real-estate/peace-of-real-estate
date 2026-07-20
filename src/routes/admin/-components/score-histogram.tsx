import { Card } from '@/components/ui/card'
import type { DebugMatchesPayload } from '@/lib/matching/debug'
import { cn } from '@/lib/utils/ui'
import { MeterBar } from '@/routes/admin/-components/meter-bar'
import { SectionLabel } from '@/routes/admin/-components/section-label'

interface ScoreHistogramProps {
	matches: DebugMatchesPayload
}

/** Bucket disqualified agents' would-be scores into the same decade ranges. */
function wouldBeCounts(matches: DebugMatchesPayload): number[] {
	const counts = Array.from(
		{ length: matches.scoreDistribution.length },
		() => 0,
	)
	if (counts.length === 0) return counts
	for (const match of matches.disqualified) {
		const index = Math.min(
			Math.max(Math.floor(match.trace.computedScore / 10), 0),
			counts.length - 1,
		)
		counts[index] = (counts[index] ?? 0) + 1
	}
	return counts
}

export function ScoreHistogram({ matches }: ScoreHistogramProps) {
	const ghost = wouldBeCounts(matches)
	const hasGhost = ghost.some((count) => count > 0)
	const maxCount = Math.max(
		1,
		...matches.scoreDistribution.map((bucket) => bucket.count),
		...ghost,
	)

	return (
		<Card className="p-3">
			<SectionLabel className="mb-2">fitScore distribution</SectionLabel>
			<div className="space-y-1 font-mono text-xs">
				{matches.scoreDistribution.map((bucket, index) => {
					const ghostCount = ghost[index] ?? 0
					return (
						<div key={bucket.range} className="flex items-center gap-2">
							<span className="text-muted-foreground w-14 shrink-0 text-right">
								{bucket.range}
							</span>
							<div className="flex min-w-0 flex-1 flex-col gap-0.5">
								<MeterBar value={bucket.count / maxCount} />
								{hasGhost && (
									<MeterBar
										value={ghostCount / maxCount}
										tone="muted"
										className="h-1"
									/>
								)}
							</div>
							<span
								className={cn(
									'w-10 shrink-0 text-right tabular-nums',
									hasGhost && 'leading-tight',
								)}
							>
								{bucket.count}
								{hasGhost && (
									<span className="text-muted-foreground block text-[10px]">
										{ghostCount > 0 ? `~${ghostCount}` : ' '}
									</span>
								)}
							</span>
						</div>
					)
				})}
			</div>
			{hasGhost && (
				<div className="text-muted-foreground mt-2 flex flex-wrap items-center gap-3 text-[10px]">
					<span className="flex items-center gap-1">
						<span className="bg-primary size-2 rounded-full" />
						actual (disqualified count as 0)
					</span>
					<span className="flex items-center gap-1">
						<span className="bg-muted-foreground/40 size-2 rounded-full" />
						would-be score of disqualified
					</span>
				</div>
			)}
		</Card>
	)
}
