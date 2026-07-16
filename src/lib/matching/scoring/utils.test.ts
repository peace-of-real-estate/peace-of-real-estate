import { describe, expect, test } from 'vitest'

import { parseSerializedPriceRange } from './utils'

describe('parseSerializedPriceRange', () => {
	test('parses min-max serialized format', () => {
		const range = parseSerializedPriceRange('400000-750000')
		expect(range).toEqual({ min: 400_000, max: 750_000 })
	})

	test('parses agent bucket slugs', () => {
		expect(parseSerializedPriceRange('under400k')).toEqual({
			min: 0,
			max: 400_000,
		})
		expect(parseSerializedPriceRange('400kTo750k')).toEqual({
			min: 400_000,
			max: 750_000,
		})
		expect(parseSerializedPriceRange('750kTo1_5m')).toEqual({
			min: 750_000,
			max: 1_500_000,
		})
		expect(parseSerializedPriceRange('1_5mPlus')).toEqual({
			min: 1_500_000,
			max: 2_000_000,
		})
	})

	test('returns undefined for unparseable values', () => {
		expect(parseSerializedPriceRange('legacy $250k - $500k')).toBeUndefined()
		expect(parseSerializedPriceRange('')).toBeUndefined()
		expect(parseSerializedPriceRange(null)).toBeUndefined()
		expect(parseSerializedPriceRange(undefined)).toBeUndefined()
	})

	test('trims whitespace around slugs', () => {
		expect(parseSerializedPriceRange('  400kTo750k  ')).toEqual({
			min: 400_000,
			max: 750_000,
		})
	})
})
