import { describe, expect, test } from 'vitest'

import {
	calculateFitScore,
	deriveExpectedClientTypes,
	priceOverlapRatio,
	rankWithTieBands,
	rankWithTieBandsDetailed,
	scoreLocation,
} from '../scoring'
import type {
	AgentProfile,
	BuyerProfile,
	SellerProfile,
} from '@/lib/profile/types'
import { AGENT_PRICE_RANGES } from '@/lib/price-range'
import type { AgentPriceBucket } from '@/lib/price-range'

const FIXED_DATE = new Date('2026-01-01T00:00:00Z')

function makeAgent(overrides: Partial<AgentProfile> = {}): AgentProfile {
	return {
		id: 'agent-fixture-1',
		userId: 'user-agent-fixture-1',
		representationSide: 'buyers',
		city: 'Baltimore',
		state: 'MD',
		typicalPriceRange: '400kTo750k',
		bestClientTypes: ['firstTime', 'moveUp'],
		notFitFor: [] satisfies string[],
		firstName: 'Avery',
		lastName: 'Stone',
		brokerageName: 'Harborline Realty',
		email: 'avery@example.com',
		phone: null,
		businessAddress: null,
		billingAddress: null,
		licenseNumberState: 'LIC-123456-MD',
		zipCodes: ['21201', '21202'],
		cityCenterLatitude: null,
		cityCenterLongitude: null,
		yearsLicensed: '6-10',
		averageTransactions: '6-15',
		employmentStatus: 'Realtor',
		licenseProof: null,
		usePaxWriter: true,
		licenseAttested: true,
		eoInsuranceStatus: 'Active',
		peacePactSigned: true,
		peacePactSignature: 'Avery Stone',
		peacePactSignedAt: FIXED_DATE,
		clientDescription: 'strategicDataDriven',
		communicationFrequency: 'scheduled',
		quickCommunicationChannel: 'text',
		updateDeliveryMethod: 'email',
		difficultDealInstinct: 'factsFast',
		responseTime: 'within30Min',
		commissionApproach: 'proactiveOpen',
		unrepresentedBuyerApproach: 'referSeparateBrokerage',
		createdAt: FIXED_DATE,
		updatedAt: FIXED_DATE,
		...overrides,
	}
}

function makeBuyer(overrides: Partial<BuyerProfile> = {}): BuyerProfile {
	return {
		id: 'buyer-fixture-1',
		userId: 'user-buyer-fixture-1',
		status: 'active',
		state: 'MD',
		city: 'Baltimore',
		zipCodes: ['21201', '21205'],
		cityCenterLatitude: null,
		cityCenterLongitude: null,
		timeline: 'exploring',
		priceRange: '400000-600000',
		propertyTypes: ['singleFamily'],
		experienceLevel: 'firstTime',
		quickCommunicationChannel: 'text',
		updateDeliveryMethod: 'email',
		involvementLevel: 'veryInvolved',
		commissionComfort: 'dontUnderstand',
		responseTimeExpectation: 'within30Min',
		idealAgentRelationship: 'thinkingPartner',
		decisionMakingNeed: 'numbersData',
		biddingWarResponse: 'factsOptions',
		matchPriorities: [],
		matchDetails: null,
		createdAt: FIXED_DATE,
		updatedAt: FIXED_DATE,
		...overrides,
	}
}

function makeSeller(overrides: Partial<SellerProfile> = {}): SellerProfile {
	return {
		id: 'seller-fixture-1',
		userId: 'user-seller-fixture-1',
		status: 'active',
		state: 'MD',
		city: 'Baltimore',
		zipCodes: ['21201'],
		cityCenterLatitude: null,
		cityCenterLongitude: null,
		timeline: 'exploring',
		priceRange: '400000-600000',
		propertyTypes: ['singleFamily'],
		involvementLevel: 'keyDetails',
		quickCommunicationChannel: 'phone',
		updateDeliveryMethod: 'phoneThenEmailRecap',
		commissionComfort: 'payFairRate',
		responseTimeExpectation: 'within30Min',
		matchPriorities: [],
		matchDetails: null,
		saleMotivation: 'relocation',
		successfulSaleLooksLike: 'strongPriceSmoothProcess',
		agentDeliveryExpectations: ['pricedRight', 'greatNegotiatedOutcome'],
		homeConnection: 'asset',
		agentSilencePreference: 'milestones',
		representationPreference: 'exclusiveRepresentationOnly',
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
		const buyer = makeBuyer({ priceRange: '1200000-1500000' })
		expect(deriveExpectedClientTypes(buyer, 'buying')).toContain('luxury')
	})
})

describe('scoreLocation', () => {
	function baseAgent(overrides: Partial<AgentProfile> = {}): AgentProfile {
		return makeAgent({
			zipCodes: [],
			...overrides,
		})
	}

	function baseBuyer(overrides: Partial<BuyerProfile> = {}): BuyerProfile {
		return makeBuyer({
			zipCodes: [],
			...overrides,
		})
	}

	test('twin cities: Minneapolis client passes with St. Paul agent', () => {
		const agent = baseAgent({
			city: 'St. Paul',
			state: 'MN',
			cityCenterLatitude: 44.9537,
			cityCenterLongitude: -93.09,
		})
		const buyer = baseBuyer({
			city: 'Minneapolis',
			state: 'MN',
			cityCenterLatitude: 44.9778,
			cityCenterLongitude: -93.265,
		})
		const result = scoreLocation(buyer, agent)
		expect(result.score).toBeGreaterThan(0)
		expect(result.score).toBeCloseTo(0.54, 1)
	})

	test('metroplex: Fort Worth agent is low-but-qualified for Dallas client', () => {
		const agent = baseAgent({
			city: 'Fort Worth',
			state: 'TX',
			cityCenterLatitude: 32.7555,
			cityCenterLongitude: -97.3308,
		})
		const buyer = baseBuyer({
			city: 'Dallas',
			state: 'TX',
			cityCenterLatitude: 32.7767,
			cityCenterLongitude: -96.797,
		})
		const result = scoreLocation(buyer, agent)
		expect(result.score).toBeGreaterThan(0)
		expect(result.score).toBeCloseTo(0.25, 1)
	})

	test('Dallas client disqualified from Austin agent', () => {
		const agent = baseAgent({
			city: 'Austin',
			state: 'TX',
			cityCenterLatitude: 30.2672,
			cityCenterLongitude: -97.7431,
		})
		const buyer = baseBuyer({
			city: 'Dallas',
			state: 'TX',
			cityCenterLatitude: 32.7767,
			cityCenterLongitude: -96.797,
		})
		const result = scoreLocation(buyer, agent)
		expect(result.score).toBe(0)
	})

	test('Dallas client disqualified from Houston agent', () => {
		const agent = baseAgent({
			city: 'Houston',
			state: 'TX',
			cityCenterLatitude: 29.7604,
			cityCenterLongitude: -95.3698,
		})
		const buyer = baseBuyer({
			city: 'Dallas',
			state: 'TX',
			cityCenterLatitude: 32.7767,
			cityCenterLongitude: -96.797,
		})
		const result = scoreLocation(buyer, agent)
		expect(result.score).toBe(0)
	})

	test('boroughs: Manhattan and Brooklyn both signal', () => {
		const agent = baseAgent({
			city: 'Brooklyn',
			state: 'NY',
			cityCenterLatitude: 40.6782,
			cityCenterLongitude: -73.9442,
		})
		const buyer = baseBuyer({
			city: 'Manhattan',
			state: 'NY',
			cityCenterLatitude: 40.7831,
			cityCenterLongitude: -73.9712,
		})
		const result = scoreLocation(buyer, agent)
		expect(result.score).toBeGreaterThan(0)
		expect(result.score).toBeCloseTo(0.55, 1)
	})

	test('cross-state metro is blocked by state gate, not distance', () => {
		const agent = baseAgent({
			city: 'Hoboken',
			state: 'NJ',
			cityCenterLatitude: 40.7433,
			cityCenterLongitude: -74.0324,
		})
		const buyer = baseBuyer({
			city: 'New York',
			state: 'NY',
			cityCenterLatitude: 40.7128,
			cityCenterLongitude: -74.006,
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
	})
})

describe('calculateFitScore', () => {
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
		const buyer = makeBuyer({ priceRange: '200000-300000' })
		const result = calculateFitScore(agent, buyer, 'buying')
		expect(result.disqualified).toBe(true)
	})

	test('adjacent bucket passes price gate', () => {
		const agent = makeAgent({ typicalPriceRange: '750kTo1_5m' })
		const buyer = makeBuyer({ priceRange: '400000-600000' })
		const result = calculateFitScore(agent, buyer, 'buying')
		expect(result.disqualified).toBe(false)
	})

	test('fallback score when no client', () => {
		const agent = makeAgent()
		const result = calculateFitScore(agent)
		expect(result.fitScore).toBe(100)
		expect(result.trace.mode).toBe('fallback')
	})

	test('fallback penalizes invalid price bucket', () => {
		const agent = makeAgent({ typicalPriceRange: 'legacy $250k - $500k' })
		const result = calculateFitScore(agent)
		expect(result.fitScore).toBeLessThan(100)
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
})
