import { boolean, text, timestamp } from 'drizzle-orm/pg-core'

export type ConsumerProfileStatus =
	| 'draft'
	| 'essentials_submitted'
	| 'active'
	| 'enriched'

export type RepresentationSide = 'buying' | 'selling' | 'both'

export const consumerProfileColumns = {
	// Lifecycle
	status: text().$type<ConsumerProfileStatus>().default('draft').notNull(),

	// Profile
	intent: text().$type<RepresentationSide>().notNull(),
	state: text(),
	city: text(),
	zipCodes: text('zip_codes').array().notNull().default([]),
	timeline: text(),
	priceRange: text('price_range'),
	estimatedHomeValue: text('estimated_home_value'),
	propertyTypes: text('property_types').array(),
	experienceLevel: text('experience_level'),
	preferredContactMethod: text('preferred_contact_method'),
	involvementLevel: text('involvement_level'),
	representationPreference: text('representation_preference'),
	commissionComfort: text('commission_comfort'),
	matchPriorities: text('match_priorities').array(),
	matchDetails: text('match_details'),
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
