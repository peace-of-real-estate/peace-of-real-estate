import { createFileRoute } from '@tanstack/react-router'

import type { SellerDraft } from '@/lib/profile'
import { sellerQuestionIds, sellerQuestions } from '@/lib/profile'
import { PreferencesStep } from '../-components/quiz'
import { useSignupWizardContext } from '../-components/signup-shell'
import type { ClientSignupStep } from './route'

export const Route = createFileRoute(
	'/signup/(steps)/seller/(step-3)/preferences',
)({
	component: SellerPreferencesRoute,
})

function SellerPreferencesRoute() {
	const { state, updateState, goToStep } = useSignupWizardContext<
		SellerDraft,
		ClientSignupStep
	>()

	return (
		<PreferencesStep
			title="Preferences"
			stepNumber={3}
			totalSteps={3}
			stepKey="preferences"
			questionIds={sellerQuestionIds}
			questions={sellerQuestions}
			state={state}
			updateState={updateState}
			goToStep={goToStep}
			advanceOnSelect={(id) => sellerQuestions[id].kind === 'single'}
			onComplete={() => goToStep('preview')}
		/>
	)
}
