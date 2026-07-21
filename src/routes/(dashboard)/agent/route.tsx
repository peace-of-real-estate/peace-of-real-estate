import { ChatIcon } from '@phosphor-icons/react'
import { createFileRoute, Outlet } from '@tanstack/react-router'

import {
	DashboardShell,
	DashboardSidebar,
	type SidebarItem,
} from '@/routes/(dashboard)/-components/dashboard'

export const Route = createFileRoute('/(dashboard)/agent')({
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
