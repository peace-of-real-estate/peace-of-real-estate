import { createFileRoute, Outlet } from '@tanstack/react-router'

import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { redirectNonAdminUsers } from '@/lib/auth/redirects'

import { AdminSidebar } from './-components/admin-sidebar'

export const Route = createFileRoute('/admin')({
	beforeLoad: async ({ location }) => {
		await redirectNonAdminUsers({ redirectTo: location.pathname })
	},
	component: AdminLayout,
})

function AdminLayout() {
	return (
		<SidebarProvider>
			<AdminSidebar />
			<SidebarInset>
				<Outlet />
			</SidebarInset>
		</SidebarProvider>
	)
}
