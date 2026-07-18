import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'

import {
	DashboardShell,
	DashboardSidebar,
	type SidebarItem,
} from '@/routes/(dashboard)/-components/dashboard'
import { redirectUnauthenticatedUsers } from '@/lib/auth/functions'
import { loadAgentProfile } from '@/lib/profile'
import { ChatIcon } from '@phosphor-icons/react'

export const Route = createFileRoute('/(dashboard)/agent')({
	beforeLoad: async ({ location }) => {
		await redirectUnauthenticatedUsers({ redirectTo: location.pathname })

		if (!(await loadAgentProfile())) {
			throw redirect({ to: '/signup/agent' })
		}
	},
	component: AgentDashboardLayout,
})

const agentItems: SidebarItem[] = [
	{
		label: 'Introductions',
		icon: ChatIcon,
		href: '/agent/introductions',
	},
]

function AgentDashboardLayout() {
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
