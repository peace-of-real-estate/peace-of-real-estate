import { expect, test } from 'vitest'
import { renderRoute } from '@tests/support/render/route'
import { expectScreenshot } from '@tests/support/render/screenshot'

test('beta gate page renders', async () => {
	await renderRoute({ path: '/auth/beta' })
	await expectScreenshot(document.body, { name: 'default' })

	const form = document.querySelector('form')
	expect(form?.getAttribute('action')).toBe('/server-fn')
	expect(form?.method).toBe('post')
})
