import { CheckCircleIcon, CircleIcon } from '@phosphor-icons/react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { SidebarTrigger } from '@/components/ui/sidebar'
import {
	ensureAdminTestProfiles,
	getAdminTestProfileStatus,
} from '@/lib/profile/admin-seed'

const ROLE_CARDS = [
	{ key: 'hasBuyer', label: 'Buyer', to: '/buyer/matches' },
	{ key: 'hasSeller', label: 'Seller', to: '/seller/matches' },
	{ key: 'hasAgent', label: 'Agent', to: '/agent/introductions' },
] as const

export function RoleSwitchPage() {
	const queryClient = useQueryClient()
	const statusQuery = useQuery({
		queryKey: ['admin-test-profile-status'],
		queryFn: () => getAdminTestProfileStatus(),
	})

	const setupMutation = useMutation({
		mutationFn: () => ensureAdminTestProfiles(),
		onSuccess: () => {
			void queryClient.invalidateQueries({
				queryKey: ['admin-test-profile-status'],
			})
		},
	})

	const status = statusQuery.data
	const anyMissing = status
		? !status.hasBuyer || !status.hasSeller || !status.hasAgent
		: true

	return (
		<div className="w-full px-6 py-10">
			<div className="mb-6 flex items-center gap-2 md:hidden">
				<SidebarTrigger />
				<span className="text-sm font-medium">Role Switch</span>
			</div>

			<h1 className="font-heading mb-1 text-xl font-semibold">Role Switch</h1>
			<p className="text-muted-foreground mb-6 text-sm">
				Preview the app as a buyer, seller, or agent using real test profiles
				under your own admin account.
			</p>

			<div className="grid gap-4 sm:grid-cols-3">
				{ROLE_CARDS.map((role) => {
					const ready = status?.[role.key] ?? false
					return (
						<Card key={role.key}>
							<CardHeader>
								<CardTitle className="flex items-center justify-between">
									{role.label}
									{ready ? (
										<Badge variant="secondary" className="gap-1">
											<CheckCircleIcon className="text-success" /> Ready
										</Badge>
									) : (
										<Badge variant="muted" className="gap-1">
											<CircleIcon /> Not set up
										</Badge>
									)}
								</CardTitle>
							</CardHeader>
							<CardContent>
								{ready ? (
									<Button asChild variant="secondary" className="w-full">
										<Link to={role.to}>Go to →</Link>
									</Button>
								) : (
									<Button
										variant="outline"
										className="w-full"
										disabled={setupMutation.isPending}
										onClick={() => setupMutation.mutate()}
									>
										Set up
									</Button>
								)}
							</CardContent>
						</Card>
					)
				})}
			</div>

			{anyMissing ? (
				<Button
					className="mt-4"
					disabled={setupMutation.isPending}
					onClick={() => setupMutation.mutate()}
				>
					{setupMutation.isPending ? 'Setting up…' : 'Set up all test profiles'}
				</Button>
			) : null}
		</div>
	)
}
