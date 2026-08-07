import { ArrowLeftIcon, ArrowRightIcon } from '@phosphor-icons/react'
import { AnimatePresence, m } from 'framer-motion'
import type { ReactNode } from 'react'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import type {
	MultiQuestion,
	Question,
	QuestionRecord,
	SingleQuestion,
} from '@/lib/profile'

import { AnimatedStepCard, StepHeader } from '../signup-shell'
import { MultiQuestionCard } from './multi-question-card'
import { QuizProgress } from './quiz-progress'
import { QuestionCard } from './single-question'
import { useQuestionFlow } from './use-question-flow'

const slideVariants = {
	enter: (direction: number) => ({ opacity: 0, x: direction * 24 }),
	center: { opacity: 1, x: 0 },
	exit: (direction: number) => ({ opacity: 0, x: direction * -24 }),
}

function QuestionFlow({
	currentStepIndex,
	totalSteps,
	direction,
	canAdvance,
	isLastQuestion,
	children,
	onQuestionIndexChange,
	onComplete,
}: {
	currentStepIndex: number
	totalSteps: number
	direction: number
	canAdvance: boolean
	isLastQuestion: boolean
	children: ReactNode
	onQuestionIndexChange: (index: number) => void
	onComplete: () => void
}) {
	const currentStepIndexClamped = Math.min(currentStepIndex, totalSteps - 1)
	const isFirstQuestion = currentStepIndexClamped === 0

	const goBack = () => {
		if (!isFirstQuestion) onQuestionIndexChange(currentStepIndexClamped - 1)
	}

	const goForward = () => {
		if (!canAdvance) return
		if (isLastQuestion) {
			onComplete()
		} else {
			onQuestionIndexChange(currentStepIndexClamped + 1)
		}
	}

	return (
		<div className="space-y-6">
			<div className="flex items-center gap-3">
				<Button
					variant="ghost"
					size="sm"
					onClick={goBack}
					disabled={isFirstQuestion}
					className="-ml-2 shrink-0"
				>
					<ArrowLeftIcon data-icon="inline-start" />
					Back
				</Button>
				<QuizProgress
					current={currentStepIndexClamped + 1}
					total={totalSteps}
					direction={direction}
					className="min-w-0 flex-1"
				/>
				<Button
					size="sm"
					onClick={goForward}
					disabled={!canAdvance}
					className="shrink-0"
				>
					{isLastQuestion ? 'Finish' : 'Next'}
					<ArrowRightIcon data-icon="inline-end" />
				</Button>
			</div>

			<AnimatePresence mode="wait" custom={direction} initial={false}>
				<m.div
					key={currentStepIndexClamped}
					custom={direction}
					variants={slideVariants}
					initial="enter"
					animate="center"
					exit="exit"
					transition={{ duration: 0.18, ease: 'easeOut' }}
					className="min-h-70 space-y-4"
				>
					{children}
				</m.div>
			</AnimatePresence>
		</div>
	)
}

function QuizQuestionContent<
	TDraft extends Record<string, unknown>,
	TQuestionId extends keyof TDraft & string,
>({
	question,
	answer,
	onSelect,
	disabled,
}: {
	question: Question<TQuestionId, TDraft[TQuestionId]>
	answer: TDraft[TQuestionId] | null | undefined
	onSelect: (value: TDraft[TQuestionId] | undefined) => void
	disabled?: boolean | undefined
}) {
	switch (question.kind) {
		case 'single': {
			// oxlint-disable-next-line typescript/consistent-type-assertions
			const singleQuestion = question as SingleQuestion<TQuestionId, string>
			// oxlint-disable-next-line typescript/consistent-type-assertions
			const singleAnswer = (answer as string | null | undefined) ?? null
			return (
				<QuestionCard
					question={singleQuestion}
					answer={singleAnswer}
					onSelect={(value) =>
						// oxlint-disable-next-line typescript/consistent-type-assertions
						onSelect(value as TDraft[TQuestionId] | undefined)
					}
					disabled={disabled}
				/>
			)
		}
		case 'multi': {
			// oxlint-disable-next-line typescript/consistent-type-assertions
			const multiQuestion = question as MultiQuestion<TQuestionId, string>
			const multiAnswer = Array.isArray(answer) ? answer : []
			return (
				<MultiQuestionCard
					question={multiQuestion}
					// oxlint-disable-next-line typescript/consistent-type-assertions
					answer={multiAnswer as string[]}
					onSelect={(value) =>
						// oxlint-disable-next-line typescript/consistent-type-assertions
						onSelect(value as TDraft[TQuestionId] | undefined)
					}
					disabled={disabled}
				/>
			)
		}
	}
}

export function PreferencesStep<
	TDraft extends Record<string, unknown>,
	TQuestionId extends keyof TDraft & string,
	TStep extends string,
>({
	title,
	stepNumber,
	totalSteps,
	stepKey,
	questionIds,
	questions,
	state,
	updateState,
	advanceOnSelect,
	isSkippable,
	onComplete,
}: {
	title: string
	stepNumber: number
	totalSteps: number
	stepKey: string
	questionIds: readonly TQuestionId[]
	questions: QuestionRecord<Pick<TDraft, TQuestionId>>
	state: Partial<TDraft>
	updateState: (patch: Partial<TDraft>) => void
	goToStep: (step: TStep) => void
	advanceOnSelect?: (questionId: TQuestionId) => boolean
	isSkippable?: (questionId: TQuestionId) => boolean
	onComplete: () => void
}) {
	const {
		currentQuestionIndex,
		questionId,
		direction,
		goToQuestion,
		isLastQuestion,
		canAdvance,
		handleSelect,
	} = useQuestionFlow({
		questionIds,
		questions,
		advanceOnSelect,
		isSkippable,
		state,
		updateState,
		onComplete,
	})

	return (
		<AnimatedStepCard stepKey={stepKey}>
			<Card size="sm" className="shadow-sm">
				<CardContent className="space-y-6">
					<StepHeader
						stepNumber={stepNumber}
						totalSteps={totalSteps}
						title={title}
					/>
					{questionId ? (
						<QuestionFlow
							currentStepIndex={currentQuestionIndex}
							totalSteps={questionIds.length}
							direction={direction}
							canAdvance={canAdvance}
							isLastQuestion={isLastQuestion}
							onQuestionIndexChange={goToQuestion}
							onComplete={onComplete}
						>
							<QuizQuestionContent
								question={questions[questionId]}
								answer={state[questionId]}
								onSelect={(value) => handleSelect(questionId, value)}
							/>
						</QuestionFlow>
					) : null}
				</CardContent>
			</Card>
		</AnimatedStepCard>
	)
}
