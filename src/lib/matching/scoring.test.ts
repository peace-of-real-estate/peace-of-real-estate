import { describe, expect, test } from 'vitest'

import {
	buildTieBands,
	rankWithTieBands,
	tieBandRotation,
	calculateFitScore,
	TIE_BAND_THRESHOLD,
} from '@/lib/matching/scoring'
import type { AgentProfile, BuyerProfile } from '@/lib/profile/types'

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

const buyer: BuyerProfile = {
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
	matchPriorities: ['priceRange'],
	matchDetails: null,
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
	test('output is byte-identical to pre-refactor behavior', () => {
		const input = scored([
			{ id: 'a', fitScore: 92 },
			{ id: 'b', fitScore: 90 },
			{ id: 'c', fitScore: 88 },
			{ id: 'd', fitScore: 80 },
		])
		const ranked = rankWithTieBands(input, 'client-abc')
		const ids = ranked.map((item) => item.id)
		expect(ids).toEqual(['b', 'c', 'a', 'd'])
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
