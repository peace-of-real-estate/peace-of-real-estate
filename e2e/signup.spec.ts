import { test, expect } from '@playwright/test'

// End-to-end walkthrough of the signup flows against a deployed environment.
// These tests are read-only: they fill each step and verify the preview page
// renders, but do not submit the signup form or create accounts.

test.describe('with beta access', () => {
	test.beforeEach(async ({ context, baseURL }) => {
		if (!baseURL) throw new Error('BASE_URL must be set for e2e tests')
		await context.addCookies([
			{ name: 'beta_auth', value: 'true', url: baseURL },
		])
	})

	test('buyer signup flow walks through all steps', async ({ page }) => {
		await page.goto('/signup/buyer/location')
		await expect(
			page.getByRole('heading', { name: 'Location', exact: true }),
		).toBeVisible()
		await page.locator('#client-location').click()
		await page.getByPlaceholder('Search city').fill('Austin')
		await page.getByRole('option').first().click()
		await page.getByRole('button', { name: 'Continue' }).click()

		await expect(
			page.getByRole('heading', { name: 'Home', exact: true }),
		).toBeVisible()
		await page.getByRole('button', { name: 'Single-Family' }).click()
		await page.getByRole('button', { name: 'Continue' }).click()

		await expect(
			page.getByText('How familiar does this process feel?'),
		).toBeVisible()
		await page
			.getByRole('button', { name: /first time/i })
			.first()
			.click()
		await page
			.getByRole('button', { name: /trusted advisor/i })
			.first()
			.click()
		await page
			.getByRole('button', { name: /the numbers\/data/i })
			.first()
			.click()
		await page
			.getByRole('button', { name: /facts & options immediately/i })
			.first()
			.click()
		await page.getByRole('button', { name: /text/i }).first().click()
		await page.getByRole('button', { name: /email/i }).first().click()
		await page
			.getByRole('button', { name: /very involved/i })
			.first()
			.click()
		await page
			.getByRole('button', { name: /within 10 min/i })
			.first()
			.click()
		await page
			.getByRole('button', { name: /open but want options first/i })
			.first()
			.click()

		await expect(page).toHaveURL(/\/signup\/preview\/buyer$/)
		await expect(
			page.getByRole('heading', { name: 'Your Profile', exact: true }),
		).toBeVisible()
	})

	test('seller signup flow walks through all steps', async ({ page }) => {
		await page.goto('/signup/seller/location')
		await expect(
			page.getByRole('heading', { name: 'Location', exact: true }),
		).toBeVisible()
		await page.locator('#client-location').click()
		await page.getByPlaceholder('Search city').fill('Austin')
		await page.getByRole('option').first().click()
		await page.getByRole('button', { name: 'Continue' }).click()

		await expect(
			page.getByRole('heading', { name: 'Home', exact: true }),
		).toBeVisible()
		await page.getByRole('button', { name: 'Single-Family' }).click()
		await page.getByRole('button', { name: 'Continue' }).click()

		await expect(page.getByText('What is driving this sale?')).toBeVisible()
		await page
			.getByRole('button', { name: /lifestyle change/i })
			.first()
			.click()
		await page
			.getByRole('button', { name: /strong price \+ smooth process/i })
			.first()
			.click()
		await page
			.getByRole('button', { name: /very involved/i })
			.first()
			.click()
		await page.getByRole('button', { name: /text/i }).first().click()
		await page.getByRole('button', { name: /email/i }).first().click()
		await page
			.getByRole('button', { name: /priced it right/i })
			.first()
			.click()
		await page
			.getByRole('button', { name: /honest & straightforward/i })
			.first()
			.click()
		await page
			.getByRole('button', { name: /next question/i })
			.first()
			.click()
		await page
			.getByRole('button', { name: /good memories, ready to move on/i })
			.first()
			.click()
		await page
			.getByRole('button', { name: /updates at key milestones/i })
			.first()
			.click()
		await page
			.getByRole('button', { name: /exclusive representation only/i })
			.first()
			.click()
		await page
			.getByRole('button', { name: /30 min/i })
			.first()
			.click()
		await page
			.getByRole('button', { name: /open but want options first/i })
			.first()
			.click()

		await expect(page).toHaveURL(/\/signup\/preview\/seller$/)
		await expect(
			page.getByRole('heading', { name: 'Your Profile', exact: true }),
		).toBeVisible()
	})

	test('agent signup flow walks through all steps', async ({ page }) => {
		test.slow()
		await page.goto('/signup/agent/identity')
		await expect(
			page.getByRole('heading', { name: 'Identity', exact: true }),
		).toBeVisible()
		await page.getByRole('textbox', { name: 'First name' }).fill('Alex')
		await page.getByRole('textbox', { name: 'Last name' }).fill('Morgan')
		await page
			.getByRole('textbox', { name: 'Brokerage name' })
			.fill('PRE Realty Group')
		await page
			.getByRole('textbox', { name: 'License number & state' })
			.fill('TX-12345678')
		await page.getByRole('button', { name: 'Continue' }).click()

		await expect(
			page.getByRole('heading', { name: 'Market', exact: true }),
		).toBeVisible()
		await page.locator('#agent-market').click()
		await page.getByPlaceholder('Search city').fill('Austin')
		await page.getByRole('option').first().click()
		await page.getByRole('button', { name: 'Buyers', exact: true }).click()
		await page.getByRole('button', { name: 'First-time buyers' }).click()
		await page.getByRole('button', { name: 'Continue' }).click()

		await expect(
			page.getByText('How would clients describe working with you?'),
		).toBeVisible()
		await page
			.getByRole('button', { name: /strategic & data-driven/i })
			.first()
			.click()
		await page
			.getByRole('button', { name: /regular scheduled check-ins/i })
			.first()
			.click()
		await page.getByRole('button', { name: /text/i }).first().click()
		await page.getByRole('button', { name: /email/i }).first().click()
		await page
			.getByRole('button', { name: /facts fast/i })
			.first()
			.click()
		await page
			.getByRole('button', { name: /within 10 min/i })
			.first()
			.click()
		await page
			.getByRole('button', { name: /proactive & open to discussion/i })
			.first()
			.click()
		await page
			.getByRole('button', { name: /represent seller only/i })
			.first()
			.click()
		await page.getByRole('button', { name: 'Skip' }).first().click()

		await expect(
			page.getByRole('heading', { name: 'Compliance', exact: true }),
		).toBeVisible()
		await page.getByRole('checkbox').first().click()
		await page
			.getByRole('radio', { name: 'Yes, I carry my own E&O policy' })
			.click()
		await page.getByRole('button', { name: 'Continue' }).click()

		await expect(
			page.getByRole('heading', { name: 'Peace Pact', exact: true }),
		).toBeVisible()
		await page.getByRole('checkbox').first().click()
		await page
			.getByRole('textbox', { name: 'Agent Signature' })
			.fill('Alex Morgan')
		await page.getByRole('button', { name: 'Sign & continue' }).click()

		await expect(page).toHaveURL(/\/signup\/preview\/agent$/)
		await expect(
			page.getByRole('heading', { name: 'Your Agent Profile', exact: true }),
		).toBeVisible()
	})
})
