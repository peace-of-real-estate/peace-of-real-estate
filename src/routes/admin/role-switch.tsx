import { createFileRoute } from '@tanstack/react-router'

import { RoleSwitchPage } from '@/routes/admin/-components/role-switch-page'

export const Route = createFileRoute('/admin/role-switch')({
	component: RoleSwitchPage,
})
