import { makeAgent } from '@tests/support/fixtures/data/agent-profile'
import { setMockAgentProfile } from '@tests/support/mocks/browser'
import { renderRoute } from '@tests/support/render/route'
import { expectScreenshot } from '@tests/support/render/screenshot'
import { describe, test } from 'vitest'

describe('agent dashboard pages', () => {
	test('introductions page', async () => {
		await renderRoute({
			path: '/agent/introductions',
			setup: () => setMockAgentProfile(makeAgent()),
		})
		await expectScreenshot(document.body, {
			name: 'dashboard-introductions',
		})
	})
})
