import {
	ArrowsLeftRightIcon,
	MagnifyingGlassIcon,
	UsersIcon,
} from '@phosphor-icons/react'
import { createFileRoute, Outlet } from '@tanstack/react-router'

import {
	DashboardShell,
	DashboardSidebar,
	type SidebarItem,
} from '@/routes/(dashboard)/-components/dashboard'

export const Route = createFileRoute('/(dashboard)/seller')({
	component: SellerDashboardLayout,
})

const sellerItems: SidebarItem[] = [
	{ label: 'Matches', icon: UsersIcon, href: '/seller/matches' },
	{
		label: 'Introductions',
		icon: ArrowsLeftRightIcon,
		href: '/seller/introductions',
	},
	{
		label: 'Search Preferences',
		icon: MagnifyingGlassIcon,
		href: '/seller/search-preferences',
	},
]

function SellerDashboardLayout() {
	return (
		<DashboardShell
			sidebar={
				<DashboardSidebar
					items={sellerItems}
					aiItems={[]}
					userRole="seller"
					profileLabel="Your account"
					profileHint="Create a profile to save matches"
				/>
			}
		>
			<Outlet />
		</DashboardShell>
	)
}
