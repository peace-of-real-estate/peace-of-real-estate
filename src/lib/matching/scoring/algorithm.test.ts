import { makeAgent } from '@tests/support/fixtures/data/agent-profile'
import { makeBuyerProfile } from '@tests/support/fixtures/data/buyer-profile'
import { makeSellerProfile } from '@tests/support/fixtures/data/seller-profile'
import { geoOf } from '@tests/support/fixtures/geography'
import { describe, expect, test } from 'vitest'

import type { UsPostalCode } from '@/lib/geography/states'
import { AGENT_PRICE_RANGES } from '@/lib/price-range'
import type { AgentPriceBucket } from '@/lib/price-range'
import type {
	AgentProfile,
	BuyerProfile,
	SellerProfile,
} from '@/lib/profile/types'

import {
	buildTieBands,
	calculateFitScore,
	deriveExpectedClientTypes,
	rankWithTieBands,
	rankWithTieBandsDetailed,
	scoreLocation,
	tieBandRotation,
	TIE_BAND_THRESHOLD,
} from './algorithm'
import { priceOverlapRatio, round2 } from './utils'

const FIXED_DATE = new Date('2026-01-01T00:00:00Z')

function cityOf(
	name: string,
	state: UsPostalCode,
	center: { lat: number; lng: number },
) {
	return {
		id: `city-fixture-${name.toLowerCase().replace(/[^a-z]+/g, '-')}-${state.toLowerCase()}`,
		name,
		state,
		center,
	}
}

function makeBuyer(overrides: Partial<BuyerProfile> = {}): BuyerProfile {
	return makeBuyerProfile({
		id: 'buyer-fixture-1',
		userId: 'user-buyer-fixture-1',
		status: 'active',
		city: cityOf('Baltimore', 'MD', { lat: 39.2904, lng: -76.6122 }),
		geography: geoOf({
			'21201': { lat: 39.2946, lng: -76.6239 },
			'21205': { lat: 39.303, lng: -76.5822 },
		}),
		priceMin: 400_000,
		priceMax: 600_000,
		createdAt: FIXED_DATE,
		updatedAt: FIXED_DATE,
		...overrides,
	})
}

function makeSeller(overrides: Partial<SellerProfile> = {}): SellerProfile {
	return makeSellerProfile({
		id: 'seller-fixture-1',
		userId: 'user-seller-fixture-1',
		status: 'active',
		city: cityOf('Baltimore', 'MD', { lat: 39.2904, lng: -76.6122 }),
		geography: geoOf({
			'21201': { lat: 39.2946, lng: -76.6239 },
		}),
		priceMin: 400_000,
		priceMax: 600_000,
		sellingMotivation: 'relocating',
		createdAt: FIXED_DATE,
		updatedAt: FIXED_DATE,
		...overrides,
	})
}

describe('priceOverlapRatio', () => {
	test('full overlap', () => {
		expect(
			priceOverlapRatio(
				{ min: 400_000, max: 600_000 },
				{ min: 300_000, max: 700_000 },
			),
		).toBe(1)
	})

	test('partial overlap', () => {
		expect(
			priceOverlapRatio(
				{ min: 400_000, max: 600_000 },
				{ min: 500_000, max: 700_000 },
			),
		).toBe(0.5)
	})

	test('no overlap', () => {
		expect(
			priceOverlapRatio(
				{ min: 400_000, max: 600_000 },
				{ min: 700_000, max: 900_000 },
			),
		).toBe(0)
	})
})

describe('deriveExpectedClientTypes', () => {
	test('first-time buyer', () => {
		const buyer = makeBuyer({ buyingExperience: 'firstTime' })
		expect(deriveExpectedClientTypes(buyer)).toEqual(['firstTimeBuyers'])
	})

	test('experienced buyer', () => {
		const buyer = makeBuyer({ buyingExperience: 'severalTimes' })
		expect(deriveExpectedClientTypes(buyer)).toEqual([
			'experiencedLowMaintenance',
		])
	})

	test('seller without a mapped motivation expects no client types', () => {
		const seller = makeSeller({ sellingMotivation: 'differentSize' })
		expect(deriveExpectedClientTypes(seller)).toEqual([])
	})

	test('life-change seller', () => {
		const seller = makeSeller({ sellingMotivation: 'lifeChange' })
		expect(deriveExpectedClientTypes(seller)).toEqual(['lifeChangeSellers'])
	})

	test('luxury buyer', () => {
		const buyer = makeBuyer({ priceMin: 1_200_000, priceMax: 1_500_000 })
		expect(deriveExpectedClientTypes(buyer)).toContain('luxury')
	})
})

describe('decision support', () => {
	function decisionScore(
		clientSlug: BuyerProfile['decisionStyle'],
		agentSlug: AgentProfile['clientDecisionStyle'],
	): number {
		const agent = makeAgent({ clientDecisionStyle: agentSlug })
		const buyer = makeBuyer({ decisionStyle: clientSlug })
		const result = calculateFitScore(agent, buyer)
		return result.trace.dimensions.find((d) => d.id === 'decisions')!.score
	}

	test('aligned pairs score 1', () => {
		expect(decisionScore('letThemLead', 'theyLetMeLead')).toBe(1)
		expect(decisionScore('walkMeThrough', 'walkThroughFollow')).toBe(1)
		expect(decisionScore('middleGround', 'middleGround')).toBe(1)
		expect(decisionScore('finalCall', 'theirCall')).toBe(1)
	})

	test('adjacent pairs score 0.7', () => {
		expect(decisionScore('walkMeThrough', 'theyLetMeLead')).toBe(0.7)
		expect(decisionScore('walkMeThrough', 'middleGround')).toBe(0.7)
		expect(decisionScore('middleGround', 'theirCall')).toBe(0.7)
	})

	test('opposite poles score 0.1', () => {
		expect(decisionScore('letThemLead', 'theirCall')).toBe(0.1)
		expect(decisionScore('finalCall', 'theyLetMeLead')).toBe(0.1)
	})
})

describe('scoreLocation', () => {
	function baseAgent(overrides: Partial<AgentProfile> = {}): AgentProfile {
		return makeAgent({
			geography: geoOf({}),
			...overrides,
		})
	}

	function baseBuyer(overrides: Partial<BuyerProfile> = {}): BuyerProfile {
		return makeBuyer({
			geography: geoOf({}),
			...overrides,
		})
	}

	test('twin cities: Minneapolis client passes with St. Paul agent', () => {
		const agent = baseAgent({
			city: cityOf('St. Paul', 'MN', { lat: 44.9537, lng: -93.09 }),
		})
		const buyer = baseBuyer({
			city: cityOf('Minneapolis', 'MN', { lat: 44.9778, lng: -93.265 }),
		})
		const result = scoreLocation(buyer, agent)
		expect(result.score).toBeGreaterThan(0)
		expect(result.score).toBeCloseTo(0.54, 1)
	})

	test('metroplex: Fort Worth agent is low-but-qualified for Dallas client', () => {
		const agent = baseAgent({
			city: cityOf('Fort Worth', 'TX', { lat: 32.7555, lng: -97.3308 }),
		})
		const buyer = baseBuyer({
			city: cityOf('Dallas', 'TX', { lat: 32.7767, lng: -96.797 }),
		})
		const result = scoreLocation(buyer, agent)
		expect(result.score).toBeGreaterThan(0)
		expect(result.score).toBeCloseTo(0.25, 1)
	})

	test('Dallas client disqualified from Austin agent', () => {
		const agent = baseAgent({
			city: cityOf('Austin', 'TX', { lat: 30.2672, lng: -97.7431 }),
		})
		const buyer = baseBuyer({
			city: cityOf('Dallas', 'TX', { lat: 32.7767, lng: -96.797 }),
		})
		const result = scoreLocation(buyer, agent)
		expect(result.score).toBe(0)
	})

	test('Dallas client disqualified from Houston agent', () => {
		const agent = baseAgent({
			city: cityOf('Houston', 'TX', { lat: 29.7604, lng: -95.3698 }),
		})
		const buyer = baseBuyer({
			city: cityOf('Dallas', 'TX', { lat: 32.7767, lng: -96.797 }),
		})
		const result = scoreLocation(buyer, agent)
		expect(result.score).toBe(0)
	})

	test('boroughs: Manhattan and Brooklyn both signal', () => {
		const agent = baseAgent({
			city: cityOf('Brooklyn', 'NY', { lat: 40.6782, lng: -73.9442 }),
		})
		const buyer = baseBuyer({
			city: cityOf('Manhattan', 'NY', { lat: 40.7831, lng: -73.9712 }),
		})
		const result = scoreLocation(buyer, agent)
		expect(result.score).toBeGreaterThan(0)
		expect(result.score).toBeCloseTo(0.55, 1)
	})

	test('cross-state metro is blocked by state gate, not distance', () => {
		const agent = baseAgent({
			city: cityOf('Hoboken', 'NJ', { lat: 40.7433, lng: -74.0324 }),
		})
		const buyer = baseBuyer({
			city: cityOf('New York', 'NY', { lat: 40.7128, lng: -74.006 }),
		})
		const result = scoreLocation(buyer, agent)
		expect(result.score).toBeGreaterThan(0)
		const full = calculateFitScore(agent, buyer)
		expect(full.disqualified).toBe(true)
		expect(
			full.trace.disqualifiers.some((d) => d.id === 'state' && d.disqualified),
		).toBe(true)
	})

	test('geo trace carries centers and centroid miles', () => {
		const agent = baseAgent({
			city: cityOf('St. Paul', 'MN', { lat: 44.9537, lng: -93.09 }),
		})
		const buyer = baseBuyer({
			city: cityOf('Minneapolis', 'MN', { lat: 44.9778, lng: -93.265 }),
			geography: geoOf({ '55401': { lat: 44.9834, lng: -93.2666 } }),
		})
		const full = calculateFitScore(agent, buyer)
		const geo = full.trace.geo
		expect(geo?.client.lat).toBeCloseTo(44.9778, 4)
		expect(geo?.agent.lat).toBeCloseTo(44.9537, 4)
		// Minneapolis to the St. Paul city center is ~9 miles
		expect(geo?.centroidMiles).toBeGreaterThan(5)
		expect(geo?.centroidMiles).toBeLessThan(15)
		expect(geo?.cityFit).toBeGreaterThan(0)
	})
})

describe('calculateFitScore', () => {
	test('accepts slug stored format for agent typicalPriceRange', () => {
		const agent = makeAgent({ typicalPriceRange: '400kTo750k' })
		const buyer = makeBuyer({ priceMin: 400_000, priceMax: 750_000 })
		const result = calculateFitScore(agent, buyer)

		expect(result.disqualified).toBe(false)
		expect(
			result.trace.dimensions.find((d) => d.id === 'priceFit')?.score,
		).toBe(1)
		expect(result.fitScore).toBeGreaterThan(0)
	})

	test('a realistic buyer and agent pair is not disqualified', () => {
		const agent = makeAgent({
			id: 'agent-fixture-realistic',
			typicalPriceRange: '400kTo750k',
		})
		const buyer = makeBuyer({ priceMin: 400_000, priceMax: 750_000 })
		const result = calculateFitScore(agent, buyer)

		expect(result.disqualified).toBe(false)
		const priceFit = result.trace.dimensions.find((d) => d.id === 'priceFit')
		expect(priceFit).toBeDefined()
		expect(priceFit?.score).toBeGreaterThan(0)
		expect(priceFit?.explanation).toContain('bucket overlap')
		expect(result.fitScore).toBeGreaterThan(0)
	})

	test('perfect buyer match scores 100', () => {
		const agent = makeAgent({
			geography: geoOf({ '21201': { lat: 39.2946, lng: -76.6239 } }),
			specialties: ['vaMilitary'],
		})
		const buyer = makeBuyer({
			geography: geoOf({ '21201': { lat: 39.2946, lng: -76.6239 } }),
			propertyTypes: [],
			buyingExperience: 'firstTime',
			situationSpecialties: ['vaMilitary'],
		})
		const result = calculateFitScore(agent, buyer)
		expect(result.fitScore).toBe(100)
		expect(result.disqualified).toBe(false)
	})

	test('disqualified for side mismatch', () => {
		const agent = makeAgent({ representationSide: 'seller' })
		const buyer = makeBuyer()
		const result = calculateFitScore(agent, buyer)
		expect(result.disqualified).toBe(true)
		expect(result.fitScore).toBe(0)
	})

	test('disqualified for state mismatch', () => {
		const agent = makeAgent({
			city: cityOf('Arlington', 'VA', { lat: 38.8816, lng: -77.091 }),
		})
		const buyer = makeBuyer()
		const result = calculateFitScore(agent, buyer)
		expect(result.disqualified).toBe(true)
		expect(result.fitScore).toBe(0)
	})

	test('state gate: same state is not disqualified', () => {
		const agent = makeAgent({
			city: cityOf('Towson', 'MD', { lat: 39.4015, lng: -76.6019 }),
		})
		const buyer = makeBuyer()
		const result = calculateFitScore(agent, buyer)
		const stateGate = result.trace.disqualifiers.find((d) => d.id === 'state')
		expect(stateGate?.disqualified).toBe(false)
		expect(stateGate?.detail).toBe('client in MD, agent in MD')
		expect(result.disqualified).toBe(false)
	})

	test('state gate: mismatch is exact and always enforced', () => {
		const agent = makeAgent({
			city: cityOf('Arlington', 'VA', { lat: 38.8816, lng: -77.091 }),
		})
		const buyer = makeBuyer()
		const result = calculateFitScore(agent, buyer)
		const stateGate = result.trace.disqualifiers.find((d) => d.id === 'state')
		expect(stateGate?.disqualified).toBe(true)
		expect(stateGate?.detail).toBe('client in MD, agent in VA')
	})

	test('disqualified for location floor', () => {
		const agent = makeAgent({
			geography: geoOf({ '94101': { lat: 37.7749, lng: -122.4194 } }),
			city: cityOf('San Francisco', 'CA', { lat: 37.7749, lng: -122.4194 }),
		})
		const buyer = makeBuyer({
			geography: geoOf({ '21201': { lat: 39.2946, lng: -76.6239 } }),
			city: cityOf('Baltimore', 'MD', { lat: 39.2904, lng: -76.6122 }),
		})
		const result = calculateFitScore(agent, buyer)
		expect(result.disqualified).toBe(true)
	})

	test('disqualified for price contact', () => {
		const agent = makeAgent({ typicalPriceRange: '1_5mPlus' })
		const buyer = makeBuyer({ priceMin: 200_000, priceMax: 300_000 })
		const result = calculateFitScore(agent, buyer)
		expect(result.disqualified).toBe(true)
	})

	test('adjacent bucket passes price gate', () => {
		const agent = makeAgent({ typicalPriceRange: '750kTo1_5m' })
		const buyer = makeBuyer({ priceMin: 400_000, priceMax: 600_000 })
		const result = calculateFitScore(agent, buyer)
		expect(result.disqualified).toBe(false)
	})

	test('seller match is not disqualified', () => {
		const agent = makeAgent({ representationSide: 'seller' })
		const seller = makeSeller()
		const result = calculateFitScore(agent, seller)
		expect(result.disqualified).toBe(false)
		const dimension = (id: string) =>
			result.trace.dimensions.find((d) => d.id === id)?.score
		expect(dimension('specialization')).toBe(0.45)
		expect(dimension('decisions')).toBe(1)
		expect(dimension('risk')).toBe(1)
		expect(dimension('commission')).toBe(1)
	})

	test('no disqualified agent outranks a qualified one', () => {
		const qualified = makeAgent()
		const disqualified = makeAgent({
			id: 'agent-disqualified',
			city: cityOf('Arlington', 'VA', { lat: 38.8816, lng: -77.091 }),
		})
		const buyer = makeBuyer()
		const qualifiedResult = calculateFitScore(qualified, buyer)
		const disqualifiedResult = calculateFitScore(disqualified, buyer)
		expect(qualifiedResult.fitScore).toBeGreaterThan(
			disqualifiedResult.fitScore,
		)
	})
})

describe('agent price buckets', () => {
	test('all buckets have ranges', () => {
		const buckets: AgentPriceBucket[] = [
			'under400k',
			'400kTo750k',
			'750kTo1_5m',
			'1_5mPlus',
		]
		for (const bucket of buckets) {
			expect(AGENT_PRICE_RANGES[bucket]).toBeDefined()
		}
	})
})

describe('calculateFitScore trace', () => {
	test('stage2 values are internally consistent', () => {
		const agent = makeAgent()
		const buyer = makeBuyer()
		const result = calculateFitScore(agent, buyer)
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
		const buyer = makeBuyer()
		const result = calculateFitScore(agent, buyer)
		const { stage2, agentFit, reciprocalBlend } = result.trace
		expect(reciprocalBlend).toBeDefined()
		const expected =
			(2 * stage2!.consumerScore * (0.5 + 0.5 * agentFit!)) /
			(stage2!.consumerScore + 0.5 + 0.5 * agentFit!)
		expect(reciprocalBlend).toBe(round2(expected))
	})
})

describe('TIE_BAND_THRESHOLD', () => {
	test('is exported as 3', () => {
		expect(TIE_BAND_THRESHOLD).toBe(3)
	})
})

describe('buildTieBands', () => {
	function scored(items: { id: string; fitScore: number }[]) {
		return items.map((item) => ({
			id: item.id,
			score: { fitScore: item.fitScore },
		}))
	}

	test('groups chained scores within threshold', () => {
		const input = scored([
			{ id: 'a', fitScore: 90 },
			{ id: 'b', fitScore: 88 },
			{ id: 'c', fitScore: 86 },
			{ id: 'd', fitScore: 82 },
		])
		const bands = buildTieBands(input)
		expect(bands).toHaveLength(2)
		expect(bands[0]!.map((item) => item.id)).toEqual(['a', 'b', 'c'])
		expect(bands[1]!.map((item) => item.id)).toEqual(['d'])
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
	function scored(score: number) {
		return { id: `agent-${score}`, score: { fitScore: score } }
	}

	test('sorts descending without client id', () => {
		const input = [scored(78), scored(81), scored(71), scored(73)]
		const result = rankWithTieBands(input, undefined)
		expect(result.map((r) => r.score.fitScore)).toEqual([81, 78, 73, 71])
	})

	test('rotates tie bands while preserving relative order', () => {
		const input = [scored(81), scored(78), scored(73), scored(71)]
		const result = rankWithTieBands(input, 'client-a')
		const scores = result.map((r) => r.score.fitScore)

		expect(scores.slice(0, 2)).toEqual(scores[0] === 81 ? [81, 78] : [78, 81])
		expect(scores.slice(2, 4)).toEqual(scores[2] === 73 ? [73, 71] : [71, 73])
		expect(scores).toEqual(expect.arrayContaining([81, 78, 73, 71]))
	})

	test('different clients get different rotations', () => {
		const input = [scored(81), scored(78), scored(75)]
		const clients = ['client-a', 'client-b', 'client-c', 'client-d', 'client-e']
		const rotations = clients.map((clientId) =>
			rankWithTieBands(input, clientId).map((r) => r.score.fitScore),
		)

		const unique = new Set(rotations.map((r) => r.join(',')))
		expect(unique.size).toBeGreaterThan(1)
	})

	test('same client gets the same rotation every time', () => {
		const input = [scored(81), scored(78), scored(75)]
		const first = rankWithTieBands(input, 'client-a').map(
			(r) => r.score.fitScore,
		)
		const second = rankWithTieBands(input, 'client-a').map(
			(r) => r.score.fitScore,
		)
		expect(first).toEqual(second)
	})

	test('no rotation for agents outside the tie band', () => {
		const input = [scored(85), scored(81), scored(78), scored(73)]
		const result = rankWithTieBands(input, 'client-a')
		const scores = result.map((r) => r.score.fitScore)

		expect(scores[0]).toBe(85)
		expect(scores.slice(1, 3)).toEqual(scores[1] === 81 ? [81, 78] : [78, 81])
		expect(scores[3]).toBe(73)
	})
})

describe('rankWithTieBandsDetailed', () => {
	function scored(score: number) {
		return { id: `agent-${score}`, score: { fitScore: score } }
	}

	test('matches rankWithTieBands item order exactly', () => {
		const input = [scored(81), scored(78), scored(73), scored(71), scored(60)]
		for (const clientId of [undefined, 'client-a', 'client-b']) {
			expect(
				rankWithTieBandsDetailed(input, clientId).map((r) => r.item),
			).toEqual(rankWithTieBands(input, clientId))
		}
	})

	test('display ranks are sequential and pre-shuffle ranks are a permutation', () => {
		const input = [scored(81), scored(80), scored(79), scored(70)]
		const result = rankWithTieBandsDetailed(input, 'client-a')

		expect(result.map((r) => r.displayRank)).toEqual([1, 2, 3, 4])
		expect(result.map((r) => r.preShuffleRank).sort((a, b) => a - b)).toEqual([
			1, 2, 3, 4,
		])
	})

	test('pre-shuffle rank reflects the score-sorted position', () => {
		const input = [scored(81), scored(80), scored(79), scored(70)]
		const result = rankWithTieBandsDetailed(input, 'client-a')
		const sortedIds = [...input]
			.sort((a, b) => b.score.fitScore - a.score.fitScore)
			.map((item) => item.id)

		for (const ranked of result) {
			expect(sortedIds[ranked.preShuffleRank - 1]).toBe(ranked.item.id)
		}
	})

	test('band metadata is consistent within each band', () => {
		const input = [scored(81), scored(80), scored(79), scored(70)]
		const result = rankWithTieBandsDetailed(input, 'client-a')

		const firstBand = result.filter((r) => r.bandIndex === 0)
		const secondBand = result.filter((r) => r.bandIndex === 1)
		expect(firstBand).toHaveLength(3)
		expect(secondBand).toHaveLength(1)
		expect(new Set(firstBand.map((r) => r.bandOffset)).size).toBe(1)
		expect(firstBand.every((r) => r.bandSize === 3)).toBe(true)
	})

	test('singleton bands and missing client id never rotate', () => {
		const singleton = rankWithTieBandsDetailed([scored(90)], 'client-a')
		expect(singleton.map((r) => r.bandOffset)).toEqual([0])

		const noClient = rankWithTieBandsDetailed(
			[scored(81), scored(80), scored(79)],
			undefined,
		)
		expect(noClient.every((r) => r.bandOffset === 0)).toBe(true)
		expect(noClient.every((r) => r.displayRank === r.preShuffleRank)).toBe(true)
	})

	test('rotation offset is deterministic per client', () => {
		const input = [scored(81), scored(80), scored(79)]
		const first = rankWithTieBandsDetailed(input, 'client-a')
		const second = rankWithTieBandsDetailed(input, 'client-a')
		expect(first).toEqual(second)
	})

	test('slug agent earns adjacent-bucket credit', () => {
		const agent = makeAgent({ typicalPriceRange: '400kTo750k' })
		const buyer = makeBuyer({ priceMin: 750_000, priceMax: 900_000 })
		const result = calculateFitScore(agent, buyer)
		expect(result.disqualified).toBe(false)
		const priceFit = result.trace.dimensions.find((d) => d.id === 'priceFit')
		expect(priceFit?.score).toBe(0.4)
	})
})
