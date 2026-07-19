import { createFileRoute } from '@tanstack/react-router'

import type { AgentDraft } from '@/lib/profile'
import {
	agentWorkStyleQuestionIds,
	agentWorkStyleQuestions,
	notFitForQuestion,
} from '@/lib/profile'
import { PreferencesStep } from '../-components/quiz'
import { useSignupWizardContext } from '../-components/signup-shell'
import type { AgentFlowStep } from './route'

export const Route = createFileRoute(
	'/signup/(steps)/agent/(step-3)/preferences',
)({
	component: AgentPreferencesRoute,
})

function AgentPreferencesRoute() {
	const { state, updateState, goToStep } = useSignupWizardContext<
		AgentDraft,
		AgentFlowStep
	>()

	return (
		<PreferencesStep
			title="Preferences"
			stepNumber={3}
			totalSteps={5}
			stepKey="preferences"
			questionIds={agentWorkStyleQuestionIds}
			questions={agentWorkStyleQuestions}
			state={state}
			updateState={updateState}
			goToStep={goToStep}
			advanceOnSelect={(id) => agentWorkStyleQuestions[id].kind === 'single'}
			isSkippable={(id) => id === notFitForQuestion.id}
			onComplete={() => goToStep('compliance')}
			freeForm={{
				isSkippable: (id) => id === notFitForQuestion.id,
				onSkip: () => goToStep('compliance'),
			}}
		/>
	)
}
