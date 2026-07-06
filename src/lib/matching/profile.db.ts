import { boolean, text, timestamp } from 'drizzle-orm/pg-core'

export type ProfileStatus =
	| 'draft'
	| 'essentials_submitted'
	| 'active'
	| 'enriched'

export type RepresentationSide = 'buying' | 'selling' | 'both'

export const commonClientProfileColumns = {
	// Lifecycle
	status: text().$type<ProfileStatus>().default('draft').notNull(),

	// Profile — required before a profile row is created
	state: text().notNull(),
	city: text().notNull(),
	zipCodes: text('zip_codes').array().notNull().default([]),
	timeline: text().notNull(),
	priceRange: text('price_range').notNull(),
	propertyTypes: text('property_types').array().notNull(),

	// Preferences quiz — asked of both buyers and sellers
	involvementLevel: text('involvement_level').notNull(),
	quickCommunicationChannel: text('quick_communication_channel').notNull(),
	updateDeliveryMethod: text('update_delivery_method').notNull(),
	commissionComfort: text('commission_comfort').notNull(),
	responseTimeExpectation: text('response_time_expectation').notNull(),

	// Match tuning — not collected during signup
	matchPriorities: text('match_priorities').array(),
	matchDetails: text('match_details'),
}

export const buyerSpecificProfileColumns = {
	experienceLevel: text('experience_level').notNull(),
	idealAgentRelationship: text('ideal_agent_relationship').notNull(),
	decisionMakingNeed: text('decision_making_need').notNull(),
	biddingWarResponse: text('bidding_war_response').notNull(),
}

export const sellerSpecificProfileColumns = {
	saleMotivation: text('sale_motivation').notNull(),
	successfulSaleLooksLike: text('successful_sale_looks_like').notNull(),
	agentDeliveryExpectations: text('agent_delivery_expectations')
		.array()
		.notNull(),
	homeConnection: text('home_connection').notNull(),
	agentSilencePreference: text('agent_silence_preference').notNull(),
	representationPreference: text('representation_preference').notNull(),
}

export const agentProfileColumns = {
	// Core
	representationSide: text('representation_side')
		.$type<RepresentationSide>()
		.notNull(),
	city: text().notNull(),
	state: text().notNull(),
	typicalPriceRange: text('typical_price_range').notNull(),
	bestClientTypes: text('best_client_types').array().notNull().default([]),
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
	clientDescription: text('client_description').notNull(),
	communicationFrequency: text('communication_frequency').notNull(),
	quickCommunicationChannel: text('quick_communication_channel').notNull(),
	updateDeliveryMethod: text('update_delivery_method').notNull(),
	difficultDealInstinct: text('difficult_deal_instinct').notNull(),
	responseTime: text('response_time').notNull(),
	commissionApproach: text('commission_approach').notNull(),
	unrepresentedBuyerApproach: text('unrepresented_buyer_approach').notNull(),

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
