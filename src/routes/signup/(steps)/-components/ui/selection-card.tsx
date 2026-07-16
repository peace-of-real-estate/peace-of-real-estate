import type { ElementType, ReactNode } from 'react'

import { cn } from '@/lib/utils/ui'
import { CheckIcon } from '@phosphor-icons/react'

type SelectionCardLayout = 'vertical' | 'horizontal'
type SelectionCardVariant = 'solid' | 'subtle'

export type SelectionCardProps = {
	icon?: ElementType | undefined
	media?: ReactNode
	title: ReactNode
	description?: ReactNode
	selected?: boolean
	disabled?: boolean | undefined
	layout?: SelectionCardLayout
	variant?: SelectionCardVariant
	indicator?: 'check' | 'none'
	className?: string
	onClick?: () => void
}

export function SelectionCard({
	icon: Icon,
	media,
	title,
	description,
	selected = false,
	disabled = false,
	layout = 'horizontal',
	variant = 'subtle',
	indicator = 'check',
	className,
	onClick,
}: SelectionCardProps) {
	const isVertical = layout === 'vertical'

	const iconContent = media ? (
		media
	) : Icon ? (
		<Icon className={cn('h-5 w-5', isVertical && 'h-4 w-4')} />
	) : null

	return (
		<button
			type="button"
			onClick={onClick}
			disabled={disabled}
			aria-pressed={selected}
			className={cn(
				'group relative flex items-center gap-3 rounded-2xl border px-4 py-4 text-left transition-all duration-150',
				isVertical && 'flex-col justify-center gap-2 py-5 text-center',
				selected && variant === 'solid'
					? 'border-primary bg-primary text-primary-foreground shadow-sm'
					: selected && variant === 'subtle'
						? 'border-primary/60 bg-primary/[0.06] text-foreground shadow-sm'
						: 'border-border bg-card text-foreground hover:border-primary/50 hover:bg-background hover:shadow-sm',
				disabled && 'cursor-not-allowed opacity-50',
				className,
			)}
		>
			{selected && indicator === 'check' ? (
				<span
					className={cn(
						'absolute top-2 right-2 flex h-5 w-5 items-center justify-center rounded-full',
						variant === 'solid'
							? 'bg-primary-foreground text-primary'
							: 'bg-primary text-primary-foreground',
					)}
				>
					<CheckIcon className="h-3 w-3" />
				</span>
			) : null}

			{iconContent ? (
				<span
					className={cn(
						'flex h-10 w-10 shrink-0 items-center justify-center rounded-full border transition-colors duration-150',
						selected
							? variant === 'solid'
								? 'border-primary-foreground/30 bg-primary-foreground/15 text-primary-foreground'
								: 'border-primary/30 bg-primary/10 text-primary'
							: 'border-muted-foreground/20 bg-muted/30 text-muted-foreground group-hover:border-primary/40 group-hover:text-primary',
						isVertical && 'h-9 w-9',
					)}
				>
					{iconContent}
				</span>
			) : null}

			<div className={cn('min-w-0', isVertical && 'w-full')}>
				<div
					className={cn(
						'font-semibold leading-snug',
						isVertical ? 'text-sm' : 'text-base',
					)}
				>
					{title}
				</div>
				{description ? (
					<div
						className={cn(
							'mt-0.5 text-sm leading-snug',
							selected && variant === 'solid'
								? 'text-primary-foreground/80'
								: 'text-muted-foreground',
						)}
					>
						{description}
					</div>
				) : null}
			</div>
		</button>
	)
}
