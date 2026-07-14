import type { SellerDraft } from '@/lib/profile'
import { test, vi, beforeEach } from 'vitest'

import { renderRoute } from '@tests/support/render/route'
import { expectScreenshot } from '@tests/support/render/screenshot'

var mockSellerDraft: SellerDraft | null = null

vi.mock('@/lib/utils/localstorage', () => ({
	createLocalStorage: () => ({
		load: () => mockSellerDraft,
		save: () => {},
		clear: () => {
			mockSellerDraft = null
		},
	}),
	readLocalStorage: () => null,
	writeLocalStorage: () => {},
	removeLocalStorage: () => {},
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
	priceRange: '400000-750000',
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

test('preview screenshot', async () => {
	mockSellerDraft = { ...step1, ...step2, ...step3 }
	await renderRoute({ path: '/signup/preview/seller' })
	await expectScreenshot(document.body, { name: 'step-4-preview' })
})
