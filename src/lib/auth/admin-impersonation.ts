import { createServerFn } from '@tanstack/react-start'
import { getRequestHeaders } from '@tanstack/react-start/server'
import { and, eq, isNull, ne, or } from 'drizzle-orm'
import { z } from 'zod'

import { db } from '@/db/connection'
import { agentProfiles, clientProfiles, user } from '@/db/tables'

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

/**
 * better-auth's admin plugin gates impersonateUser on the calling session's
 * own `user.role` column being literally 'admin' — independent of this app's
 * ADMIN_EMAILS allowlist (requireAdmin()). Self-heal it lazily here, only on
 * the impersonation path, so ADMIN_EMAILS stays the sole admin source of
 * truth everywhere else in the app.
 */
async function ensureAdminRole(userId: string): Promise<void> {
	await db
		.update(user)
		.set({ role: 'admin' })
		.where(
			and(eq(user.id, userId), or(isNull(user.role), ne(user.role, 'admin'))),
		)
}

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
		const adminUserId = await requireAdmin()
		// This app-level check exists for a fast, friendly error message. The
		// actual enforcement lives server-side on the better-auth endpoint
		// itself (src/lib/auth/config.ts's impersonateUser request hook), since
		// enabling the admin plugin's client makes `/admin/impersonate-user`
		// directly callable — a wrapper-only check here would be bypassable.
		await requireSeededAgentUser(data.agentUserId)
		await ensureAdminRole(adminUserId)
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
