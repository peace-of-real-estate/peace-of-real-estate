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

interface BlendEquationProps {
	trace: ScoreTrace
	fitScore: number
}

export function BlendEquation({ trace, fitScore }: BlendEquationProps) {
	const stage2 = trace.stage2
	const penalty = trace.notFitPenalty

	const weightedLinear = stage2 ? stage2.linear * 0.7 : undefined
	const weightedGeometric = stage2 ? stage2.geometric * 0.3 : undefined

	return (
		<Card className="p-3">
			<SectionLabel className="mb-2">Stage 2 — Reciprocal blend</SectionLabel>

			<div className="grid grid-cols-[1fr_auto_1fr_auto_1fr] items-center gap-2">
				<Tile label="linear ×0.7" value={weightedLinear} />
				<Operator>+</Operator>
				<Tile label="geometric ×0.3" value={weightedGeometric} />
				<Operator>=</Operator>
				<Tile
					label="consumerScore"
					value={stage2?.consumerScore}
					tooltip="0.7·linear + 0.3·geometric"
				/>
			</div>

			<Operator className="my-2 justify-center">↓</Operator>

			<div className="grid grid-cols-[1fr_auto_1fr_auto_1fr] items-center gap-2">
				<Tile
					label="consumerScore"
					value={stage2?.consumerScore}
					tooltip="0.7·linear + 0.3·geometric"
				/>
				<Operator>⨯</Operator>
				<Tile
					label="agentFit"
					value={trace.agentFit}
					tooltip="Average of price centrality and client-type fit"
				/>
				<Operator>→</Operator>
				<Tile
					label="reciprocalBlend"
					value={trace.reciprocalBlend}
					tooltip="harmonicMean(consumerScore, 0.5 + 0.5·agentFit)"
				/>
			</div>

			<Operator className="my-2 justify-center">↓</Operator>

			<div className="flex items-center justify-center">
				<Tile label="×100" value={trace.computedScore} suffix="pts" />
			</div>

			{penalty && (
				<>
					<Operator className="my-2 justify-center">↓</Operator>
					<div className="rounded-md border border-red-500/20 bg-red-500/5 p-2 text-center">
						<p className="text-[10px] font-semibold text-red-700 uppercase dark:text-red-300">
							notFitFor penalty ({penalty.reason})
						</p>
						<p className="font-mono text-sm font-semibold text-red-700 tabular-nums dark:text-red-300">
							{penalty.scoreBefore.toFixed(2)} → {penalty.scoreAfter.toFixed(2)}
						</p>
					</div>
				</>
			)}

			<div className="mt-3 text-center">
				<p className="text-muted-foreground text-[10px] uppercase">
					Final fitScore
				</p>
				<p
					className={cn(
						'font-mono text-3xl font-bold tabular-nums',
						scoreToneClasses[fitScoreTone(fitScore)].text,
					)}
				>
					{fitScore}%
				</p>
			</div>
		</Card>
	)
}

function Operator({
	className,
	children,
}: {
	className?: string | undefined
	children: React.ReactNode
}) {
	return (
		<div className={cn('text-muted-foreground flex text-lg', className)}>
			{children}
		</div>
	)
}

function Tile({
	label,
	value,
	suffix,
	tooltip,
}: {
	label: string
	value: number | undefined
	suffix?: string | undefined
	tooltip?: string | undefined
}) {
	const tile = (
		<div
			className={cn(
				'bg-muted/50 rounded-md p-2 text-center',
				tooltip && 'cursor-help',
			)}
		>
			<p className="text-muted-foreground text-[10px] font-semibold uppercase">
				{label}
			</p>
			<p className="font-mono text-sm font-semibold tabular-nums">
				{value?.toFixed(2) ?? '—'}
				{suffix ? (
					<span className="text-muted-foreground text-xs"> {suffix}</span>
				) : null}
			</p>
		</div>
	)

	if (!tooltip) return tile

	return (
		<Tooltip>
			<TooltipTrigger asChild>{tile}</TooltipTrigger>
			<TooltipContent>
				<p className="max-w-xs text-xs">{tooltip}</p>
			</TooltipContent>
		</Tooltip>
	)
}
