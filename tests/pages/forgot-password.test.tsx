import { test, expect } from 'vitest'

import { renderRoute } from '@tests/support/render/route'

test('forgot password page renders', async () => {
	await renderRoute({ path: '/auth/forgot-password' })
	await expect.element(document.body).toHaveTextContent('Reset password')
	await expect.element(document.body).toHaveTextContent('Send reset link')
}, 10_000)
