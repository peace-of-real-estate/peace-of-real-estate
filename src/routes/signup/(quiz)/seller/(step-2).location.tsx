import { createFileRoute } from '@tanstack/react-router'

import {
	ClientLocationFields,
	type ClientDraft,
	type ClientSignupStep,
} from '../-components/client-quiz-fields'
import { useSignupWizardContext } from '../-components/signup-wizard-shell'

export const Route = createFileRoute('/signup/(quiz)/seller/(step-2)/location')(
	{
		component: SellerLocationRoute,
	},
)

function SellerLocationRoute() {
	const { state, updateState, goToStep } = useSignupWizardContext<
		ClientDraft,
		ClientSignupStep
	>()

	return (
		<ClientLocationFields
			state={state}
			onUpdate={updateState}
			onContinue={() => goToStep('home')}
		/>
	)
}
