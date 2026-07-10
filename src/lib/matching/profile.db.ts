import { boolean, pgEnum, text, timestamp } from 'drizzle-orm/pg-core'

import {
	agentClientDescriptionOptions,
	agentCommunicationFrequencyOptions,
	agentCommissionApproachOptions,
	agentDifficultDealInstinctOptions,
	agentResponseTimeOptions,
	agentUnrepresentedBuyerApproachOptions,
	bestClientTypeOptions,
	buyerBiddingWarResponseOptions,
	buyerDecisionMakingNeedOptions,
	buyerExperienceLevelOptions,
	buyerIdealAgentRelationshipOptions,
	commissionComfortOptions,
	involvementLevelOptions,
	optionKeys,
	profileStatusOptions,
	propertyTypeOptions,
	quickCommunicationChannelOptions,
	representationSideOptions,
	responseTimeExpectationOptions,
	sellerAgentDeliveryExpectationsOptions,
	sellerAgentSilencePreferenceOptions,
	sellerHomeConnectionOptions,
	sellerRepresentationPreferenceOptions,
	sellerSaleMotivationOptions,
	sellerSuccessfulSaleLooksLikeOptions,
	updateDeliveryMethodOptions,
} from '@/lib/matching/enums'

export type ProfileStatus =
	| 'draft'
	| 'essentials_submitted'
	| 'active'
	| 'enriched'

const profileStatusEnum = pgEnum(
	'profile_status',
	optionKeys(profileStatusOptions),
)

const representationSideEnum = pgEnum(
	'representation_side',
	optionKeys(representationSideOptions),
)

const buyerExperienceLevelEnum = pgEnum(
	'buyer_experience_level',
	optionKeys(buyerExperienceLevelOptions),
)
const buyerIdealAgentRelationshipEnum = pgEnum(
	'buyer_ideal_agent_relationship',
	optionKeys(buyerIdealAgentRelationshipOptions),
)
const buyerDecisionMakingNeedEnum = pgEnum(
	'buyer_decision_making_need',
	optionKeys(buyerDecisionMakingNeedOptions),
)
const buyerBiddingWarResponseEnum = pgEnum(
	'buyer_bidding_war_response',
	optionKeys(buyerBiddingWarResponseOptions),
)
const quickCommunicationChannelEnum = pgEnum(
	'quick_communication_channel',
	optionKeys(quickCommunicationChannelOptions),
)
const updateDeliveryMethodEnum = pgEnum(
	'update_delivery_method',
	optionKeys(updateDeliveryMethodOptions),
)
const involvementLevelEnum = pgEnum(
	'involvement_level',
	optionKeys(involvementLevelOptions),
)
const responseTimeExpectationEnum = pgEnum(
	'response_time_expectation',
	optionKeys(responseTimeExpectationOptions),
)
const commissionComfortEnum = pgEnum(
	'commission_comfort',
	optionKeys(commissionComfortOptions),
)

const sellerSaleMotivationEnum = pgEnum(
	'seller_sale_motivation',
	optionKeys(sellerSaleMotivationOptions),
)
const sellerSuccessfulSaleLooksLikeEnum = pgEnum(
	'seller_successful_sale_looks_like',
	optionKeys(sellerSuccessfulSaleLooksLikeOptions),
)
const sellerAgentDeliveryExpectationsEnum = pgEnum(
	'seller_agent_delivery_expectations',
	optionKeys(sellerAgentDeliveryExpectationsOptions),
)
const sellerHomeConnectionEnum = pgEnum(
	'seller_home_connection',
	optionKeys(sellerHomeConnectionOptions),
)
const sellerAgentSilencePreferenceEnum = pgEnum(
	'seller_agent_silence_preference',
	optionKeys(sellerAgentSilencePreferenceOptions),
)
const sellerRepresentationPreferenceEnum = pgEnum(
	'seller_representation_preference',
	optionKeys(sellerRepresentationPreferenceOptions),
)

const agentClientDescriptionEnum = pgEnum(
	'agent_client_description',
	optionKeys(agentClientDescriptionOptions),
)
const agentCommunicationFrequencyEnum = pgEnum(
	'agent_communication_frequency',
	optionKeys(agentCommunicationFrequencyOptions),
)
const agentDifficultDealInstinctEnum = pgEnum(
	'agent_difficult_deal_instinct',
	optionKeys(agentDifficultDealInstinctOptions),
)
const agentResponseTimeEnum = pgEnum(
	'agent_response_time',
	optionKeys(agentResponseTimeOptions),
)
const agentCommissionApproachEnum = pgEnum(
	'agent_commission_approach',
	optionKeys(agentCommissionApproachOptions),
)
const agentUnrepresentedBuyerApproachEnum = pgEnum(
	'agent_unrepresented_buyer_approach',
	optionKeys(agentUnrepresentedBuyerApproachOptions),
)

const propertyTypeEnum = pgEnum(
	'property_type',
	optionKeys(propertyTypeOptions),
)

const bestClientTypeEnum = pgEnum(
	'best_client_type',
	optionKeys(bestClientTypeOptions),
)

export type RepresentationSide = 'buying' | 'selling' | 'both'

export const commonClientProfileColumns = {
	// Lifecycle
	status: profileStatusEnum('status').default('draft').notNull(),

	// Profile — required before a profile row is created
	state: text().notNull(),
	city: text().notNull(),
	zipCodes: text('zip_codes').array().notNull().default([]),
	timeline: text().notNull(),
	priceRange: text('price_range').notNull(),
	propertyTypes: propertyTypeEnum('property_types').array().notNull(),

	// Preferences quiz — asked of both buyers and sellers
	involvementLevel: involvementLevelEnum('involvement_level').notNull(),
	quickCommunicationChannel: quickCommunicationChannelEnum(
		'quick_communication_channel',
	).notNull(),
	updateDeliveryMethod: updateDeliveryMethodEnum(
		'update_delivery_method',
	).notNull(),
	commissionComfort: commissionComfortEnum('commission_comfort').notNull(),
	responseTimeExpectation: responseTimeExpectationEnum(
		'response_time_expectation',
	).notNull(),

	// Match tuning — not collected during signup
	matchPriorities: text('match_priorities').array(),
	matchDetails: text('match_details'),
}

export const buyerSpecificProfileColumns = {
	experienceLevel: buyerExperienceLevelEnum('experience_level').notNull(),
	idealAgentRelationship: buyerIdealAgentRelationshipEnum(
		'ideal_agent_relationship',
	).notNull(),
	decisionMakingNeed: buyerDecisionMakingNeedEnum(
		'decision_making_need',
	).notNull(),
	biddingWarResponse: buyerBiddingWarResponseEnum(
		'bidding_war_response',
	).notNull(),
}

export const sellerSpecificProfileColumns = {
	saleMotivation: sellerSaleMotivationEnum('sale_motivation').notNull(),
	successfulSaleLooksLike: sellerSuccessfulSaleLooksLikeEnum(
		'successful_sale_looks_like',
	).notNull(),
	agentDeliveryExpectations: sellerAgentDeliveryExpectationsEnum(
		'agent_delivery_expectations',
	)
		.array()
		.notNull(),
	homeConnection: sellerHomeConnectionEnum('home_connection').notNull(),
	agentSilencePreference: sellerAgentSilencePreferenceEnum(
		'agent_silence_preference',
	).notNull(),
	representationPreference: sellerRepresentationPreferenceEnum(
		'representation_preference',
	).notNull(),
}

export const agentProfileColumns = {
	// Core
	representationSide: representationSideEnum('representation_side').notNull(),
	city: text().notNull(),
	state: text().notNull(),
	typicalPriceRange: text('typical_price_range').notNull(),
	bestClientTypes: bestClientTypeEnum('best_client_types')
		.array()
		.notNull()
		.default([]),
	notFitFor: text('not_fit_for'),

	// Identity
	firstName: text('first_name').notNull(),
	lastName: text('last_name').notNull(),
	brokerageName: text('brokerage_name').notNull(),
	email: text(),
	phone: text(),
	businessAddress: text('business_address'),
	billingAddress: text('billing_address'),
	licenseNumberState: text('license_number_state').notNull(),
	zipCodes: text('zip_codes').array().notNull().default([]),
	yearsLicensed: text('years_licensed'),
	averageTransactions: text('average_transactions'),
	employmentStatus: text('employment_status'),
	licenseProof: text('license_proof'),

	// Work style
	clientDescription: agentClientDescriptionEnum('client_description').notNull(),
	communicationFrequency: agentCommunicationFrequencyEnum(
		'communication_frequency',
	).notNull(),
	quickCommunicationChannel: quickCommunicationChannelEnum(
		'quick_communication_channel',
	).notNull(),
	updateDeliveryMethod: updateDeliveryMethodEnum(
		'update_delivery_method',
	).notNull(),
	difficultDealInstinct: agentDifficultDealInstinctEnum(
		'difficult_deal_instinct',
	).notNull(),
	responseTime: agentResponseTimeEnum('response_time').notNull(),
	commissionApproach: agentCommissionApproachEnum(
		'commission_approach',
	).notNull(),
	unrepresentedBuyerApproach: agentUnrepresentedBuyerApproachEnum(
		'unrepresented_buyer_approach',
	).notNull(),

	// Compliance
	usePaxWriter: boolean('use_pax_writer').default(true).notNull(),
	licenseAttested: boolean('license_attested').default(false).notNull(),
	eoInsuranceStatus: text('eo_insurance_status').notNull(),
	peacePactSigned: boolean('peace_pact_signed').default(false).notNull(),
	peacePactSignature: text('peace_pact_signature').notNull(),
	peacePactSignedAt: timestamp('peace_pact_signed_at', {
		withTimezone: true,
	}),
}
