import { redirect } from '@tanstack/react-router'

import { getUserDashboardPath } from '@/lib/profile'

import { getIsAdmin } from './is-admin'
import { getCurrentSession } from './session'

export async function redirectAuthenticatedUsers() {
	const session = await getCurrentSession()

	if (session) {
		const dashboardPath = await getUserDashboardPath()
		throw redirect({ to: dashboardPath })
	}
}

export async function redirectUnauthenticatedUsers({
	redirectTo,
}: {
	redirectTo: string
}) {
	const session = await getCurrentSession()

	if (!session) {
		throw redirect({ to: '/auth/login', search: { redirect: redirectTo } })
	}

	return session
}

export async function redirectNonAdminUsers({
	redirectTo,
}: {
	redirectTo: string
}) {
	const session = await getCurrentSession()

	if (!session) {
		throw redirect({ to: '/auth/login', search: { redirect: redirectTo } })
	}

	if (!(await getIsAdmin())) {
		throw redirect({ to: '/' })
	}

	return session
}
