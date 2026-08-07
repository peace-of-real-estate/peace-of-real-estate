import { describe, expect, test } from 'vitest'
import { parse, safeParse } from 'zod/mini'

import {
	agentInsertSchema,
	buyerInsertSchema,
	sellerInsertSchema,
} from './insert-schemas.server'
import {
	agentCompletedDraftSchema,
	agentDraftSchema,
	buyerCompletedDraftSchema,
	buyerDraftSchema,
	sellerCompletedDraftSchema,
	sellerDraftSchema,
} from './types'

// ===== Client/server schema parity =====
// The client derives zod/mini schemas from profile-fields (types.ts) while the
// server derives classic insert schemas from the drizzle tables
// (insert-schemas.server.ts). These tests are the guard that the two
// derivations cannot drift apart.

const cityId = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'

const clientQuizAnswers = {
	decisionStyle: 'letThemLead',
	contactStyle: 'whenItMatters',
	riskComfort: 'lowRisk',
	commissionPlan: 'negotiate',
	situationSpecialties: ['vaMilitary'],
} as const

const completedBuyer = {
	cityId,
	timeline: 'exploring',
	priceMin: 300_000,
	priceMax: 650_000,
	propertyTypes: ['singleFamily'],
	zipCodes: ['78704'],
	...clientQuizAnswers,
	buyingExperience: 'firstTime',
}

const completedSeller = {
	cityId,
	timeline: '3months',
	priceMin: 400_000,
	priceMax: 750_000,
	propertyTypes: ['condoTownhome', 'multiFamily'],
	zipCodes: [],
	...clientQuizAnswers,
	sellingMotivation: 'differentSize',
}

const completedAgent = {
	representationSide: 'buyer',
	cityId,
	typicalPriceRange: '400kTo750k',
	enjoyedClients: ['firstTimeBuyers'],
	brokerageName: 'PRE Partner Realty',
	licenseNumberState: 'TX-12345',
	yearsLicensed: '6-10',
	energyFocus: ['fightHard', 'calm'],
	clientDecisionStyle: 'theyLetMeLead',
	clientContactStyle: 'regularCheckins',
	riskAdviceComfort: 'moderateRisk',
	commissionStyle: 'openToNegotiating',
	specialties: ['bridgeLoans'],
	zipCodes: ['78704', '78745'],
}

function withoutStatus<T extends Record<string, unknown>>(value: T) {
	const { status: _, ...rest } = value
	return rest
}

describe('draft schema key parity', () => {
	test.each([
		['buyer', buyerDraftSchema, buyerInsertSchema],
		['seller', sellerDraftSchema, sellerInsertSchema],
		['agent', agentDraftSchema, agentInsertSchema],
	] as const)('%s fields match the insert schema', (_, draft, insert) => {
		expect(Object.keys(draft.shape).sort()).toEqual(
			Object.keys(insert.shape).sort(),
		)
	})
})

describe('completed draft parse parity', () => {
	test('buyer', () => {
		const client = parse(buyerCompletedDraftSchema, completedBuyer)
		const server = buyerInsertSchema.parse({
			...completedBuyer,
			status: 'active',
		})
		expect(withoutStatus(server)).toEqual(client)
	})

	test('seller', () => {
		const client = parse(sellerCompletedDraftSchema, completedSeller)
		const server = sellerInsertSchema.parse({
			...completedSeller,
			status: 'active',
		})
		expect(withoutStatus(server)).toEqual(client)
	})

	test('agent', () => {
		const client = parse(agentCompletedDraftSchema, completedAgent)
		const server = agentInsertSchema.parse(completedAgent)
		expect(server).toEqual(client)
	})
})

describe('optional and default field parity', () => {
	test('omitted zipCodes default to [] on both sides', () => {
		const { zipCodes: _zips, ...noZips } = completedBuyer
		const client = parse(buyerCompletedDraftSchema, noZips)
		const server = buyerInsertSchema.parse({ ...noZips, status: 'draft' })
		expect(client.zipCodes).toEqual([])
		expect(server.zipCodes).toEqual([])
	})

	test('omitted situationSpecialties stays absent on both sides', () => {
		const { situationSpecialties: _specialties, ...noSpecialties } =
			completedBuyer
		const client = parse(buyerCompletedDraftSchema, noSpecialties)
		const server = buyerInsertSchema.parse({
			...noSpecialties,
			status: 'draft',
		})
		expect('situationSpecialties' in client).toBe(false)
		expect('situationSpecialties' in server).toBe(false)
	})

	test('nullable yearsLicensed behaves the same on both sides', () => {
		const { yearsLicensed: _years, ...noYears } = completedAgent
		expect(parse(agentCompletedDraftSchema, noYears).yearsLicensed).toBe(
			undefined,
		)
		expect(agentInsertSchema.parse(noYears).yearsLicensed).toBe(undefined)
		const withNull = { ...completedAgent, yearsLicensed: null }
		expect(parse(agentCompletedDraftSchema, withNull).yearsLicensed).toBe(null)
		expect(agentInsertSchema.parse(withNull).yearsLicensed).toBe(null)
	})
})

describe('completed draft validation', () => {
	test('rejects an inverted price range', () => {
		const inverted = { ...completedBuyer, priceMin: 700_000, priceMax: 300_000 }
		expect(safeParse(buyerCompletedDraftSchema, inverted).success).toBe(false)
	})

	test.each([
		['buyer', buyerCompletedDraftSchema, completedBuyer],
		['seller', sellerCompletedDraftSchema, completedSeller],
		['agent', agentCompletedDraftSchema, completedAgent],
	] as const)('%s rejects a missing required field', (_, schema, fixture) => {
		const { cityId: _city, ...missingCity } = fixture
		expect(safeParse(schema, missingCity).success).toBe(false)
	})
})
