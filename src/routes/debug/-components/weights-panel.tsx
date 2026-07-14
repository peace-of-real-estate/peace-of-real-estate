import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import type { DebugMatchesPayload } from '@/lib/matching/debug'
import { MeterBar } from '@/routes/debug/-components/meter-bar'
import { SectionLabel } from '@/routes/debug/-components/section-label'

interface WeightsPanelProps {
	matches: DebugMatchesPayload
}

export function WeightsPanel({ matches }: WeightsPanelProps) {
	const trace = matches.qualified[0]?.trace ?? matches.disqualified[0]?.trace

	if (!trace) {
		return (
			<Card className="p-3">
				<SectionLabel className="mb-2">Resolved weights</SectionLabel>
				<p className="text-muted-foreground text-xs">No traces available.</p>
			</Card>
		)
	}

	return (
		<Card className="p-3">
			<div className="mb-2 flex flex-wrap items-center gap-1.5">
				<SectionLabel>Resolved weights</SectionLabel>
				{trace.matchPriorities.map((priority) => (
					<Badge
						key={priority}
						variant="outline"
						className="border-primary/40 text-primary font-mono text-[10px]"
					>
						{priority}
					</Badge>
				))}
			</div>
			<div className="space-y-1.5">
				{trace.dimensions.map((dimension) => (
					<div key={dimension.id} className="flex items-center gap-2 text-xs">
						<span className="w-28 truncate font-medium">{dimension.label}</span>
						<MeterBar value={dimension.weight / 100} className="h-1.5 flex-1" />
						<span className="w-10 text-right font-mono tabular-nums">
							{dimension.weight}
						</span>
						{dimension.boosted && (
							<span className="text-primary font-mono text-[10px]">
								↑ {dimension.baseWeight}
							</span>
						)}
					</div>
				))}
			</div>
		</Card>
	)
}
