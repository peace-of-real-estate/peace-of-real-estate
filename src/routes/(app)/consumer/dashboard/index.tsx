import { createFileRoute, Link } from '@tanstack/react-router'
import {
	Crown,
	ExternalLink,
	LogOut,
	Mail,
	Search,
	Shield,
	Trash2,
	User,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from '@/components/ui/card'
import { DashboardPage, DashboardPageMobileNav } from '@/components/dashboard'
import { authClient } from '@/lib/auth/client'
import { loadConsumerProfile } from '@/lib/matching/profile'
import {
	formatPriceRange,
	parsePriceRange,
} from '@/components/signup/price-range'

export const Route = createFileRoute('/(app)/consumer/dashboard/')({
	component: ConsumerDashboard,
	loader: () => loadConsumerProfile(),
})

function ConsumerDashboard() {
	const consumerProfile = Route.useLoaderData()
	const { data: session } = authClient.useSession()

	const initials = getInitials(session?.user.name, session?.user.email)
	const searchSnapshot = [
		{
			label: 'Location',
			value:
				consumerProfile?.city && consumerProfile?.state
					? `${consumerProfile.city}, ${consumerProfile.state}`
					: (consumerProfile?.city ?? consumerProfile?.state),
		},
		{ label: 'Intent', value: consumerProfile?.intent },
		{
			label: 'Budget',
			value: consumerProfile?.priceRange
				? formatPriceRange(parsePriceRange(consumerProfile.priceRange))
				: undefined,
		},
		{
			label: 'Property Types',
			value: consumerProfile?.propertyTypes?.join(', '),
		},
	]

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
		<DashboardPage>
			<DashboardPageMobileNav label="Account menu" />
			<div className="mx-auto w-full max-w-4xl space-y-6">
				<div className="mb-8 flex items-center gap-4">
					<div className="bg-primary text-primary-foreground flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl text-base font-semibold">
						{session?.user.image ? (
							<img
								src={session.user.image}
								alt=""
								className="size-full object-cover"
							/>
						) : (
							initials
						)}
					</div>
					<div className="min-w-0">
						<p className="text-muted-foreground text-sm font-medium">Account</p>
						<h1 className="font-heading truncate text-3xl font-semibold tracking-tight">
							{session?.user.name ?? 'Your account'}
						</h1>
						<p className="text-muted-foreground mt-1 truncate text-sm">
							{session?.user.email ?? 'No email on file'}
						</p>
					</div>
				</div>

				<div className="grid gap-5">
					<Card>
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<User className="size-4" />
								Account Details
							</CardTitle>
							<CardDescription>
								Your login identity and account-level information.
							</CardDescription>
						</CardHeader>
						<CardContent className="grid gap-4 text-sm sm:grid-cols-2">
							<Detail label="Name" value={session?.user.name} />
							<Detail label="Email" value={session?.user.email} icon={Mail} />
							<Detail label="Tier" value="Free" icon={Crown} />
							<Detail
								label="Login Method"
								value="Google or email"
								icon={Shield}
							/>
						</CardContent>
					</Card>

					<Card>
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<Search className="size-4" />
								Search Snapshot
							</CardTitle>
							<CardDescription>
								Readonly summary of the preferences used to tune matches.
							</CardDescription>
						</CardHeader>
						<CardContent className="grid gap-4 text-sm sm:grid-cols-2">
							{searchSnapshot.map((item) => (
								<Detail
									key={item.label}
									label={item.label}
									value={item.value}
								/>
							))}
						</CardContent>
						<CardFooter className="border-t">
							<Button asChild variant="outline" size="sm">
								<Link to="/consumer/dashboard/search-preferences">
									Edit search preferences
									<ExternalLink className="size-3.5" />
								</Link>
							</Button>
						</CardFooter>
					</Card>

					<Card>
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<Crown className="size-4" />
								Plan
							</CardTitle>
							<CardDescription>
								Your current access level for matches and introductions.
							</CardDescription>
						</CardHeader>
						<CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
							<div>
								<div className="text-2xl font-semibold">Free</div>
								<p className="text-muted-foreground mt-1 text-sm">
									Dashboard access is free while PRE is in beta.
								</p>
							</div>
						</CardContent>
					</Card>

					<Card>
						<CardHeader>
							<CardTitle>Account Actions</CardTitle>
							<CardDescription>
								Session and account lifecycle controls.
							</CardDescription>
						</CardHeader>
						<CardContent className="flex flex-col gap-3 sm:flex-row">
							<Button variant="outline" onClick={() => void handleSignOut()}>
								<LogOut className="size-4" />
								Sign out
							</Button>
							<Button variant="destructive" disabled>
								<Trash2 className="size-4" />
								Delete account
							</Button>
						</CardContent>
					</Card>
				</div>
			</div>
		</DashboardPage>
	)
}

function Detail({
	label,
	value,
	icon: Icon,
}: {
	label: string
	value: string | undefined | null
	icon?: React.ElementType
}) {
	return (
		<div className="rounded-2xl border p-4">
			<p className="text-muted-foreground mb-1 flex items-center gap-1.5 text-xs font-medium tracking-wide uppercase">
				{Icon ? <Icon className="size-3.5" /> : null}
				{label}
			</p>
			<p className="truncate text-sm font-medium">{value || 'Not set'}</p>
		</div>
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
