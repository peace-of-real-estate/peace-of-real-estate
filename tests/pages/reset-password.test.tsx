import { renderRoute } from '@tests/support/render/route'
import { test, expect } from 'vitest'

test('reset password page renders', async () => {
	await renderRoute({ path: '/auth/reset-password?token=test-token' })
	await expect.element(document.body).toHaveTextContent('Create new password')
	await expect.element(document.body).toHaveTextContent('Reset password')
}, 10_000)
