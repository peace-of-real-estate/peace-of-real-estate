import { createFileRoute, notFound, useNavigate } from '@tanstack/react-router'
import { z } from 'zod'

import { clientEnv } from '@/env'
import { redirectUnauthenticatedUsers } from '@/lib/auth/functions'
import { loadDebugClientOptions, loadDebugMatches } from '@/lib/matching/debug'
import { DebugMatchesPage } from '@/routes/debug/-components/debug-matches-page'

const debugMatchesSearchSchema = z.object({
	clientId: z.string().optional(),
	side: z.enum(['buying', 'selling']).optional(),
	agent: z.string().optional(),
	compare: z.string().optional(),
})

export const Route = createFileRoute('/debug/matches')({
	validateSearch: debugMatchesSearchSchema,
	beforeLoad: async () => {
		if (clientEnv.VITE_MATCH_DEBUG !== 'true') {
			throw notFound()
		}

		await redirectUnauthenticatedUsers({ redirectTo: '/debug/matches' })
	},
	component: DebugMatchesRoute,
})

function DebugMatchesRoute() {
	const search = Route.useSearch()
	const navigate = useNavigate({ from: '/debug/matches' })

	return (
		<DebugMatchesPage
			clientId={search.clientId}
			side={search.side}
			selectedAgentId={search.agent}
			compareAgentId={search.compare}
			onSelectClient={(clientId, side) =>
				navigate({
					search: (prev) => ({
						...prev,
						clientId,
						side,
						agent: undefined,
						compare: undefined,
					}),
				})
			}
			onSelectAgent={(agentId) =>
				navigate({
					search: (prev) => ({ ...prev, agent: agentId }),
					replace: true,
				})
			}
			onSetCompare={(agentId) =>
				navigate({
					search: (prev) => ({ ...prev, compare: agentId }),
					replace: true,
				})
			}
			loadDebugClientOptions={() => loadDebugClientOptions()}
			loadDebugMatches={(input) => loadDebugMatches({ data: input })}
		/>
	)
}
