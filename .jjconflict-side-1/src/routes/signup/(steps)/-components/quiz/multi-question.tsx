import { motion } from 'framer-motion'

import type { MultiQuestion } from '@/lib/profile'

import { SelectionCard } from '../ui/selection-card'
import { QuestionPrompt } from './question-prompt'

export function MultiSelectQuestionCard<TSlug extends string>({
	question,
	answer,
	onChange,
	disabled,
}: {
	question: MultiQuestion<string, TSlug>
	answer: TSlug[] | null | undefined
	onChange: (value: TSlug[] | undefined) => void
	disabled?: boolean | undefined
}) {
	return (
		<div className="space-y-4">
			<QuestionPrompt title={question.title} />
			<div className="space-y-3">
				{question.options.slugs.map((slug, optionIndex) => {
					const current = answer ?? []
					const selected = current.includes(slug)
					const label = question.options.labels[slug]
					const meta = question.optionMeta?.[slug]
					const optionDescription = meta?.description ?? null

					return (
						<motion.div
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
								selected={selected}
								variant="subtle"
								layout="horizontal"
								indicator="none"
								disabled={disabled}
								onClick={() => {
									const current = answer ?? []
									const next = current.includes(slug)
										? current.filter((item) => item !== slug)
										: [...current, slug]
									onChange(next.length > 0 ? next : undefined)
								}}
								className="w-full"
							/>
						</motion.div>
					)
				})}
			</div>
		</div>
	)
}
