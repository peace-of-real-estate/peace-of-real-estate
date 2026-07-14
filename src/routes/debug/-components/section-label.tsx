import { cn } from '@/lib/utils/ui'

export function SectionLabel({
	className,
	children,
}: {
	className?: string | undefined
	children: React.ReactNode
}) {
	return (
		<p
			className={cn(
				'text-muted-foreground text-[11px] font-semibold tracking-wide uppercase',
				className,
			)}
		>
			{children}
		</p>
	)
}
