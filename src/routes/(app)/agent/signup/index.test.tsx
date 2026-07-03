import '@tests/__mocks__/browser'

import { test } from '@tests/__fixtures__/browser'

import { expectRouteScreenshot } from '@tests/utils/file-routes'

const agentSignupSteps = [
	{ step: 'intro', name: 'agent-signup-step-1-intro' },
	{ step: 'identity', name: 'agent-signup-step-2-identity' },
	{ step: 'market', name: 'agent-signup-step-3-market' },
	{ step: 'compliance', name: 'agent-signup-step-4-compliance' },
	{ step: 'peacePact', name: 'agent-signup-step-5-peace-pact' },
	{ step: 'preview', name: 'agent-signup-step-6-preview' },
] as const

for (const { step, name } of agentSignupSteps) {
	test(`agent signup ${step} step matches desktop screenshot`, async () => {
		await expectRouteScreenshot({
			path: `/agent/signup/?step=${step}`,
			name,
		})
	})
}
