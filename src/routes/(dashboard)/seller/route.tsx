import { createFileRoute, Outlet } from '@tanstack/react-router'
import { ArrowRightLeft, Search, Users } from 'lucide-react'

import {
	DashboardShell,
	DashboardSidebar,
	type SidebarItem,
} from '@/routes/(dashboard)/-components/dashboard'

export const Route = createFileRoute('/(dashboard)/seller')({
	component: SellerDashboardLayout,
})

const sellerItems: SidebarItem[] = [
	{ label: 'Matches', icon: Users, href: '/seller/matches' },
	{
		label: 'Introductions',
		icon: ArrowRightLeft,
		href: '/seller/introductions',
	},
	{
		label: 'Search Preferences',
		icon: Search,
		href: '/seller/search-preferences',
	},
]

function SellerDashboardLayout() {
	return (
		<DashboardShell
			sidebar={
				<DashboardSidebar
					items={sellerItems}
					profileLabel="Your account"
					profileHint="Create a profile to save matches"
				/>
			}
		>
			<Outlet />
		</DashboardShell>
	)
}
