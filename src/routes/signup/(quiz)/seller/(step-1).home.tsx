import { createFileRoute } from '@tanstack/react-router'

import {
	ClientHomeFields,
	type ClientDraft,
	type ClientSignupStep,
} from '../-components/client-quiz-fields'
import { useSignupWizardContext } from '../-components/signup-wizard-shell'

export const Route = createFileRoute('/signup/(quiz)/seller/(step-1)/home')({
	component: SellerHomeRoute,
})

function SellerHomeRoute() {
	const { state, updateState, goToStep } = useSignupWizardContext<
		ClientDraft,
		ClientSignupStep
	>()

	return (
		<ClientHomeFields
			state={state}
			priceLabel="Estimated value"
			onUpdate={updateState}
			onContinue={() => goToStep('preferences')}
		/>
	)
}
