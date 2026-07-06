import { test } from 'vitest'
import { renderRoute } from '@tests/support/render/route'
import { expectScreenshot } from '@tests/support/render/screenshot'

test('login page renders', async () => {
	await renderRoute({ path: '/auth/login' })
	await expectScreenshot(document.body, { name: 'default' })
})
