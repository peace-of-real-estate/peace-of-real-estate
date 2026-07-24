import { makeAgent } from '@tests/support/fixtures/data/agent-profile'
import { mockBuyerProfile } from '@tests/support/fixtures/data/buyer-profile'
import { mockSellerProfile } from '@tests/support/fixtures/data/seller-profile'
import { describe, expect, test } from 'vitest'

import { AGENT_PRICE_RANGES } from '@/lib/price-range'
import type { AgentPriceBucket } from '@/lib/price-range'
import type { BuyerProfile, SellerProfile } from '@/lib/profile/types'

import {
	buildTieBands,
	calculateFitScore,
	deriveExpectedClientTypes,
	rankWithTieBands,
	rankWithTieBandsDetailed,
	scoreLocation,
	tieBandRotation,
	TIE_BAND_THRESHOLD,
	type AgentProfileForScoring,
	type ClientProfileForScoring,
} from './algorithm'
import { priceOverlapRatio } from './utils'

const FIXED_DATE = new Date('2026-01-01T00:00:00Z')

type BuyerForScoring = ClientProfileForScoring & BuyerProfile
type SellerForScoring = ClientProfileForScoring & SellerProfile

function makeBuyer(overrides: Partial<BuyerForScoring> = {}): BuyerForScoring {
	return {
		...mockBuyerProfile,
		id: 'buyer-fixture-1',
		userId: 'user-buyer-fixture-1',
		status: 'active',
		cityId: 'city-fixture-baltimore-md',
		city: 'Baltimore',
		state: 'MD',
		zipCodes: ['21201', '21205'],
		priceMin: 400_000,
		priceMax: 600_000,
		involvementLevel: 'veryInvolved',
		commissionComfort: 'dontUnderstand',
		idealAgentRelationship: 'thinkingPartner',
		decisionMakingNeed: 'numbersData',
		biddingWarResponse: 'factsOptions',
		matchPriorities: [],
		createdAt: FIXED_DATE,
		updatedAt: FIXED_DATE,
		...overrides,
	}
}

function makeSeller(
	overrides: Partial<SellerForScoring> = {},
): SellerForScoring {
	return {
		...mockSellerProfile,
		id: 'seller-fixture-1',
		userId: 'user-seller-fixture-1',
		status: 'active',
		cityId: 'city-fixture-baltimore-md',
		city: 'Baltimore',
		state: 'MD',
		zipCodes: ['21201'],
		priceMin: 400_000,
		priceMax: 600_000,
		involvementLevel: 'keyDetails',
		quickCommunicationChannel: 'phone',
		updateDeliveryMethod: 'phoneThenEmailRecap',
		commissionComfort: 'payFairRate',
		saleMotivation: 'relocation',
		successfulSaleLooksLike: 'strongPriceSmoothProcess',
		homeConnection: 'asset',
		agentSilencePreference: 'milestones',
		representationPreference: 'exclusiveRepresentationOnly',
		matchPriorities: [],
		createdAt: FIXED_DATE,
		updatedAt: FIXED_DATE,
		...overrides,
	}
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
	test('buyer single-family', () => {
		const buyer = makeBuyer({ propertyTypes: ['singleFamily'] })
		expect(deriveExpectedClientTypes(buyer, 'buying')).toEqual([
			'firstTime',
			'moveUp',
		])
	})

	test('seller', () => {
		const seller = makeSeller()
		expect(deriveExpectedClientTypes(seller, 'selling')).toEqual(['seller'])
	})

	test('luxury buyer', () => {
		const buyer = makeBuyer({ priceMin: 1_200_000, priceMax: 1_500_000 })
		expect(deriveExpectedClientTypes(buyer, 'buying')).toContain('luxury')
	})
})

describe('scoreLocation', () => {
	function baseAgent(
		overrides: Partial<AgentProfileForScoring> = {},
	): AgentProfileForScoring {
		return makeAgent({
			zipCodes: [],
			...overrides,
		})
	}

	function baseBuyer(
		overrides: Partial<BuyerForScoring> = {},
	): BuyerForScoring {
		return makeBuyer({
			zipCodes: [],
			...overrides,
		})
	}

	test('twin cities: Minneapolis client passes with St. Paul agent', () => {
		const agent = baseAgent({
			city: 'St. Paul',
			state: 'MN',
			cityCenter: { lat: 44.9537, lng: -93.09 },
		})
		const buyer = baseBuyer({
			city: 'Minneapolis',
			state: 'MN',
			cityCenter: { lat: 44.9778, lng: -93.265 },
		})
		const result = scoreLocation(buyer, agent)
		expect(result.score).toBeGreaterThan(0)
		expect(result.score).toBeCloseTo(0.54, 1)
	})

	test('metroplex: Fort Worth agent is low-but-qualified for Dallas client', () => {
		const agent = baseAgent({
			city: 'Fort Worth',
			state: 'TX',
			cityCenter: { lat: 32.7555, lng: -97.3308 },
		})
		const buyer = baseBuyer({
			city: 'Dallas',
			state: 'TX',
			cityCenter: { lat: 32.7767, lng: -96.797 },
		})
		const result = scoreLocation(buyer, agent)
		expect(result.score).toBeGreaterThan(0)
		expect(result.score).toBeCloseTo(0.25, 1)
	})

	test('Dallas client disqualified from Austin agent', () => {
		const agent = baseAgent({
			city: 'Austin',
			state: 'TX',
			cityCenter: { lat: 30.2672, lng: -97.7431 },
		})
		const buyer = baseBuyer({
			city: 'Dallas',
			state: 'TX',
			cityCenter: { lat: 32.7767, lng: -96.797 },
		})
		const result = scoreLocation(buyer, agent)
		expect(result.score).toBe(0)
	})

	test('Dallas client disqualified from Houston agent', () => {
		const agent = baseAgent({
			city: 'Houston',
			state: 'TX',
			cityCenter: { lat: 29.7604, lng: -95.3698 },
		})
		const buyer = baseBuyer({
			city: 'Dallas',
			state: 'TX',
			cityCenter: { lat: 32.7767, lng: -96.797 },
		})
		const result = scoreLocation(buyer, agent)
		expect(result.score).toBe(0)
	})

	test('boroughs: Manhattan and Brooklyn both signal', () => {
		const agent = baseAgent({
			city: 'Brooklyn',
			state: 'NY',
			cityCenter: { lat: 40.6782, lng: -73.9442 },
		})
		const buyer = baseBuyer({
			city: 'Manhattan',
			state: 'NY',
			cityCenter: { lat: 40.7831, lng: -73.9712 },
		})
		const result = scoreLocation(buyer, agent)
		expect(result.score).toBeGreaterThan(0)
		expect(result.score).toBeCloseTo(0.55, 1)
	})

	test('cross-state metro is blocked by state gate, not distance', () => {
		const agent = baseAgent({
			city: 'Hoboken',
			state: 'NJ',
			cityCenter: { lat: 40.7433, lng: -74.0324 },
		})
		const buyer = baseBuyer({
			city: 'New York',
			state: 'NY',
			cityCenter: { lat: 40.7128, lng: -74.006 },
		})
		const result = scoreLocation(buyer, agent)
		expect(result.score).toBeGreaterThan(0)
		const full = calculateFitScore(agent, buyer, 'buying')
		expect(full.disqualified).toBe(true)
		expect(
			full.trace.disqualifiers.some((d) => d.id === 'state' && d.disqualified),
		).toBe(true)
	})

	test('no city centers and no zips gives zero location score', () => {
		const agent = baseAgent()
		const buyer = baseBuyer()
		const result = scoreLocation(buyer, agent)
		expect(result.score).toBe(0)
		expect(result.geo?.client).toBeUndefined()
		expect(result.geo?.agent).toBeUndefined()
		expect(result.geo?.centroidMiles).toBeUndefined()
	})

	test('geo trace carries centers, source, and centroid miles', () => {
		const agent = baseAgent({
			city: 'St. Paul',
			state: 'MN',
			cityCenter: { lat: 44.9537, lng: -93.09 },
		})
		const buyer = baseBuyer({
			city: 'Minneapolis',
			state: 'MN',
			zipCodes: ['55401'],
		})
		const full = calculateFitScore(agent, buyer, 'buying')
		const geo = full.trace.geo
		expect(geo?.client?.source).toBe('zipCentroid')
		expect(geo?.agent?.source).toBe('cityCenter')
		expect(geo?.agent?.lat).toBeCloseTo(44.9537, 4)
		// Minneapolis 55401 to the St. Paul city center is ~9 miles
		expect(geo?.centroidMiles).toBeGreaterThan(5)
		expect(geo?.centroidMiles).toBeLessThan(15)
		expect(geo?.cityFit).toBeGreaterThan(0)
	})
})

describe('calculateFitScore', () => {
	test('accepts slug stored format for agent typicalPriceRange', () => {
		const agent = makeAgent({ typicalPriceRange: '400kTo750k' })
		const buyer = makeBuyer({ priceMin: 400_000, priceMax: 750_000 })
		const result = calculateFitScore(agent, buyer, 'buying')

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
		const result = calculateFitScore(agent, buyer, 'buying')

		expect(result.disqualified).toBe(false)
		const priceFit = result.trace.dimensions.find((d) => d.id === 'priceFit')
		expect(priceFit).toBeDefined()
		expect(priceFit?.score).toBeGreaterThan(0)
		expect(priceFit?.explanation).toContain('bucket overlap')
		expect(result.fitScore).toBeGreaterThan(0)
	})

	test('perfect buyer match scores 100', () => {
		const agent = makeAgent({ zipCodes: ['21201'] })
		const buyer = makeBuyer({
			zipCodes: ['21201'],
			propertyTypes: [],
			experienceLevel: 'firstTime',
		})
		const result = calculateFitScore(agent, buyer, 'buying')
		expect(result.fitScore).toBe(100)
		expect(result.disqualified).toBe(false)
	})

	test('disqualified for side mismatch', () => {
		const agent = makeAgent({ representationSide: 'sellers' })
		const buyer = makeBuyer()
		const result = calculateFitScore(agent, buyer, 'buying')
		expect(result.disqualified).toBe(true)
		expect(result.fitScore).toBe(0)
	})

	test('disqualified for state mismatch', () => {
		const agent = makeAgent({ state: 'VA' })
		const buyer = makeBuyer({ state: 'MD' })
		const result = calculateFitScore(agent, buyer, 'buying')
		expect(result.disqualified).toBe(true)
		expect(result.fitScore).toBe(0)
	})

	test('disqualified for location floor', () => {
		const agent = makeAgent({
			zipCodes: ['94101'],
			city: 'San Francisco',
			state: 'CA',
		})
		const buyer = makeBuyer({
			zipCodes: ['21201'],
			city: 'Baltimore',
			state: 'MD',
		})
		const result = calculateFitScore(agent, buyer, 'buying')
		expect(result.disqualified).toBe(true)
	})

	test('disqualified for price contact', () => {
		const agent = makeAgent({ typicalPriceRange: '1_5mPlus' })
		const buyer = makeBuyer({ priceMin: 200_000, priceMax: 300_000 })
		const result = calculateFitScore(agent, buyer, 'buying')
		expect(result.disqualified).toBe(true)
	})

	test('adjacent bucket passes price gate', () => {
		const agent = makeAgent({ typicalPriceRange: '750kTo1_5m' })
		const buyer = makeBuyer({ priceMin: 400_000, priceMax: 600_000 })
		const result = calculateFitScore(agent, buyer, 'buying')
		expect(result.disqualified).toBe(false)
	})

	test('fallback score when no client', () => {
		const agent = makeAgent()
		const result = calculateFitScore(agent)
		expect(result.fitScore).toBe(100)
		expect(result.trace.mode).toBe('fallback')
	})

	test('priority boost raises priceFit weight', () => {
		const agent = makeAgent()
		const buyer = makeBuyer({ matchPriorities: ['priceRange'] })
		const result = calculateFitScore(agent, buyer, 'buying')
		const priceDimension = result.trace.dimensions.find(
			(d) => d.id === 'priceFit',
		)
		expect(priceDimension?.boosted).toBe(true)
		expect(priceDimension?.weight).toBeGreaterThan(16)
	})

	test('seller match uses seller matrices', () => {
		const agent = makeAgent({ representationSide: 'sellers' })
		const seller = makeSeller()
		const result = calculateFitScore(agent, seller, 'selling')
		expect(result.disqualified).toBe(false)
		expect(result.fitScore).toBeGreaterThan(0)
		const workingStyle = result.trace.dimensions.find(
			(d) => d.id === 'workingStyle',
		)
		expect(
			workingStyle?.checks.some((c) => c.label === 'home connection'),
		).toBe(true)
	})

	test('no disqualified agent outranks a qualified one', () => {
		const qualified = makeAgent()
		const disqualified = makeAgent({
			id: 'agent-disqualified',
			state: 'VA',
		})
		const buyer = makeBuyer()
		const qualifiedResult = calculateFitScore(qualified, buyer, 'buying')
		const disqualifiedResult = calculateFitScore(disqualified, buyer, 'buying')
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
		const buyer = makeBuyer({ matchPriorities: ['priceRange'] })
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
		const buyer = makeBuyer({ matchPriorities: ['priceRange'] })
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
		const buyer = makeBuyer({ matchPriorities: ['priceRange'] })
		const result = calculateFitScore(agent, buyer, 'buying')
		expect(result.trace.notFitPenalty).toBeDefined()
		expect(result.trace.notFitPenalty!.scoreAfter).toBeCloseTo(
			result.trace.notFitPenalty!.scoreBefore * 0.3,
			2,
		)
	})

	test('notFitPenalty is omitted when not penalized', () => {
		const agent = makeAgent()
		const buyer = makeBuyer({ matchPriorities: ['priceRange'] })
		const result = calculateFitScore(agent, buyer, 'buying')
		expect(result.trace.notFitPenalty).toBeUndefined()
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
		const result = calculateFitScore(agent, buyer, 'buying')
		expect(result.disqualified).toBe(false)
		const priceFit = result.trace.dimensions.find((d) => d.id === 'priceFit')
		expect(priceFit?.score).toBe(0.4)
	})
})
