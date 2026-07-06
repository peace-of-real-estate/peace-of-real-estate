import { describe, test } from 'vitest'
import { renderRoute } from '@tests/support/render/route'
import { expectScreenshot } from '@tests/support/render/screenshot'

describe('buyer dashboard pages', () => {
	test('matches page', async () => {
		await renderRoute({ path: '/buyer/matches' })
		await expectScreenshot(document.body, { name: 'matches' })
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
