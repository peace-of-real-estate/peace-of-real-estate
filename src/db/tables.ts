import { sql } from 'drizzle-orm'
import {
	boolean,
	check,
	doublePrecision,
	foreignKey,
	index,
	pgEnum,
	pgTable,
	text,
	timestamp,
	unique,
	uniqueIndex,
} from 'drizzle-orm/pg-core'

import { US_POSTAL_CODES } from '@/lib/geography/states'
import {
	agentComplianceColumns,
	agentIdentityColumns,
	agentMatchingColumns,
	agentQuizColumns,
	buyerQuizColumns,
	clientLifecycleColumns,
	clientMatchingColumns,
	clientMatchTuningColumns,
	clientWorkStyleColumns,
	sellerQuizColumns,
} from '@/lib/profile/db'

export const entitlementKey = pgEnum('entitlement_key', [
	'client_lifetime_premium',
	'agent_subscription',
])

export const entitlementSource = pgEnum('entitlement_source', [
	'manual',
	'stripe_checkout',
	'stripe_subscription',
])

export const usPostalCode = pgEnum('us_postal_code', US_POSTAL_CODES)

export const user = pgTable(
	'user',
	{
		id: text().primaryKey().notNull(),
		name: text().notNull(),
		email: text().notNull(),
		emailVerified: boolean().default(false).notNull(),
		image: text(),
		createdAt: timestamp({ withTimezone: true }).notNull(),
		updatedAt: timestamp({ withTimezone: true }).notNull(),
	},
	(table) => [uniqueIndex('user_email_index').on(table.email)],
)

export const userEntitlements = pgTable(
	'user_entitlements',
	{
		id: text().primaryKey().notNull(),
		userId: text().notNull(),
		key: entitlementKey().notNull(),
		source: entitlementSource().notNull(),
		stripeCustomerId: text(),
		stripePaymentIntentId: text(),
		stripeSubscriptionId: text(),
		startsAt: timestamp({ withTimezone: true }).notNull(),
		endsAt: timestamp({ withTimezone: true }),
		createdAt: timestamp({ withTimezone: true }).notNull(),
		updatedAt: timestamp({ withTimezone: true }).notNull(),
	},
	(table) => [
		index('user_entitlements_user_id_index').using('btree', table.userId),
		uniqueIndex('user_entitlements_user_key_index').on(table.userId, table.key),
		foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: 'user_entitlements_user_id_fk',
		}),
	],
)

export const session = pgTable(
	'session',
	{
		id: text().primaryKey().notNull(),
		userId: text().notNull(),
		token: text().notNull(),
		expiresAt: timestamp({ withTimezone: true }).notNull(),
		ipAddress: text(),
		userAgent: text(),
		createdAt: timestamp({ withTimezone: true }).notNull(),
		updatedAt: timestamp({ withTimezone: true }).notNull(),
	},
	(table) => [
		uniqueIndex('session_token_index').on(table.token),
		index('session_user_id_index').on(table.userId),
		foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: 'session_user_id_fk',
		}),
	],
)

export const account = pgTable(
	'account',
	{
		id: text().primaryKey().notNull(),
		userId: text().notNull(),
		accountId: text().notNull(),
		providerId: text().notNull(),
		accessToken: text(),
		refreshToken: text(),
		accessTokenExpiresAt: timestamp({
			withTimezone: true,
		}),
		refreshTokenExpiresAt: timestamp({
			withTimezone: true,
		}),
		scope: text(),
		idToken: text(),
		password: text(),
		createdAt: timestamp({ withTimezone: true }).notNull(),
		updatedAt: timestamp({ withTimezone: true }).notNull(),
	},
	(table) => [
		index('account_user_id_index').using('btree', table.userId),
		uniqueIndex('account_provider_account_index').on(
			table.providerId,
			table.accountId,
		),
		foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: 'account_user_id_fk',
		}),
	],
)

export const verification = pgTable(
	'verification',
	{
		id: text().primaryKey().notNull(),
		identifier: text().notNull(),
		value: text().notNull(),
		expiresAt: timestamp({ withTimezone: true }).notNull(),
		createdAt: timestamp({ withTimezone: true }).notNull(),
		updatedAt: timestamp({ withTimezone: true }).notNull(),
	},
	(table) => [index('verification_identifier_index').on(table.identifier)],
)

export const cities = pgTable(
	'cities',
	{
		id: text().primaryKey().notNull(),
		name: text().notNull(),
		state: usPostalCode().notNull(),
		centerLat: doublePrecision().notNull(),
		centerLng: doublePrecision().notNull(),
		createdAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
	},
	(table) => [
		uniqueIndex('cities_name_state_index').on(table.name, table.state),
		index('cities_state_index').on(table.state),
	],
)

export const cityZips = pgTable(
	'city_zips',
	{
		id: text().primaryKey().notNull(),
		cityId: text().notNull(),
		zip: text().notNull(),
		// Per-zip centroid from the seed dataset; scoring resolves zip
		// distances from these so the `zipcodes` package is only needed at
		// seed time. Zips without coordinates are excluded at seed time.
		lat: doublePrecision().notNull(),
		lng: doublePrecision().notNull(),
		createdAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
	},
	(table) => [
		// One zip belongs to exactly one city (the seed dataset has one record
		// per zip). Accepted limitation: zips labeled with a borough/neighborhood
		// city (e.g. Brooklyn, Flushing) no longer roll up to their metro city
		// (New York, NY lost ~200 zips when the old NYC_ZIP_RANGES aliasing was
		// removed). Revisit with metro aliasing if a zip ever needs two cities.
		uniqueIndex('city_zips_zip_unique').on(table.zip),
		foreignKey({
			columns: [table.cityId],
			foreignColumns: [cities.id],
			name: 'city_zips_city_id_fk',
		}),
	],
)

export const clientRole = pgEnum('client_role', ['buyer', 'seller'])

export const clientProfiles = pgTable(
	'client_profiles',
	{
		id: text().primaryKey().notNull(),
		userId: text().notNull(),
		role: clientRole().notNull(),
		...clientLifecycleColumns,
		...clientMatchingColumns,
		...clientWorkStyleColumns,
		...clientMatchTuningColumns,
		createdAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
		updatedAt: timestamp({ withTimezone: true }).notNull(),
	},
	(table) => [
		uniqueIndex('client_profiles_user_role_index').on(table.userId, table.role),
		unique('client_profiles_id_role_index').on(table.id, table.role),
		foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: 'client_profiles_user_id_fk',
		}).onDelete('cascade'),
		foreignKey({
			columns: [table.cityId],
			foreignColumns: [cities.id],
			name: 'client_profiles_city_id_fk',
		}),
		check(
			'client_profiles_price_range_check',
			sql`"price_min" >= 0 AND "price_max" <= 2000000 AND "price_min" <= "price_max"`,
		),
	],
)

export const buyerDetails = pgTable(
	'buyer_details',
	{
		clientProfileId: text().primaryKey().notNull(),
		role: clientRole().notNull().default('buyer'),
		...buyerQuizColumns,
	},
	(table) => [
		check('buyer_details_role_check', sql`${table.role} = 'buyer'`),
		foreignKey({
			columns: [table.clientProfileId, table.role],
			foreignColumns: [clientProfiles.id, clientProfiles.role],
			name: 'buyer_details_profile_role_fk',
		}).onDelete('cascade'),
	],
)

export const sellerDetails = pgTable(
	'seller_details',
	{
		clientProfileId: text().primaryKey().notNull(),
		role: clientRole().notNull().default('seller'),
		...sellerQuizColumns,
	},
	(table) => [
		check('seller_details_role_check', sql`${table.role} = 'seller'`),
		foreignKey({
			columns: [table.clientProfileId, table.role],
			foreignColumns: [clientProfiles.id, clientProfiles.role],
			name: 'seller_details_profile_role_fk',
		}).onDelete('cascade'),
	],
)

export const agentProfiles = pgTable(
	'agent_profiles',
	{
		id: text().primaryKey().notNull(),
		userId: text().notNull(),
		...agentMatchingColumns,
		...agentIdentityColumns,
		...agentQuizColumns,
		...agentComplianceColumns,
		createdAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
		updatedAt: timestamp({ withTimezone: true }).notNull(),
	},
	(table) => [
		uniqueIndex('agent_profiles_user_id_index').on(table.userId),
		foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: 'agent_profiles_user_id_fk',
		}).onDelete('cascade'),
		foreignKey({
			columns: [table.cityId],
			foreignColumns: [cities.id],
			name: 'agent_profiles_city_id_fk',
		}),
	],
)

const profileZipColumns = {
	id: text().primaryKey().notNull(),
	cityZipId: text().notNull(),
	createdAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
}

// Each profile's service zips are rows referencing `city_zips` directly, so
// membership in the profile's city is enforced by foreign key rather than by
// application-level checks on an unverifiable string array. Buyer and seller
// profiles share `client_profiles`, so their zips share one join table.
export const clientProfileZips = pgTable(
	'client_profile_zips',
	{
		...profileZipColumns,
		profileId: text().notNull(),
	},
	(table) => [
		uniqueIndex('client_profile_zips_profile_id_city_zip_id_index').on(
			table.profileId,
			table.cityZipId,
		),
		index('client_profile_zips_profile_id_index').on(table.profileId),
		foreignKey({
			columns: [table.profileId],
			foreignColumns: [clientProfiles.id],
			name: 'client_profile_zips_profile_id_fk',
		}).onDelete('cascade'),
		foreignKey({
			columns: [table.cityZipId],
			foreignColumns: [cityZips.id],
			name: 'client_profile_zips_city_zip_id_fk',
		}),
	],
)

export const agentProfileZips = pgTable(
	'agent_profile_zips',
	{
		...profileZipColumns,
		profileId: text().notNull(),
	},
	(table) => [
		uniqueIndex('agent_profile_zips_profile_id_city_zip_id_index').on(
			table.profileId,
			table.cityZipId,
		),
		index('agent_profile_zips_profile_id_index').on(table.profileId),
		foreignKey({
			columns: [table.profileId],
			foreignColumns: [agentProfiles.id],
			name: 'agent_profile_zips_profile_id_fk',
		}).onDelete('cascade'),
		foreignKey({
			columns: [table.cityZipId],
			foreignColumns: [cityZips.id],
			name: 'agent_profile_zips_city_zip_id_fk',
		}),
	],
)
