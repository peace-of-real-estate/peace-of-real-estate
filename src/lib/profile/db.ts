import { integer, pgEnum, text, uuid } from 'drizzle-orm/pg-core'

import { BUCKET_ORDER } from '@/lib/price-range'
import {
	agentQuestions,
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
export const propertyTypeEnum = pgEnumFromDefinition(propertyType)
export const timelineEnum = pgEnumFromDefinition(timeline)

export const clientDecisionStyleEnum = pgEnumFromDefinition(
	buyerQuestions.decisionStyle.options,
)
export const contactStyleEnum = pgEnumFromDefinition(
	buyerQuestions.contactStyle.options,
)
export const riskComfortEnum = pgEnumFromDefinition(
	buyerQuestions.riskComfort.options,
)
export const clientCommissionPlanEnum = pgEnumFromDefinition(
	buyerQuestions.commissionPlan.options,
)
export const specialtyEnum = pgEnumFromDefinition(
	buyerQuestions.situationSpecialties.options,
)
export const buyerExperienceEnum = pgEnumFromDefinition(
	buyerQuestions.buyingExperience.options,
)
export const sellerMotivationEnum = pgEnumFromDefinition(
	sellerQuestions.sellingMotivation.options,
)
export const enjoyedClientTypeEnum = pgEnumFromDefinition(
	agentQuestions.enjoyedClients.options,
)
export const agentEnergyFocusEnum = pgEnumFromDefinition(
	agentQuestions.energyFocus.options,
)
export const agentDecisionStyleEnum = pgEnumFromDefinition(
	agentQuestions.clientDecisionStyle.options,
)
export const agentCommissionStyleEnum = pgEnumFromDefinition(
	agentQuestions.commissionStyle.options,
)
export const agentPriceBucketEnum = pgEnumFromDefinition({
	dbName: 'agent_price_bucket',
	slugs: BUCKET_ORDER,
})

export const clientLifecycleColumns = {
	status: profileStatusEnum().default('draft').notNull(),
}

export const clientMatchingColumns = {
	cityId: uuid().notNull(),
	timeline: timelineEnum().notNull(),
	priceMin: integer().notNull(),
	priceMax: integer().notNull(),
	propertyTypes: propertyTypeEnum().array().notNull(),
}

export const clientWorkStyleColumns = {
	decisionStyle: clientDecisionStyleEnum().notNull(),
	contactStyle: contactStyleEnum().notNull(),
	riskComfort: riskComfortEnum().notNull(),
	commissionPlan: clientCommissionPlanEnum().notNull(),
	situationSpecialties: specialtyEnum().array().notNull().default([]),
}

export const buyerQuizColumns = {
	buyingExperience: buyerExperienceEnum().notNull(),
}

export const sellerQuizColumns = {
	sellingMotivation: sellerMotivationEnum().notNull(),
}

export const agentMatchingColumns = {
	representationSide: representationSideEnum().notNull(),
	cityId: uuid().notNull(),
	typicalPriceRange: agentPriceBucketEnum().notNull(),
	enjoyedClients: enjoyedClientTypeEnum().array().notNull().default([]),
}

export const agentIdentityColumns = {
	brokerageName: text().notNull(),
	licenseNumberState: text().notNull(),
	yearsLicensed: yearsLicensedEnum(),
}

export const agentQuizColumns = {
	energyFocus: agentEnergyFocusEnum().array().notNull(),
	clientDecisionStyle: agentDecisionStyleEnum().notNull(),
	clientContactStyle: contactStyleEnum().notNull(),
	riskAdviceComfort: riskComfortEnum().notNull(),
	commissionStyle: agentCommissionStyleEnum().notNull(),
	specialties: specialtyEnum().array().notNull().default([]),
}
