import { eq } from 'drizzle-orm'

import { db } from '@/db/connection'
import { agentProfiles, user } from '@/db/schema'

/**
 * Seeded/fake users created by scripts/seeds/agents/index.ts are identified
 * by convention only: their email always ends in @example.com. This is the
 * single place that convention lives — reused by admin tooling that must
 * never operate on a real user (force-accept, impersonation).
 */
export function isSeededEmail(email: string): boolean {
	return email.trim().toLowerCase().endsWith('@example.com')
}

/**
 * Re-derives (never trusts a caller-supplied flag) whether a given user id
 * belongs to a seeded fake agent. Used both by our own impersonation server
 * function AND by a better-auth request hook (src/lib/auth/config.ts) that
 * restricts the raw impersonateUser endpoint itself — the hook exists because
 * enabling the admin plugin's client (`authClient.admin.impersonateUser`)
 * makes that endpoint directly callable, bypassing any app-level wrapper.
 */
export async function isSeededAgentUserId(userId: string): Promise<boolean> {
	const [row] = await db
		.select({ email: user.email })
		.from(user)
		.innerJoin(agentProfiles, eq(agentProfiles.userId, user.id))
		.where(eq(user.id, userId))
		.limit(1)
	return row !== undefined && isSeededEmail(row.email)
}
