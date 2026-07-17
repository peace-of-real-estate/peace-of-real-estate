import { createFileRoute } from '@tanstack/react-router'

import { HomeStep } from '../-components/home-step'
import type { ClientSignupStep } from './route'

export const Route = createFileRoute('/signup/(steps)/buyer/(step-1)/home')({
	component: BuyerHomeRoute,
})

function BuyerHomeRoute() {
	return (
		<HomeStep<ClientSignupStep>
			priceTitle="Target price"
			preferencesStep="preferences"
		/>
	)
}
