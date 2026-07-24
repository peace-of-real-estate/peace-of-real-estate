import { eq, type SQL } from 'drizzle-orm'

import { db } from '@/db/connection'
import {
	agentProfiles,
	buyerProfiles,
	cities,
	sellerProfiles,
	user,
} from '@/db/tables'
import { toCityCenter } from '@/lib/geography/zip'

import {
	type AgentProfileForScoring,
	type ClientProfileForScoring,
} from './scoring'

type User = typeof user.$inferSelect

// Every profile's `cityId` is a required FK to `cities`, so both loaders can
// innerJoin it to resolve city/state and city center in one query — nobody
// downstream has to remember to do that lookup or normalization themselves.
const cityJoinColumns = {
	city: cities.city,
	state: cities.state,
	cityCenter: { lat: cities.centerLat, lng: cities.centerLng },
}

export async function loadClientProfileWithCityCenter(
	table: typeof buyerProfiles | typeof sellerProfiles,
	where: SQL,
): Promise<ClientProfileForScoring | undefined> {
	const [row] = await db
		.select({ profile: table, ...cityJoinColumns })
		.from(table)
		.innerJoin(cities, eq(table.cityId, cities.id))
		.where(where)
		.limit(1)
	return (
		row && {
			...row.profile,
			city: row.city,
			state: row.state,
			cityCenter: toCityCenter(row.cityCenter),
		}
	)
}

export async function loadAgentProfilesWithCityCenter(): Promise<
	{ agent: AgentProfileForScoring; user: User }[]
> {
	const results = await db
		.select({ agent: agentProfiles, user, ...cityJoinColumns })
		.from(agentProfiles)
		.innerJoin(user, eq(agentProfiles.userId, user.id))
		.innerJoin(cities, eq(agentProfiles.cityId, cities.id))
	return results.map((row) => ({
		agent: {
			...row.agent,
			city: row.city,
			state: row.state,
			cityCenter: toCityCenter(row.cityCenter),
		},
		user: row.user,
	}))
}
