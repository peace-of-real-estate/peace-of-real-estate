import { createServerFn } from '@tanstack/react-start'
import { getRequestHeaders } from '@tanstack/react-start/server'

import { isAdminEmail } from './admin-emails'
import { getAuth } from './config'

export const getIsAdmin = createServerFn({ method: 'GET' }).handler(
	async () => {
		const { serverEnv } = await import('@/env.server')
		const session = await getAuth().api.getSession({
			headers: getRequestHeaders(),
		})
		if (!session) return false

		return isAdminEmail(session.user.email, serverEnv.ADMIN_EMAILS)
	},
)
