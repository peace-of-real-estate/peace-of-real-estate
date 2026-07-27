import { createFileRoute, redirect } from '@tanstack/react-router'

import { buyer } from '@/lib/profile'
import { ClientMatches } from '@/routes/(dashboard)/-components/client-matches'

export const Route = createFileRoute('/(dashboard)/buyer/matches')({
	beforeLoad: async () => {
		const buyerProfile = await buyer.loadProfile()

		if (!buyerProfile) {
			throw redirect({ to: '/signup/buyer/location' })
		}
	},
	component: MatchesRoute,
})

function MatchesRoute() {
	return <ClientMatches clientRole="buyer" />
}
