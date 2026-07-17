import type { BuyerDraft } from '@/lib/profile'
import { test, vi, beforeEach, expect } from 'vitest'

import { page } from 'vite-plus/test/browser'
import { renderRoute } from '@tests/support/render/route'
import { expectScreenshot } from '@tests/support/render/screenshot'

var mockBuyerDraft: BuyerDraft | null = null

vi.mock('@/lib/utils/localstorage', () => ({
	createLocalStorage: () => ({
		load: () => mockBuyerDraft,
		save: () => {},
		clear: () => {
			mockBuyerDraft = null
		},
	}),
	readLocalStorage: () => null,
	writeLocalStorage: () => {},
	removeLocalStorage: () => {},
}))

beforeEach(() => {
	mockBuyerDraft = null
})

const step1: BuyerDraft = {
	city: 'Austin',
	state: 'TX',
	zipCodes: [],
}

const step2: BuyerDraft = {
	priceRange: '400000-750000',
	propertyTypes: ['singleFamily'],
	timeline: 'exploring',
}

const step3: BuyerDraft = {
	experienceLevel: 'firstTime',
	idealAgentRelationship: 'trustedAdvisor',
	decisionMakingNeed: 'numbersData',
	biddingWarResponse: 'factsOptions',
	quickCommunicationChannel: 'text',
	updateDeliveryMethod: 'email',
	involvementLevel: 'veryInvolved',
	responseTimeExpectation: 'within10Min',
	commissionComfort: 'negotiate',
}

test('location step screenshot', async () => {
	mockBuyerDraft = step1
	await renderRoute({ path: '/signup/buyer/location' })
	await expectScreenshot(document.body, { name: 'step-1-location' })
})

test('home step screenshot', async () => {
	mockBuyerDraft = { ...step1, ...step2 }
	await renderRoute({ path: '/signup/buyer/home' })
	await expectScreenshot(document.body, { name: 'step-2-home' })
})

test('preferences step screenshot', async () => {
	mockBuyerDraft = { ...step1, ...step2, ...step3 }
	await renderRoute({ path: '/signup/buyer/preferences' })
	await expectScreenshot(document.body, { name: 'step-3-preferences' })
})

test('preview screenshot', async () => {
	mockBuyerDraft = { ...step1, ...step2, ...step3 }
	await renderRoute({ path: '/signup/preview/buyer' })
	await expectScreenshot(document.body, { name: 'step-4-preview' })
})

test('location step city dropdown open', async () => {
	mockBuyerDraft = step1
	await renderRoute({ path: '/signup/buyer/location' })
	const trigger = page.getByRole('button', { name: /Austin/ })
	await expect.element(trigger).toBeVisible()
	await trigger.click()
	await expect.element(page.getByPlaceholder('Search city...')).toBeVisible()
	await expectScreenshot(document.body, { name: 'step-1-city-dropdown' })
}, 60000)
