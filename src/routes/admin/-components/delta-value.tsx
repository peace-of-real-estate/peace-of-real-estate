import { cn } from '@/lib/utils/ui'

export function DeltaValue({
	delta,
	digits = 2,
}: {
	delta: number | undefined
	digits?: number | undefined
}) {
	if (delta === undefined) {
		return <span className="text-muted-foreground text-right">—</span>
	}
	const rounded = Number(delta.toFixed(digits))
	return (
		<span
			className={cn(
				'text-right',
				rounded > 0 && 'text-emerald-600 dark:text-emerald-400',
				rounded < 0 && 'text-red-600 dark:text-red-400',
				rounded === 0 && 'text-muted-foreground',
			)}
		>
			{rounded > 0 ? '+' : ''}
			{rounded.toFixed(digits)}
		</span>
	)
}
