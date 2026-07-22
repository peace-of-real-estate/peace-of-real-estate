import { renderRoute } from '@tests/support/render/route'
import { expectScreenshot } from '@tests/support/render/screenshot'
import { test } from 'vitest'

test('login page renders', async () => {
	await renderRoute({ path: '/auth/login' })
	await expectScreenshot(document.body, { name: 'default' })
})
