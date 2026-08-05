import { useState } from 'react'

export function isAnswered(value: unknown): boolean {
	if (value === undefined || value === null) return false
	if (value === '') return false
	if (Array.isArray(value)) return value.length > 0
	return true
}

export function useQuestionFlow<
	TDraft extends Record<string, unknown>,
	TQuestionId extends keyof TDraft & string,
>({
	questionIds,
	advanceOnSelect,
	isSkippable,
	state,
	updateState,
	onComplete,
}: {
	questionIds: readonly TQuestionId[]
	advanceOnSelect?: ((questionId: TQuestionId) => boolean) | undefined
	isSkippable?: ((questionId: TQuestionId) => boolean) | undefined
	state: Partial<TDraft>
	updateState: (patch: Partial<TDraft>) => void
	onComplete?: (() => void) | undefined
}) {
	const [currentQuestionIndex, setCurrentQuestionIndex] = useState(() =>
		getFirstUnansweredIndex(questionIds, state),
	)

	const questionId = questionIds[currentQuestionIndex]
	const isLastQuestion = currentQuestionIndex === questionIds.length - 1
	const answeredFlags = questionIds.map((id) => isAnswered(state[id]))
	const canAdvance = questionId
		? isAnswered(state[questionId]) || Boolean(isSkippable?.(questionId))
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
			!isAnswered(value) ||
			(advanceOnSelect && !advanceOnSelect(questionId))
		)
			return
		if (isLastQuestion) {
			onComplete?.()
		} else {
			setCurrentQuestionIndex((index) => index + 1)
		}
	}

	return {
		currentQuestionIndex,
		questionId,
		setCurrentQuestionIndex,
		isLastQuestion,
		answeredFlags,
		canAdvance,
		handleSelect,
	}
}

function getFirstUnansweredIndex<TQuestionId extends string>(
	questionIds: readonly TQuestionId[],
	state: Partial<Record<TQuestionId, unknown>>,
): number {
	const index = questionIds.findIndex((id) => !isAnswered(state[id]))
	return index === -1 ? questionIds.length - 1 : index
}
