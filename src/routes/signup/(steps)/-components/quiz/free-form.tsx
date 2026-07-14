import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import type { FreeFormQuestion } from '@/lib/profile'

export function FreeFormQuestionCard<TKey extends string>({
	question,
	value,
	onChange,
	onComplete,
	onSkip,
	isLastQuestion,
	canAdvance,
}: {
	question: FreeFormQuestion<TKey>
	value: string | null | undefined
	onChange: (value: string) => void
	onComplete?: (() => void) | undefined
	onSkip?: (() => void) | undefined
	isLastQuestion: boolean
	canAdvance: boolean
}) {
	return (
		<div className="space-y-4">
			<Textarea
				value={value ?? ''}
				onChange={(event) => onChange(event.target.value)}
				placeholder={question.title}
				rows={4}
			/>
			<div className="space-y-3">
				{onComplete ? (
					<Button
						onClick={onComplete}
						disabled={!canAdvance}
						size="lg"
						className="w-full gap-2 rounded-4xl px-8 py-6 text-base"
					>
						{isLastQuestion ? 'Finish' : 'Continue'}
					</Button>
				) : null}
				{question.allowSkip && onSkip ? (
					<Button
						variant="ghost"
						onClick={onSkip}
						size="lg"
						className="text-muted-foreground w-full"
					>
						Skip
					</Button>
				) : null}
			</div>
		</div>
	)
}
