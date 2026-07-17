import { useState, type ElementType, type ReactNode } from 'react'
import { Link, useRouterState } from '@tanstack/react-router'

import { authClient } from '@/lib/auth/client'
import { SUPPORT_EMAIL } from '@/lib/constants'
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
import { QuestionIcon, SignOutIcon } from '@phosphor-icons/react'

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
							<span className="ml-auto shrink-0 text-xs font-medium tracking-wider uppercase opacity-60">
								{item.badge}
							</span>
						) : null}
					</SidebarMenuButton>
				) : item.onClick ? (
					<SidebarMenuButton onClick={item.onClick}>
						<Icon />
						<span className="truncate">{item.label}</span>
						{item.badge ? (
							<span className="ml-auto shrink-0 text-xs font-medium tracking-wider uppercase opacity-60">
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
								<span className="ml-auto shrink-0 text-xs font-medium tracking-wider uppercase opacity-60">
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
								<span className="ml-auto shrink-0 text-xs font-medium tracking-wider uppercase opacity-60">
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
						<div className="bg-primary text-primary-foreground flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-md text-xs font-semibold">
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
								<span className="bg-sky-tint text-brand ml-1.5 rounded-sm px-1.5 py-0.5 text-xs font-semibold tracking-wider uppercase">
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
								<QuestionIcon />
								<span>Support</span>
							</SidebarMenuButton>
						</SidebarMenuItem>
						{isAuthenticated ? (
							<SidebarMenuItem>
								<SidebarMenuButton onClick={() => void handleSignOut()}>
									<SignOutIcon />
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

function SupportDialog({
	open,
	onOpenChange,
}: {
	open: boolean
	onOpenChange: (open: boolean) => void
}) {
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
					<div className="bg-muted/30 rounded-lg border p-4">
						<p className="text-muted-foreground mb-2 text-sm">
							For account questions, match concerns, or anything that needs a
							human reply:
						</p>
						<a
							href={`mailto:${SUPPORT_EMAIL}`}
							className="font-medium underline underline-offset-4"
						>
							{SUPPORT_EMAIL}
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
						<a href={`mailto:${SUPPORT_EMAIL}`}>Open email</a>
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
