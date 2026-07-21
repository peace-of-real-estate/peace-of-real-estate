import { makeAgent } from '@tests/support/fixtures/data/agent-profile'
import { mockBuyerProfile } from '@tests/support/fixtures/data/buyer-profile'
import { describe, expect, test } from 'vitest'

import { buildDebugPayload } from '@/lib/matching/debug'
import type { ScoredAgent } from '@/lib/matching/debug'
import { TIE_BAND_THRESHOLD } from '@/lib/matching/scoring'

const buyer = mockBuyerProfile

function makeScoredAgent(
	id: string,
	fitScore: number,
	disqualified: boolean,
): ScoredAgent {
	return {
		row: {
			agent: makeAgent({ id, userId: 'user-' + id }),
			user: {
				id: 'user-' + id,
				name: 'Agent ' + id,
				email: 'agent@example.com',
				emailVerified: true,
				image: null,
			},
		},
		score: {
			fitScore,
			scores: {
				Location: 4,
				'Price Fit': 4,
				Specialization: 4,
				'Working Style': 4,
				Communication: 4,
				'Business Terms': 4,
			},
			disqualified,
			trace: {
				mode: 'client-scored',
				side: 'buyers',
				matchPriorities: [],
				disqualifiers: [],
				disqualified,
				dimensions: [],
				computedScore: fitScore,
				fitScore,
				formula: 'test',
			},
		},
	}
}

describe('buildDebugPayload', () => {
	test('annotates band index, size, and offset correctly', () => {
		const a = makeScoredAgent('a', 90, false)
		const b = makeScoredAgent('b', 88, false)
		const c = makeScoredAgent('c', 80, false)
		const d = makeScoredAgent('d', 75, false)

		const payload = buildDebugPayload(buyer, 'buying', {
			qualified: [a, b, c, d],
			ranked: [a, b, c, d],
			disqualified: [],
			scoreDistribution: [],
			totalAgents: 4,
		})

		expect(payload.qualified).toHaveLength(4)
		expect(payload.tieBandThreshold).toBe(TIE_BAND_THRESHOLD)

		const bandA = payload.qualified.find((match) => match.agentId === 'a')!
		const bandB = payload.qualified.find((match) => match.agentId === 'b')!
		const bandC = payload.qualified.find((match) => match.agentId === 'c')!
		const bandD = payload.qualified.find((match) => match.agentId === 'd')!

		expect(bandA.bandIndex).toBe(0)
		expect(bandB.bandIndex).toBe(0)
		expect(bandC.bandIndex).toBe(1)
		expect(bandD.bandIndex).toBe(2)

		expect(bandA.bandSize).toBe(2)
		expect(bandB.bandSize).toBe(2)
		expect(bandC.bandSize).toBe(1)
		expect(bandD.bandSize).toBe(1)
	})

	test('displayRank follows rotated band order', () => {
		const a = makeScoredAgent('a', 90, false)
		const b = makeScoredAgent('b', 88, false)
		const c = makeScoredAgent('c', 80, false)

		const payload = buildDebugPayload(buyer, 'buying', {
			qualified: [a, b, c],
			ranked: [a, b, c],
			disqualified: [],
			scoreDistribution: [],
			totalAgents: 3,
		})

		const ranks = payload.qualified.map((match) => ({
			id: match.agentId,
			displayRank: match.displayRank,
			preShuffleRank: match.preShuffleRank,
		}))

		// preShuffleRank is sorted order; displayRank is 1..n
		const preShuffle = [...ranks].sort(
			(a, b) => a.preShuffleRank - b.preShuffleRank,
		)
		expect(preShuffle.map((r) => r.id)).toEqual(['a', 'b', 'c'])
		expect(new Set(ranks.map((r) => r.displayRank))).toEqual(new Set([1, 2, 3]))
	})

	test('disqualified agents have bandIndex -1 and continue ranks', () => {
		const a = makeScoredAgent('a', 90, false)
		const b = makeScoredAgent('b', 70, true)

		const payload = buildDebugPayload(buyer, 'buying', {
			qualified: [a],
			ranked: [a],
			disqualified: [b],
			scoreDistribution: [],
			totalAgents: 2,
		})

		expect(payload.qualified[0]!.displayRank).toBe(1)
		expect(payload.disqualified[0]!).toMatchObject({
			bandIndex: -1,
			bandSize: 1,
			bandOffset: 0,
			displayRank: 2,
			preShuffleRank: 2,
		})
	})
})
