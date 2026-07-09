import { useState, type ElementType, type ReactNode } from 'react'
import { Link, useRouterState } from '@tanstack/react-router'
import { HelpCircle, LogOut } from 'lucide-react'

import { authClient } from '@/lib/auth/client'
import { cn } from '@/lib/utils/ui'
import { Button } from '@/components/ui/button'
import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { Textarea } from '@/components/ui/textarea'
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarGroup,
	SidebarGroupContent,
	SidebarGroupLabel,
	SidebarHeader,
	SidebarInset,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarProvider,
} from '@/components/ui/sidebar'

// ============================================================
// Types
// ============================================================

export type SidebarItem = {
	label: string
	icon: ElementType
	href?: string
	external?: string
	onClick?: () => void
	badge?: string
	locked?: boolean
}

// ============================================================
// Layout shell
// ============================================================

export type DashboardShellProps = {
	sidebar: ReactNode
	children: ReactNode
}

export function DashboardShell({ sidebar, children }: DashboardShellProps) {
	return (
		<SidebarProvider>
			{sidebar}
			<SidebarInset className="overflow-x-hidden">
				<div className="flex min-h-dvh flex-col">
					<main className="flex w-full flex-1 flex-col overflow-x-hidden">
						{children}
					</main>
				</div>
			</SidebarInset>
		</SidebarProvider>
	)
}

export type DashboardSidebarProps = {
	items: SidebarItem[]
	profileLabel: string
	profileHint?: string
	aiItems?: SidebarItem[]
	userRole?: 'buyer' | 'seller' | 'agent'
}

export function DashboardSidebar({
	items,
	profileLabel,
	profileHint,
	aiItems = [],
	userRole = 'buyer',
}: DashboardSidebarProps) {
	const router = useRouterState()
	const currentPath = router.location.pathname
	const { data: session } = authClient.useSession()
	const isAuthenticated = Boolean(session)
	const [showSupport, setShowSupport] = useState(false)
	const profileName = session?.user.name?.trim() || profileLabel
	const profileEmail =
		session?.user.email || profileHint || 'Create a profile to save matches'
	const profileImage = session?.user.image
	const profileInitials = getInitials(session?.user.name, session?.user.email)
	const profileGradient = getProfileGradient(
		session?.user.email ?? session?.user.name,
	)

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

	const homeHref = isAuthenticated
		? userRole === 'seller'
			? '/seller/matches'
			: userRole === 'agent'
				? '/agent/introductions'
				: '/buyer/matches'
		: '/auth/login'

	const renderItem = (item: SidebarItem) => {
		const Icon = item.icon
		const active = item.href ? isActive(item.href) : false
		const isLocked = !isAuthenticated || item.locked

		return (
			<SidebarMenuItem key={item.label}>
				{isLocked ? (
					<SidebarMenuButton disabled>
						<Icon />
						<span className="truncate">{item.label}</span>
						{item.badge ? (
							<span className="ml-auto shrink-0 text-[10px] font-medium tracking-wider uppercase opacity-60">
								{item.badge}
							</span>
						) : null}
					</SidebarMenuButton>
				) : item.onClick ? (
					<SidebarMenuButton onClick={item.onClick}>
						<Icon />
						<span className="truncate">{item.label}</span>
						{item.badge ? (
							<span className="ml-auto shrink-0 text-[10px] font-medium tracking-wider uppercase opacity-60">
								{item.badge}
							</span>
						) : null}
					</SidebarMenuButton>
				) : item.href ? (
					<SidebarMenuButton asChild isActive={active}>
						<Link to={item.href}>
							<Icon />
							<span className="truncate">{item.label}</span>
							{item.badge ? (
								<span className="ml-auto shrink-0 text-[10px] font-medium tracking-wider uppercase opacity-60">
									{item.badge}
								</span>
							) : null}
						</Link>
					</SidebarMenuButton>
				) : (
					<SidebarMenuButton asChild>
						<a href={item.external} target="_blank" rel="noopener noreferrer">
							<Icon />
							<span className="truncate">{item.label}</span>
							{item.badge ? (
								<span className="ml-auto shrink-0 text-[10px] font-medium tracking-wider uppercase opacity-60">
									{item.badge}
								</span>
							) : null}
						</a>
					</SidebarMenuButton>
				)}
			</SidebarMenuItem>
		)
	}

	return (
		<>
			<Sidebar>
				<SidebarHeader className="px-2 py-2">
					<Link
						to={homeHref}
						className="hover:bg-sidebar-accent hover:text-sidebar-accent-foreground flex h-12 w-full items-center gap-2 overflow-hidden rounded-lg px-2.5 text-left text-sm transition-colors"
					>
						<div
							className={`flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-lg text-xs font-semibold text-white ${profileGradient}`}
						>
							{profileImage ? (
								<img
									src={profileImage}
									alt=""
									className="size-full object-cover"
								/>
							) : (
								profileInitials
							)}
						</div>
						<div className="min-w-0 flex-1 leading-tight">
							<div className="flex min-w-0 items-center gap-2">
								<span className="truncate font-medium">{profileName}</span>
							</div>
							<div className="text-muted-foreground truncate text-xs">
								{profileEmail}
							</div>
						</div>
					</Link>
				</SidebarHeader>
				<SidebarContent>
					<SidebarGroup>
						<SidebarGroupLabel>Menu</SidebarGroupLabel>
						<SidebarGroupContent>
							<SidebarMenu>{items.map(renderItem)}</SidebarMenu>
						</SidebarGroupContent>
					</SidebarGroup>

					{aiItems.length > 0 ? (
						<SidebarGroup>
							<SidebarGroupLabel>
								AI
								<span className="ml-1.5 rounded-full bg-sky-100 px-1.5 py-0.5 text-[9px] font-semibold tracking-wider text-sky-700 uppercase dark:bg-sky-950 dark:text-sky-300">
									beta
								</span>
							</SidebarGroupLabel>
							<SidebarGroupContent>
								<SidebarMenu>{aiItems.map(renderItem)}</SidebarMenu>
							</SidebarGroupContent>
						</SidebarGroup>
					) : null}
				</SidebarContent>

				<SidebarFooter className="gap-3">
					<SidebarMenu>
						<SidebarMenuItem>
							<SidebarMenuButton onClick={() => setShowSupport(true)}>
								<HelpCircle />
								<span>Support</span>
							</SidebarMenuButton>
						</SidebarMenuItem>
						{isAuthenticated ? (
							<SidebarMenuItem>
								<SidebarMenuButton onClick={() => void handleSignOut()}>
									<LogOut />
									<span>Sign out</span>
								</SidebarMenuButton>
							</SidebarMenuItem>
						) : null}
					</SidebarMenu>

					{!isAuthenticated ? (
						<div className="flex flex-col gap-2 px-2">
							<Button asChild className="w-full">
								<Link to="/signup/buyer/location">Create Profile</Link>
							</Button>
							<Button asChild variant="outline" className="w-full">
								<Link to="/auth/login">Log in</Link>
							</Button>
						</div>
					) : null}
				</SidebarFooter>
			</Sidebar>
			<SupportDialog open={showSupport} onOpenChange={setShowSupport} />
		</>
	)
}

function getInitials(name?: string | null, email?: string | null) {
	const source = name?.trim() || email?.split('@')[0] || 'PRE'
	return source
		.split(/\s+|[._-]/)
		.filter(Boolean)
		.slice(0, 2)
		.map((part) => part[0]?.toUpperCase() ?? '')
		.join('')
}

function getProfileGradient(seed?: string | null) {
	const gradients = [
		'bg-gradient-to-br from-emerald-500 to-teal-700',
		'bg-gradient-to-br from-indigo-500 to-violet-700',
		'bg-gradient-to-br from-rose-500 to-orange-600',
		'bg-gradient-to-br from-sky-500 to-blue-700',
		'bg-gradient-to-br from-amber-500 to-pink-600',
	]

	if (!seed) return gradients[0]

	const index = Array.from(seed).reduce(
		(total, char) => total + char.charCodeAt(0),
		0,
	)

	return gradients[index % gradients.length]
}

function SupportDialog({
	open,
	onOpenChange,
}: {
	open: boolean
	onOpenChange: (open: boolean) => void
}) {
	const supportEmail = 'hello@peaceofrealestate.com'

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Support</DialogTitle>
					<DialogDescription>
						Contact us directly or send a quick anonymous bug report.
					</DialogDescription>
				</DialogHeader>

				<div className="space-y-5">
					<div className="bg-muted/30 rounded-2xl border p-4">
						<p className="text-muted-foreground mb-2 text-sm">
							For account questions, match concerns, or anything that needs a
							human reply:
						</p>
						<a
							href={`mailto:${supportEmail}`}
							className="font-medium underline underline-offset-4"
						>
							{supportEmail}
						</a>
					</div>

					<div className="space-y-3">
						<div>
							<h3 className="text-sm font-medium">Anonymous bug report</h3>
							<p className="text-muted-foreground text-sm">
								Share what went wrong. No account details are required.
							</p>
						</div>
						<Input placeholder="Short bug summary" />
						<Textarea
							placeholder="What happened? Include steps to reproduce if you have them."
							className="min-h-32"
						/>
					</div>
				</div>

				<DialogFooter>
					<DialogClose asChild>
						<Button variant="outline">Close</Button>
					</DialogClose>
					<Button asChild>
						<a href={`mailto:${supportEmail}`}>Open email</a>
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	)
}

// ============================================================
// Page shell
// ============================================================

export type DashboardPageProps = {
	children: ReactNode
	className?: string
}

export function DashboardPage({ children, className }: DashboardPageProps) {
	return <div className={cn('w-full px-6 py-10', className)}>{children}</div>
}

export type DashboardPageMobileNavProps = {
	label: string
}

export function DashboardPageMobileNav({ label }: DashboardPageMobileNavProps) {
	return (
		<div className="mb-6 flex items-center gap-2 md:hidden">
			<SidebarTrigger />
			<span className="text-sm font-medium">{label}</span>
		</div>
	)
}

// ============================================================
// Shared dashboard widgets
// ============================================================
