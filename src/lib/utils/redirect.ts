/**
 * Restricts a post-auth redirect target to a same-origin path. Absolute URLs,
 * protocol-relative values ("//evil.example"), and backslash variants
 * ("/\evil.example", which URL parsing folds into "//") fall back so the auth
 * flow can never forward users off-site.
 */
export function sanitizeRedirectPath(
	value: string | null | undefined,
	fallback = '/',
): string {
	if (!value || !value.startsWith('/')) return fallback
	if (value[1] === '/' || value[1] === '\\') return fallback
	for (const char of value) {
		const code = char.charCodeAt(0)
		if (code < 32 || code === 127) return fallback
	}
	return value
}
