import { sql } from 'drizzle-orm'
import {
	boolean,
	check,
	customType,
	doublePrecision,
	foreignKey,
	index,
	jsonb,
	pgEnum,
	snakeCase,
	text,
	timestamp,
	unique,
	uniqueIndex,
	uuid,
} from 'drizzle-orm/pg-core'

import { US_POSTAL_CODES } from '@/lib/geography/states'
import {
	ACTIVE_STATUSES,
	buildIntroductionDataChecks,
	INTRODUCTION_STATUSES,
	PAIR_BLOCKING_STATUSES,
	statusIn,
} from '@/lib/introductions/intro-data'
import {
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

const citext = customType<{ data: string }>({
	dataType: () => 'citext',
})

export const user = snakeCase.table(
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

export const userEntitlements = snakeCase.table(
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
		}).onDelete('cascade'),
	],
)

export const session = snakeCase.table(
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
		}).onDelete('cascade'),
	],
)

export const account = snakeCase.table(
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
		}).onDelete('cascade'),
	],
)

export const verification = snakeCase.table(
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

export const cities = snakeCase.table(
	'cities',
	{
		id: uuid().primaryKey().notNull(),
		name: citext().notNull(),
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

export const cityZips = snakeCase.table(
	'city_zips',
	{
		id: text().primaryKey().notNull(),
		cityId: uuid().notNull(),
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
		index('city_zips_city_id_index').on(table.cityId),
		unique('city_zips_id_city_id_unique').on(table.id, table.cityId),
		foreignKey({
			columns: [table.cityId],
			foreignColumns: [cities.id],
			name: 'city_zips_city_id_fk',
		}),
	],
)

export const clientRole = pgEnum('client_role', ['buyer', 'seller'])

export const clientProfiles = snakeCase.table(
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
		unique('client_profiles_id_city_id_unique').on(table.id, table.cityId),
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

export const buyerDetails = snakeCase.table(
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

export const sellerDetails = snakeCase.table(
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

export const agentProfiles = snakeCase.table(
	'agent_profiles',
	{
		id: text().primaryKey().notNull(),
		userId: text().notNull(),
		...agentMatchingColumns,
		...agentIdentityColumns,
		...agentQuizColumns,
		createdAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
		updatedAt: timestamp({ withTimezone: true }).notNull(),
	},
	(table) => [
		uniqueIndex('agent_profiles_user_id_index').on(table.userId),
		index('agent_profiles_city_id_index').on(table.cityId),
		unique('agent_profiles_id_city_id_unique').on(table.id, table.cityId),
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
	cityId: uuid().notNull(),
	createdAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
}

// Zip↔profile membership is enforced at the database level: the join row's
// `cityId` is pinned to BOTH the profile's `(id, cityId)` and the zip's
// `(id, cityId)` by composite foreign keys, so a row can only commit when
// the zip belongs to the profile's city. Buyer and seller profiles share
// `client_profiles`, so their zips share one join table.
export const clientProfileZips = snakeCase.table(
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
			columns: [table.profileId, table.cityId],
			foreignColumns: [clientProfiles.id, clientProfiles.cityId],
			name: 'client_profile_zips_profile_city_fk',
		}).onDelete('cascade'),
		foreignKey({
			columns: [table.cityZipId, table.cityId],
			foreignColumns: [cityZips.id, cityZips.cityId],
			name: 'client_profile_zips_city_zip_city_fk',
		}),
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

export const agentProfileZips = snakeCase.table(
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
			columns: [table.profileId, table.cityId],
			foreignColumns: [agentProfiles.id, agentProfiles.cityId],
			name: 'agent_profile_zips_profile_city_fk',
		}).onDelete('cascade'),
		foreignKey({
			columns: [table.cityZipId, table.cityId],
			foreignColumns: [cityZips.id, cityZips.cityId],
			name: 'agent_profile_zips_city_zip_city_fk',
		}),
	],
)

export const introductions = snakeCase.table(
	'introductions',
	{
		id: text().primaryKey().notNull(),
		clientProfileId: text().notNull(),
		agentProfileId: text().notNull(),
		status: introductionStatus().default('pending').notNull(),
		acceptedAt: timestamp({ withTimezone: true }),
		connectedAt: timestamp({ withTimezone: true }),
		closedAt: timestamp({ withTimezone: true }),
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

export const connectionNotificationJobs = snakeCase.table(
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

export const introductionNotificationJobs = snakeCase.table(
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

export const introAccessWindows = snakeCase.table(
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
export const introUnlockFulfillments = snakeCase.table(
	'intro_unlock_fulfillments',
	{
		stripePaymentIntentId: text().primaryKey().notNull(),
		clientProfileId: text().notNull(),
		fulfilledAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
	},
	(table) => [
		foreignKey({
			columns: [table.clientProfileId],
			foreignColumns: [clientProfiles.id],
			name: 'intro_unlock_fulfillments_client_profile_id_fk',
		}).onDelete('cascade'),
	],
)

export const introCheckoutReservations = snakeCase.table(
	'intro_checkout_reservations',
	{
		id: text().primaryKey().notNull(),
		clientProfileId: text().notNull(),
		stripeSessionId: text(),
		selectedIntroductionIds: jsonb().$type<string[]>(),
		expiresAt: timestamp({ withTimezone: true }).notNull(),
		createdAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
		updatedAt: timestamp({ withTimezone: true }).notNull(),
	},
	(table) => [
		foreignKey({
			columns: [table.clientProfileId],
			foreignColumns: [clientProfiles.id],
			name: 'intro_checkout_reservations_client_profile_id_fk',
		}).onDelete('cascade'),
		uniqueIndex('intro_checkout_reservations_profile_index').on(
			table.clientProfileId,
		),
		uniqueIndex('intro_checkout_reservations_session_index').on(
			table.stripeSessionId,
		),
	],
)
