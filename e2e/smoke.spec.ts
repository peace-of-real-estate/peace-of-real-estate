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
	test.beforeEach(async ({ context, baseURL }) => {
		if (!baseURL) throw new Error('BASE_URL must be set for e2e tests')
		await context.addCookies([
			{ name: 'beta_auth', value: 'true', url: baseURL },
		])
	})

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
