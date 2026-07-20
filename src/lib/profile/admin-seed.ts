import { createServerFn } from '@tanstack/react-start'
import { eq } from 'drizzle-orm'

import { db } from '@/db/connection'
import { agentProfiles } from '@/db/tables'
import { serverEnv } from '@/env.server'
import { requireAdmin } from '@/lib/auth/session'
import { resolveCityCenter } from '@/lib/geography/zip.server'
import { DEFAULT_PRICE_RANGE, serializePriceRange } from '@/lib/price-range'

import {
	insertBuyerProfile,
	insertSellerProfile,
	loadBuyerProfileByUserId,
	loadSellerProfileByUserId,
} from './repository'
import {
	agentInsertSchema,
	buyerInsertSchema,
	sellerInsertSchema,
} from './types'

const TEST_CITY = { city: 'Austin', state: 'TX' }
const TEST_PRICE_RANGE = serializePriceRange(DEFAULT_PRICE_RANGE)

const ADMIN_TEST_BUYER_PAYLOAD = {
	status: 'active' as const,
	...TEST_CITY,
	timeline: '3months' as const,
	priceRange: TEST_PRICE_RANGE,
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
}

const ADMIN_TEST_SELLER_PAYLOAD = {
	status: 'active' as const,
	...TEST_CITY,
	timeline: '3months' as const,
	priceRange: TEST_PRICE_RANGE,
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
	agentDeliveryExpectations: [
		'reachableResponsive',
		'honestStraightforward',
	] as const,
}

const ADMIN_TEST_AGENT_PAYLOAD = {
	representationSide: 'both' as const,
	...TEST_CITY,
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
	peacePactSignedAt: new Date(),
}

async function ensureAdminAgentProfile(userId: string): Promise<boolean> {
	const [existing] = await db
		.select({ id: agentProfiles.id })
		.from(agentProfiles)
		.where(eq(agentProfiles.userId, userId))
		.limit(1)
	if (existing) return false

	const data = agentInsertSchema.parse(ADMIN_TEST_AGENT_PAYLOAD)
	const center = await resolveCityCenter({ city: data.city, state: data.state })
	const now = new Date()
	const [profile] = await db
		.insert(agentProfiles)
		.values({
			id: crypto.randomUUID(),
			userId,
			...data,
			cityCenterLatitude: center?.latitude,
			cityCenterLongitude: center?.longitude,
			createdAt: now,
			updatedAt: now,
		})
		.onConflictDoNothing({ target: agentProfiles.userId })
		.returning({ id: agentProfiles.id })
	return profile !== undefined
}

export const ensureAdminTestProfiles = createServerFn({
	method: 'POST',
}).handler(async () => {
	const userId = await requireAdmin()

	if (serverEnv.APP_ENV === 'production') {
		throw new Error('Admin test profiles are disabled in production')
	}

	const now = new Date()
	const results = { buyer: false, seller: false, agent: false }

	if (!(await loadBuyerProfileByUserId(userId))) {
		const {
			experienceLevel,
			idealAgentRelationship,
			decisionMakingNeed,
			biddingWarResponse,
			...base
		} = buyerInsertSchema.parse(ADMIN_TEST_BUYER_PAYLOAD)
		results.buyer = await insertBuyerProfile({
			id: crypto.randomUUID(),
			userId,
			now,
			base,
			details: {
				experienceLevel,
				idealAgentRelationship,
				decisionMakingNeed,
				biddingWarResponse,
			},
		})
	}

	if (!(await loadSellerProfileByUserId(userId))) {
		const {
			saleMotivation,
			successfulSaleLooksLike,
			homeConnection,
			agentSilencePreference,
			representationPreference,
			agentDeliveryExpectations,
			...base
		} = sellerInsertSchema.parse(ADMIN_TEST_SELLER_PAYLOAD)
		results.seller = await insertSellerProfile({
			id: crypto.randomUUID(),
			userId,
			now,
			base,
			details: {
				saleMotivation,
				successfulSaleLooksLike,
				homeConnection,
				agentSilencePreference,
				representationPreference,
				agentDeliveryExpectations,
			},
		})
	}

	results.agent = await ensureAdminAgentProfile(userId)

	return results
})

export const getAdminTestProfileStatus = createServerFn({
	method: 'GET',
}).handler(async () => {
	const userId = await requireAdmin()
	const [buyer, seller, agent] = await Promise.all([
		loadBuyerProfileByUserId(userId),
		loadSellerProfileByUserId(userId),
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
