import {
	agentProfiles,
	agentProfileZips,
	buyerDetails,
	cities,
	cityZips,
	clientProfiles,
	clientProfileZips,
	introAccessWindows,
	introductions,
	user,
} from '@/db/schema'
import type { ResolvedCity, ZipGeography } from '@/lib/geography/zip'
import type { ProfileStatus } from '@/lib/profile/profile-fields'

import type { Database } from '../db'
import { makeIntroUser } from './user'

const HOUR_MS = 3_600_000
const DAY_MS = 86_400_000

export function hoursAgo(hours: number): Date {
	return new Date(Date.now() - hours * HOUR_MS)
}

export function daysAgo(days: number): Date {
	return new Date(Date.now() - days * DAY_MS)
}

const baltimoreCity: ResolvedCity = {
	id: '01936f00-0000-7000-8000-000000000ba1',
	name: 'Baltimore',
	state: 'MD',
	center: { lat: 39.2904, lng: -76.6122 },
}

const baltimoreGeography: ZipGeography = [
	{ zip: '21201', center: { lat: 39.2946, lng: -76.6239 } },
	{ zip: '21202', center: { lat: 39.3051, lng: -76.6056 } },
]

// Deterministic ids let repeated seeds in a file-shared database dedupe via
// onConflictDoNothing.
const cityZipRowId = (zip: string) => `cityzips-${zip}`

async function ensureCity(
	db: Database,
	city: ResolvedCity,
	geography: ZipGeography,
) {
	await db
		.insert(cities)
		.values({
			id: city.id,
			name: city.name,
			state: city.state,
			centerLat: city.center.lat,
			centerLng: city.center.lng,
		})
		.onConflictDoNothing()
	if (geography.length === 0) return
	await db
		.insert(cityZips)
		.values(
			geography.map(({ zip, center }) => ({
				id: cityZipRowId(zip),
				cityId: city.id,
				zip,
				lat: center.lat,
				lng: center.lng,
			})),
		)
		.onConflictDoNothing()
}

export async function seedClient(
	db: Database,
	overrides: { status?: ProfileStatus } = {},
) {
	const now = new Date()
	const account = makeIntroUser()
	await db.insert(user).values(account)
	await ensureCity(db, baltimoreCity, baltimoreGeography)
	const profile: typeof clientProfiles.$inferSelect = {
		id: crypto.randomUUID(),
		userId: account.id,
		role: 'buyer',
		status: overrides.status ?? 'active',
		cityId: baltimoreCity.id,
		timeline: 'exploring',
		priceMin: 400_000,
		priceMax: 750_000,
		propertyTypes: ['singleFamily'],
		decisionStyle: 'middleGround',
		contactStyle: 'regularCheckins',
		riskComfort: 'lowRisk',
		commissionPlan: 'discussThenDecide',
		situationSpecialties: [],
		createdAt: now,
		updatedAt: now,
	}
	await db.insert(clientProfiles).values(profile)
	await db.insert(buyerDetails).values({
		clientProfileId: profile.id,
		buyingExperience: 'firstTime',
	})
	await db.insert(clientProfileZips).values(
		baltimoreGeography.map(({ zip }) => ({
			id: crypto.randomUUID(),
			profileId: profile.id,
			cityZipId: cityZipRowId(zip),
			cityId: baltimoreCity.id,
		})),
	)
	return { profile, user: account }
}

export async function seedAgent(
	db: Database,
	overrides: { city?: ResolvedCity; geography?: ZipGeography } = {},
) {
	const now = new Date()
	const city = overrides.city ?? baltimoreCity
	const geography = overrides.geography ?? baltimoreGeography
	const account = makeIntroUser({ name: 'Test Agent' })
	await db.insert(user).values(account)
	await ensureCity(db, city, geography)
	const profile: typeof agentProfiles.$inferSelect = {
		id: crypto.randomUUID(),
		userId: account.id,
		representationSide: 'buyer',
		cityId: city.id,
		typicalPriceRange: '400kTo750k',
		enjoyedClients: ['firstTimeBuyers'],
		brokerageName: 'Harborline Realty',
		licenseNumberState: 'LIC-123456-MD',
		yearsLicensed: '6-10',
		energyFocus: ['calm', 'explainSteps'],
		clientDecisionStyle: 'middleGround',
		clientContactStyle: 'regularCheckins',
		riskAdviceComfort: 'lowRisk',
		commissionStyle: 'walkThroughRate',
		specialties: [],
		createdAt: now,
		updatedAt: now,
	}
	await db.insert(agentProfiles).values(profile)
	if (geography.length > 0) {
		await db.insert(agentProfileZips).values(
			geography.map(({ zip }) => ({
				id: crypto.randomUUID(),
				profileId: profile.id,
				cityZipId: cityZipRowId(zip),
				cityId: city.id,
			})),
		)
	}
	return { profile, user: account }
}

export function makeIntroduction(input: {
	clientProfileId: string
	agentProfileId: string
	overrides?: Partial<typeof introductions.$inferInsert>
}): typeof introductions.$inferInsert {
	const now = new Date()
	const status = input.overrides?.status ?? 'pending'
	const row: typeof introductions.$inferInsert = {
		id: crypto.randomUUID(),
		clientProfileId: input.clientProfileId,
		agentProfileId: input.agentProfileId,
		status,
		acceptedAt: null,
		connectedAt: null,
		closedAt: null,
		createdAt: now,
		updatedAt: now,
	}
	// The status data checks require lifecycle timestamps to match the status.
	if (status === 'accepted' || status === 'connected') row.acceptedAt = now
	if (status === 'connected') row.connectedAt = now
	if (status === 'declined' || status === 'withdrawn') row.closedAt = now
	return { ...row, ...input.overrides }
}

export function makeAccessWindow(
	clientProfileId: string,
	overrides: Partial<typeof introAccessWindows.$inferInsert> = {},
): typeof introAccessWindows.$inferInsert {
	const now = new Date()
	return {
		id: crypto.randomUUID(),
		clientProfileId,
		stripePaymentIntentId: `pi_${crypto.randomUUID()}`,
		startsAt: hoursAgo(1),
		endsAt: new Date(now.getTime() + 30 * DAY_MS),
		createdAt: now,
		updatedAt: now,
		...overrides,
	}
}
