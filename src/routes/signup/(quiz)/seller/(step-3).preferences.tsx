import { createFileRoute } from '@tanstack/react-router'

import {
	ClientPreferencesFields,
	type ClientDraft,
	type ClientSignupStep,
} from '../-components/client-quiz-fields'
import { useSignupWizardContext } from '../-components/signup-wizard-shell'

export const Route = createFileRoute(
	'/signup/(quiz)/seller/(step-3)/preferences',
)({
	component: SellerPreferencesRoute,
})

function SellerPreferencesRoute() {
	const { state, updateState, goToStep } = useSignupWizardContext<
		ClientDraft,
		ClientSignupStep
	>()

	return (
		<ClientPreferencesFields
			state={state}
			onUpdate={updateState}
			onComplete={() => goToStep('preview')}
			clientRole="seller"
		/>
	)
}
