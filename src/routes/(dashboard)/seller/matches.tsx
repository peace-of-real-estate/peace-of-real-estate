import { createFileRoute, redirect } from '@tanstack/react-router'

import { seller } from '@/lib/profile/server'
import { ClientMatches } from '@/routes/(dashboard)/-components/client-matches'

export const Route = createFileRoute('/(dashboard)/seller/matches')({
	beforeLoad: async () => {
		const sellerProfile = await seller.loadProfile()

		if (!sellerProfile) {
			throw redirect({ to: '/signup/seller/location' })
		}
	},
	component: MatchesRoute,
})

function MatchesRoute() {
	return <ClientMatches clientRole="seller" />
}
