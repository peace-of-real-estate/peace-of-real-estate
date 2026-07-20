import type { AgentDraft } from '@/lib/profile'
import { test, vi, beforeEach, expect } from 'vitest'

import { page } from 'vite-plus/test/browser'
import { renderRoute } from '@tests/support/render/route'
import { expectScreenshot } from '@tests/support/render/screenshot'

var mockAgentDraft: AgentDraft | null = null
var saveAgentDraft = vi.fn()

vi.mock('@/lib/utils/localstorage', () => ({
	createLocalStorage: () => ({
		load: () => mockAgentDraft,
		save: saveAgentDraft,
		clear: () => {
			mockAgentDraft = null
		},
	}),
}))

beforeEach(() => {
	mockAgentDraft = null
	saveAgentDraft.mockReset()
})

const identity: AgentDraft = {
	firstName: 'Alex',
	lastName: 'Morgan',
	brokerageName: 'PRE Realty Group',
	email: 'alex.morgan@example.com',
	phone: '555-123-4567',
	businessAddress: '123 Main St, Austin, TX 78701',
	licenseNumberState: 'TX-12345678',
	licenseProof: 'https://license.example.com/alex-morgan',
	employmentStatus: 'Full time',
}

const market: AgentDraft = {
	city: 'Austin',
	state: 'TX',
	zipCodes: ['78701', '78704'],
	typicalPriceRange: '400000-1000000',
	representationSide: 'both',
	bestClientTypes: ['firstTime', 'moveUp'],
	yearsLicensed: '6-10',
	averageTransactions: '16-30',
}

const preferences: AgentDraft = {
	clientDescription: 'strategicDataDriven',
	communicationFrequency: 'scheduled',
	quickCommunicationChannel: 'text',
	updateDeliveryMethod: 'email',
	difficultDealInstinct: 'factsFast',
	responseTime: 'within10Min',
	commissionApproach: 'proactiveOpen',
	unrepresentedBuyerApproach: 'representSellerOnly',
}

const compliance: AgentDraft = {
	licenseAttested: true,
	eoInsuranceStatus: 'Yes, I carry my own E&O policy',
}

const peacePact: AgentDraft = {
	peacePactSigned: true,
	peacePactSignature: 'Alex Morgan',
}

test('identity step screenshot', async () => {
	mockAgentDraft = identity
	await renderRoute({ path: '/signup/agent/identity' })
	await expectScreenshot(document.body, { name: 'step-1-identity' })
})

test('identity step submits the draft and advances to market', async () => {
	await renderRoute({ path: '/signup/agent/identity' })

	await page.getByRole('textbox', { name: 'First name' }).fill('Alex')
	await page.getByRole('textbox', { name: 'Last name' }).fill('Morgan')
	await page
		.getByRole('textbox', { name: 'Brokerage name' })
		.fill('PRE Realty Group')
	await page
		.getByRole('textbox', { name: 'License number & state' })
		.fill('TX-12345678')
	await page.getByRole('button', { name: 'Continue' }).click()

	await vi.waitFor(() => {
		expect(saveAgentDraft).toHaveBeenCalledWith(
			expect.objectContaining({ firstName: 'Alex', lastName: 'Morgan' }),
		)
	})
	await expect
		.element(page.getByRole('heading', { name: 'Market', exact: true }))
		.toBeVisible()
})

test('market step screenshot', async () => {
	mockAgentDraft = { ...identity, ...market }
	await renderRoute({ path: '/signup/agent/market' })
	await expectScreenshot(document.body, { name: 'step-2-market' })
})

test('preferences step screenshot', async () => {
	mockAgentDraft = { ...identity, ...market, ...preferences }
	await renderRoute({ path: '/signup/agent/preferences' })
	await expectScreenshot(document.body, { name: 'step-3-preferences' })
})

test('compliance step screenshot', async () => {
	mockAgentDraft = { ...identity, ...market, ...preferences, ...compliance }
	await renderRoute({ path: '/signup/agent/compliance' })
	await expectScreenshot(document.body, { name: 'step-4-compliance' })
})

test('peace pact step screenshot', async () => {
	mockAgentDraft = {
		...identity,
		...market,
		...preferences,
		...compliance,
		...peacePact,
	}
	await renderRoute({ path: '/signup/agent/peace-pact' })
	await expectScreenshot(document.body, { name: 'step-5-peace-pact' })
})

test('preview screenshot', async () => {
	mockAgentDraft = {
		...identity,
		...market,
		...preferences,
		...compliance,
		...peacePact,
	}
	await renderRoute({ path: '/signup/preview/agent' })
	await expectScreenshot(document.body, { name: 'step-6-preview' })
})
