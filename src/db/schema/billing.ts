import { sql } from 'drizzle-orm'
import {
	check,
	foreignKey,
	index,
	jsonb,
	pgEnum,
	snakeCase,
	text,
	timestamp,
	uniqueIndex,
} from 'drizzle-orm/pg-core'

import { user } from './auth'
import { clientProfiles } from './profiles'

export const entitlementKey = pgEnum('entitlement_key', [
	'client_lifetime_premium',
	'agent_subscription',
])

export const entitlementSource = pgEnum('entitlement_source', [
	'manual',
	'stripe_checkout',
	'stripe_subscription',
])

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
		clientProfileId: text(),
		fulfilledAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
	},
	(table) => [
		foreignKey({
			columns: [table.clientProfileId],
			foreignColumns: [clientProfiles.id],
			name: 'intro_unlock_fulfillments_client_profile_id_fk',
		}).onDelete('set null'),
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
