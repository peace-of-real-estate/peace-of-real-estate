import { and, eq, type SQL } from 'drizzle-orm'

import { db } from '@/db/connection'
import { buyerDetails, clientProfiles, sellerDetails } from '@/db/tables'
import { resolveCityCenter } from '@/lib/geography/zip.server'

import type { BuyerProfile, ClientRole, SellerProfile } from './types'

export type DbOrTx =
	| typeof db
	| Parameters<Parameters<typeof db.transaction>[0]>[0]

type ClientProfileBaseRow = typeof clientProfiles.$inferSelect
type BuyerDetailsRow = typeof buyerDetails.$inferSelect
type SellerDetailsRow = typeof sellerDetails.$inferSelect

type ClientProfileBaseValues = Omit<
	typeof clientProfiles.$inferInsert,
	'id' | 'userId' | 'role' | 'createdAt' | 'updatedAt'
>

type BuyerDetailsValues = Omit<BuyerDetailsRow, 'clientProfileId' | 'role'>

type SellerDetailsValues = Omit<SellerDetailsRow, 'clientProfileId' | 'role'>

async function withCityCenter(
	executor: DbOrTx,
	base: ClientProfileBaseValues,
): Promise<ClientProfileBaseValues> {
	if (base.cityCenterLatitude != null && base.cityCenterLongitude != null) {
		return base
	}
	const center = await resolveCityCenter(
		{ city: base.city, state: base.state },
		executor,
	)
	if (!center) return base
	return {
		...base,
		cityCenterLatitude: base.cityCenterLatitude ?? center.latitude,
		cityCenterLongitude: base.cityCenterLongitude ?? center.longitude,
	}
}

function toFlatProfile<D extends BuyerDetailsRow | SellerDetailsRow>(
	base: ClientProfileBaseRow,
	details: D,
) {
	const { role: _baseRole, ...shared } = base
	const { clientProfileId: _profileId, role: _detailRole, ...quiz } = details
	return { ...shared, ...quiz }
}

type ProfileMatch = { userId?: string; profileId?: string }

function profileWhere(role: ClientRole, match: ProfileMatch): SQL | undefined {
	const conditions = [eq(clientProfiles.role, role)]
	if (match.userId) {
		conditions.push(eq(clientProfiles.userId, match.userId))
	}
	if (match.profileId) {
		conditions.push(eq(clientProfiles.id, match.profileId))
	}
	return and(...conditions)
}

type ClientDetailsTable = typeof buyerDetails | typeof sellerDetails

function queryClientProfiles<Details extends ClientDetailsTable>(
	executor: DbOrTx,
	details: Details,
	role: ClientRole,
	match: ProfileMatch,
) {
	const table: ClientDetailsTable = details
	return executor
		.select({ base: clientProfiles, details })
		.from(clientProfiles)
		.innerJoin(table, eq(table.clientProfileId, clientProfiles.id))
		.where(profileWhere(role, match))
}

function queryBuyerProfiles(executor: DbOrTx, match: ProfileMatch) {
	return queryClientProfiles(executor, buyerDetails, 'buyer', match)
}

function querySellerProfiles(executor: DbOrTx, match: ProfileMatch) {
	return queryClientProfiles(executor, sellerDetails, 'seller', match)
}

export async function loadBuyerProfileByUserId(
	userId: string,
): Promise<BuyerProfile | undefined> {
	const [row] = await queryBuyerProfiles(db, { userId }).limit(1)
	return row ? toFlatProfile(row.base, row.details) : undefined
}

export async function loadSellerProfileByUserId(
	userId: string,
): Promise<SellerProfile | undefined> {
	const [row] = await querySellerProfiles(db, { userId }).limit(1)
	return row ? toFlatProfile(row.base, row.details) : undefined
}

export async function loadBuyerProfileById(
	profileId: string,
	executor: DbOrTx = db,
): Promise<BuyerProfile | undefined> {
	const [row] = await queryBuyerProfiles(executor, { profileId }).limit(1)
	return row ? toFlatProfile(row.base, row.details) : undefined
}

export async function loadSellerProfileById(
	profileId: string,
	executor: DbOrTx = db,
): Promise<SellerProfile | undefined> {
	const [row] = await querySellerProfiles(executor, { profileId }).limit(1)
	return row ? toFlatProfile(row.base, row.details) : undefined
}

export async function listBuyerProfiles(): Promise<BuyerProfile[]> {
	const rows = await queryBuyerProfiles(db, {})
	return rows.map((row) => toFlatProfile(row.base, row.details))
}

export async function listSellerProfiles(): Promise<SellerProfile[]> {
	const rows = await querySellerProfiles(db, {})
	return rows.map((row) => toFlatProfile(row.base, row.details))
}

async function insertProfile(
	{
		id,
		userId,
		now,
		role,
		base,
	}: {
		id: string
		userId: string
		now: Date
		role: ClientRole
		base: ClientProfileBaseValues
	},
	executor: DbOrTx,
	insertDetails: (
		tx: Parameters<Parameters<typeof db.transaction>[0]>[0],
	) => Promise<unknown>,
): Promise<boolean> {
	return executor.transaction(async (tx) => {
		const [profile] = await tx
			.insert(clientProfiles)
			.values({
				id,
				userId,
				role,
				...(await withCityCenter(tx, base)),
				createdAt: now,
				updatedAt: now,
			})
			.onConflictDoNothing({
				target: [clientProfiles.userId, clientProfiles.role],
			})
			.returning({ id: clientProfiles.id })
		if (!profile) return false

		await insertDetails(tx)
		return true
	})
}

export async function insertBuyerProfile(
	input: {
		id: string
		userId: string
		now: Date
		base: ClientProfileBaseValues
		details: BuyerDetailsValues
	},
	executor: DbOrTx = db,
): Promise<boolean> {
	return insertProfile({ ...input, role: 'buyer' }, executor, (tx) =>
		tx.insert(buyerDetails).values({
			clientProfileId: input.id,
			...input.details,
		}),
	)
}

export async function insertSellerProfile(
	input: {
		id: string
		userId: string
		now: Date
		base: ClientProfileBaseValues
		details: SellerDetailsValues
	},
	executor: DbOrTx = db,
): Promise<boolean> {
	return insertProfile({ ...input, role: 'seller' }, executor, (tx) =>
		tx.insert(sellerDetails).values({
			clientProfileId: input.id,
			...input.details,
		}),
	)
}
