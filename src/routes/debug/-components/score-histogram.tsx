import { Card } from '@/components/ui/card'
import type { DebugMatchesPayload } from '@/lib/matching/debug'
import { MeterBar } from '@/routes/debug/-components/meter-bar'
import { SectionLabel } from '@/routes/debug/-components/section-label'

interface ScoreHistogramProps {
	matches: DebugMatchesPayload
}

export function ScoreHistogram({ matches }: ScoreHistogramProps) {
	const maxCount = Math.max(
		1,
		...matches.scoreDistribution.map((bucket) => bucket.count),
	)

	return (
		<Card className="p-3">
			<SectionLabel className="mb-2">fitScore distribution</SectionLabel>
			<div className="space-y-0.5 font-mono text-xs">
				{matches.scoreDistribution.map((bucket) => (
					<div key={bucket.range} className="flex items-center gap-2">
						<span className="text-muted-foreground w-14 shrink-0 text-right">
							{bucket.range}
						</span>
						<MeterBar value={bucket.count / maxCount} />

						<span className="w-6 text-right tabular-nums">{bucket.count}</span>
					</div>
				))}
			</div>
		</Card>
	)
}
