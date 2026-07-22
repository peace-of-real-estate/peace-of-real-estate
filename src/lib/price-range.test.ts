import { describe, expect, test } from 'vitest'

import { parseMinMaxRange } from './price-range'

describe('parseMinMaxRange', () => {
	test('parses min-max serialized format', () => {
		const range = parseMinMaxRange('400000-750000')
		expect(range).toEqual({ min: 400_000, max: 750_000 })
	})

	test('normalizes reversed bounds', () => {
		expect(parseMinMaxRange('750000-400000')).toEqual({
			min: 400_000,
			max: 750_000,
		})
	})

	test('returns undefined for unparseable values', () => {
		expect(parseMinMaxRange('legacy $250k - $500k')).toBeUndefined()
		expect(parseMinMaxRange('400kTo750k')).toBeUndefined()
		expect(parseMinMaxRange('')).toBeUndefined()
		expect(parseMinMaxRange(null)).toBeUndefined()
		expect(parseMinMaxRange(undefined)).toBeUndefined()
	})
})
