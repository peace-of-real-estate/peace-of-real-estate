import { createFileRoute } from '@tanstack/react-router'

import {
	ClientPreferencesFields,
	type ClientDraft,
	type ClientSignupStep,
} from '../-components/client-quiz-fields'
import { useSignupWizardContext } from '../-components/signup-wizard-shell'

export const Route = createFileRoute(
	'/signup/(quiz)/buyer/(step-3)/preferences',
)({
	component: BuyerPreferencesRoute,
})

function BuyerPreferencesRoute() {
	const { state, updateState, goToStep } = useSignupWizardContext<
		ClientDraft,
		ClientSignupStep
	>()

	return (
		<ClientPreferencesFields
			state={state}
			onUpdate={updateState}
			onComplete={() => goToStep('preview')}
		/>
	)
}
