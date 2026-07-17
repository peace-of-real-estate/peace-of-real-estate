import { cn } from '@/lib/utils/ui'
import { CheckIcon } from '@phosphor-icons/react'

type ChipSelectOption<TValue extends string = string> = {
	value: TValue
	label: string
}

type ChipSelectProps<TValue extends string = string> = {
	options: ChipSelectOption<TValue>[]
	selected: TValue[]
	onChange: (selected: TValue[]) => void
	maxSelections?: number | undefined
	disabled?: boolean
	className?: string
}

export function ChipSelect<TValue extends string>({
	options,
	selected,
	onChange,
	maxSelections,
	disabled = false,
	className,
}: ChipSelectProps<TValue>) {
	const toggle = (value: TValue) => {
		if (disabled) return
		const isSelected = selected.includes(value)
		if (isSelected) {
			onChange(selected.filter((v) => v !== value))
			return
		}
		if (maxSelections && selected.length >= maxSelections) {
			return
		}
		onChange([...selected, value])
	}

	return (
		<div className={cn('flex flex-wrap gap-2', className)}>
			{options.map((option) => {
				const isSelected = selected.includes(option.value)
				const isAtLimit =
					!isSelected &&
					maxSelections !== undefined &&
					selected.length >= maxSelections

				return (
					<button
						key={option.value}
						type="button"
						disabled={isAtLimit || disabled}
						onClick={() => toggle(option.value)}
						className={cn(
							'inline-flex h-8 items-center gap-1.5 rounded-md border px-3 text-sm font-medium transition-all',
							isSelected
								? 'border-primary bg-primary/10 text-primary'
								: 'border-border bg-background text-foreground hover:border-foreground/30 hover:bg-muted/30',
							(isAtLimit || disabled) && 'pointer-events-none opacity-50',
						)}
					>
						{isSelected && <CheckIcon className="h-3.5 w-3.5" />}
						{option.label}
					</button>
				)
			})}
		</div>
	)
}
