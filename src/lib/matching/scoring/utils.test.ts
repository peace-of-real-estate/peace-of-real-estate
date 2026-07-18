import { describe, expect, test } from 'vitest'

import {
	parseSerializedPriceRange,
	priceOverlapRatio,
	snapToAgentBucket,
} from './utils'

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

describe('snapToAgentBucket', () => {
	test('a bucket range snaps to its own bucket', () => {
		expect(snapToAgentBucket({ min: 400_000, max: 750_000 })).toBe('400kTo750k')
		expect(snapToAgentBucket({ min: 1_500_000, max: 2_000_000 })).toBe(
			'1_5mPlus',
		)
	})

	test('a min-max range snaps to the bucket with the most overlap', () => {
		expect(snapToAgentBucket({ min: 300_000, max: 600_000 })).toBe('400kTo750k')
		expect(snapToAgentBucket({ min: 800_000, max: 1_500_000 })).toBe(
			'750kTo1_5m',
		)
	})

	test('a point range snaps to a containing bucket instead of none', () => {
		expect(snapToAgentBucket({ min: 500_000, max: 500_000 })).toBe('400kTo750k')
	})

	test('returns undefined when the range overlaps no bucket', () => {
		expect(
			snapToAgentBucket({ min: 3_000_000, max: 4_000_000 }),
		).toBeUndefined()
	})
})

describe('priceOverlapRatio', () => {
	test('a point-range agent inside the client range scores above zero', () => {
		const ratio = priceOverlapRatio(
			{ min: 400_000, max: 600_000 },
			{ min: 500_000, max: 500_000 },
		)
		expect(ratio).toBeGreaterThan(0)
		expect(ratio).toBeCloseTo(0.25, 2)
	})

	test('a point-range agent outside the client range scores zero', () => {
		expect(
			priceOverlapRatio(
				{ min: 400_000, max: 600_000 },
				{ min: 900_000, max: 900_000 },
			),
		).toBe(0)
	})

	test('a point-range client covered by the agent scores one', () => {
		expect(
			priceOverlapRatio(
				{ min: 500_000, max: 500_000 },
				{ min: 400_000, max: 750_000 },
			),
		).toBe(1)
	})
})
