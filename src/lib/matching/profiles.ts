import { and, eq, type SQL } from 'drizzle-orm'

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

// Both loaders join `cities` on (city, state) to resolve each profile's city
// center and normalize the join's nullable result via toCityCenter, so every
// caller gets an already-clean ClientProfileForScoring/AgentProfileForScoring
// — nobody downstream has to remember to do that conversion themselves.
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
		.select({
			profile: table,
			cityCenter: { lat: cities.centerLat, lng: cities.centerLng },
		})
		.from(table)
		.leftJoin(
			cities,
			and(eq(table.city, cities.city), eq(table.state, cities.state)),
		)
		.where(where)
		.limit(1)
	return row && { ...row.profile, cityCenter: toCityCenter(row.cityCenter) }
}

export async function loadAgentProfilesWithCityCenter(): Promise<
	{ agent: AgentProfileForScoring; user: User }[]
> {
	const results = await db
		.select({
			agent: agentProfiles,
			user,
			cityCenter: { lat: cities.centerLat, lng: cities.centerLng },
		})
		.from(agentProfiles)
		.innerJoin(user, eq(agentProfiles.userId, user.id))
		.leftJoin(
			cities,
			and(
				eq(agentProfiles.city, cities.city),
				eq(agentProfiles.state, cities.state),
			),
		)
	return results.map((row) => ({
		agent: { ...row.agent, cityCenter: toCityCenter(row.cityCenter) },
		user: row.user,
	}))
}
