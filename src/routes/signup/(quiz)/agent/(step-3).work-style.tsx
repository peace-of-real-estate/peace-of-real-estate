import { ChartLineIcon } from '@phosphor-icons/react'
import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'

import {
	AnimatedStepCard,
	StepHeader,
	StepProgressHeader,
	useSignupWizardContext,
} from '../-components/signup-wizard-shell'
import { Card, CardContent } from '@/components/ui/card'
import type { AgentDraft } from '@/lib/matching/profile'
import {
	agentAnswerLabels,
	type AnswerValue,
	type Question,
} from '@/lib/matching/questions'
import { QuestionFlow } from '../-components/client-quiz-fields'
import type { AgentFlowStep } from './route'

export const Route = createFileRoute(
	'/signup/(quiz)/agent/(step-3)/work-style',
)({
	component: AgentWorkStyleRoute,
})

const agentQuestions = Object.entries(agentAnswerLabels).map(
	([id, config]) =>
		({
			id,
			title: config.title,
			options: config.options,
			multiple: config.multiple,
		}) satisfies Question,
)

const notFitForQuestion: Question = {
	id: 'notFitFor',
	title: 'Who are you NOT the right fit for?',
	options: {},
	freeForm: true,
	allowSkip: true,
}

const questions = [...agentQuestions, notFitForQuestion]

function AgentWorkStyleRoute() {
	const { state, updateState, goToStep } = useSignupWizardContext<
		AgentDraft,
		AgentFlowStep
	>()

	return (
		<AgentWorkStyle
			state={state}
			onUpdate={updateState}
			onContinue={() => goToStep('compliance')}
		/>
	)
}

function AgentWorkStyle({
	state,
	onUpdate,
	onContinue,
}: {
	state: AgentDraft
	onUpdate: (patch: Partial<AgentDraft>) => void
	onContinue: () => void
}) {
	const initialAnswers = extractAnswers(state, questions)
	const [answers, setAnswers] = useState(initialAnswers)
	const [currentQuestionIndex, setCurrentQuestionIndex] = useState(() =>
		getNextUnansweredQuestionIndex(questions, answers),
	)
	const completedCount = agentQuestions.filter(
		(q) => answers[q.id] !== undefined && answers[q.id] !== null,
	).length
	const allComplete = completedCount === agentQuestions.length

	const handleAnswersChange = (nextAnswers: Record<string, AnswerValue>) => {
		setAnswers(nextAnswers)
		onUpdate(answersToProfileUpdate(nextAnswers, questions))
	}

	const handleComplete = () => {
		if (!allComplete) return
		onUpdate(answersToProfileUpdate(answers, questions))
		onContinue()
	}

	return (
		<AnimatedStepCard stepKey="workStyle">
			<Card size="sm" className="shadow-sm">
				<CardContent className="space-y-6">
					<StepHeader
						stepNumber={3}
						totalSteps={6}
						title="Work Style"
						icon={ChartLineIcon}
					/>

					<StepProgressHeader
						stepNumber={3}
						totalSteps={6}
						title="Work Style"
						activeIndex={currentQuestionIndex}
						items={questions.map(
							(q) => answers[q.id] !== undefined && answers[q.id] !== null,
						)}
						showTitle={false}
					/>

					<QuestionFlow
						questions={questions}
						answers={answers}
						currentQuestionIndex={currentQuestionIndex}
						onAnswersChange={handleAnswersChange}
						onQuestionIndexChange={setCurrentQuestionIndex}
						onComplete={handleComplete}
					/>
				</CardContent>
			</Card>
		</AnimatedStepCard>
	)
}

function extractAnswers(
	draft: AgentDraft,
	questionList: Question[],
): Record<string, AnswerValue> {
	const result: Record<string, AnswerValue> = {}
	for (const question of questionList) {
		const value = draft[question.id as keyof AgentDraft]
		if (value !== undefined && value !== null)
			result[question.id] = value as AnswerValue
	}
	return result
}

function answersToProfileUpdate(
	answerMap: Record<string, AnswerValue>,
	questionList: Question[],
): Partial<AgentDraft> {
	const update: Partial<AgentDraft> = {}
	for (const question of questionList) {
		const value = answerMap[question.id]
		if (value !== undefined && value !== null)
			update[question.id as keyof AgentDraft] = value as never
	}
	return update
}

function getNextUnansweredQuestionIndex(
	questionList: Question[],
	answerMap: Record<string, AnswerValue>,
) {
	const nextIndex = questionList.findIndex((q) => answerMap[q.id] === undefined)
	return nextIndex === -1 ? Math.max(questionList.length - 1, 0) : nextIndex
}
