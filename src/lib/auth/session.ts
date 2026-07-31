import { createServerFn, createServerOnlyFn } from '@tanstack/react-start'
import { getRequestHeaders } from '@tanstack/react-start/server'

import { isAdminEmail } from './admin-emails'
import { getAuth } from './config'

export const getCurrentSession = createServerFn({ method: 'GET' }).handler(
	async () => {
		return getAuth().api.getSession({
			headers: getRequestHeaders(),
		})
	},
)

export async function requireUserId(): Promise<string> {
	const session = await getCurrentSession()

	if (!session) {
		throw new Error('Unauthorized')
	}

	return session.user.id
}

// Server-only: this module is also imported by client-bundled route code
// (for getCurrentSession), so the env.server access must live inside a
// createServerOnlyFn body, which is stripped from the client bundle.
export const requireAdmin = createServerOnlyFn(async (): Promise<string> => {
	const session = await getCurrentSession()

	if (!session) {
		throw new Error('Unauthorized')
	}

	const { serverEnv } = await import('@/env.server')
	if (!isAdminEmail(session.user.email, serverEnv.ADMIN_EMAILS)) {
		throw new Error('Unauthorized')
	}

	return session.user.id
})
