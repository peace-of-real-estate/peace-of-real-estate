import { ChevronRight } from 'lucide-react'

import { Card } from '@/components/ui/card'
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from '@/components/ui/tooltip'
import type { ScoreTrace } from '@/lib/matching/scoring'
import { cn } from '@/lib/utils/ui'
import { SectionLabel } from '@/routes/debug/-components/section-label'
import {
	fitScoreTone,
	scoreToneClasses,
} from '@/routes/debug/-components/score-tone'

interface PipelineStripProps {
	trace: ScoreTrace
	fitScore: number
}

interface Stage {
	label: string
	value: string
	tooltip?: string | undefined
	className?: string | undefined
}

function buildStages(trace: ScoreTrace, fitScore: number): Stage[] {
	const stages: Stage[] = []

	if (trace.mode === 'fallback') {
		const present = trace.fallback?.present.length ?? 0
		const missing = trace.fallback?.missing.length ?? 0
		stages.push({
			label: 'completeness',
			value: `${present}/${present + missing}`,
			tooltip: 'Fallback mode — agent profile completeness, no client profile',
		})
	} else {
		const dimensionTotal = trace.dimensions.reduce(
			(sum, dimension) => sum + dimension.contribution,
			0,
		)
		stages.push({
			label: 'Σ dims',
			value: `${dimensionTotal.toFixed(1)} pts`,
			tooltip: 'Sum of weighted dimension contributions (Stage 1)',
		})

		if (trace.stage2) {
			stages.push(
				{
					label: 'linear',
					value: trace.stage2.linear.toFixed(2),
					tooltip: 'Weighted arithmetic mean of dimension scores',
				},
				{
					label: 'geometric',
					value: trace.stage2.geometric.toFixed(2),
					tooltip:
						'Weighted geometric mean (floor 0.05) — punishes weak dimensions',
				},
				{
					label: 'consumer',
					value: trace.stage2.consumerScore.toFixed(2),
					tooltip: '0.7·linear + 0.3·geometric',
				},
			)
		}
		if (trace.agentFit !== undefined) {
			stages.push({
				label: 'agentFit',
				value: trace.agentFit.toFixed(2),
				tooltip: 'Average of price centrality and client-type fit',
			})
		}
		if (trace.reciprocalBlend !== undefined) {
			stages.push({
				label: 'blend',
				value: trace.reciprocalBlend.toFixed(2),
				tooltip: 'harmonicMean(consumerScore, 0.5 + 0.5·agentFit)',
			})
		}
		stages.push({
			label: '×100',
			value: trace.computedScore.toFixed(1),
			tooltip: 'Blend scaled to points, before penalties and gates',
		})
		if (trace.notFitPenalty) {
			stages.push({
				label: '×0.3 notFit',
				value: trace.notFitPenalty.scoreAfter.toFixed(1),
				tooltip: `notFitFor penalty: ${trace.notFitPenalty.reason}`,
				className:
					'border-red-500/30 bg-red-500/5 text-red-700 dark:text-red-300',
			})
		}
	}

	if (trace.disqualified) {
		stages.push({
			label: 'gated',
			value: '0',
			tooltip: 'Hard gate failed — public fitScore forced to 0',
			className:
				'border-red-500/30 bg-red-500/5 text-red-700 dark:text-red-300',
		})
	}

	stages.push({
		label: 'fitScore',
		value: `${fitScore}%`,
		className: scoreToneClasses[fitScoreTone(fitScore)].badge,
	})

	return stages
}

export function PipelineStrip({ trace, fitScore }: PipelineStripProps) {
	const stages = buildStages(trace, fitScore)

	return (
		<Card className="p-3">
			<SectionLabel className="mb-2">Score pipeline</SectionLabel>
			<div className="flex flex-wrap items-center gap-1.5">
				{stages.map((stage, index) => (
					<div key={stage.label} className="flex items-center gap-1.5">
						{index > 0 && (
							<ChevronRight className="text-muted-foreground size-3.5 shrink-0" />
						)}
						<StageTile stage={stage} />
					</div>
				))}
			</div>
		</Card>
	)
}

function StageTile({ stage }: { stage: Stage }) {
	const tile = (
		<div
			className={cn(
				'bg-muted/40 rounded-md border border-transparent px-2 py-1 text-center',
				stage.tooltip && 'cursor-help',
				stage.className,
			)}
		>
			<p className="text-muted-foreground text-[10px] font-semibold uppercase">
				{stage.label}
			</p>
			<p className="font-mono text-sm font-semibold tabular-nums">
				{stage.value}
			</p>
		</div>
	)

	if (!stage.tooltip) return tile

	return (
		<Tooltip>
			<TooltipTrigger asChild>{tile}</TooltipTrigger>
			<TooltipContent>
				<p className="max-w-xs text-xs">{stage.tooltip}</p>
			</TooltipContent>
		</Tooltip>
	)
}
