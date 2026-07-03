import { UserIcon } from '@phosphor-icons/react'
import { useState } from 'react'

import { AnimatedStepCard } from '@/components/signup/shared'
import { ConsumerQuestionFlow } from '@/components/signup/question-flow'
import {
	questionOptionLabel,
	consumerAnswerLabels,
	type AnswerValue,
	type Question,
} from '@/components/signup/questions'
import { Card, CardContent } from '@/components/ui/card'
import type { ConsumerDraft } from '@/lib/matching/profile'
import { StepHeader } from '@/components/signup/step-header'
import { StepProgressHeader } from '@/components/signup/shared'
import type { ConsumerProfileUpdate } from '@/lib/matching/profile'

const consumerQuizFields = [
	'preferredContactMethod',
	'involvementLevel',
	'representationPreference',
	'commissionComfort',
	'experienceLevel',
] as const satisfies readonly (keyof ConsumerDraft)[]

const consumerQuestions = Object.entries(consumerAnswerLabels).map(
	([id, config]) => ({
		id,
		title: config.title,
		options: config.options,
	}),
) satisfies Question[]

const consumerQuestionList: Question[] = [...consumerQuestions]

export function isConsumerQuizComplete(state: ConsumerDraft): boolean {
	return consumerQuizFields.every((field) => state[field] !== undefined)
}

export function ConsumerQuiz({
	state,
	onUpdate,
	onComplete,
}: {
	state: ConsumerDraft
	onUpdate: (patch: Partial<ConsumerDraft>) => void
	onComplete: () => void
}) {
	const answers = extractAnswers(state)
	const [currentQuestionIndex, setCurrentQuestionIndex] = useState(() =>
		getNextUnansweredQuestionIndex(consumerQuestionList, answers),
	)

	return (
		<AnimatedStepCard stepKey="quiz">
			<Card size="sm" className="shadow-sm">
				<CardContent className="space-y-6">
					<StepHeader
						stepNumber={4}
						totalSteps={4}
						title="Preferences"
						icon={UserIcon}
					/>
					<StepProgressHeader
						stepNumber={4}
						totalSteps={4}
						title="Preferences"
						activeIndex={currentQuestionIndex}
						items={consumerQuestions.map(
							(q) => answers[q.id] !== undefined && answers[q.id] !== null,
						)}
						showTitle={false}
					/>
					<ConsumerQuestionFlow
						questions={consumerQuestionList}
						answers={answers}
						currentQuestionIndex={currentQuestionIndex}
						onAnswersChange={(nextAnswers) =>
							onUpdate(answersToProfileUpdate(nextAnswers))
						}
						onQuestionIndexChange={setCurrentQuestionIndex}
						onComplete={onComplete}
					/>
				</CardContent>
			</Card>
		</AnimatedStepCard>
	)
}

function getNextUnansweredQuestionIndex(
	questions: Question[],
	answers: Record<string, AnswerValue>,
) {
	const nextIndex = questions.findIndex((q) => answers[q.id] === undefined)

	return nextIndex === -1 ? Math.max(questions.length - 1, 0) : nextIndex
}

function extractAnswers(draft: ConsumerDraft): Record<string, AnswerValue> {
	const answers: Record<string, AnswerValue> = {}
	for (const question of consumerQuestionList) {
		const value = draft[question.id as keyof ConsumerProfileUpdate]
		if (value !== undefined && value !== null) {
			answers[question.id] = value as AnswerValue
		}
	}
	return answers
}

function answersToProfileUpdate(
	answers: Record<string, AnswerValue>,
): Partial<ConsumerDraft> {
	const update: Partial<ConsumerDraft> = {}
	for (const question of consumerQuestionList) {
		const value = answers[question.id]
		if (value !== undefined && value !== null) {
			update[question.id as keyof ConsumerDraft] = value as never
		}
	}
	return update
}

export function getAnswerLabel(question: Question, value: AnswerValue): string {
	if (value === undefined || value === null) return 'Not answered'
	if (question.freeForm && typeof value === 'string') {
		return value.trim() || 'Not answered'
	}
	if (Array.isArray(value)) {
		return value
			.map((slug) => questionOptionLabel(question, slug))
			.filter(Boolean)
			.join(', ')
	}
	return questionOptionLabel(question, value)
}
