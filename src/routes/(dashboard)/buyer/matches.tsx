import { createFileRoute, redirect } from '@tanstack/react-router'

import { ClientMatches } from '@/routes/(dashboard)/-components/client-matches'
import { loadBuyerProfile } from '@/lib/profile'

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
