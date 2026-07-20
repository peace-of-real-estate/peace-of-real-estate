import { createServerFn } from '@tanstack/react-start'

export const hasBetaAccess = createServerFn({ method: 'GET' }).handler(
	async () => {
		const { hasBetaAccessCookie } = await import('./beta.server')
		return hasBetaAccessCookie()
	},
)

export const authenticateBeta = createServerFn({ method: 'POST' })
	.validator((data) => {
		if (!(data instanceof FormData)) {
			throw new Error('Expected form data')
		}

		return data.get('password')
	})
	.handler(async ({ data: password }) => {
		const { authenticateBetaAction } = await import('./beta.server')
		return authenticateBetaAction(password)
	})
