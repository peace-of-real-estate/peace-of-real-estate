import {
	ArrowsLeftRightIcon,
	ChatCircleIcon,
	ChartBarIcon,
	ShieldCheckIcon,
	SignOutIcon,
	UsersIcon,
} from '@phosphor-icons/react'
import { Link, useRouterState } from '@tanstack/react-router'

import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarGroup,
	SidebarGroupContent,
	SidebarGroupLabel,
	SidebarHeader,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
} from '@/components/ui/sidebar'
import { authClient } from '@/lib/auth/client'

const adminNavItems = [
	{ label: 'Matches', to: '/admin/matches', icon: ChartBarIcon },
	{ label: 'Users', to: '/admin/users', icon: UsersIcon },
	{ label: 'Role Switch', to: '/admin/role-switch', icon: ArrowsLeftRightIcon },
	{ label: 'Invitations', to: '/admin/invitations', icon: ChatCircleIcon },
] as const

export function AdminSidebar() {
	const router = useRouterState()
	const currentPath = router.location.pathname
	const isActive = (path: string) =>
		currentPath === path || currentPath.startsWith(`${path}/`)

	const handleSignOut = async () => {
		await authClient.signOut({
			fetchOptions: {
				onSuccess: () => {
					window.location.assign('/')
				},
			},
		})
	}

	return (
		<Sidebar>
			<SidebarHeader className="px-2 py-2">
				<Link
					to="/"
					className="hover:bg-sidebar-accent hover:text-sidebar-accent-foreground flex h-12 w-full items-center gap-2 overflow-hidden rounded-lg px-2.5 text-left text-sm transition-colors"
				>
					<img src="/logomark-theme.svg" alt="" className="h-6 w-auto" />
					<span className="font-heading flex items-center gap-1.5 font-semibold">
						<ShieldCheckIcon className="h-4 w-4" />
						Admin
					</span>
				</Link>
			</SidebarHeader>
			<SidebarContent>
				<SidebarGroup>
					<SidebarGroupLabel>Admin Tools</SidebarGroupLabel>
					<SidebarGroupContent>
						<SidebarMenu>
							{adminNavItems.map((item) => (
								<SidebarMenuItem key={item.to}>
									<SidebarMenuButton asChild isActive={isActive(item.to)}>
										<Link to={item.to}>
											<item.icon />
											<span className="truncate">{item.label}</span>
										</Link>
									</SidebarMenuButton>
								</SidebarMenuItem>
							))}
						</SidebarMenu>
					</SidebarGroupContent>
				</SidebarGroup>
			</SidebarContent>
			<SidebarFooter className="gap-1">
				<SidebarMenu>
					<SidebarMenuItem>
						<SidebarMenuButton asChild>
							<Link to="/">
								<ArrowsLeftRightIcon />
								<span>Back to app</span>
							</Link>
						</SidebarMenuButton>
					</SidebarMenuItem>
					<SidebarMenuItem>
						<SidebarMenuButton onClick={() => void handleSignOut()}>
							<SignOutIcon />
							<span>Sign out</span>
						</SidebarMenuButton>
					</SidebarMenuItem>
				</SidebarMenu>
			</SidebarFooter>
		</Sidebar>
	)
}
