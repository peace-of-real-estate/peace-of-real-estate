import { beforeEach, describe, expect, test } from 'vitest'
import { page } from 'vite-plus/test/browser'
import { renderRoute } from '@tests/support/render/route'
import { expectScreenshot } from '@tests/support/render/screenshot'

async function clickSelector(id: string) {
	await page.elementLocator(document.querySelector(id)!).click()
}

async function selectCity() {
	await clickSelector('#client-location')
	const searchInput = page.getByPlaceholder('Search city')
	await expect.element(searchInput).toBeVisible()
	await searchInput.fill('Austin')
	await page.getByRole('option').first().click()
	await page.getByRole('button', { name: 'Continue' }).click()
}

async function fillHomeStep() {
	const singleFamily = page.getByRole('button', { name: 'Single-Family' })
	await expect.element(singleFamily).toBeVisible()
	await singleFamily.click()
	await page.getByRole('button', { name: 'Continue' }).click()
}

async function answerPreference(name: string) {
	const option = page.getByRole('button', { name, exact: true })
	await expect.element(option).toBeVisible()
	await option.click()
}

async function fillPreferencesStep() {
	await answerPreference('Text')
	await answerPreference('Very involved')
	await answerPreference('Exclusive representation')
	await answerPreference("I'm new, explain it to me")
	await answerPreference("First time; I'll want guidance")
}

describe('buyer signup flow', () => {
	beforeEach(async () => {
		localStorage.clear()
	})

	test('walkthrough screenshots', async () => {
		await renderRoute({ path: '/signup/buyer/location' })
		await expectScreenshot(document.body, { name: 'step-1-location' })

		await selectCity()
		await expectScreenshot(document.body, { name: 'step-2-home' })

		await fillHomeStep()
		await expectScreenshot(document.body, {
			name: 'step-3-preferences',
		})

		await fillPreferencesStep()
		await expectScreenshot(document.body, { name: 'step-4-preview' })
	})
})
