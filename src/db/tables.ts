import { sql } from 'drizzle-orm'
import {
	boolean,
	check,
	doublePrecision,
	foreignKey,
	index,
	jsonb,
	pgEnum,
	pgTable,
	text,
	timestamp,
	unique,
	uniqueIndex,
} from 'drizzle-orm/pg-core'

import {
	ACTIVE_STATUSES,
	buildIntroductionDataChecks,
	INTRODUCTION_STATUSES,
	PAIR_BLOCKING_STATUSES,
	statusIn,
	type IntroductionData,
} from '@/lib/introductions/intro-data'
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
		index('session_user_id_index').using('btree', table.userId),
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
		index('account_provider_index').using(
			'btree',
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
	(table) => [
		index('verification_identifier_index').using('btree', table.identifier),
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

export const introductionStatus = pgEnum(
	'introduction_status',
	INTRODUCTION_STATUSES,
)

export const introductionNotificationKind = pgEnum(
	'introduction_notification_kind',
	['sent', 'accepted', 'declined'],
)

export const cityZips = pgTable(
	'city_zips',
	{
		id: text().primaryKey().notNull(),
		cityId: text().notNull(),
		city: text().notNull(),
		state: text().notNull(),
		zip: text().notNull(),
		createdAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
	},
	(table) => [
		index('city_zips_city_state_index').on(table.city, table.state),
		uniqueIndex('city_zips_city_state_zip_index').on(
			table.city,
			table.state,
			table.zip,
		),
		index('city_zips_zip_index').on(table.zip),
		index('city_zips_city_id_index').on(table.cityId),
		foreignKey({
			columns: [table.cityId],
			foreignColumns: [cities.id],
			name: 'city_zips_city_id_fk',
		}).onDelete('cascade'),
	],
)

export const introductions = pgTable(
	'introductions',
	{
		id: text().primaryKey().notNull(),
		clientProfileId: text().notNull(),
		agentProfileId: text().notNull(),
		status: introductionStatus().default('pending').notNull(),
		data: jsonb('data')
			.$type<IntroductionData>()
			.notNull()
			.default(sql`'{}'::jsonb`),
		createdAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
		updatedAt: timestamp({ withTimezone: true }).notNull(),
	},
	(table) => [
		foreignKey({
			columns: [table.clientProfileId],
			foreignColumns: [clientProfiles.id],
			name: 'introductions_client_profile_id_fk',
		}).onDelete('cascade'),
		foreignKey({
			columns: [table.agentProfileId],
			foreignColumns: [agentProfiles.id],
			name: 'introductions_agent_profile_id_fk',
		}).onDelete('cascade'),
		uniqueIndex('introductions_active_pair_index')
			.on(table.agentProfileId, table.clientProfileId)
			.where(statusIn(table.status, PAIR_BLOCKING_STATUSES)),
		index('introductions_client_active_index')
			.on(table.clientProfileId)
			.where(statusIn(table.status, ACTIVE_STATUSES)),
		index('introductions_client_created_index').on(
			table.clientProfileId,
			table.createdAt,
		),
		index('introductions_agent_status_index').on(
			table.agentProfileId,
			table.status,
		),
		...buildIntroductionDataChecks(table).map(({ name, predicate }) =>
			check(name, predicate),
		),
	],
)

export const connectionNotificationJobs = pgTable(
	'connection_notification_jobs',
	{
		introductionId: text().primaryKey().notNull(),
		agentSentAt: timestamp({ withTimezone: true }),
		clientSentAt: timestamp({ withTimezone: true }),
		createdAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
	},
	(table) => [
		foreignKey({
			columns: [table.introductionId],
			foreignColumns: [introductions.id],
			name: 'connection_notification_jobs_introduction_id_fk',
		}).onDelete('cascade'),
	],
)

export const introductionNotificationJobs = pgTable(
	'introduction_notification_jobs',
	{
		id: text().primaryKey().notNull(),
		introductionId: text().notNull(),
		kind: introductionNotificationKind().notNull(),
		sentAt: timestamp({ withTimezone: true }),
		createdAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
	},
	(table) => [
		foreignKey({
			columns: [table.introductionId],
			foreignColumns: [introductions.id],
			name: 'introduction_notification_jobs_introduction_id_fk',
		}).onDelete('cascade'),
		uniqueIndex('introduction_notification_jobs_intro_kind_index').on(
			table.introductionId,
			table.kind,
		),
		index('introduction_notification_jobs_pending_index')
			.on(table.kind)
			.where(sql`${table.sentAt} is null`),
	],
)

export const introAccessWindows = pgTable(
	'intro_access_windows',
	{
		id: text().primaryKey().notNull(),
		clientProfileId: text().notNull(),
		stripePaymentIntentId: text().notNull(),
		startsAt: timestamp({ withTimezone: true }).notNull(),
		endsAt: timestamp({ withTimezone: true }).notNull(),
		createdAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
		updatedAt: timestamp({ withTimezone: true }).notNull(),
	},
	(table) => [
		foreignKey({
			columns: [table.clientProfileId],
			foreignColumns: [clientProfiles.id],
			name: 'intro_access_windows_client_profile_id_fk',
		}).onDelete('cascade'),
		uniqueIndex('intro_access_windows_profile_index').on(table.clientProfileId),
		uniqueIndex('intro_access_windows_payment_intent_index').on(
			table.stripePaymentIntentId,
		),
		check(
			'intro_access_windows_range_check',
			sql`${table.endsAt} > ${table.startsAt}`,
		),
	],
)
