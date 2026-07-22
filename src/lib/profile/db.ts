import { sql } from 'drizzle-orm'
import {
	boolean,
	doublePrecision,
	integer,
	pgEnum,
	text,
	timestamp,
} from 'drizzle-orm/pg-core'

import { BUCKET_ORDER } from '@/lib/price-range'
import {
	agentQuestions,
	averageTransactions,
	bestClientType,
	buyerQuestions,
	profileStatus,
	propertyType,
	representationSide,
	sellerQuestions,
	timeline,
	yearsLicensed,
} from '@/lib/profile/profile-fields'

function pgEnumFromDefinition<TSlug extends string>(definition: {
	readonly dbName: string
	readonly slugs: readonly [TSlug, ...TSlug[]]
}) {
	return pgEnum(definition.dbName, definition.slugs)
}

export const profileStatusEnum = pgEnumFromDefinition(profileStatus)
export const representationSideEnum = pgEnumFromDefinition(representationSide)
export const yearsLicensedEnum = pgEnumFromDefinition(yearsLicensed)
export const averageTransactionsEnum = pgEnumFromDefinition(averageTransactions)
export const propertyTypeEnum = pgEnumFromDefinition(propertyType)
export const bestClientTypeEnum = pgEnumFromDefinition(bestClientType)
export const timelineEnum = pgEnumFromDefinition(timeline)
export const quickCommunicationChannelEnum = pgEnumFromDefinition(
	buyerQuestions.quickCommunicationChannel.options,
)
export const updateDeliveryMethodEnum = pgEnumFromDefinition(
	buyerQuestions.updateDeliveryMethod.options,
)
export const responseTimeExpectationEnum = pgEnumFromDefinition(
	buyerQuestions.responseTimeExpectation.options,
)
export const involvementLevelEnum = pgEnumFromDefinition(
	buyerQuestions.involvementLevel.options,
)
export const commissionComfortEnum = pgEnumFromDefinition(
	buyerQuestions.commissionComfort.options,
)
export const buyerExperienceLevelEnum = pgEnumFromDefinition(
	buyerQuestions.experienceLevel.options,
)
export const buyerIdealAgentRelationshipEnum = pgEnumFromDefinition(
	buyerQuestions.idealAgentRelationship.options,
)
export const buyerDecisionMakingNeedEnum = pgEnumFromDefinition(
	buyerQuestions.decisionMakingNeed.options,
)
export const buyerBiddingWarResponseEnum = pgEnumFromDefinition(
	buyerQuestions.biddingWarResponse.options,
)
export const sellerSaleMotivationEnum = pgEnumFromDefinition(
	sellerQuestions.saleMotivation.options,
)
export const sellerSuccessfulSaleLooksLikeEnum = pgEnumFromDefinition(
	sellerQuestions.successfulSaleLooksLike.options,
)
export const sellerHomeConnectionEnum = pgEnumFromDefinition(
	sellerQuestions.homeConnection.options,
)
export const sellerAgentSilencePreferenceEnum = pgEnumFromDefinition(
	sellerQuestions.agentSilencePreference.options,
)
export const sellerRepresentationPreferenceEnum = pgEnumFromDefinition(
	sellerQuestions.representationPreference.options,
)
export const agentClientDescriptionEnum = pgEnumFromDefinition(
	agentQuestions.clientDescription.options,
)
export const agentCommunicationFrequencyEnum = pgEnumFromDefinition(
	agentQuestions.communicationFrequency.options,
)
export const agentDifficultDealInstinctEnum = pgEnumFromDefinition(
	agentQuestions.difficultDealInstinct.options,
)
export const agentResponseTimeEnum = pgEnumFromDefinition(
	agentQuestions.responseTime.options,
)
export const agentCommissionApproachEnum = pgEnumFromDefinition(
	agentQuestions.commissionApproach.options,
)
export const agentUnrepresentedBuyerApproachEnum = pgEnumFromDefinition(
	agentQuestions.unrepresentedBuyerApproach.options,
)
export const agentPriceBucketEnum = pgEnumFromDefinition({
	dbName: 'agent_price_bucket',
	slugs: BUCKET_ORDER,
})

export const clientLifecycleColumns = {
	status: profileStatusEnum().default('draft').notNull(),
}

export const clientMatchingColumns = {
	state: text().notNull(),
	city: text().notNull(),
	zipCodes: text().array().notNull().default([]),
	cityCenterLatitude: doublePrecision('city_center_latitude').default(
		sql`NULL`,
	),
	cityCenterLongitude: doublePrecision('city_center_longitude').default(
		sql`NULL`,
	),
	timeline: timelineEnum().notNull(),
	priceMin: integer().notNull(),
	priceMax: integer().notNull(),
	propertyTypes: propertyTypeEnum().array().notNull(),
}

export const clientWorkStyleColumns = {
	quickCommunicationChannel: quickCommunicationChannelEnum().notNull(),
	updateDeliveryMethod: updateDeliveryMethodEnum().notNull(),
	responseTimeExpectation: responseTimeExpectationEnum().notNull(),
	involvementLevel: involvementLevelEnum().notNull(),
	commissionComfort: commissionComfortEnum().notNull(),
}

export const clientMatchTuningColumns = {
	matchPriorities: text().array(),
	matchDetails: text(),
}

export const buyerQuizColumns = {
	experienceLevel: buyerExperienceLevelEnum().notNull(),
	idealAgentRelationship: buyerIdealAgentRelationshipEnum().notNull(),
	decisionMakingNeed: buyerDecisionMakingNeedEnum().notNull(),
	biddingWarResponse: buyerBiddingWarResponseEnum().notNull(),
}

export const sellerQuizColumns = {
	saleMotivation: sellerSaleMotivationEnum().notNull(),
	successfulSaleLooksLike: sellerSuccessfulSaleLooksLikeEnum().notNull(),
	homeConnection: sellerHomeConnectionEnum().notNull(),
	agentSilencePreference: sellerAgentSilencePreferenceEnum().notNull(),
	representationPreference: sellerRepresentationPreferenceEnum().notNull(),
}

export const agentMatchingColumns = {
	representationSide: representationSideEnum().notNull(),
	city: text().notNull(),
	state: text().notNull(),
	typicalPriceRange: agentPriceBucketEnum().notNull(),
	bestClientTypes: bestClientTypeEnum().array().notNull().default([]),
	notFitFor: text().array().notNull().default([]),
}

export const agentIdentityColumns = {
	firstName: text().notNull(),
	lastName: text().notNull(),
	brokerageName: text().notNull(),
	email: text(),
	phone: text(),
	businessAddress: text(),
	billingAddress: text(),
	licenseNumberState: text().notNull(),
	zipCodes: text().array().notNull().default([]),
	cityCenterLatitude: doublePrecision('city_center_latitude').default(
		sql`NULL`,
	),
	cityCenterLongitude: doublePrecision('city_center_longitude').default(
		sql`NULL`,
	),
	yearsLicensed: yearsLicensedEnum(),
	averageTransactions: averageTransactionsEnum(),
	employmentStatus: text(),
	licenseProof: text(),
}

export const agentQuizColumns = {
	clientDescription: agentClientDescriptionEnum().notNull(),
	communicationFrequency: agentCommunicationFrequencyEnum().notNull(),
	quickCommunicationChannel: quickCommunicationChannelEnum().notNull(),
	updateDeliveryMethod: updateDeliveryMethodEnum().notNull(),
	difficultDealInstinct: agentDifficultDealInstinctEnum().notNull(),
	responseTime: agentResponseTimeEnum().notNull(),
	commissionApproach: agentCommissionApproachEnum().notNull(),
	unrepresentedBuyerApproach: agentUnrepresentedBuyerApproachEnum().notNull(),
}

export const agentComplianceColumns = {
	usePaxWriter: boolean().default(true).notNull(),
	licenseAttested: boolean().default(false).notNull(),
	eoInsuranceStatus: text().notNull(),
	peacePactSigned: boolean().default(false).notNull(),
	peacePactSignature: text().notNull(),
	peacePactSignedAt: timestamp({
		withTimezone: true,
	}),
}
