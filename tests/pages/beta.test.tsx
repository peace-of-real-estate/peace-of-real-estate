import { renderRoute } from '@tests/support/render/route'
import { expectScreenshot } from '@tests/support/render/screenshot'
import { test } from 'vitest'

test('beta gate page renders', async () => {
	await renderRoute({ path: '/auth/beta' })
	await expectScreenshot(document.body, { name: 'default' })
})
