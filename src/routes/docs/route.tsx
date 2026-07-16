import {
	Link,
	Outlet,
	createFileRoute,
	useRouterState,
} from '@tanstack/react-router'

import {
	Sidebar,
	SidebarContent,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarProvider,
	SidebarInset,
	SidebarTrigger,
} from '@/components/ui/sidebar'
import { docsNav } from '@/routes/docs/-components/doc-ui'

export const Route = createFileRoute('/docs')({
	component: DocsLayout,
	head: () => ({
		meta: [{ title: 'Introductions — Spec & Plan · PRE docs' }],
	}),
})

function DocsLayout() {
	const currentPath = useRouterState().location.pathname

	return (
		<SidebarProvider>
			<Sidebar>
				<SidebarContent className="pt-4">
					<SidebarMenu>
						{docsNav.map((page) => (
							<SidebarMenuItem key={page.path}>
								<SidebarMenuButton asChild isActive={currentPath === page.path}>
									<Link to={page.path}>{page.title}</Link>
								</SidebarMenuButton>
							</SidebarMenuItem>
						))}
					</SidebarMenu>
				</SidebarContent>
			</Sidebar>
			<SidebarInset className="overflow-x-hidden">
				<div className="bg-background/90 sticky top-0 z-10 flex h-12 items-center gap-2 border-b px-4 backdrop-blur md:hidden">
					<SidebarTrigger />
					<span className="text-sm font-medium">Introductions docs</span>
				</div>
				<Outlet />
			</SidebarInset>
		</SidebarProvider>
	)
}
