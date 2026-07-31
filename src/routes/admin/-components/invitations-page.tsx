import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
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
	forceAcceptIntroduction,
	listFakeAgentPendingIntroductions,
} from '@/lib/introductions/admin'

import { ErrorState } from './query-states'

export function InvitationsPage() {
	const queryClient = useQueryClient()
	const listQuery = useQuery({
		queryKey: ['admin-fake-agent-pending-introductions'],
		queryFn: () => listFakeAgentPendingIntroductions(),
	})

	const forceAcceptMutation = useMutation({
		mutationFn: (introductionId: string) =>
			forceAcceptIntroduction({ data: { introductionId } }),
		onSuccess: () => {
			void queryClient.invalidateQueries({
				queryKey: ['admin-fake-agent-pending-introductions'],
			})
		},
	})

	const rows = listQuery.data ?? []

	return (
		<div className="w-full px-6 py-10">
			<div className="mb-6 flex items-center gap-2 md:hidden">
				<SidebarTrigger />
				<span className="text-sm font-medium">Invitations</span>
			</div>

			<h1 className="font-heading mb-1 text-xl font-semibold">
				Pending invitations to seeded agents
			</h1>
			<p className="text-muted-foreground mb-6 text-sm">
				Rows are pre-filtered server-side to @example.com agents only. Force
				accept exercises the same DB mutation and email notification path a real
				agent accept would.
			</p>

			{forceAcceptMutation.isError && (
				<ErrorState
					title="Force accept failed"
					message={forceAcceptMutation.error.message}
				/>
			)}

			{listQuery.isError ? (
				<ErrorState
					message={listQuery.error.message}
					onRetry={() => void listQuery.refetch()}
				/>
			) : rows.length === 0 && !listQuery.isLoading ? (
				<div className="text-muted-foreground rounded-md border border-dashed p-6 text-sm">
					No pending introductions to seeded agents right now — send one from a
					buyer/seller test profile via{' '}
					<Link to="/admin/role-switch" className="underline">
						Role Switch
					</Link>{' '}
					to test this flow.
				</div>
			) : (
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>Client</TableHead>
							<TableHead>Agent (fake)</TableHead>
							<TableHead>Sent</TableHead>
							<TableHead />
						</TableRow>
					</TableHeader>
					<TableBody>
						{rows.map((row) => (
							<TableRow key={row.introductionId}>
								<TableCell>
									{row.clientName}{' '}
									<Badge variant="secondary" className="ml-1">
										{row.clientRole}
									</Badge>
								</TableCell>
								<TableCell>
									{row.agentName}{' '}
									<span className="text-muted-foreground text-xs">
										{row.agentEmail}
									</span>
								</TableCell>
								<TableCell className="text-muted-foreground text-xs">
									{new Date(row.createdAt).toLocaleString()}
								</TableCell>
								<TableCell>
									<Button
										size="sm"
										disabled={
											forceAcceptMutation.isPending &&
											forceAcceptMutation.variables === row.introductionId
										}
										onClick={() =>
											forceAcceptMutation.mutate(row.introductionId)
										}
									>
										Force accept
									</Button>
								</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			)}
		</div>
	)
}
