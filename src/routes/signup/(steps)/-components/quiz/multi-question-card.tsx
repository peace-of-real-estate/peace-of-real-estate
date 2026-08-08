import { CheckIcon } from '@phosphor-icons/react'
import { m } from 'framer-motion'

import type { MultiQuestion } from '@/lib/profile'
import { cn } from '@/lib/utils/ui'

import { QuestionPrompt } from './question-prompt'

function selectionHint({
	minSelections,
	maxSelections,
}: {
	minSelections: number
	maxSelections: number
}) {
	if (minSelections === maxSelections) return `Pick ${maxSelections}`
	if (minSelections > 0) return `Choose ${minSelections} to ${maxSelections}`
	return `Choose up to ${maxSelections}`
}

function completionText({
	selectedCount,
	minSelections,
	maxSelections,
}: {
	selectedCount: number
	minSelections: number
	maxSelections: number
}) {
	if (minSelections === maxSelections) {
		return `${selectedCount}/${maxSelections}`
	}
	return `${selectedCount} selected`
}

export function MultiQuestionCard<TAnswer extends string>({
	question,
	answer,
	onSelect,
	disabled,
}: {
	question: MultiQuestion<string, TAnswer>
	answer: readonly TAnswer[] | null | undefined
	onSelect: (value: TAnswer[] | undefined) => void
	disabled?: boolean | undefined
}) {
	const selected = answer ? [...answer] : []
	const selectedSet = new Set(selected)
	const isComplete = selected.length >= question.minSelections
	const isAtMax = selected.length >= question.maxSelections

	const handleSelect = (slug: TAnswer) => {
		if (selectedSet.has(slug)) {
			onSelect(selected.filter((value) => value !== slug))
			return
		}
		if (isAtMax) return
		onSelect([...selected, slug])
	}

	return (
		<div className="space-y-5">
			<div className="flex items-start justify-between gap-4">
				<QuestionPrompt
					title={question.title}
					subtitle={selectionHint(question)}
				/>
				<div
					className={cn(
						'rounded-full px-3 py-1 text-xs font-semibold whitespace-nowrap transition-colors',
						isComplete
							? 'bg-primary text-primary-foreground'
							: 'bg-muted text-muted-foreground',
					)}
				>
					{completionText({
						selectedCount: selected.length,
						minSelections: question.minSelections,
						maxSelections: question.maxSelections,
					})}
				</div>
			</div>

			<div className="grid gap-2.5 sm:grid-cols-2">
				{question.options.slugs.map((slug, optionIndex) => {
					const isSelected = selectedSet.has(slug)
					const isUnavailable = !isSelected && isAtMax
					return (
						<m.button
							key={slug}
							type="button"
							initial={{ opacity: 0, y: 6 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{
								delay: optionIndex * 0.025,
								type: 'spring',
								stiffness: 520,
								damping: 30,
							}}
							disabled={disabled || isUnavailable}
							aria-pressed={isSelected}
							onClick={() => handleSelect(slug)}
							className={cn(
								'group flex min-h-13 items-center gap-3 rounded-xl border px-3.5 py-3 text-left text-sm font-semibold transition-all',
								'focus-visible:ring-ring focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none',
								isSelected
									? 'border-primary/60 bg-sky-tint text-foreground shadow-sm'
									: 'border-border bg-card hover:border-primary/40 hover:bg-background',
								isUnavailable && 'opacity-45 hover:border-border hover:bg-card',
								disabled && 'cursor-not-allowed opacity-50',
							)}
						>
							<span
								className={cn(
									'flex h-5 w-5 shrink-0 items-center justify-center rounded-sm border transition-colors',
									isSelected
										? 'border-primary bg-primary text-primary-foreground'
										: 'border-muted-foreground/25 text-transparent group-hover:border-primary/50',
								)}
							>
								<CheckIcon className="h-3.5 w-3.5" weight="bold" />
							</span>
							<span className="leading-snug">
								{question.options.labels[slug]}
							</span>
						</m.button>
					)
				})}
			</div>
		</div>
	)
}
