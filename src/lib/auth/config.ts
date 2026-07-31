import { drizzleAdapter } from '@better-auth/drizzle-adapter'
import { betterAuth } from 'better-auth'
import { APIError, createAuthMiddleware } from 'better-auth/api'
import { admin as adminPlugin, oAuthProxy } from 'better-auth/plugins'
import { createAccessControl } from 'better-auth/plugins/access'
import { tanstackStartCookies } from 'better-auth/tanstack-start'

import { db } from '@/db/connection'
import { account, session, user, verification } from '@/db/schema'
import { serverEnv as env } from '@/env.server'
import { isAdminEmail } from '@/lib/auth/admin-emails'
import { isSeededAgentUserId } from '@/lib/auth/seed'
import { sendPasswordResetEmail } from '@/lib/email.server'

const appOrigin = new URL(env.BETTER_AUTH_URL).origin

/**
 * better-auth's admin plugin defaults the 'admin' role to nearly every
 * permission it has (ban, delete, set-password, set-role, create-user, ...).
 * This app only ever needs `user:impersonate` (for "sign in as a seeded
 * agent" — src/lib/auth/admin-impersonation.ts), so the 'admin' role is
 * redefined here to grant only that, least-privilege. Any other admin-plugin
 * endpoint (ban-user, set-user-password, set-role, remove-user, ...) is now
 * unauthorized for every session regardless of `user.role`, closing off the
 * rest of the plugin's surface rather than trusting a hand-maintained list of
 * per-endpoint hooks.
 */
const adminAccessControl = createAccessControl({ user: ['impersonate'] })
const appAdminRole = adminAccessControl.newRole({ user: ['impersonate'] })
const appUserRole = adminAccessControl.newRole({})

/**
 * The admin plugin authorizes either by a persisted DB `user.role` or by this
 * ID list. This app never persists admin roles — ADMIN_EMAILS is the source
 * of truth — so the before hook below adds an allowlisted caller's user ID
 * here on demand instead. Shared by reference with every getAuth() instance,
 * so the plugin's permission check sees IDs added earlier in the same
 * request. Removal from ADMIN_EMAILS takes effect on process restart, which
 * is when an env change applies anyway.
 */
const adminUserIds: string[] = []

export function getAuth() {
	return betterAuth({
		appName: 'Peace of Real Estate',
		baseURL: {
			allowedHosts: [
				'127.0.0.1:*',
				'localhost:*',
				'peaceofrealestate.com',
				'www.peaceofrealestate.com',
				'beta.peaceofrealestate.com',
				'peace-of-real-estate-*.up.railway.app',
			],
			protocol: 'auto',
			fallback: appOrigin,
		},
		secret: env.BETTER_AUTH_SECRET,
		database: drizzleAdapter(db, {
			provider: 'pg',
			schema: { account, session, user, verification },
		}),
		emailAndPassword: {
			enabled: true,
			autoSignIn: true,
			resetPasswordPath: '/auth/reset-password',
			sendResetPassword: async ({ user, url }) => {
				await sendPasswordResetEmail({ to: user.email, resetUrl: url })
			},
		},
		...(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET
			? {
					socialProviders: {
						google: {
							clientId: env.GOOGLE_CLIENT_ID,
							clientSecret: env.GOOGLE_CLIENT_SECRET,
						},
					},
				}
			: {}),
		hooks: {
			before: createAuthMiddleware(async (ctx) => {
				// Framework-level enforcement, not just a UI convenience: with
				// the admin plugin's client enabled, `/admin/impersonate-user`
				// is directly callable (e.g. via `authClient.admin.impersonateUser`),
				// bypassing our own impersonateAgent wrapper in
				// src/lib/auth/admin-impersonation.ts. Every /admin/* endpoint is
				// gated on ADMIN_EMAILS (this app's actual admin source of truth),
				// so a persisted DB `user.role` can never grant access on its own.
				// stop-impersonating is exempt: it runs under the impersonated
				// (seeded agent) session, which is deliberately not on the
				// allowlist; better-auth already restricts it to sessions with
				// impersonatedBy set.
				if (
					!ctx.path.startsWith('/admin/') ||
					ctx.path === '/admin/stop-impersonating'
				) {
					return
				}

				const callerSession = ctx.headers
					? await getAuth().api.getSession({ headers: ctx.headers })
					: null
				if (
					!callerSession ||
					!isAdminEmail(callerSession.user.email, env.ADMIN_EMAILS)
				) {
					throw new APIError('FORBIDDEN', {
						message: 'Admin access required',
					})
				}

				if (!adminUserIds.includes(callerSession.user.id)) {
					adminUserIds.push(callerSession.user.id)
				}

				if (ctx.path !== '/admin/impersonate-user') return

				const body: unknown = ctx.body
				const userId =
					body !== null &&
					typeof body === 'object' &&
					'userId' in body &&
					typeof body.userId === 'string'
						? body.userId
						: undefined
				if (!userId || !(await isSeededAgentUserId(userId))) {
					throw new APIError('FORBIDDEN', {
						message:
							'Can only impersonate seeded (@example.com) agent accounts',
					})
				}
			}),
		},
		plugins: [
			oAuthProxy({
				productionURL: appOrigin,
				secret: env.BETTER_AUTH_SECRET,
			}),
			// Powers admin "sign in as" impersonation (src/lib/auth/admin-impersonation.ts).
			// This app's own admin-authorization source of truth stays ADMIN_EMAILS
			// (see requireAdmin() in src/lib/auth/session.ts) — the plugin's own
			// role-based admin concept is only ever used internally to satisfy its
			// impersonateUser permission check, and is deliberately scoped down to
			// just that one permission (see adminAccessControl above).
			adminPlugin({
				ac: adminAccessControl,
				roles: { admin: appAdminRole, user: appUserRole },
				adminUserIds,
			}),
			// Must stay last: better-auth forwards Set-Cookie headers to the
			// framework cookie store only for plugins whose hooks run before it.
			tanstackStartCookies(),
		],
	})
}
