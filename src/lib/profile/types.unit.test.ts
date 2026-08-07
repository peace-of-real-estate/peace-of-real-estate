import { describe, expect, test } from 'vitest'

import { BUCKET_ORDER } from '@/lib/price-range'

import { agentInsertSchema } from './insert-schemas.server'

describe('agentInsertSchema typicalPriceRange', () => {
	test('accepts every bucket slug', () => {
		const schema = agentInsertSchema.shape.typicalPriceRange
		for (const slug of BUCKET_ORDER) {
			expect(schema.safeParse(slug).success).toBe(true)
		}
	})

	test('rejects raw min-max serialized ranges', () => {
		const schema = agentInsertSchema.shape.typicalPriceRange
		expect(schema.safeParse('400000-750000').success).toBe(false)
	})

	test('rejects unknown values', () => {
		const schema = agentInsertSchema.shape.typicalPriceRange
		expect(schema.safeParse('not-a-bucket').success).toBe(false)
		expect(schema.safeParse('').success).toBe(false)
	})
})
