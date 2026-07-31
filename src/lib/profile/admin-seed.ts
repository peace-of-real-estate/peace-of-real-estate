import { createServerFn } from '@tanstack/react-start'
import { and, eq } from 'drizzle-orm'

import { db } from '@/db/connection'
import { agentProfiles, cities } from '@/db/schema'
import { serverEnv } from '@/env.server'
import { requireAdmin } from '@/lib/auth/session'

import { Agent, Buyer, Seller } from './repository'
import {
	agentInsertSchema,
	buyerDetailsInsertSchema,
	buyerInsertSchema,
	clientProfileInsertSchema,
	sellerDetailsInsertSchema,
	sellerInsertSchema,
} from './types'

const TEST_CITY = { name: 'Austin', state: 'TX' } as const
const TEST_ZIP_CODES = ['78701']
const TEST_PRICE_RANGE = { priceMin: 400_000, priceMax: 600_000 }

const ADMIN_TEST_BUYER_PAYLOAD = {
	status: 'active' as const,
	timeline: '3months' as const,
	...TEST_PRICE_RANGE,
	propertyTypes: ['singleFamily'] as const,
	quickCommunicationChannel: 'either' as const,
	updateDeliveryMethod: 'email' as const,
	responseTimeExpectation: 'within24Hours' as const,
	involvementLevel: 'keyDetails' as const,
	commissionComfort: 'payFairRate' as const,
	experienceLevel: 'firstTime' as const,
	idealAgentRelationship: 'trustedAdvisor' as const,
	decisionMakingNeed: 'trustedPerspective' as const,
	biddingWarResponse: 'factsOptions' as const,
	zipCodes: TEST_ZIP_CODES,
}

const ADMIN_TEST_SELLER_PAYLOAD = {
	status: 'active' as const,
	timeline: '3months' as const,
	...TEST_PRICE_RANGE,
	propertyTypes: ['singleFamily'] as const,
	quickCommunicationChannel: 'either' as const,
	updateDeliveryMethod: 'email' as const,
	responseTimeExpectation: 'within24Hours' as const,
	involvementLevel: 'keyDetails' as const,
	commissionComfort: 'payFairRate' as const,
	saleMotivation: 'rightTime' as const,
	successfulSaleLooksLike: 'strongPriceSmoothProcess' as const,
	homeConnection: 'asset' as const,
	agentSilencePreference: 'milestones' as const,
	representationPreference: 'broadConnections' as const,
	zipCodes: TEST_ZIP_CODES,
}

const ADMIN_TEST_AGENT_PAYLOAD = {
	representationSide: 'both' as const,
	typicalPriceRange: '400kTo750k' as const,
	bestClientTypes: ['firstTime', 'moveUp'] as const,
	notFitFor: [] as const,
	firstName: 'Admin',
	lastName: 'Test Agent',
	brokerageName: 'PRE Internal Testing',
	licenseNumberState: 'ADMIN-TEST-TX',
	yearsLicensed: '6-10' as const,
	averageTransactions: '6-15' as const,
	employmentStatus: 'Full-time',
	clientDescription: 'calmSteady' as const,
	communicationFrequency: 'milestones' as const,
	quickCommunicationChannel: 'either' as const,
	updateDeliveryMethod: 'email' as const,
	difficultDealInstinct: 'slowItDown' as const,
	responseTime: 'within24Hours' as const,
	commissionApproach: 'proactiveOpen' as const,
	unrepresentedBuyerApproach: 'referSeparateBrokerage' as const,
	licenseAttested: true,
	eoInsuranceStatus: 'active',
	peacePactSigned: true,
	peacePactSignature: 'Admin Test Agent',
	zipCodes: TEST_ZIP_CODES,
}

async function loadTestCityId(): Promise<string> {
	const [row] = await db
		.select({ id: cities.id })
		.from(cities)
		.where(
			and(eq(cities.name, TEST_CITY.name), eq(cities.state, TEST_CITY.state)),
		)
		.limit(1)
	if (!row) {
		throw new Error(
			`Test city ${TEST_CITY.name}, ${TEST_CITY.state} is not seeded`,
		)
	}
	return row.id
}

async function ensureAdminAgentProfile(
	userId: string,
	cityId: string,
): Promise<boolean> {
	const [existing] = await db
		.select({ id: agentProfiles.id })
		.from(agentProfiles)
		.where(eq(agentProfiles.userId, userId))
		.limit(1)
	if (existing) return false

	const now = new Date()
	const { zipCodes, ...values } = agentInsertSchema.parse({
		...ADMIN_TEST_AGENT_PAYLOAD,
		peacePactSignedAt: now,
		cityId,
	})
	return Agent.insert({
		id: crypto.randomUUID(),
		userId,
		now,
		values,
		zipCodes,
	})
}

export const ensureAdminTestProfiles = createServerFn({
	method: 'POST',
}).handler(async () => {
	const userId = await requireAdmin()

	if (serverEnv.APP_ENV === 'production') {
		throw new Error('Admin test profiles are disabled in production')
	}

	const now = new Date()
	const cityId = await loadTestCityId()
	const results = { buyer: false, seller: false, agent: false }

	if (!(await Buyer.loadByUserId(userId))) {
		const parsed = buyerInsertSchema.parse({
			...ADMIN_TEST_BUYER_PAYLOAD,
			cityId,
		})
		const { zipCodes, ...base } = clientProfileInsertSchema.parse(parsed)
		const details = buyerDetailsInsertSchema.parse(parsed)
		results.buyer = await Buyer.insert({
			id: crypto.randomUUID(),
			userId,
			now,
			base,
			details,
			zipCodes,
		})
	}

	if (!(await Seller.loadByUserId(userId))) {
		const parsed = sellerInsertSchema.parse({
			...ADMIN_TEST_SELLER_PAYLOAD,
			cityId,
		})
		const { zipCodes, ...base } = clientProfileInsertSchema.parse(parsed)
		const details = sellerDetailsInsertSchema.parse(parsed)
		results.seller = await Seller.insert({
			id: crypto.randomUUID(),
			userId,
			now,
			base,
			details,
			zipCodes,
		})
	}

	results.agent = await ensureAdminAgentProfile(userId, cityId)

	return results
})

export const getAdminTestProfileStatus = createServerFn({
	method: 'GET',
}).handler(async () => {
	const userId = await requireAdmin()
	const [buyer, seller, agent] = await Promise.all([
		Buyer.loadByUserId(userId),
		Seller.loadByUserId(userId),
		db
			.select({ id: agentProfiles.id })
			.from(agentProfiles)
			.where(eq(agentProfiles.userId, userId))
			.limit(1),
	])
	return {
		hasBuyer: Boolean(buyer),
		hasSeller: Boolean(seller),
		hasAgent: agent.length > 0,
	}
})
