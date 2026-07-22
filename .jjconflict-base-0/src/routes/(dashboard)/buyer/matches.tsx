import { createFileRoute, redirect } from '@tanstack/react-router'

import { loadBuyerProfile } from '@/lib/profile'
import { ClientMatches } from '@/routes/(dashboard)/-components/client-matches'

export const Route = createFileRoute('/(dashboard)/buyer/matches')({
	beforeLoad: async () => {
		const buyerProfile = await loadBuyerProfile()

		if (!buyerProfile) {
			throw redirect({ to: '/signup/buyer/location' })
		}
	},
	component: MatchesRoute,
})

function MatchesRoute() {
	return <ClientMatches clientRole="buyer" />
}
