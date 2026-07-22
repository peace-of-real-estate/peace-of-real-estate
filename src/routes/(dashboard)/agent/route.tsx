import { ChatIcon } from '@phosphor-icons/react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { createFileRoute, Outlet } from '@tanstack/react-router'
import { useServerFn } from '@tanstack/react-start'
import { useEffect } from 'react'

import { getPendingIntroCount } from '@/lib/introductions/server'
import { agentPendingIntroCountQueryKey } from '@/routes/(dashboard)/-components/agent-introductions'
import {
	DashboardShell,
	DashboardSidebar,
	type SidebarItem,
} from '@/routes/(dashboard)/-components/dashboard'

export const Route = createFileRoute('/(dashboard)/agent')({
	component: AgentDashboardLayout,
})

const PENDING_COUNT_REFETCH_INTERVAL_MS = 45_000

function AgentDashboardLayout() {
	const pendingCountFn = useServerFn(getPendingIntroCount)
	const queryClient = useQueryClient()
	const { data: pendingCount = 0 } = useQuery({
		queryKey: agentPendingIntroCountQueryKey,
		queryFn: () => pendingCountFn(),
		refetchInterval: PENDING_COUNT_REFETCH_INTERVAL_MS,
	})
	useEffect(() => {
		void queryClient.invalidateQueries({ queryKey: ['agent-introductions'] })
	}, [pendingCount, queryClient])

	const agentItems: SidebarItem[] = [
		{
			label: 'Introductions',
			icon: ChatIcon,
			href: '/agent/introductions',
			...(pendingCount > 0 ? { badge: String(pendingCount) } : {}),
		},
	]

	return (
		<DashboardShell
			sidebar={
				<DashboardSidebar
					items={agentItems}
					aiItems={[]}
					userRole="agent"
					profileLabel="Agent dashboard"
					profileHint="Agent dashboard"
				/>
			}
		>
			<Outlet />
		</DashboardShell>
	)
}
