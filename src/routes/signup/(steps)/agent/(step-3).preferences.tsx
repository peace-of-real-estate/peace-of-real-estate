import { createFileRoute } from '@tanstack/react-router'

import type { AgentDraft } from '@/lib/profile'
import { agentQuestionIds, agentQuestions } from '@/lib/profile'

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
			totalSteps={3}
			stepKey="preferences"
			questionIds={agentQuestionIds}
			questions={agentQuestions}
			state={state}
			updateState={updateState}
			goToStep={goToStep}
			advanceOnSelect={(id) => agentQuestions[id].kind === 'single'}
			onComplete={() => goToStep('preview')}
		/>
	)
}
