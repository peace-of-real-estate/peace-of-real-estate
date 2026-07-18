import { createFileRoute } from '@tanstack/react-router'

import { ClientMatches } from '@/routes/(dashboard)/-components/client-matches'

export const Route = createFileRoute('/(dashboard)/buyer/matches')({
	component: MatchesRoute,
})

function MatchesRoute() {
	return <ClientMatches clientRole="buyer" />
}
