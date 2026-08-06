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

	// GTM renders only in the production deployment (see VITE_PUBLIC_GTM_ID);
	// preview/PR environments run non-production mode and correctly omit it.
	test('production pages include the GTM snippet', async ({
		page,
		baseURL,
	}) => {
		test.skip(
			!baseURL?.includes('beta.peaceofrealestate.com'),
			'GTM only renders in the production deployment',
		)
		const response = await page.goto('/')
		const html = await response?.text()
		expect(html).toContain('googletagmanager.com/gtm.js')
		expect(html).toContain("'dataLayer','GTM-W74SF279'")
		expect(html).toContain('googletagmanager.com/ns.html?id=GTM-W74SF279')
	})
})
