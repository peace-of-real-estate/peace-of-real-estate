import { test, expect } from '@playwright/test'

// Read-only checks against a deployed environment (BASE_URL). Keep these
// unauthenticated and side-effect free: PR environments run real services.

test('beta gate greets visitors without access', async ({ page }) => {
	await page.goto('/')
	await expect(page).toHaveURL(/\/auth\/beta$/)
	await expect(
		page.getByRole('button', { name: /unlock preview/i }),
	).toBeVisible()
})

test.describe('with beta access', () => {
	test.use({ storageState: 'e2e/.auth/beta-user.json' })

	test('landing page renders', async ({ page }) => {
		const response = await page.goto('/')
		expect(response?.status()).toBe(200)
		await expect(page).toHaveTitle(/Peace of Real Estate/)
		await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
	})

	test('login page renders', async ({ page }) => {
		await page.goto('/auth/login')
		await expect(
			page.getByRole('heading', { name: 'Welcome Back' }),
		).toBeVisible()
	})
})
