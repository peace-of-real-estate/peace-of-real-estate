import { cn } from '@/lib/utils/ui'
import {
	type ScoreTone,
	scoreToneClasses,
} from '@/routes/admin/-components/score-tone'

type MeterTone = ScoreTone | 'primary' | 'muted'

interface MeterBarProps {
	/** Fill fraction, 0–1. Ignored when `range` is set. */
	value?: number
	tone?: MeterTone
	/** Track width as a % of the row, so track length can encode a second quantity (e.g. weight). */
	trackPct?: number
	/** Range variant: a min–max band with a marker tick instead of a fill. All values 0–1. */
	range?: { min: number; max: number; marker: number }
	className?: string
}

function fillClass(tone: MeterTone): string {
	if (tone === 'primary') return 'bg-primary'
	if (tone === 'muted') return 'bg-muted-foreground/40'
	return scoreToneClasses[tone].solid
}

export function MeterBar({
	value = 0,
	tone = 'primary',
	trackPct,
	range,
	className,
}: MeterBarProps) {
	if (range) {
		return (
			<div
				className={cn(
					'bg-muted relative h-2 w-full overflow-hidden rounded-full',
					className,
				)}
			>
				<div
					className="bg-muted-foreground/25 absolute top-0 h-full"
					style={{
						left: `${range.min * 100}%`,
						width: `${Math.max((range.max - range.min) * 100, 1)}%`,
					}}
				/>
				<div
					className={cn('absolute top-0 h-full w-0.5', fillClass(tone))}
					style={{ left: `calc(${range.marker * 100}% - 1px)` }}
				/>
			</div>
		)
	}

	return (
		<div
			className={cn(
				'bg-muted h-2 overflow-hidden rounded-full',
				trackPct === undefined && 'w-full',
				className,
			)}
			style={trackPct === undefined ? undefined : { width: `${trackPct}%` }}
		>
			<div
				className={cn('h-full rounded-full', fillClass(tone))}
				style={{ width: `${Math.min(Math.max(value, 0), 1) * 100}%` }}
			/>
		</div>
	)
}
