import { Card } from '@/components/ui/card'
import type { DebugMatch } from '@/lib/matching/debug'
import type { DimensionTrace } from '@/lib/matching/scoring'
import { DeltaValue } from '@/routes/debug/-components/delta-value'
import { MeterBar } from '@/routes/debug/-components/meter-bar'
import { SectionLabel } from '@/routes/debug/-components/section-label'
import { scoreTone } from '@/routes/debug/-components/score-tone'

interface CompareDimensionTableProps {
	selected: DebugMatch
	pinned: DebugMatch
}

export function CompareDimensionTable({
	selected,
	pinned,
}: CompareDimensionTableProps) {
	const rows = selected.trace.dimensions.map((dimension) => ({
		dimension,
		other: pinned.trace.dimensions.find(
			(candidate) => candidate.id === dimension.id,
		),
	}))

	if (rows.length === 0) return null

	return (
		<Card className="p-3">
			<SectionLabel className="mb-2">Dimension scores</SectionLabel>
			<div className="mb-1 grid grid-cols-[minmax(6rem,8rem)_1fr_1fr_4rem] items-center gap-2 text-[10px] font-semibold uppercase">
				<span />
				<span className="text-muted-foreground">selected</span>
				<span className="text-muted-foreground">pinned</span>
				<span className="text-muted-foreground text-right">Δ score</span>
			</div>
			<div className="space-y-1.5">
				{rows.map(({ dimension, other }) => (
					<div
						key={dimension.id}
						className="grid grid-cols-[minmax(6rem,8rem)_1fr_1fr_4rem] items-center gap-2 text-xs"
					>
						<span className="truncate font-medium">{dimension.label}</span>
						<DimensionBar dimension={dimension} />
						<DimensionBar dimension={other} />
						<DeltaValue
							delta={
								other !== undefined ? dimension.score - other.score : undefined
							}
						/>
					</div>
				))}
			</div>
		</Card>
	)
}

function DimensionBar({
	dimension,
}: {
	dimension: DimensionTrace | undefined
}) {
	if (!dimension) {
		return <span className="text-muted-foreground font-mono">—</span>
	}

	return (
		<div className="flex items-center gap-2">
			<MeterBar
				value={dimension.score}
				tone={scoreTone(dimension.score)}
				className="flex-1"
			/>
			<span className="w-8 shrink-0 text-right font-mono tabular-nums">
				{dimension.score.toFixed(2)}
			</span>
		</div>
	)
}
