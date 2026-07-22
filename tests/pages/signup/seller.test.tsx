import { renderRoute } from '@tests/support/render/route'
import { expectScreenshot } from '@tests/support/render/screenshot'
import { page } from 'vite-plus/test/browser'
import { test, vi, beforeEach, expect } from 'vitest'

import type { SellerDraft } from '@/lib/profile'

var mockSellerDraft: SellerDraft | null = null

vi.mock('@/lib/utils/localstorage', () => ({
	createLocalStorage: () => ({
		load: () => mockSellerDraft,
		save: () => {},
		clear: () => {
			mockSellerDraft = null
		},
	}),
}))

beforeEach(() => {
	mockSellerDraft = null
})

const step1: SellerDraft = {
	city: 'Austin',
	state: 'TX',
	zipCodes: [],
}

const step2: SellerDraft = {
	priceMin: 400_000,
	priceMax: 750_000,
	propertyTypes: ['singleFamily'],
	timeline: 'exploring',
}

const step3: SellerDraft = {
	saleMotivation: 'relocation',
	successfulSaleLooksLike: 'strongPriceSmoothProcess',
	involvementLevel: 'veryInvolved',
	quickCommunicationChannel: 'text',
	updateDeliveryMethod: 'email',
	agentDeliveryExpectations: ['pricedRight', 'honestStraightforward'],
	homeConnection: 'goodMemories',
	agentSilencePreference: 'milestones',
	representationPreference: 'exclusiveRepresentationOnly',
	responseTimeExpectation: 'within30Min',
	commissionComfort: 'openOptions',
}

test('location step screenshot', async () => {
	mockSellerDraft = step1
	await renderRoute({ path: '/signup/seller/location' })
	await expectScreenshot(document.body, { name: 'step-1-location' })
})

test('home step screenshot', async () => {
	mockSellerDraft = { ...step1, ...step2 }
	await renderRoute({ path: '/signup/seller/home' })
	await expectScreenshot(document.body, { name: 'step-2-home' })
})

test('preferences step screenshot', async () => {
	mockSellerDraft = { ...step1, ...step2, ...step3 }
	await renderRoute({ path: '/signup/seller/preferences' })
	await expectScreenshot(document.body, { name: 'step-3-preferences' })
})

test('preview redirects incomplete drafts to the first step', async () => {
	mockSellerDraft = step1
	await renderRoute({ path: '/signup/preview/seller' })
	await expect
		.element(page.getByRole('heading', { name: 'Location', exact: true }))
		.toBeVisible()
})

test('preview screenshot', async () => {
	mockSellerDraft = { ...step1, ...step2, ...step3 }
	await renderRoute({ path: '/signup/preview/seller' })
	await expectScreenshot(document.body, { name: 'step-4-preview' })
})
