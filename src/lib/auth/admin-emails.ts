/**
 * Single source of truth for "is this email an app admin" — shared by
 * getIsAdmin/requireAdmin (session.ts, is-admin.ts) and the better-auth
 * request hook that gates the raw /admin/impersonate-user endpoint
 * (config.ts), so all three enforce the exact same ADMIN_EMAILS allowlist.
 */
export function isAdminEmail(
	email: string,
	adminEmails: string | undefined,
): boolean {
	const admins = (adminEmails ?? '')
		.split(',')
		.map((entry) => entry.trim().toLowerCase())
		.filter(Boolean)
	return admins.includes(email.trim().toLowerCase())
}
