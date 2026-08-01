import { waitForZipMapIdle } from '@tests/support/render/map'
import { renderRoute } from '@tests/support/render/route'
import { expectScreenshot } from '@tests/support/render/screenshot'
import { page } from 'vite-plus/test/browser'
import { test, vi, beforeEach, expect } from 'vitest'

import type { BuyerDraft } from '@/lib/profile'

var mockBuyerDraft: BuyerDraft | null = null
var saveBuyerDraft = vi.fn()

vi.mock('@/lib/utils/localstorage', () => ({
	createLocalStorage: () => ({
		load: () => mockBuyerDraft,
		save: saveBuyerDraft,
		clear: () => {
			mockBuyerDraft = null
		},
	}),
}))

beforeEach(() => {
	mockBuyerDraft = null
	saveBuyerDraft.mockReset()
})

const step1: BuyerDraft = {
	cityId: '01936f00-0000-7000-8000-000000000aa1',
	zipCodes: [],
}

const step2: BuyerDraft = {
	priceMin: 400_000,
	priceMax: 750_000,
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
	await expectScreenshot(document.body, {
		name: 'step-1-location',
		prepare: waitForZipMapIdle,
	})
})

test('location step shows hint when continuing without a city', async () => {
	await renderRoute({ path: '/signup/buyer/location' })

	await page.getByRole('button', { name: 'Continue' }).click()

	await expect.element(page.getByText('Enter a city.')).toBeVisible()
	expect(saveBuyerDraft).not.toHaveBeenCalled()
	await expect
		.element(page.getByRole('heading', { name: 'Location', exact: true }))
		.toBeVisible()
	await expectScreenshot(document.body, { name: 'step-1-location-error' })
})

test('home step shows hint when continuing without a home type', async () => {
	mockBuyerDraft = step1
	await renderRoute({ path: '/signup/buyer/home' })

	await page.getByRole('button', { name: 'Continue' }).click()

	await expect
		.element(page.getByText('Select at least one home type.'))
		.toBeVisible()
	expect(saveBuyerDraft).not.toHaveBeenCalled()
	await expect
		.element(page.getByRole('heading', { name: 'Home', exact: true }))
		.toBeVisible()
	await expectScreenshot(document.body, { name: 'step-2-home-error' })
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

test('preview redirects incomplete drafts to the first step', async () => {
	mockBuyerDraft = {
		...step1,
		...step3,
		priceMin: step2.priceMin,
		priceMax: step2.priceMax,
		propertyTypes: step2.propertyTypes,
	}
	await renderRoute({ path: '/signup/preview/buyer' })
	await expect
		.element(page.getByRole('heading', { name: 'Location', exact: true }))
		.toBeVisible()
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
