import { useMutation, useQuery } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { useState } from 'react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { SidebarTrigger } from '@/components/ui/sidebar'
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@/components/ui/table'
import {
	impersonateAgent,
	listUsersForAdmin,
} from '@/lib/auth/admin-impersonation'

import { ErrorState } from './query-states'

function describeKind(row: { isAgent: boolean; clientRoles: string[] }) {
	const parts: string[] = []
	if (row.isAgent) parts.push('Agent')
	for (const role of row.clientRoles) {
		parts.push(role === 'buyer' ? 'Buyer' : 'Seller')
	}
	return parts.length > 0 ? parts.join(' + ') : '—'
}

export function AdminUsersPage() {
	const navigate = useNavigate()
	const [seededOnly, setSeededOnly] = useState(true)

	const usersQuery = useQuery({
		queryKey: ['admin-users'],
		queryFn: () => listUsersForAdmin(),
	})

	const impersonateMutation = useMutation({
		mutationFn: (agentUserId: string) =>
			impersonateAgent({ data: { agentUserId } }),
		onSuccess: () => {
			void navigate({ to: '/agent/introductions' })
		},
	})

	const rows = (usersQuery.data ?? []).filter(
		(row) => !seededOnly || row.isSeeded,
	)

	return (
		<div className="w-full px-6 py-10">
			<div className="mb-6 flex items-center gap-2 md:hidden">
				<SidebarTrigger />
				<span className="text-sm font-medium">Users</span>
			</div>

			<div className="mb-6 flex items-center justify-between">
				<div>
					<h1 className="font-heading text-xl font-semibold">Users</h1>
					<p className="text-muted-foreground text-sm">
						"Sign in as" is only available for seeded (@example.com) agents.
					</p>
				</div>
				<div className="flex items-center gap-2 text-sm">
					<Checkbox
						id="seeded-only"
						checked={seededOnly}
						onCheckedChange={(checked) => setSeededOnly(checked === true)}
					/>
					<Label htmlFor="seeded-only" className="cursor-pointer">
						Seeded only
					</Label>
				</div>
			</div>

			{impersonateMutation.isError && (
				<ErrorState
					title="Sign in as failed"
					message="Could not start impersonation. Try again."
				/>
			)}

			{usersQuery.isError ? (
				<ErrorState
					message="Could not load users."
					onRetry={() => void usersQuery.refetch()}
				/>
			) : (
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>User</TableHead>
							<TableHead>Kind</TableHead>
							<TableHead />
						</TableRow>
					</TableHeader>
					<TableBody>
						{rows.map((row) => (
							<TableRow key={row.id}>
								<TableCell>
									<div>{row.name}</div>
									<div className="text-muted-foreground font-mono text-xs">
										{row.email}
										{row.isSeeded ? (
											<Badge variant="muted" className="ml-2">
												seeded
											</Badge>
										) : null}
									</div>
								</TableCell>
								<TableCell>{describeKind(row)}</TableCell>
								<TableCell>
									{row.isSeeded && row.isAgent ? (
										<Button
											size="sm"
											variant="destructive"
											disabled={
												impersonateMutation.isPending &&
												impersonateMutation.variables === row.id
											}
											onClick={() => impersonateMutation.mutate(row.id)}
										>
											Sign in as
										</Button>
									) : null}
								</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			)}
		</div>
	)
}
