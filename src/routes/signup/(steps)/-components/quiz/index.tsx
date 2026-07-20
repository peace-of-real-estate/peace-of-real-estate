import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useRef, useState, type ReactNode } from 'react'

import { Card, CardContent } from '@/components/ui/card'
import type {
	FreeFormQuestion,
	MultiQuestion,
	Question,
	QuestionRecord,
	SingleQuestion,
} from '@/lib/profile'
import {
	AnimatedStepCard,
	StepHeader,
	StepProgressHeader,
} from '../signup-shell'
import { FreeFormQuestionCard } from './free-form'
import { MultiSelectQuestionCard } from './multi-question'
import { QuestionCard } from './single-question'
import { QuestionPrompt } from './question-prompt'
import { useQuestionFlow } from './use-question-flow'
import { ArrowLeftIcon, ArrowRightIcon } from '@phosphor-icons/react'

function QuestionFlow({
	currentStepIndex,
	totalSteps,
	canAdvance,
	isLastQuestion,
	children,
	onQuestionIndexChange,
	onComplete,
}: {
	currentStepIndex: number
	totalSteps: number
	canAdvance: boolean
	isLastQuestion: boolean
	children: ReactNode
	onQuestionIndexChange: (index: number) => void
	onComplete: () => void
}) {
	const [direction, setDirection] = useState(1)
	const [isTransitioning, setIsTransitioning] = useState(false)
	const transitionTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
	const completeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
	const topRef = useRef<HTMLDivElement>(null)
	const currentStepIndexClamped = Math.min(currentStepIndex, totalSteps - 1)
	const isFirstQuestion = currentStepIndexClamped === 0

	useEffect(() => {
		return () => {
			for (const ref of [transitionTimer, completeTimer]) {
				if (ref.current) {
					clearTimeout(ref.current)
					ref.current = null
				}
			}
		}
	}, [])

	const advance = () => {
		if (currentStepIndexClamped < totalSteps - 1) {
			setDirection(1)
			setIsTransitioning(true)
			if (transitionTimer.current) clearTimeout(transitionTimer.current)
			transitionTimer.current = setTimeout(() => {
				onQuestionIndexChange(currentStepIndexClamped + 1)
				setIsTransitioning(false)
			}, 120)
		}
	}

	const goBack = () => {
		if (currentStepIndexClamped > 0) {
			setDirection(-1)
			onQuestionIndexChange(currentStepIndexClamped - 1)
		}
	}

	const complete = () => {
		setIsTransitioning(true)
		if (completeTimer.current) clearTimeout(completeTimer.current)
		completeTimer.current = setTimeout(() => {
			onComplete()
		}, 100)
	}

	return (
		<div className="space-y-6">
			<div ref={topRef} className="scroll-mt-4" />

			<div className="flex items-center justify-end gap-3">
				<button
					type="button"
					onClick={goBack}
					disabled={isFirstQuestion || isTransitioning}
					className="border-border bg-card text-muted-foreground hover:border-primary/30 hover:text-foreground flex h-8 w-8 items-center justify-center rounded-full border transition disabled:cursor-not-allowed disabled:opacity-25"
				>
					<ArrowLeftIcon className="h-4 w-4" />
					<span className="sr-only">Previous question</span>
				</button>

				<button
					type="button"
					onClick={isLastQuestion ? complete : advance}
					disabled={!canAdvance || isTransitioning}
					className="border-border bg-card text-muted-foreground hover:border-primary/30 hover:text-foreground flex h-8 w-8 items-center justify-center rounded-full border transition disabled:cursor-not-allowed disabled:opacity-25"
				>
					<ArrowRightIcon className="h-4 w-4" />
					<span className="sr-only">
						{isLastQuestion ? 'Finish' : 'Next question'}
					</span>
				</button>
			</div>

			<AnimatePresence mode="wait" custom={direction}>
				<motion.div
					key={currentStepIndexClamped}
					custom={direction}
					initial={{ opacity: 0, x: direction * 24 }}
					animate={{ opacity: 1, x: 0 }}
					exit={{ opacity: 0, x: direction * -24 }}
					transition={{ duration: 0.2, ease: 'easeInOut' }}
					className="min-h-[280px] space-y-4"
				>
					{children}
				</motion.div>
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
	freeForm,
}: {
	question: Question<TQuestionId, TDraft[TQuestionId]>
	answer: TDraft[TQuestionId] | null | undefined
	onSelect: (value: TDraft[TQuestionId] | undefined) => void
	disabled?: boolean | undefined
	freeForm?:
		| {
				isLastQuestion: boolean
				canAdvance: boolean
				onComplete?: (() => void) | undefined
				onSkip?: (() => void) | undefined
		  }
		| undefined
}) {
	switch (question.kind) {
		case 'single': {
			// Correlated-union boundary: TS cannot narrow the generic union between
			// `question`, `answer`, and `onSelect` across the Question kind.
			// Runtime shapes match the single-question contract.
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
			// oxlint-disable-next-line typescript/consistent-type-assertions
			const multiAnswer = (answer as string[] | null | undefined) ?? null
			return (
				<MultiSelectQuestionCard
					question={multiQuestion}
					answer={multiAnswer}
					onChange={(value) =>
						// oxlint-disable-next-line typescript/consistent-type-assertions
						onSelect(value as TDraft[TQuestionId] | undefined)
					}
					disabled={disabled}
				/>
			)
		}
		case 'freeForm': {
			if (!freeForm) return null
			// oxlint-disable-next-line typescript/consistent-type-assertions
			const freeFormQuestion = question as FreeFormQuestion<TQuestionId>
			// oxlint-disable-next-line typescript/consistent-type-assertions
			const freeFormAnswer = (answer as string | null | undefined) ?? null
			return (
				<>
					<QuestionPrompt title={question.title} />
					<FreeFormQuestionCard
						question={freeFormQuestion}
						value={freeFormAnswer}
						onChange={(value) =>
							// oxlint-disable-next-line typescript/consistent-type-assertions
							onSelect(value as TDraft[TQuestionId] | undefined)
						}
						{...freeForm}
					/>
				</>
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
	freeForm,
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
	freeForm?: {
		isSkippable: (questionId: TQuestionId) => boolean
		onSkip: (questionId: TQuestionId) => void
	}
}) {
	const {
		currentQuestionIndex,
		questionId,
		setCurrentQuestionIndex,
		isLastQuestion,
		answeredFlags,
		canAdvance,
		handleSelect,
	} = useQuestionFlow({
		questionIds,
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
					<StepProgressHeader
						stepNumber={stepNumber}
						totalSteps={totalSteps}
						title={title}
						items={answeredFlags}
						showTitle={false}
					/>
					{questionId ? (
						<QuestionFlow
							currentStepIndex={currentQuestionIndex}
							totalSteps={questionIds.length}
							canAdvance={canAdvance}
							isLastQuestion={isLastQuestion}
							onQuestionIndexChange={setCurrentQuestionIndex}
							onComplete={onComplete}
						>
							<QuizQuestionContent
								question={questions[questionId]}
								answer={state[questionId]}
								onSelect={(value) => handleSelect(questionId, value)}
								freeForm={
									freeForm
										? {
												isLastQuestion,
												canAdvance,
												onComplete,
												onSkip: freeForm.isSkippable(questionId)
													? () => {
															// Correlated-union boundary: dynamic key assignment into a generic Partial patch.
															// oxlint-disable-next-line typescript/consistent-type-assertions
															updateState({
																[questionId]: undefined,
															} as Partial<TDraft>)
															freeForm.onSkip(questionId)
														}
													: undefined,
											}
										: undefined
								}
							/>
						</QuestionFlow>
					) : null}
				</CardContent>
			</Card>
		</AnimatedStepCard>
	)
}
