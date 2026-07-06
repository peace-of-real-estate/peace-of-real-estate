import { test, expect } from 'vitest'
import { page } from 'vite-plus/test/browser'
import { renderRoute } from '@tests/support/render/route'
import { expectScreenshot } from '@tests/support/render/screenshot'

test('landing page renders', async () => {
	await renderRoute({ path: '/' })
	await expectScreenshot(document.body, { name: 'default' })
})

test('landing page profile type dialog opens', async () => {
	await renderRoute({ path: '/' })
	const cta = page.getByRole('button', { name: 'Find Your Agent' })
	await expect.element(cta).toBeVisible()
	await cta.click()
	await expect
		.element(
			page.getByRole('heading', { name: 'What are you planning to do?' }),
		)
		.toBeVisible()
	await expectScreenshot(document.body, { name: 'dialog' })
})
