import { Badge } from '@/components/ui/badge'
import {
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from '@/components/ui/accordion'
import type { DimensionTrace } from '@/lib/matching/scoring'
import { cn } from '@/lib/utils/ui'
import {
	scoreTone,
	scoreToneClasses,
} from '@/routes/debug/-components/score-tone'
import { SubcheckTable } from '@/routes/debug/-components/subcheck-table'

interface DimensionRowProps {
	dimension: DimensionTrace
}

export function DimensionRow({ dimension }: DimensionRowProps) {
	const lost = dimension.weight - dimension.contribution
	const tone = scoreTone(dimension.score)

	return (
		<AccordionItem value={dimension.id}>
			<AccordionTrigger className="py-2 hover:no-underline">
				<div className="grid w-full grid-cols-[minmax(7rem,9rem)_1fr_auto] items-center gap-3">
					<div className="min-w-0">
						<div className="truncate text-sm font-semibold">
							{dimension.label}
						</div>
						<div className="mt-0.5 flex items-center gap-1">
							<Badge variant="outline" className="px-1 font-mono text-[10px]">
								w {dimension.weight}
							</Badge>
							{dimension.boosted && (
								<span className="text-primary font-mono text-[10px]">
									↑{dimension.baseWeight}
								</span>
							)}
						</div>
					</div>

					{/* Track length = weight share of 100 pts; fill = score share of the track,
					    so fill length visually equals contribution on a common scale. */}
					<div className="h-2.5 w-full">
						<div
							className="bg-muted h-full overflow-hidden rounded-full"
							style={{ width: `${dimension.weight}%` }}
						>
							<div
								className={cn(
									'h-full rounded-full',
									scoreToneClasses[tone].solid,
								)}
								style={{ width: `${dimension.score * 100}%` }}
							/>
						</div>
					</div>

					<div className="text-right">
						<div className="font-mono text-sm font-semibold tabular-nums">
							{dimension.contribution.toFixed(2)} pts
						</div>
						<div className="font-mono text-[10px] tabular-nums">
							<span className="text-muted-foreground">
								{dimension.weight} × {dimension.score.toFixed(2)}
							</span>
							{lost >= 0.005 && (
								<span className={cn('ml-1.5', scoreToneClasses[tone].text)}>
									−{lost.toFixed(2)} lost
								</span>
							)}
						</div>
					</div>
				</div>
			</AccordionTrigger>
			<AccordionContent>
				<p className="text-muted-foreground text-xs">{dimension.explanation}</p>
				<SubcheckTable checks={dimension.checks} />
			</AccordionContent>
		</AccordionItem>
	)
}
