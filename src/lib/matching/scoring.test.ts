import { describe, expect, test } from 'vitest'

import {
	buildTieBands,
	rankWithTieBands,
	tieBandRotation,
	calculateFitScore,
	TIE_BAND_THRESHOLD,
} from '@/lib/matching/scoring'
import type { BuyerProfile } from '@/lib/profile/types'
import { makeAgent } from '@tests/support/fixtures/data/agent-profile'
import { mockBuyerProfile } from '@tests/support/fixtures/data/buyer-profile'

const FIXED_DATE = new Date('2026-01-01T00:00:00Z')

const buyer: BuyerProfile = {
	...mockBuyerProfile,
	id: 'buyer-fixture-1',
	userId: 'user-buyer-fixture-1',
	status: 'active',
	state: 'MD',
	city: 'Baltimore',
	zipCodes: ['21201', '21205'],
	priceRange: '400000-600000',
	involvementLevel: 'veryInvolved',
	commissionComfort: 'dontUnderstand',
	idealAgentRelationship: 'thinkingPartner',
	decisionMakingNeed: 'numbersData',
	biddingWarResponse: 'factsOptions',
	matchPriorities: ['priceRange'],
	createdAt: FIXED_DATE,
	updatedAt: FIXED_DATE,
}

function scored(items: { id: string; fitScore: number }[]) {
	return items.map((item) => ({
		id: item.id,
		score: { fitScore: item.fitScore },
	}))
}

describe('buildTieBands', () => {
	test('bands anchor to the band leader, not the previous item', () => {
		// 90→88→86→82 steps down by ≤ threshold each time, but 86 is 4 points
		// below the leader 90 — chaining would merge everything into one band.
		const input = scored([
			{ id: 'a', fitScore: 90 },
			{ id: 'b', fitScore: 88 },
			{ id: 'c', fitScore: 86 },
			{ id: 'd', fitScore: 82 },
		])
		const bands = buildTieBands(input)
		expect(bands).toHaveLength(3)
		expect(bands[0]!.map((item) => item.id)).toEqual(['a', 'b'])
		expect(bands[1]!.map((item) => item.id)).toEqual(['c'])
		expect(bands[2]!.map((item) => item.id)).toEqual(['d'])
	})

	test('singletons when no ties', () => {
		const input = scored([
			{ id: 'a', fitScore: 100 },
			{ id: 'b', fitScore: 90 },
			{ id: 'c', fitScore: 80 },
		])
		const bands = buildTieBands(input)
		expect(bands).toHaveLength(3)
		expect(bands.every((band) => band.length === 1)).toBe(true)
	})

	test('boundary is inclusive', () => {
		const input = scored([
			{ id: 'a', fitScore: 95 },
			{ id: 'b', fitScore: 92 },
		])
		const bands = buildTieBands(input)
		expect(bands).toHaveLength(1)
		expect(bands[0]!).toHaveLength(2)
	})
})

describe('tieBandRotation', () => {
	test('is deterministic and within band size', () => {
		const clientId = 'client-abc'
		const rotation = tieBandRotation(clientId, 5)
		expect(rotation).toBeGreaterThanOrEqual(0)
		expect(rotation).toBeLessThan(5)
		expect(tieBandRotation(clientId, 5)).toBe(rotation)
	})

	test('returns 0 for singleton or empty bands', () => {
		expect(tieBandRotation('x', 1)).toBe(0)
	})
})

describe('rankWithTieBands', () => {
	test('rotates within bands but never across band boundaries', () => {
		const input = scored([
			{ id: 'a', fitScore: 92 },
			{ id: 'b', fitScore: 90 },
			{ id: 'c', fitScore: 88 },
			{ id: 'd', fitScore: 80 },
		])
		const ranked = rankWithTieBands(input, 'client-abc')
		const ids = ranked.map((item) => item.id)
		// Bands are [a, b] (within 3 of leader 92), [c], [d]; rotation may
		// reorder a/b but c and d stay put.
		expect(new Set(ids.slice(0, 2))).toEqual(new Set(['a', 'b']))
		expect(ids.slice(2)).toEqual(['c', 'd'])
	})

	test('rotates multi-agent bands', () => {
		const input = scored([
			{ id: 'a', fitScore: 90 },
			{ id: 'b', fitScore: 88 },
			{ id: 'c', fitScore: 80 },
		])
		const ranked = rankWithTieBands(input, 'client-xyz')
		// band [a,b] rotated, c remains third
		expect(ranked).toHaveLength(3)
		expect(ranked[2]!.id).toBe('c')
	})

	test('returns sorted order when no clientId', () => {
		const input = scored([
			{ id: 'a', fitScore: 80 },
			{ id: 'b', fitScore: 95 },
		])
		const ranked = rankWithTieBands(input)
		expect(ranked.map((item) => item.id)).toEqual(['b', 'a'])
	})
})

describe('calculateFitScore trace', () => {
	test('stage2 values are internally consistent', () => {
		const agent = makeAgent()
		const result = calculateFitScore(agent, buyer, 'buying')
		const stage2 = result.trace.stage2
		expect(stage2).toBeDefined()
		expect(stage2!.linear).toBeGreaterThan(0)
		expect(stage2!.geometric).toBeGreaterThan(0)
		expect(stage2!.consumerScore).toBeCloseTo(
			0.7 * stage2!.linear + 0.3 * stage2!.geometric,
			2,
		)
	})

	test('reciprocalBlend equals harmonic mean of consumerScore and agentFit floor', () => {
		const agent = makeAgent()
		const result = calculateFitScore(agent, buyer, 'buying')
		const { stage2, agentFit, reciprocalBlend } = result.trace
		expect(reciprocalBlend).toBeDefined()
		const expected =
			(2 * stage2!.consumerScore * (0.5 + 0.5 * agentFit!)) /
			(stage2!.consumerScore + 0.5 + 0.5 * agentFit!)
		expect(reciprocalBlend).toBeCloseTo(expected, 2)
	})

	test('notFitPenalty is populated exactly when penalized', () => {
		const agent = makeAgent({ notFitFor: ['entryLevel'] })
		const result = calculateFitScore(agent, buyer, 'buying')
		expect(result.trace.notFitPenalty).toBeDefined()
		expect(result.trace.notFitPenalty!.scoreAfter).toBeCloseTo(
			result.trace.notFitPenalty!.scoreBefore * 0.3,
			2,
		)
	})

	test('notFitPenalty is omitted when not penalized', () => {
		const agent = makeAgent()
		const result = calculateFitScore(agent, buyer, 'buying')
		expect(result.trace.notFitPenalty).toBeUndefined()
	})
})

describe('TIE_BAND_THRESHOLD', () => {
	test('is exported as 3', () => {
		expect(TIE_BAND_THRESHOLD).toBe(3)
	})
})
