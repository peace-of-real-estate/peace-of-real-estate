import { createFileRoute } from '@tanstack/react-router'

import { InvitationsPage } from '@/routes/admin/-components/invitations-page'

export const Route = createFileRoute('/admin/invitations')({
	component: InvitationsPage,
})
