import { m } from 'framer-motion'
import { useState } from 'react'

import type { SingleQuestion } from '@/lib/profile'
import { cn } from '@/lib/utils/ui'

import { SelectionCard } from '../ui/selection-card'
import { QuestionPrompt } from './question-prompt'

export function QuestionCard<TAnswer extends string>({
	question,
	answer,
	onSelect,
	disabled,
}: {
	question: SingleQuestion<string, TAnswer>
	answer: TAnswer | null | undefined
	onSelect: (value: TAnswer | undefined) => void
	disabled?: boolean | undefined
}) {
	const [poppedOption, setPoppedOption] = useState<TAnswer | null>(null)

	const handleSelect = (slug: TAnswer) => {
		if (answer === slug) {
			onSelect(undefined)
			return
		}
		setPoppedOption(slug)
		window.setTimeout(() => setPoppedOption(null), 100)
		onSelect(slug)
	}

	return (
		<div className="space-y-4">
			<QuestionPrompt title={question.title} />
			<div className="space-y-3">
				{question.options.slugs.map((slug, optionIndex) => {
					const label = question.options.labels[slug]
					const isSelected = answer === slug
					const isPopped = poppedOption === slug
					const meta = question.optionMeta?.[slug]
					const involvementLevel = meta?.level ?? null
					const optionDescription = meta?.description ?? null

					return (
						<m.div
							key={slug}
							initial={{ opacity: 0, y: 8 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{
								delay: optionIndex * 0.04,
								type: 'spring',
								stiffness: 500,
								damping: 25,
							}}
						>
							<SelectionCard
								title={label}
								description={optionDescription}
								media={
									involvementLevel ? (
										<m.span
											animate={isPopped ? { scale: 1.2 } : { scale: 1 }}
											transition={{
												type: 'spring',
												stiffness: 600,
												damping: 12,
											}}
											className="flex h-full w-full items-center justify-center"
										>
											<span className="flex items-end justify-center gap-0.5 pb-1.5">
												{[1, 2, 3].map((bar) => (
													<span
														key={bar}
														className={cn(
															'w-1 rounded-full',
															bar === 1 && 'h-2',
															bar === 2 && 'h-3.5',
															bar === 3 && 'h-5',
															bar <= involvementLevel
																? 'bg-current'
																: 'bg-current/25',
														)}
													/>
												))}
											</span>
										</m.span>
									) : undefined
								}
								selected={isSelected}
								variant="subtle"
								layout="horizontal"
								indicator="none"
								disabled={disabled}
								onClick={() => handleSelect(slug)}
								className="w-full"
							/>
						</m.div>
					)
				})}
			</div>
		</div>
	)
}
