import { waitForZipMapIdle } from '@tests/support/render/map'
import { renderRoute } from '@tests/support/render/route'
import { expectScreenshot } from '@tests/support/render/screenshot'
import { page } from 'vite-plus/test/browser'
import { test, vi, beforeEach, expect } from 'vitest'

import type { AgentDraft } from '@/lib/profile'

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
	brokerageName: 'PRE Realty Group',
	licenseNumberState: 'TX-12345678',
	yearsLicensed: '6-10',
	representationSide: 'buyer',
}

const market: AgentDraft = {
	cityId: '01936f00-0000-7000-8000-000000000aa1',
	zipCodes: ['78701', '78704'],
	typicalPriceRange: '400kTo750k',
}

const preferences: AgentDraft = {
	enjoyedClients: ['firstTimeBuyers'],
	clientDecisionStyle: 'middleGround',
	clientContactStyle: 'regularCheckins',
	riskAdviceComfort: 'lowRisk',
	commissionStyle: 'walkThroughRate',
	specialties: [],
	energyFocus: ['calm', 'explainSteps'],
}

test('identity step screenshot', async () => {
	mockAgentDraft = identity
	await renderRoute({ path: '/signup/agent/identity' })
	await expectScreenshot(document.body, { name: 'step-1-identity' })
})

test('identity step shows hints when continuing with missing fields', async () => {
	await renderRoute({ path: '/signup/agent/identity' })

	await page.getByRole('button', { name: 'Continue' }).click()

	await expect.element(page.getByText('Enter your brokerage.')).toBeVisible()
	await expect
		.element(page.getByText('Enter your license number & state.'))
		.toBeVisible()
	expect(saveAgentDraft).not.toHaveBeenCalled()
	await expect
		.element(page.getByRole('heading', { name: 'Your practice', exact: true }))
		.toBeVisible()
	await expectScreenshot(document.body, { name: 'step-1-identity-error' })
})

test('identity step submits the draft and advances to market', async () => {
	await renderRoute({ path: '/signup/agent/identity' })

	await page
		.getByRole('textbox', { name: 'Brokerage' })
		.fill('PRE Realty Group')
	await page
		.getByRole('textbox', { name: 'License number & state' })
		.fill('TX-12345678')
	await page.getByRole('button', { name: '6-10' }).click()
	await page.getByRole('button', { name: 'Buyers' }).click()
	await page.getByRole('button', { name: 'Continue' }).click()

	await vi.waitFor(() => {
		expect(saveAgentDraft).toHaveBeenCalledWith(
			expect.objectContaining({
				brokerageName: 'PRE Realty Group',
				licenseNumberState: 'TX-12345678',
				yearsLicensed: '6-10',
				representationSide: 'buyer',
			}),
		)
	})
	await expect
		.element(page.getByRole('heading', { name: 'Market', exact: true }))
		.toBeVisible()
})

test('market step screenshot', async () => {
	mockAgentDraft = { ...identity, ...market }
	await renderRoute({ path: '/signup/agent/market' })
	await expectScreenshot(document.body, {
		name: 'step-2-market',
		prepare: waitForZipMapIdle,
	})
})

test('market step idle screenshot', async () => {
	mockAgentDraft = { ...identity, ...market }
	await renderRoute({ path: '/signup/agent/market' })
	await expectScreenshot(document.body, {
		name: 'step-2-market-idle',
		prepare: waitForZipMapIdle,
	})
})

test('market step shows hints when continuing with missing fields', async () => {
	mockAgentDraft = identity
	await renderRoute({ path: '/signup/agent/market' })

	await page.getByRole('button', { name: 'Continue' }).click()

	await expect.element(page.getByText('Enter a city.')).toBeVisible()
	expect(saveAgentDraft).not.toHaveBeenCalled()
	await expect
		.element(page.getByRole('heading', { name: 'Market', exact: true }))
		.toBeVisible()
	await expectScreenshot(document.body, { name: 'step-2-market-error' })
})

test('preferences step screenshot', async () => {
	mockAgentDraft = { ...identity, ...market, ...preferences }
	await renderRoute({ path: '/signup/agent/preferences' })
	await expectScreenshot(document.body, { name: 'step-3-preferences' })
})

test('preview redirects incomplete drafts to the first step', async () => {
	mockAgentDraft = { ...identity, ...market }
	await renderRoute({ path: '/signup/preview/agent' })
	await expect
		.element(page.getByRole('heading', { name: 'Your practice', exact: true }))
		.toBeVisible()
})

test('preview screenshot', async () => {
	mockAgentDraft = { ...identity, ...market, ...preferences }
	await renderRoute({ path: '/signup/preview/agent' })
	await expect.element(page.getByText('$400k – $750k')).toBeVisible()
	await expectScreenshot(document.body, { name: 'step-4-preview' })
})
