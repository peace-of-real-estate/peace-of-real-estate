import { useState } from 'react'

import type { QuestionRecord } from '@/lib/profile'

type AnswerableQuestion =
	| { kind: 'single' }
	| { kind: 'multi'; minSelections: number }

export function isQuestionAnswered(
	question: AnswerableQuestion,
	value: unknown,
): boolean {
	switch (question.kind) {
		case 'single':
			return value !== undefined && value !== null && value !== ''
		case 'multi':
			return Array.isArray(value)
				? value.length >= question.minSelections
				: question.minSelections === 0
	}
}

export function useQuestionFlow<
	TDraft extends Record<string, unknown>,
	TQuestionId extends keyof TDraft & string,
>({
	questionIds,
	questions,
	advanceOnSelect,
	isSkippable,
	state,
	updateState,
	onComplete,
}: {
	questionIds: readonly TQuestionId[]
	questions: QuestionRecord<Pick<TDraft, TQuestionId>>
	advanceOnSelect?: ((questionId: TQuestionId) => boolean) | undefined
	isSkippable?: ((questionId: TQuestionId) => boolean) | undefined
	state: Partial<TDraft>
	updateState: (patch: Partial<TDraft>) => void
	onComplete?: (() => void) | undefined
}) {
	const [currentQuestionIndex, setCurrentQuestionIndex] = useState(() =>
		getFirstUnansweredIndex(questionIds, questions, state),
	)
	const [direction, setDirection] = useState(1)

	const goToQuestion = (index: number) => {
		const clamped = Math.max(0, Math.min(index, questionIds.length - 1))
		setDirection(clamped < currentQuestionIndex ? -1 : 1)
		setCurrentQuestionIndex(clamped)
	}

	const questionId = questionIds[currentQuestionIndex]
	const isLastQuestion = currentQuestionIndex === questionIds.length - 1
	const canAdvance = questionId
		? isQuestionAnswered(questions[questionId], state[questionId]) ||
			Boolean(isSkippable?.(questionId))
		: false

	const handleSelect = (
		questionId: TQuestionId,
		value: TDraft[TQuestionId] | undefined,
	) => {
		const patch = { ...state }
		patch[questionId] = value
		updateState(patch)
		if (
			!questionId ||
			!isQuestionAnswered(questions[questionId], value) ||
			(advanceOnSelect && !advanceOnSelect(questionId))
		)
			return
		if (isLastQuestion) {
			onComplete?.()
		} else {
			goToQuestion(currentQuestionIndex + 1)
		}
	}

	return {
		currentQuestionIndex,
		questionId,
		direction,
		goToQuestion,
		isLastQuestion,
		canAdvance,
		handleSelect,
	}
}

function getFirstUnansweredIndex<
	TDraft extends Record<string, unknown>,
	TQuestionId extends keyof TDraft & string,
>(
	questionIds: readonly TQuestionId[],
	questions: QuestionRecord<Pick<TDraft, TQuestionId>>,
	state: Partial<TDraft>,
): number {
	const index = questionIds.findIndex(
		(id) => !isQuestionAnswered(questions[id], state[id]),
	)
	return index === -1 ? questionIds.length - 1 : index
}
