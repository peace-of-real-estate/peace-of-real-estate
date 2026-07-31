import { createServerFn } from '@tanstack/react-start'
import { getRequestHeaders } from '@tanstack/react-start/server'
import { z } from 'zod'

import { db } from '@/db/connection'
import { agentProfiles, clientProfiles, user } from '@/db/schema'

import { getAuth } from './config'
import { isSeededAgentUserId, isSeededEmail } from './seed'
import { requireAdmin } from './session'

export type AdminUserRow = {
	id: string
	name: string
	email: string
	isSeeded: boolean
	isAgent: boolean
	clientRoles: ('buyer' | 'seller')[]
}

export const listUsersForAdmin = createServerFn({ method: 'GET' }).handler(
	async (): Promise<AdminUserRow[]> => {
		await requireAdmin()

		const [users, agentUserIds, clientRoleRows] = await Promise.all([
			db.select({ id: user.id, name: user.name, email: user.email }).from(user),
			db.select({ userId: agentProfiles.userId }).from(agentProfiles),
			db
				.select({ userId: clientProfiles.userId, role: clientProfiles.role })
				.from(clientProfiles),
		])

		const agentSet = new Set(agentUserIds.map((row) => row.userId))
		const clientRolesByUser = new Map<string, ('buyer' | 'seller')[]>()
		for (const row of clientRoleRows) {
			const roles = clientRolesByUser.get(row.userId) ?? []
			roles.push(row.role)
			clientRolesByUser.set(row.userId, roles)
		}

		return users.map((row) => ({
			id: row.id,
			name: row.name,
			email: row.email,
			isSeeded: isSeededEmail(row.email),
			isAgent: agentSet.has(row.id),
			clientRoles: clientRolesByUser.get(row.id) ?? [],
		}))
	},
)

async function requireSeededAgentUser(agentUserId: string): Promise<void> {
	if (!(await isSeededAgentUserId(agentUserId))) {
		throw new Error('Can only impersonate seeded (@example.com) agent accounts')
	}
}

export const impersonateAgent = createServerFn({ method: 'POST' })
	.validator((data: unknown) =>
		z.object({ agentUserId: z.string().min(1) }).parse(data),
	)
	.handler(async ({ data }) => {
		await requireAdmin()
		// This app-level check exists for a fast, friendly error message. The
		// actual enforcement lives server-side on the better-auth endpoint
		// itself (src/lib/auth/config.ts's impersonateUser request hook), since
		// enabling the admin plugin's client makes `/admin/impersonate-user`
		// directly callable — a wrapper-only check here would be bypassable.
		await requireSeededAgentUser(data.agentUserId)
		await getAuth().api.impersonateUser({
			body: { userId: data.agentUserId },
			headers: getRequestHeaders(),
		})
		return { success: true }
	})

export const stopImpersonating = createServerFn({ method: 'POST' }).handler(
	async () => {
		await getAuth().api.stopImpersonating({
			headers: getRequestHeaders(),
		})
		return { success: true }
	},
)
