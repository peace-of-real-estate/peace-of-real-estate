import { createFileRoute } from '@tanstack/react-router'

import { LocationStep } from '../-components/location-step'

export const Route = createFileRoute('/signup/(steps)/buyer/(step-2)/location')(
	{
		component: BuyerLocationRoute,
	},
)

function BuyerLocationRoute() {
	return <LocationStep />
}
