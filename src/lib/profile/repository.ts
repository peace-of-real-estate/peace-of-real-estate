import { and, eq, inArray, type SQL } from 'drizzle-orm'

import { db } from '@/db/connection'
import {
	agentProfiles,
	agentProfileZips,
	buyerDetails,
	cities,
	cityZips,
	clientProfiles,
	clientProfileZips,
	sellerDetails,
	user,
} from '@/db/schema'
import type { UsPostalCode } from '@/lib/geography/states'
import { toZipGeography, type ResolvedCity } from '@/lib/geography/zip'

import type {
	AgentProfile,
	BuyerProfile,
	ClientProfile,
	ClientRole,
	SellerProfile,
} from './types'

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0]

export type DbOrTx = typeof db | Tx

type CityRow = typeof cities.$inferSelect

type ZipTable = typeof clientProfileZips | typeof agentProfileZips

type ClientProfileBaseRow = typeof clientProfiles.$inferSelect
type BuyerDetailsRow = typeof buyerDetails.$inferSelect
type SellerDetailsRow = typeof sellerDetails.$inferSelect

type ClientProfileBaseValues = Omit<
	typeof clientProfiles.$inferInsert,
	'id' | 'userId' | 'role' | 'createdAt' | 'updatedAt'
>

type BuyerDetailsValues = Omit<BuyerDetailsRow, 'clientProfileId' | 'role'>

type SellerDetailsValues = Omit<SellerDetailsRow, 'clientProfileId' | 'role'>

type AgentProfileValues = Omit<
	typeof agentProfiles.$inferInsert,
	'id' | 'userId' | 'createdAt' | 'updatedAt'
>

export type ClientDetailsTable = typeof buyerDetails | typeof sellerDetails

// ===== Shared ================================================================

// Thrown for profile writes that fail validation the zod schemas can't
// express (cross-row checks). server.ts maps it to a 400; anything else
// escaping a create fn is a genuine server fault and stays a 500.
export class ProfileValidationError extends Error {
	override name = 'ProfileValidationError'
}

// Every profile's `cityId` is a required FK to `cities`, so an inner join
// always resolves.
function resolveCity(row: CityRow): ResolvedCity {
	return {
		id: row.id,
		name: row.name,
		state: row.state,
		center: { lat: row.centerLat, lng: row.centerLng },
	}
}

async function loadGeographyRows(
	zipTable: ZipTable,
	profileIds: string[],
	executor: DbOrTx = db,
) {
	if (profileIds.length === 0) return []
	return executor
		.select({
			profileId: zipTable.profileId,
			zip: cityZips.zip,
			lat: cityZips.lat,
			lng: cityZips.lng,
		})
		.from(zipTable)
		.innerJoin(cityZips, eq(zipTable.cityZipId, cityZips.id))
		.where(inArray(zipTable.profileId, profileIds))
}

// The signup UI only offers zips within the selected city, but the API is
// not the UI: resolve submitted zips to `city_zips` rows scoped to the chosen
// city and reject any that don't belong, so a profile can never claim one
// city while scoring against another city's zips.
async function resolveCityZipIds(tx: Tx, cityId: string, zipCodes: string[]) {
	const uniqueZips = [...new Set(zipCodes)]
	if (uniqueZips.length === 0) return []
	const rows = await tx
		.select({ id: cityZips.id })
		.from(cityZips)
		.where(and(eq(cityZips.cityId, cityId), inArray(cityZips.zip, uniqueZips)))
	if (rows.length !== uniqueZips.length) {
		throw new ProfileValidationError(
			'zipCodes must belong to the selected city',
		)
	}
	return rows.map((row) => row.id)
}

// ===== Internals (unexported) ================================================

type GeographyRows = Awaited<ReturnType<typeof loadGeographyRows>>

type DetailsTableFor<R extends ClientRole> = R extends 'buyer'
	? typeof buyerDetails
	: typeof sellerDetails

type DetailsRowFor<R extends ClientRole> = R extends 'buyer'
	? BuyerDetailsRow
	: SellerDetailsRow

type RoleDetailsPair = {
	[K in ClientRole]: { role: K; details: DetailsRowFor<K> }
}[ClientRole]

type ClientQueryRow<R extends ClientRole> = {
	base: ClientProfileBaseRow
	details: DetailsRowFor<R>
	city: CityRow
}

// The composite FK on the details tables guarantees a row's `role` matches
// its parent, so the caller's literal role is as trustworthy as the row's.
function buildClientProfile(
	pair: { role: 'buyer'; details: BuyerDetailsRow },
	base: ClientProfileBaseRow,
	city: CityRow,
	geographyRows: GeographyRows,
): BuyerProfile
function buildClientProfile(
	pair: { role: 'seller'; details: SellerDetailsRow },
	base: ClientProfileBaseRow,
	city: CityRow,
	geographyRows: GeographyRows,
): SellerProfile
function buildClientProfile(
	pair: RoleDetailsPair,
	base: ClientProfileBaseRow,
	city: CityRow,
	geographyRows: GeographyRows,
): ClientProfile {
	const { role: _baseRole, cityId: _cityId, ...shared } = base
	const resolved = {
		city: resolveCity(city),
		geography: toZipGeography(geographyRows),
	}
	const assemble = <R extends ClientRole>(
		role: R,
		details: DetailsRowFor<R>,
	) => {
		const { clientProfileId: _id, role: _role, ...quiz } = details
		return { ...shared, ...quiz, role, ...resolved }
	}
	if (pair.role === 'buyer') return assemble(pair.role, pair.details)
	return assemble(pair.role, pair.details)
}

function groupByProfile(geographyRows: GeographyRows) {
	const rowsByProfile = new Map<string, GeographyRows>()
	for (const row of geographyRows) {
		const existing = rowsByProfile.get(row.profileId)
		if (existing) existing.push(row)
		else rowsByProfile.set(row.profileId, [row])
	}
	return rowsByProfile
}

function queryClientProfiles<R extends ClientRole>(
	executor: DbOrTx,
	details: DetailsTableFor<R>,
	role: R,
	condition?: SQL,
	limit?: number,
): Promise<ClientQueryRow<R>[]>
async function queryClientProfiles(
	executor: DbOrTx,
	details: ClientDetailsTable,
	role: ClientRole,
	condition?: SQL,
	limit?: number,
): Promise<ClientQueryRow<ClientRole>[]> {
	const query = executor
		.select({ base: clientProfiles, details, city: cities })
		.from(clientProfiles)
		.innerJoin(details, eq(details.clientProfileId, clientProfiles.id))
		.innerJoin(cities, eq(clientProfiles.cityId, cities.id))
		.where(and(eq(clientProfiles.role, role), condition))
		.$dynamic()
	return limit === undefined ? query : query.limit(limit)
}

async function insertZipRows(
	tx: Tx,
	zipTable: ZipTable,
	profileId: string,
	cityId: string,
	zipCodes: string[],
) {
	const cityZipIds = await resolveCityZipIds(tx, cityId, zipCodes)
	if (cityZipIds.length === 0) return
	await tx.insert(zipTable).values(
		cityZipIds.map((cityZipId) => ({
			id: crypto.randomUUID(),
			profileId,
			cityZipId,
			cityId,
		})),
	)
}

async function insertProfile(
	executor: DbOrTx,
	insertBase: (tx: Tx) => Promise<string | undefined>,
	afterInsert: (tx: Tx) => Promise<unknown>,
): Promise<boolean> {
	return executor.transaction(async (tx) => {
		const profileId = await insertBase(tx)
		if (!profileId) return false
		await afterInsert(tx)
		return true
	})
}

// ===== Client ================================================================

type ClientProfileFor<R extends ClientRole> = R extends 'buyer'
	? BuyerProfile
	: SellerProfile

type ClientDetailsValuesFor<R extends ClientRole> = R extends 'buyer'
	? BuyerDetailsValues
	: SellerDetailsValues

function makeClientRepository<R extends ClientRole>(config: {
	role: R
	details: DetailsTableFor<R>
	toProfile: (
		row: ClientQueryRow<R>,
		geographyRows: GeographyRows,
	) => ClientProfileFor<R>
	insertDetails: (
		tx: Tx,
		profileId: string,
		values: ClientDetailsValuesFor<R>,
	) => Promise<unknown>
}) {
	type Profile = ClientProfileFor<R>

	async function loadBy(
		condition: SQL,
		executor: DbOrTx,
	): Promise<Profile | undefined> {
		const [row] = await queryClientProfiles(
			executor,
			config.details,
			config.role,
			condition,
			1,
		)
		if (!row) return undefined
		const geographyRows = await loadGeographyRows(
			clientProfileZips,
			[row.base.id],
			executor,
		)
		return config.toProfile(row, geographyRows)
	}

	return {
		loadByUserId(
			userId: string,
			executor: DbOrTx = db,
		): Promise<Profile | undefined> {
			return loadBy(eq(clientProfiles.userId, userId), executor)
		},

		loadById(
			profileId: string,
			executor: DbOrTx = db,
		): Promise<Profile | undefined> {
			return loadBy(eq(clientProfiles.id, profileId), executor)
		},

		async list(): Promise<Profile[]> {
			const rows = await queryClientProfiles(db, config.details, config.role)
			const rowsByProfile = groupByProfile(
				await loadGeographyRows(
					clientProfileZips,
					rows.map((row) => row.base.id),
				),
			)
			return rows.map((row) =>
				config.toProfile(row, rowsByProfile.get(row.base.id) ?? []),
			)
		},

		insert(
			input: {
				id: string
				userId: string
				now: Date
				base: ClientProfileBaseValues
				details: ClientDetailsValuesFor<R>
				zipCodes: string[]
			},
			executor: DbOrTx = db,
		): Promise<boolean> {
			return insertProfile(
				executor,
				async (tx) => {
					const [profile] = await tx
						.insert(clientProfiles)
						.values({
							id: input.id,
							userId: input.userId,
							role: config.role,
							...input.base,
							createdAt: input.now,
							updatedAt: input.now,
						})
						.onConflictDoNothing({
							target: [clientProfiles.userId, clientProfiles.role],
						})
						.returning({ id: clientProfiles.id })
					return profile?.id
				},
				async (tx) => {
					await config.insertDetails(tx, input.id, input.details)
					await insertZipRows(
						tx,
						clientProfileZips,
						input.id,
						input.base.cityId,
						input.zipCodes,
					)
				},
			)
		},
	}
}

export const Buyer = makeClientRepository({
	role: 'buyer',
	details: buyerDetails,
	toProfile: (row, geographyRows) =>
		buildClientProfile(
			{ role: 'buyer', details: row.details },
			row.base,
			row.city,
			geographyRows,
		),
	insertDetails: (tx, profileId, values) =>
		tx.insert(buyerDetails).values({ clientProfileId: profileId, ...values }),
})

export const Seller = makeClientRepository({
	role: 'seller',
	details: sellerDetails,
	toProfile: (row, geographyRows) =>
		buildClientProfile(
			{ role: 'seller', details: row.details },
			row.base,
			row.city,
			geographyRows,
		),
	insertDetails: (tx, profileId, values) =>
		tx.insert(sellerDetails).values({ clientProfileId: profileId, ...values }),
})

// ===== Agent =================================================================

type AgentProfileRow = typeof agentProfiles.$inferSelect

function toAgentProfile(
	row: AgentProfileRow,
	city: CityRow,
	geographyRows: GeographyRows,
): AgentProfile {
	const { cityId: _cityId, ...agent } = row
	return {
		...agent,
		city: resolveCity(city),
		geography: toZipGeography(geographyRows),
	}
}

export const Agent = {
	async loadByUserId(
		userId: string,
		executor: DbOrTx = db,
	): Promise<AgentProfile | undefined> {
		const [row] = await executor
			.select({ agent: agentProfiles, city: cities })
			.from(agentProfiles)
			.innerJoin(cities, eq(agentProfiles.cityId, cities.id))
			.where(eq(agentProfiles.userId, userId))
			.limit(1)
		if (!row) return undefined
		const geographyRows = await loadGeographyRows(
			agentProfileZips,
			[row.agent.id],
			executor,
		)
		return toAgentProfile(row.agent, row.city, geographyRows)
	},

	// `filter.state` pushes the matching algorithm's state disqualifier into
	// SQL for callers that only serve qualified matches; debug tooling calls
	// this without a filter precisely because it displays the disqualified.
	async listWithUsers(filter: { state?: UsPostalCode | undefined } = {}) {
		const rows = await db
			.select({
				agent: agentProfiles,
				user: {
					id: user.id,
					name: user.name,
					email: user.email,
					emailVerified: user.emailVerified,
					image: user.image,
				},
				city: cities,
			})
			.from(agentProfiles)
			.innerJoin(user, eq(agentProfiles.userId, user.id))
			.innerJoin(cities, eq(agentProfiles.cityId, cities.id))
			.where(filter.state ? eq(cities.state, filter.state) : undefined)
		const rowsByProfile = groupByProfile(
			await loadGeographyRows(
				agentProfileZips,
				rows.map((row) => row.agent.id),
			),
		)
		return rows.map((row) => ({
			agent: toAgentProfile(
				row.agent,
				row.city,
				rowsByProfile.get(row.agent.id) ?? [],
			),
			user: row.user,
		}))
	},

	insert(
		input: {
			id: string
			userId: string
			now: Date
			values: AgentProfileValues
			zipCodes: string[]
		},
		executor: DbOrTx = db,
	): Promise<boolean> {
		return insertProfile(
			executor,
			async (tx) => {
				const [profile] = await tx
					.insert(agentProfiles)
					.values({
						id: input.id,
						userId: input.userId,
						...input.values,
						createdAt: input.now,
						updatedAt: input.now,
					})
					.onConflictDoNothing({ target: agentProfiles.userId })
					.returning({ id: agentProfiles.id })
				return profile?.id
			},
			(tx) =>
				insertZipRows(
					tx,
					agentProfileZips,
					input.id,
					input.values.cityId,
					input.zipCodes,
				),
		)
	},
}
