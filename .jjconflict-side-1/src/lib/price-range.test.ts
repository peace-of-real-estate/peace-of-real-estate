import { describe, expect, test } from 'vitest'

import { PRICE_MAX, PRICE_MIN, priceBoundSchema } from './price-range'

describe('priceBoundSchema', () => {
	test('accepts integer prices within bounds', () => {
		expect(priceBoundSchema.safeParse(400_000).success).toBe(true)
		expect(priceBoundSchema.safeParse(PRICE_MIN).success).toBe(true)
		expect(priceBoundSchema.safeParse(PRICE_MAX).success).toBe(true)
	})

	test('rejects non-integers and out-of-bounds prices', () => {
		expect(priceBoundSchema.safeParse(400_000.5).success).toBe(false)
		expect(priceBoundSchema.safeParse(PRICE_MIN - 1).success).toBe(false)
		expect(priceBoundSchema.safeParse(PRICE_MAX + 1).success).toBe(false)
	})
})
