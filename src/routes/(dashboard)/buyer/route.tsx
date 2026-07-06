import { createFileRoute, Outlet } from '@tanstack/react-router'
import { ArrowRightLeft, Search, Users } from 'lucide-react'

import {
	DashboardShell,
	DashboardSidebar,
	type SidebarItem,
} from '@/routes/(dashboard)/-components/dashboard'

export const Route = createFileRoute('/(dashboard)/buyer')({
	component: BuyerDashboardLayout,
})

const buyerItems: SidebarItem[] = [
	{ label: 'Matches', icon: Users, href: '/buyer/matches' },
	{
		label: 'Introductions',
		icon: ArrowRightLeft,
		href: '/buyer/introductions',
	},
	{
		label: 'Search Preferences',
		icon: Search,
		href: '/buyer/search-preferences',
	},
]

function BuyerDashboardLayout() {
	return (
		<DashboardShell
			sidebar={
				<DashboardSidebar
					items={buyerItems}
					profileLabel="Your account"
					profileHint="Create a profile to save matches"
				/>
			}
		>
			<Outlet />
		</DashboardShell>
	)
}
