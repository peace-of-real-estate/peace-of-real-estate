import { createFileRoute, Outlet } from '@tanstack/react-router'

import {
	DashboardShell,
	DashboardSidebar,
	type SidebarItem,
} from '@/routes/(dashboard)/-components/dashboard'
import {
	ArrowsLeftRightIcon,
	ChatIcon,
	MagnifyingGlassIcon,
	UsersIcon,
} from '@phosphor-icons/react'

export const Route = createFileRoute('/(dashboard)/buyer')({
	component: BuyerDashboardLayout,
})

const buyerItems: SidebarItem[] = [
	{ label: 'Matches', icon: UsersIcon, href: '/buyer/matches' },
	{
		label: 'Introductions',
		icon: ArrowsLeftRightIcon,
		href: '/buyer/introductions',
	},
	{
		label: 'Search Preferences',
		icon: MagnifyingGlassIcon,
		href: '/buyer/search-preferences',
	},
]

const buyerAiItems: SidebarItem[] = [
	{
		label: 'Practice Negotiating',
		icon: ChatIcon,
		href: '/buyer/practice-negotiating',
	},
]

function BuyerDashboardLayout() {
	return (
		<DashboardShell
			sidebar={
				<DashboardSidebar
					items={buyerItems}
					aiItems={buyerAiItems}
					userRole="buyer"
					profileLabel="Your account"
					profileHint="Create a profile to save matches"
				/>
			}
		>
			<Outlet />
		</DashboardShell>
	)
}
