import { expect } from 'vite-plus/test'
import { page } from 'vite-plus/test/browser'

// Maps load tiles into a canvas, invisible to waitForImages — pass this as a
// screenshot's `prepare` so the capture doesn't race tile fetches.
export async function waitForZipMapIdle() {
	const zipMap = page.getByTestId('zip-map')
	if (!zipMap.query()) return
	await expect
		.element(zipMap, { timeout: 15000 })
		.toHaveAttribute('data-idle', 'true')
}
