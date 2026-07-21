import { createFileRoute } from '@tanstack/react-router'

import type { BuyerDraft } from '@/lib/profile'
import { buyerQuestionIds, buyerQuestions } from '@/lib/profile'

import { PreferencesStep } from '../-components/quiz'
import { useSignupWizardContext } from '../-components/signup-shell'
import type { ClientSignupStep } from './route'

export const Route = createFileRoute(
	'/signup/(steps)/buyer/(step-3)/preferences',
)({
	component: BuyerPreferencesRoute,
})

function BuyerPreferencesRoute() {
	const { state, updateState, goToStep } = useSignupWizardContext<
		BuyerDraft,
		ClientSignupStep
	>()

	return (
		<PreferencesStep
			title="Preferences"
			stepNumber={3}
			totalSteps={3}
			stepKey="preferences"
			questionIds={buyerQuestionIds}
			questions={buyerQuestions}
			state={state}
			updateState={updateState}
			goToStep={goToStep}
			advanceOnSelect={(id) => buyerQuestions[id].kind === 'single'}
			onComplete={() => goToStep('preview')}
		/>
	)
}
