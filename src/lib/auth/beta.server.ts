import { createHmac, timingSafeEqual } from 'node:crypto'

import { getCookie, getRequest, setCookie } from '@tanstack/react-start/server'

import { serverEnv as env } from '@/env.server'

const BETA_COOKIE = 'beta_auth'
const BETA_VALUE = 'true'

async function signBetaValue(value: string) {
	const secret = createHmac('sha256', env.BETTER_AUTH_SECRET)
		.update('beta')
		.digest('hex')
	return createHmac('sha256', secret).update(value).digest('hex')
}

function serializeBetaCookie(value: string, signature: string) {
	return `${value}:${signature}`
}

function parseBetaCookie(
	cookie: string | undefined,
): { value: string; signature: string } | undefined {
	if (!cookie) return undefined
	const [value, signature, ...rest] = cookie.split(':')
	if (!value || !signature || rest.length > 0) return undefined
	return { value, signature }
}

async function isValidBetaPassword(password: string) {
	const expectedBuffer = Buffer.from(env.BETA_PASSWORD)
	const passwordBuffer = Buffer.from(password)
	return (
		expectedBuffer.length === passwordBuffer.length &&
		timingSafeEqual(expectedBuffer, passwordBuffer)
	)
}

async function grantBetaAccess() {
	const signature = await signBetaValue(BETA_VALUE)
	setCookie(BETA_COOKIE, serializeBetaCookie(BETA_VALUE, signature), {
		path: '/',
		sameSite: 'lax',
		maxAge: 60 * 60 * 24 * 30,
		httpOnly: true,
		secure: process.env.NODE_ENV === 'production',
	})
}

export async function authenticateBetaAction(
	password: FormDataEntryValue | null,
) {
	const request = getRequest()

	try {
		if (
			typeof password !== 'string' ||
			!(await isValidBetaPassword(password))
		) {
			return new Response(null, {
				status: 303,
				headers: {
					location: new URL('/auth/beta?error=invalid', request.url).href,
				},
			})
		}

		await grantBetaAccess()
		return new Response(null, {
			status: 303,
			headers: { location: new URL('/', request.url).href },
		})
	} catch {
		return new Response(null, {
			status: 303,
			headers: {
				location: new URL('/auth/beta?error=server', request.url).href,
			},
		})
	}
}

export async function hasBetaAccessCookie() {
	const parsed = parseBetaCookie(getCookie(BETA_COOKIE))
	if (!parsed) return false

	const expected = await signBetaValue(parsed.value)
	const expectedBuffer = Buffer.from(expected, 'hex')
	const signatureBuffer = Buffer.from(parsed.signature, 'hex')
	if (expectedBuffer.length !== signatureBuffer.length) return false
	return timingSafeEqual(expectedBuffer, signatureBuffer)
}
