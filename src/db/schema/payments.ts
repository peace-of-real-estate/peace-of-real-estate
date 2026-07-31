import {
	foreignKey,
	jsonb,
	snakeCase,
	text,
	timestamp,
	uniqueIndex,
} from 'drizzle-orm/pg-core'

import { clientProfiles } from './profiles'

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
