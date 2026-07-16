import { describe, expect, test } from 'vitest'

import type { AgentProfile, BuyerProfile } from '@/lib/profile/types'

import { calculateFitScore } from './algorithm'

const FIXED_DATE = new Date('2026-01-01T00:00:00Z')

function makeAgent(overrides: Partial<AgentProfile> = {}): AgentProfile {
	return {
		id: 'agent-fixture-1',
		userId: 'user-agent-fixture-1',
		representationSide: 'both',
		city: 'Baltimore',
		state: 'MD',
		typicalPriceRange: '300000-600000',
		bestClientTypes: ['firstTime', 'moveUp'],
		notFitFor: null,
		firstName: 'Avery',
		lastName: 'Stone',
		brokerageName: 'Harborline Realty',
		email: 'avery@example.com',
		phone: null,
		businessAddress: null,
		billingAddress: null,
		licenseNumberState: 'LIC-123456-MD',
		zipCodes: ['21201', '21202'],
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
		responseTime: 'within10Min',
		commissionApproach: 'proactiveOpen',
		unrepresentedBuyerApproach: 'representSellerOnly',
		createdAt: FIXED_DATE,
		updatedAt: FIXED_DATE,
		...overrides,
	}
}

function makeBuyer(priceRange: string): BuyerProfile {
	return {
		id: 'buyer-fixture-1',
		userId: 'user-buyer-fixture-1',
		status: 'active',
		state: 'MD',
		city: 'Baltimore',
		zipCodes: ['21201', '21205'],
		timeline: 'exploring',
		priceRange,
		propertyTypes: ['singleFamily'],
		experienceLevel: 'firstTime',
		quickCommunicationChannel: 'text',
		updateDeliveryMethod: 'email',
		involvementLevel: 'veryInvolved',
		commissionComfort: 'negotiate',
		responseTimeExpectation: 'within10Min',
		idealAgentRelationship: 'trustedAdvisor',
		decisionMakingNeed: 'numbersData',
		biddingWarResponse: 'factsOptions',
		matchPriorities: ['priceRange'],
		matchDetails: null,
		createdAt: FIXED_DATE,
		updatedAt: FIXED_DATE,
	}
}

describe('calculateFitScore', () => {
	test('accepts min-max stored format for both client and agent', () => {
		const agent = makeAgent({ typicalPriceRange: '400000-750000' })
		const buyer = makeBuyer('400000-750000')
		const result = calculateFitScore(agent, buyer, 'buyers')

		expect(result.disqualified).toBe(false)
		expect(
			result.trace.dimensions.find((d) => d.id === 'priceFit')?.score,
		).toBe(1)
		expect(result.fitScore).toBeGreaterThan(0)
	})

	test('accepts slug stored format for agent typicalPriceRange', () => {
		const agent = makeAgent({ typicalPriceRange: '400kTo750k' })
		const buyer = makeBuyer('400000-750000')
		const result = calculateFitScore(agent, buyer, 'buyers')

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
		const buyer = makeBuyer('400000-750000')
		const result = calculateFitScore(agent, buyer, 'buyers')

		expect(result.disqualified).toBe(false)
		const priceFit = result.trace.dimensions.find((d) => d.id === 'priceFit')
		expect(priceFit).toBeDefined()
		expect(priceFit?.score).toBeGreaterThan(0)
		expect(priceFit?.explanation).toContain('covers')
		expect(result.fitScore).toBeGreaterThan(0)
	})

	test('returns zero price fit when agent range is unparseable', () => {
		const agent = makeAgent({ typicalPriceRange: 'legacy $250k - $500k' })
		const buyer = makeBuyer('400000-750000')
		const result = calculateFitScore(agent, buyer, 'buyers')

		expect(result.disqualified).toBe(false)
		const priceFit = result.trace.dimensions.find((d) => d.id === 'priceFit')
		expect(priceFit?.score).toBe(0)
	})
})
