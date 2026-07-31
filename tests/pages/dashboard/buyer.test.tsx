import { renderRoute } from '@tests/support/render/route'
import { expectScreenshot } from '@tests/support/render/screenshot'
import { page } from 'vite-plus/test/browser'
import { describe, expect, test } from 'vitest'

describe('buyer dashboard pages', () => {
	test('matches page', async () => {
		await renderRoute({ path: '/buyer/matches' })
		await expectScreenshot(document.body, { name: 'matches' })
	})

	test('matches page row expanded', async () => {
		await renderRoute({ path: '/buyer/matches' })
		const toggle = page.getByRole('button', {
			name: 'Toggle details for Sarah Chen',
		})
		await expect.element(toggle).toBeVisible()
		await toggle.click()
		await expectScreenshot(document.body, { name: 'matches-expanded' })
	})

	test('introductions page', async () => {
		await renderRoute({ path: '/buyer/introductions' })
		await expectScreenshot(document.body, {
			name: 'introductions',
		})
	})

	test('search preferences page', async () => {
		await renderRoute({ path: '/buyer/search-preferences' })
		await expectScreenshot(document.body, {
			name: 'search-preferences',
		})
	})
})
