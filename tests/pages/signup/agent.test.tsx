import { beforeEach, describe, expect, test } from 'vitest'
import { page } from 'vite-plus/test/browser'
import { renderRoute } from '@tests/support/render/route'
import { expectScreenshot } from '@tests/support/render/screenshot'

async function clickSelector(id: string) {
	await page.elementLocator(document.querySelector(id)!).click()
}

async function fillIdentityStep() {
	await page.getByRole('textbox', { name: 'First name' }).fill('Alex')
	await page.getByRole('textbox', { name: 'Last name' }).fill('Morgan')
	await page
		.getByRole('textbox', { name: 'Brokerage name' })
		.fill('PRE Realty Group')
	await page
		.getByRole('textbox', { name: 'License number & state' })
		.fill('TX-12345678')
}

async function fillMarketStep() {
	await clickSelector('#agent-market')
	const searchInput = page.getByPlaceholder('Search city')
	await expect.element(searchInput).toBeVisible()
	await searchInput.fill('Austin')
	await page.getByRole('option').first().click()
	await page.getByRole('button', { name: 'Buyers', exact: true }).click()
	await page
		.getByRole('button', {
			name: 'First-time buyers',
		})
		.click()
}

async function fillWorkStyleStep() {
	await page.getByRole('button', { name: 'Strategic & data-driven' }).click()
	await page
		.getByRole('button', { name: 'Regular scheduled check-ins' })
		.click()
	await page.getByRole('button', { name: 'Text' }).click()
	await page.getByRole('button', { name: 'Email', exact: true }).click()
	await page.getByRole('button', { name: 'Facts fast' }).click()
	await page.getByRole('button', { name: 'Within 10 min' }).click()
	await page
		.getByRole('button', { name: 'Proactive & open to discussion' })
		.click()
	await page
		.getByRole('button', {
			name: 'Represent seller only, buyer unrepresented (disclosed)',
		})
		.click()
	await page.getByRole('button', { name: 'Skip' }).click()
}

async function fillComplianceStep() {
	await page.getByRole('checkbox').first().click()
	await page
		.getByRole('radio', { name: 'Yes, I carry my own E&O policy' })
		.click()
}

async function fillPeacePactStep() {
	await page.getByRole('checkbox').first().click()
	await page
		.getByRole('textbox', { name: 'Agent Signature' })
		.fill('Alex Morgan')
}

describe('agent signup flow', () => {
	beforeEach(async () => {
		localStorage.clear()
	})

	test('walkthrough screenshots', async () => {
		await renderRoute({ path: '/signup/agent/identity' })
		await expectScreenshot(document.body, { name: 'step-1-identity' })

		await fillIdentityStep()
		await page.getByRole('button', { name: 'Continue' }).click()
		await expectScreenshot(document.body, { name: 'step-2-market' })

		await fillMarketStep()
		await page.getByRole('button', { name: 'Continue' }).click()
		await expectScreenshot(document.body, { name: 'step-3-work-style' })

		await fillWorkStyleStep()
		await expectScreenshot(document.body, { name: 'step-4-compliance' })

		await fillComplianceStep()
		await page.getByRole('button', { name: 'Continue' }).click()
		await expectScreenshot(document.body, { name: 'step-5-peace-pact' })

		await fillPeacePactStep()
		await page.getByRole('button', { name: 'Sign & continue' }).click()

		await expectScreenshot(document.body, { name: 'step-6-preview' })
	}, 20_000)
})
