import { sql } from 'drizzle-orm'
import {
	check,
	foreignKey,
	index,
	pgEnum,
	snakeCase,
	text,
	timestamp,
	unique,
	uniqueIndex,
	uuid,
} from 'drizzle-orm/pg-core'

import {
	agentIdentityColumns,
	agentMatchingColumns,
	agentQuizColumns,
	buyerQuizColumns,
	clientLifecycleColumns,
	clientMatchingColumns,
	clientWorkStyleColumns,
	sellerQuizColumns,
} from '@/lib/profile/db'

import { user } from './auth'
import { cities, cityZips } from './geo'

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
			sql`${table.priceMin} >= 0 AND ${table.priceMax} <= 2000000 AND ${table.priceMin} <= ${table.priceMax}`,
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
