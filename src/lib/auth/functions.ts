import { createHmac, timingSafeEqual } from 'node:crypto'

import { redirect } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { getCookie, setCookie } from '@tanstack/react-start/server'

import { serverEnv as env } from '@/env.server'
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

const BETA_COOKIE = 'beta_auth'
const BETA_VALUE = 'true'

async function deriveBetaSecret() {
	return createHmac('sha256', env.BETTER_AUTH_SECRET)
		.update('beta')
		.digest('hex')
}

async function signBetaValue(value: string) {
	const secret = await deriveBetaSecret()
	return createHmac('sha256', secret).update(value).digest('hex')
}

function serializeBetaCookie(value: string, signature: string) {
	return `${value}:${signature}`
}

function parseBetaCookie(
	cookie: string | undefined,
): { value: string; signature: string } | null {
	if (!cookie) return null
	const parts = cookie.split(':')
	if (parts.length !== 2) return null
	const [value, signature] = parts
	if (!value || !signature) return null
	return { value, signature }
}

export const authenticateBeta = createServerFn({ method: 'POST' })
	.validator((data: { password: string }) => data)
	.handler(async ({ data }) => {
		const expectedBuffer = Buffer.from(env.BETA_PASSWORD)
		const passwordBuffer = Buffer.from(data.password)
		const isValid =
			expectedBuffer.length === passwordBuffer.length &&
			timingSafeEqual(expectedBuffer, passwordBuffer)

		if (isValid) {
			const signature = await signBetaValue(BETA_VALUE)
			setCookie(BETA_COOKIE, serializeBetaCookie(BETA_VALUE, signature), {
				path: '/',
				sameSite: 'lax',
				maxAge: 60 * 60 * 24 * 30,
				httpOnly: true,
				secure: process.env.NODE_ENV === 'production',
			})
		}

		return { success: isValid }
	})

export const hasBetaAccess = createServerFn({ method: 'GET' }).handler(
	async () => {
		const cookie = getCookie(BETA_COOKIE)
		const parsed = parseBetaCookie(cookie)
		if (!parsed) return false

		const expected = await signBetaValue(parsed.value)
		const expectedBuffer = Buffer.from(expected, 'hex')
		const signatureBuffer = Buffer.from(parsed.signature, 'hex')
		if (expectedBuffer.length !== signatureBuffer.length) return false
		return timingSafeEqual(expectedBuffer, signatureBuffer)
	},
)
