import { test as setup, expect } from '@playwright/test'

const authFile = 'e2e/.auth/beta-user.json'

setup('authenticate with beta gate', async ({ page }) => {
	const password = process.env.BETA_PASSWORD
	if (!password) {
		throw new Error('BETA_PASSWORD must be set for e2e tests')
	}

	await page.goto('/auth/beta')
	await page.getByPlaceholder('Enter invite password').fill(password)
	await page.getByRole('button', { name: 'Unlock Preview' }).click()

	await expect(page).toHaveURL(/\/$/)
	await page.context().storageState({ path: authFile })
})

setup('beta gate accepts a native form submission', async ({ browser }) => {
	const password = process.env.BETA_PASSWORD
	if (!password) {
		throw new Error('BETA_PASSWORD must be set for e2e tests')
	}

	const context = await browser.newContext({ javaScriptEnabled: false })
	const page = await context.newPage()
	await page.goto('/auth/beta')
	await page.getByPlaceholder('Enter invite password').fill(password)
	await page.getByRole('button', { name: 'Unlock Preview' }).click()

	await expect(page).toHaveURL(/\/$/)
	await context.close()
})
