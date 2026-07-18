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
	uniqueIndex,
} from 'drizzle-orm/pg-core'

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

export const entitlementKey = pgEnum('entitlement_key', ['agent_subscription'])

export const entitlementSource = pgEnum('entitlement_source', [
	'manual',
	'stripe_checkout',
	'stripe_subscription',
])

export const user = pgTable(
	'user',
	{
		id: text().primaryKey().notNull(),
		name: text().notNull(),
		email: text().notNull(),
		emailVerified: boolean().default(false).notNull(),
		image: text(),
		createdAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
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
		createdAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
		updatedAt: timestamp({ withTimezone: true }).notNull(),
	},
	(table) => [
		index('user_entitlements_user_id_index').using('btree', table.userId),
		uniqueIndex('user_entitlements_user_key_index').on(table.userId, table.key),
		foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: 'user_entitlements_user_id_fk',
		}).onDelete('cascade'),
		check(
			'user_entitlements_range_check',
			sql`${table.endsAt} is null or ${table.endsAt} > ${table.startsAt}`,
		),
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
		createdAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
		updatedAt: timestamp({ withTimezone: true }).notNull(),
	},
	(table) => [
		uniqueIndex('session_token_index').on(table.token),
		index('session_user_id_index').using('btree', table.userId),
		foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: 'session_user_id_fk',
		}).onDelete('cascade'),
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
		createdAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
		updatedAt: timestamp({ withTimezone: true }).notNull(),
	},
	(table) => [
		index('account_user_id_index').using('btree', table.userId),
		uniqueIndex('account_provider_account_index').on(
			table.providerId,
			table.accountId,
		),
		index('account_provider_index').using(
			'btree',
			table.providerId,
			table.accountId,
		),
		foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: 'account_user_id_fk',
		}).onDelete('cascade'),
	],
)

export const verification = pgTable(
	'verification',
	{
		id: text().primaryKey().notNull(),
		identifier: text().notNull(),
		value: text().notNull(),
		expiresAt: timestamp({ withTimezone: true }).notNull(),
		createdAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
		updatedAt: timestamp({ withTimezone: true }).notNull(),
	},
	(table) => [
		index('verification_identifier_index').using('btree', table.identifier),
	],
)

export const buyerProfiles = pgTable(
	'buyer_profiles',
	{
		id: text().primaryKey().notNull(),
		userId: text().notNull(),
		...clientLifecycleColumns,
		...clientMatchingColumns,
		...clientWorkStyleColumns,
		...clientMatchTuningColumns,
		...buyerQuizColumns,
		createdAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
		updatedAt: timestamp({ withTimezone: true }).notNull(),
	},
	(table) => [
		uniqueIndex('buyer_profiles_user_id_index').on(table.userId),
		foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: 'buyer_profiles_user_id_fk',
		}).onDelete('cascade'),
	],
)

export const sellerProfiles = pgTable(
	'seller_profiles',
	{
		id: text().primaryKey().notNull(),
		userId: text().notNull(),
		...clientLifecycleColumns,
		...clientMatchingColumns,
		...clientWorkStyleColumns,
		...clientMatchTuningColumns,
		...sellerQuizColumns,
		createdAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
		updatedAt: timestamp({ withTimezone: true }).notNull(),
	},
	(table) => [
		uniqueIndex('seller_profiles_user_id_index').on(table.userId),
		foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: 'seller_profiles_user_id_fk',
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
	],
)

export const cities = pgTable(
	'cities',
	{
		id: text().primaryKey().notNull(),
		city: text().notNull(),
		state: text().notNull(),
		centerLat: doublePrecision().notNull(),
		centerLng: doublePrecision().notNull(),
		createdAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
	},
	(table) => [
		uniqueIndex('cities_city_state_index').on(table.city, table.state),
		index('cities_state_index').on(table.state),
	],
)

export const cityZips = pgTable(
	'city_zips',
	{
		id: text().primaryKey().notNull(),
		cityId: text().notNull(),
		zip: text().notNull(),
		createdAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
	},
	(table) => [
		foreignKey({
			columns: [table.cityId],
			foreignColumns: [cities.id],
			name: 'city_zips_city_id_fk',
		}).onDelete('cascade'),
		index('city_zips_city_id_index').on(table.cityId),
		uniqueIndex('city_zips_city_zip_index').on(table.cityId, table.zip),
		index('city_zips_zip_index').on(table.zip),
	],
)
