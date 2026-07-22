import { BriefcaseIcon, HouseIcon, TagIcon } from '@phosphor-icons/react'
import { createFileRoute, Link, redirect } from '@tanstack/react-router'

import { Card, CardContent } from '@/components/ui/card'
import { redirectUnauthenticatedUsers } from '@/lib/auth/redirects'
import { loadExistingProfileRoles } from '@/lib/profile'
import {
	dashboardPaths,
	resolveDashboardTarget,
	type ProfileRole,
} from '@/lib/profile/types'

export const Route = createFileRoute('/choose-role')({
	beforeLoad: async () => {
		await redirectUnauthenticatedUsers({ redirectTo: '/choose-role' })
		const roles = await loadExistingProfileRoles()
		const target = resolveDashboardTarget(roles)
		if (target !== '/choose-role') {
			throw redirect({ to: target })
		}
		return { roles }
	},
	component: ChooseRolePage,
})

const roleOptions: readonly {
	role: ProfileRole
	label: string
	description: string
	icon: typeof BriefcaseIcon
}[] = [
	{
		role: 'agent',
		label: 'Agent',
		description: 'See your client introductions',
		icon: BriefcaseIcon,
	},
	{
		role: 'buyer',
		label: 'Buying',
		description: 'See your matched agents',
		icon: HouseIcon,
	},
	{
		role: 'seller',
		label: 'Selling',
		description: 'See your matched agents',
		icon: TagIcon,
	},
]

function ChooseRolePage() {
	const { roles } = Route.useRouteContext()
	const options = roleOptions.filter((o) => roles.includes(o.role))

	return (
		<div className="bg-background flex min-h-dvh items-center justify-center px-6 py-12">
			<Card className="w-full max-w-md shadow-sm">
				<CardContent className="flex flex-col gap-5 p-8">
					<div className="text-center">
						<h1 className="font-heading text-2xl tracking-tight">Where to?</h1>
						<p className="text-muted-foreground mt-2 text-sm">
							You have more than one profile. Pick a dashboard.
						</p>
					</div>
					<div className="flex flex-col gap-3">
						{options.map(({ role, label, description, icon: Icon }) => (
							<Link
								key={role}
								to={dashboardPaths[role]}
								className="hover:border-primary/50 hover:bg-muted/50 flex items-center gap-3 rounded-md border px-4 py-3 transition-colors"
							>
								<Icon className="text-brand size-5 shrink-0" weight="duotone" />
								<span className="flex flex-col">
									<span className="text-sm font-semibold">{label}</span>
									<span className="text-muted-foreground text-xs">
										{description}
									</span>
								</span>
							</Link>
						))}
					</div>
				</CardContent>
			</Card>
		</div>
	)
}
