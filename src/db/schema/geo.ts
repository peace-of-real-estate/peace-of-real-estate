import {
	customType,
	doublePrecision,
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

import { US_POSTAL_CODES } from '@/lib/geography/states'

export const usPostalCode = pgEnum('us_postal_code', US_POSTAL_CODES)

const citext = customType<{ data: string }>({
	dataType: () => 'citext',
})

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
		// per zip). Beta-metro zips (e.g. Brooklyn, Flushing) are aliased to
		// their curated beta city at seed time — see
		// scripts/zip-metro-aliases.ts.
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
