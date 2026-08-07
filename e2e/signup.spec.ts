import { test, expect, type Page } from '@playwright/test'

// End-to-end walkthrough of the signup flows against a deployed environment.
// These tests are read-only: they fill each step and verify the preview page
// renders, but do not submit the signup form or create accounts.

async function selectCity(page: Page, triggerLabel: string) {
	const input = page.getByPlaceholder('City or neighborhood')
	const trigger = page.getByRole('button', { name: triggerLabel })
	for (let i = 0; i < 3; i++) {
		if (await input.isVisible().catch(() => false)) break
		await trigger.click()
		await input.waitFor({ state: 'visible', timeout: 2000 }).catch(() => {})
	}
	if (!(await input.isVisible().catch(() => false))) {
		throw new Error('Location selector did not open')
	}
	await input.fill('Baltimore')
	// City rows carry the agent count; community name matches don't.
	await page.getByRole('option').filter({ hasText: /agent/ }).first().click()
	// Continue is gated on at least one community.
	await page
		.getByRole('button', { name: /Search Baltimore communities/ })
		.click()
	await page.getByRole('option', { name: 'Fells Point' }).click()
	await page.keyboard.press('Escape')
}

async function answerQuestionFlow(page: Page, stopUrl: RegExp) {
	const maxQuestions = 15
	for (let i = 0; i < maxQuestions; i++) {
		if (stopUrl.test(page.url())) return

		const options = page.locator('button[aria-pressed]')
		const skip = page.getByRole('button', { name: 'Skip' })
		await expect(options.first().or(skip)).toBeVisible({ timeout: 10000 })

		if (await skip.isVisible().catch(() => false)) {
			await skip.click()
			continue
		}

		const firstOption = options.first()
		const firstOptionName = await firstOption.textContent()
		await firstOption.click()

		await page.waitForTimeout(800)
		const sameSelectedOption = page.getByRole('button', {
			name: firstOptionName ?? '',
			pressed: true,
		})
		if (await sameSelectedOption.isVisible().catch(() => false)) {
			const next = page.getByRole('button', { name: /^(Next|Finish)$/ })
			// Multi-select questions need minSelections picks before Next enables
			for (let extra = 1; extra < 5 && (await next.isDisabled()); extra++) {
				await options.nth(extra).click()
			}
			await next.click()
		}
	}

	if (!stopUrl.test(page.url())) {
		throw new Error('Did not reach expected page')
	}
}

test.describe('with beta access', () => {
	test.use({ storageState: 'e2e/.auth/beta-user.json' })

	test('buyer signup flow walks through all steps', async ({ page }) => {
		test.slow()
		await page.goto('/signup/buyer/location')
		await expect(
			page.getByRole('heading', { name: 'Location', exact: true }),
		).toBeVisible()
		await selectCity(page, 'Search for your city or neighborhood')
		await page.getByRole('button', { name: 'Continue' }).click()

		await expect(
			page.getByRole('heading', { name: 'Home', exact: true }),
		).toBeVisible()
		await page.getByRole('button', { name: 'Single-Family' }).click()
		await page.getByRole('button', { name: 'Continue' }).click()

		await answerQuestionFlow(page, /\/signup\/preview\/buyer$/)

		await expect(page).toHaveURL(/\/signup\/preview\/buyer$/)
		await expect(
			page.getByRole('heading', { name: 'Your Profile', exact: true }),
		).toBeVisible()
	})

	test('seller signup flow walks through all steps', async ({ page }) => {
		test.slow()
		await page.goto('/signup/seller/location')
		await expect(
			page.getByRole('heading', { name: 'Location', exact: true }),
		).toBeVisible()
		await selectCity(page, 'Search for your city or neighborhood')
		await page.getByRole('button', { name: 'Continue' }).click()

		await expect(
			page.getByRole('heading', { name: 'Home', exact: true }),
		).toBeVisible()
		await page.getByRole('button', { name: 'Single-Family' }).click()
		await page.getByRole('button', { name: 'Continue' }).click()

		await answerQuestionFlow(page, /\/signup\/preview\/seller$/)

		await expect(page).toHaveURL(/\/signup\/preview\/seller$/)
		await expect(
			page.getByRole('heading', { name: 'Your Profile', exact: true }),
		).toBeVisible()
	})

	test('non-beta cities are disabled and communities pick their parent city', async ({
		page,
	}) => {
		await page.goto('/signup/buyer/location')

		const input = page.getByPlaceholder('City or neighborhood')
		await page
			.getByRole('button', { name: 'Search for your city or neighborhood' })
			.click()
		await input.fill('Austin')
		const comingSoon = page
			.getByRole('option')
			.filter({ hasText: 'Coming soon' })
			.first()
		await expect(comingSoon).toBeVisible()
		await expect(comingSoon).toHaveAttribute('aria-disabled', 'true')

		await input.fill('Fells')
		await page.getByRole('option', { name: /Fells Point/ }).click()

		await expect(
			page.getByRole('button', { name: /MD Baltimore/ }),
		).toBeVisible()
		await expect(
			page.getByRole('button', { name: /Fells Point ×/ }),
		).toBeVisible()
	})

	test('agent signup flow walks through all steps', async ({ page }) => {
		test.slow()
		await page.goto('/signup/agent/identity')
		await expect(
			page.getByRole('heading', { name: 'Your practice', exact: true }),
		).toBeVisible()
		await page.getByRole('button', { name: 'Buyers', exact: true }).click()
		await page
			.getByRole('textbox', { name: 'Brokerage' })
			.fill('PRE Realty Group')
		await page
			.getByRole('textbox', { name: 'License number & state' })
			.fill('TX-12345678')
		await page.getByRole('button', { name: '3-5', exact: true }).click()
		await page.getByRole('button', { name: 'Continue' }).click()

		await expect(
			page.getByRole('heading', { name: 'Market', exact: true }),
		).toBeVisible()
		await selectCity(page, 'Search for your city or neighborhood')
		await page.getByRole('button', { name: /Under \$400k/ }).click()
		await page.getByRole('button', { name: 'Continue' }).click()

		await answerQuestionFlow(page, /\/signup\/preview\/agent$/)

		await expect(page).toHaveURL(/\/signup\/preview\/agent$/)
		await expect(
			page.getByRole('heading', { name: 'Your Agent Profile', exact: true }),
		).toBeVisible()
	})
})
