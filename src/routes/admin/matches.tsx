import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { z } from 'zod'

import { loadDebugClientOptions, loadDebugMatches } from '@/lib/matching/debug'
import { DebugMatchesPage } from '@/routes/admin/-components/debug-matches-page'

const debugMatchesSearchSchema = z.object({
	clientId: z.string().optional(),
	side: z.enum(['buyer', 'seller']).optional(),
	agent: z.string().optional(),
	compare: z.string().optional(),
})

export const Route = createFileRoute('/admin/matches')({
	validateSearch: debugMatchesSearchSchema,
	component: DebugMatchesRoute,
})

function DebugMatchesRoute() {
	const search = Route.useSearch()
	const navigate = useNavigate({ from: '/admin/matches' })

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
