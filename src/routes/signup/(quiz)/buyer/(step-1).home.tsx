import { createFileRoute } from '@tanstack/react-router'

import {
	ClientHomeFields,
	type ClientDraft,
	type ClientSignupStep,
} from '../-components/client-quiz-fields'
import { useSignupWizardContext } from '../-components/signup-wizard-shell'

export const Route = createFileRoute('/signup/(quiz)/buyer/(step-1)/home')({
	component: BuyerHomeRoute,
})

function BuyerHomeRoute() {
	const { state, updateState, goToStep } = useSignupWizardContext<
		ClientDraft,
		ClientSignupStep
	>()

	return (
		<ClientHomeFields
			state={state}
			priceLabel="Target price"
			onUpdate={updateState}
			onContinue={() => goToStep('preferences')}
		/>
	)
}
