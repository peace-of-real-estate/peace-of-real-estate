import { createFileRoute } from '@tanstack/react-router'

import { LocationStep } from '../-components/location-step'

export const Route = createFileRoute(
	'/signup/(steps)/seller/(step-2)/location',
)({
	component: SellerLocationRoute,
})

function SellerLocationRoute() {
	return <LocationStep />
}
