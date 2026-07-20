import { Badge } from '@/components/ui/badge'
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from '@/components/ui/tooltip'
import { cn } from '@/lib/utils/ui'
import {
	fitScoreTone,
	scoreToneClasses,
} from '@/routes/admin/-components/score-tone'

interface FitScoreBadgeProps {
	fitScore: number
	disqualified?: boolean
	/**
	 * Pre-gate score (`trace.computedScore`). When set on a disqualified match,
	 * renders a ghost "would be N%" instead of a bare 0%.
	 */
	computedScore?: number
	size?: 'sm' | 'lg' | 'xl'
	/** Caption under the number (xl only), e.g. "Final fitScore". */
	label?: string
	className?: string
}

const DQ_TEXT = 'text-red-600 dark:text-red-400'

export function FitScoreBadge({
	fitScore,
	disqualified = false,
	computedScore,
	size = 'sm',
	label,
	className,
}: FitScoreBadgeProps) {
	const toneText = disqualified
		? DQ_TEXT
		: scoreToneClasses[fitScoreTone(fitScore)].text
	const ghost = disqualified && computedScore !== undefined

	if (size === 'sm') {
		const badge = (
			<Badge
				variant="outline"
				className={cn(
					'w-14 justify-center py-1 font-mono text-sm font-semibold tabular-nums',
					disqualified
						? 'border-dashed border-red-500/30 text-red-600 dark:text-red-400'
						: scoreToneClasses[fitScoreTone(fitScore)].badge,
					className,
				)}
			>
				{ghost ? `~${computedScore}%` : `${fitScore}%`}
			</Badge>
		)

		if (!ghost) return badge

		return (
			<Tooltip>
				<TooltipTrigger asChild>{badge}</TooltipTrigger>
				<TooltipContent>
					<p className="max-w-xs text-xs">
						Would score {computedScore}% if gates passed; public fitScore is
						forced to 0.
					</p>
				</TooltipContent>
			</Tooltip>
		)
	}

	if (size === 'lg') {
		return (
			<div
				className={cn(
					'shrink-0 font-mono text-xl font-bold tabular-nums',
					toneText,
					className,
				)}
			>
				{fitScore}%
			</div>
		)
	}

	return (
		<div className={cn('text-right', className)}>
			<div
				className={cn('font-mono text-2xl font-bold tabular-nums', toneText)}
			>
				{fitScore}%
			</div>
			{label && (
				<div className="text-muted-foreground text-[10px] uppercase">
					{label}
				</div>
			)}
			{ghost && (
				<div className="text-muted-foreground font-mono text-[10px] tabular-nums">
					would be {computedScore}%
				</div>
			)}
		</div>
	)
}
