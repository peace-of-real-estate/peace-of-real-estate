import { renderRoute } from '@tests/support/render/route'
import { expectScreenshot } from '@tests/support/render/screenshot'
import { describe, test } from 'vitest'

describe('seller dashboard pages', () => {
	test('matches page', async () => {
		await renderRoute({ path: '/seller/matches' })
		await expectScreenshot(document.body, { name: 'matches' })
	})

	test('introductions page', async () => {
		await renderRoute({ path: '/seller/introductions' })
		await expectScreenshot(document.body, {
			name: 'introductions',
		})
	})

	test('search preferences page', async () => {
		await renderRoute({ path: '/seller/search-preferences' })
		await expectScreenshot(document.body, {
			name: 'search-preferences',
		})
	})
})
