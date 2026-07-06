import { createFileRoute, Outlet } from '@tanstack/react-router'
import { MessageSquare } from 'lucide-react'

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
		icon: MessageSquare,
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
					profileLabel="Agent dashboard"
					profileHint="Agent dashboard"
				/>
			}
		>
			<Outlet />
		</DashboardShell>
	)
}
