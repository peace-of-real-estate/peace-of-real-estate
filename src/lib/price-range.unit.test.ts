import { describe, expect, test } from 'vitest'
import * as z from 'zod/mini'

import { PRICE_MAX, PRICE_MIN, priceBoundSchema } from './price-range'

describe('priceBoundSchema', () => {
	test('accepts integer prices within bounds', () => {
		expect(z.safeParse(priceBoundSchema, 400_000).success).toBe(true)
		expect(z.safeParse(priceBoundSchema, PRICE_MIN).success).toBe(true)
		expect(z.safeParse(priceBoundSchema, PRICE_MAX).success).toBe(true)
	})

	test('rejects non-integers and out-of-bounds prices', () => {
		expect(z.safeParse(priceBoundSchema, 400_000.5).success).toBe(false)
		expect(z.safeParse(priceBoundSchema, PRICE_MIN - 1).success).toBe(false)
		expect(z.safeParse(priceBoundSchema, PRICE_MAX + 1).success).toBe(false)
	})
})
