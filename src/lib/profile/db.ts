import { sql } from 'drizzle-orm'
import { boolean, pgEnum, real, text, timestamp } from 'drizzle-orm/pg-core'
import type {
	MultiQuestion,
	SingleQuestion,
} from '@/lib/profile/question-types'

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

function questionColumn<TSlug extends string>(
	question: SingleQuestion<string, TSlug>,
) {
	return pgEnumFromDefinition(question.options)().notNull()
}

function multiQuestionColumn<TSlug extends string>(
	question: MultiQuestion<string, TSlug>,
) {
	return pgEnumFromDefinition(question.options)().array().notNull()
}

export const clientLifecycleColumns = {
	status: pgEnumFromDefinition(profileStatus)().default('draft').notNull(),
}

export const clientMatchingColumns = {
	state: text().notNull(),
	city: text().notNull(),
	zipCodes: text().array().notNull().default([]),
	cityCenterLatitude: real('city_center_latitude').default(sql`NULL`),
	cityCenterLongitude: real('city_center_longitude').default(sql`NULL`),
	timeline: pgEnumFromDefinition(timeline)().notNull(),
	priceRange: text().notNull(),
	propertyTypes: pgEnumFromDefinition(propertyType)().array().notNull(),
}

export const clientWorkStyleColumns = {
	quickCommunicationChannel: questionColumn(
		buyerQuestions.quickCommunicationChannel,
	),
	updateDeliveryMethod: questionColumn(buyerQuestions.updateDeliveryMethod),
	responseTimeExpectation: questionColumn(
		buyerQuestions.responseTimeExpectation,
	),
	involvementLevel: questionColumn(buyerQuestions.involvementLevel),
	commissionComfort: questionColumn(buyerQuestions.commissionComfort),
}

export const clientMatchTuningColumns = {
	matchPriorities: text().array(),
	matchDetails: text(),
}

export const buyerQuizColumns = {
	experienceLevel: questionColumn(buyerQuestions.experienceLevel),
	idealAgentRelationship: questionColumn(buyerQuestions.idealAgentRelationship),
	decisionMakingNeed: questionColumn(buyerQuestions.decisionMakingNeed),
	biddingWarResponse: questionColumn(buyerQuestions.biddingWarResponse),
}

export const sellerQuizColumns = {
	saleMotivation: questionColumn(sellerQuestions.saleMotivation),
	successfulSaleLooksLike: questionColumn(
		sellerQuestions.successfulSaleLooksLike,
	),
	homeConnection: questionColumn(sellerQuestions.homeConnection),
	agentSilencePreference: questionColumn(
		sellerQuestions.agentSilencePreference,
	),
	representationPreference: questionColumn(
		sellerQuestions.representationPreference,
	),
	agentDeliveryExpectations: multiQuestionColumn(
		sellerQuestions.agentDeliveryExpectations,
	),
}

export const agentMatchingColumns = {
	representationSide: pgEnumFromDefinition(representationSide)().notNull(),
	city: text().notNull(),
	state: text().notNull(),
	typicalPriceRange: text().notNull(),
	bestClientTypes: pgEnumFromDefinition(bestClientType)()
		.array()
		.notNull()
		.default([]),
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
	cityCenterLatitude: real('city_center_latitude').default(sql`NULL`),
	cityCenterLongitude: real('city_center_longitude').default(sql`NULL`),
	yearsLicensed: pgEnumFromDefinition(yearsLicensed)(),
	averageTransactions: pgEnumFromDefinition(averageTransactions)(),
	employmentStatus: text(),
	licenseProof: text(),
}

export const agentQuizColumns = {
	clientDescription: questionColumn(agentQuestions.clientDescription),
	communicationFrequency: questionColumn(agentQuestions.communicationFrequency),
	quickCommunicationChannel: questionColumn(
		agentQuestions.quickCommunicationChannel,
	),
	updateDeliveryMethod: questionColumn(agentQuestions.updateDeliveryMethod),
	difficultDealInstinct: questionColumn(agentQuestions.difficultDealInstinct),
	responseTime: questionColumn(agentQuestions.responseTime),
	commissionApproach: questionColumn(agentQuestions.commissionApproach),
	unrepresentedBuyerApproach: questionColumn(
		agentQuestions.unrepresentedBuyerApproach,
	),
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

export const profileFieldsByFacet = {
	buyer: {
		lifecycle: Object.keys(clientLifecycleColumns),
		matching: Object.keys(clientMatchingColumns),
		workStyle: [
			...Object.keys(clientWorkStyleColumns),
			...Object.keys(buyerQuizColumns),
		],
		matchTuning: Object.keys(clientMatchTuningColumns),
	},
	seller: {
		lifecycle: Object.keys(clientLifecycleColumns),
		matching: Object.keys(clientMatchingColumns),
		workStyle: [
			...Object.keys(clientWorkStyleColumns),
			...Object.keys(sellerQuizColumns),
		],
		matchTuning: Object.keys(clientMatchTuningColumns),
	},
	agent: {
		matching: Object.keys(agentMatchingColumns),
		identity: Object.keys(agentIdentityColumns),
		workStyle: Object.keys(agentQuizColumns),
		compliance: Object.keys(agentComplianceColumns),
	},
} as const
