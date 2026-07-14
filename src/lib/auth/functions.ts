import { redirect } from '@tanstack/react-router'

import { getUserDashboardPath } from '@/lib/profile'
import { getCurrentSession } from './session'

export async function redirectAuthenticatedUsers() {
	const session = await getCurrentSession()

	if (session) {
		const dashboardPath = await getUserDashboardPath()
		throw redirect({ to: dashboardPath })
	}
}

export async function redirectUnauthenticatedUsers({
	redirectTo = '/buyer/matches',
}: {
	redirectTo?: string
} = {}) {
	const session = await getCurrentSession()

	if (!session) {
		throw redirect({ to: '/auth/login', search: { redirect: redirectTo } })
	}

	return session
}
