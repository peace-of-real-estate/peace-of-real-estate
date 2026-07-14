import { Card } from '@/components/ui/card'
import type { DebugMatchesPayload } from '@/lib/matching/debug'
import { MeterBar } from '@/routes/debug/-components/meter-bar'
import { SectionLabel } from '@/routes/debug/-components/section-label'
import { scoreTone } from '@/routes/debug/-components/score-tone'

interface DimensionCohortStatsProps {
	matches: DebugMatchesPayload
}

interface CohortStat {
	id: string
	label: string
	mean: number
	min: number
	max: number
}

function computeStats(matches: DebugMatchesPayload): CohortStat[] {
	const first = matches.qualified[0]
	if (!first) return []

	return first.trace.dimensions.map((dimension) => {
		const scores = matches.qualified.reduce<number[]>((acc, match) => {
			const score = match.trace.dimensions.find(
				(d) => d.id === dimension.id,
			)?.score
			if (score !== undefined) acc.push(score)
			return acc
		}, [])
		const mean =
			scores.reduce((sum, score) => sum + score, 0) / Math.max(scores.length, 1)
		return {
			id: dimension.id,
			label: dimension.label,
			mean,
			min: Math.min(...scores),
			max: Math.max(...scores),
		}
	})
}

export function DimensionCohortStats({ matches }: DimensionCohortStatsProps) {
	const stats = computeStats(matches)

	return (
		<Card className="p-3">
			<SectionLabel className="mb-2">
				Dimension scores across qualified agents
			</SectionLabel>
			{stats.length === 0 ? (
				<p className="text-muted-foreground text-xs">No qualified agents.</p>
			) : (
				<div className="space-y-1.5">
					{stats.map((stat) => (
						<div key={stat.id} className="flex items-center gap-2 text-xs">
							<span className="w-28 truncate font-medium">{stat.label}</span>
							<MeterBar
								range={{ min: stat.min, max: stat.max, marker: stat.mean }}
								tone={scoreTone(stat.mean)}
								className="flex-1"
							/>
							<span className="text-muted-foreground w-40 shrink-0 text-right font-mono tabular-nums">
								μ {stat.mean.toFixed(2)} · {stat.min.toFixed(2)}–
								{stat.max.toFixed(2)}
							</span>
						</div>
					))}
				</div>
			)}
		</Card>
	)
}
