import { createFileRoute } from '@tanstack/react-router'

import { HomeStep } from '../-components/home-step'
import type { ClientSignupStep } from './route'

export const Route = createFileRoute('/signup/(steps)/seller/(step-1)/home')({
	component: SellerHomeRoute,
})

function SellerHomeRoute() {
	return (
		<HomeStep<ClientSignupStep>
			priceTitle="Estimated value"
			preferencesStep="preferences"
		/>
	)
}
