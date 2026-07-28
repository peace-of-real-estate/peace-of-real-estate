import { and, eq, inArray, or } from 'drizzle-orm'

import { db } from '../../../src/db/connection'
import {
	account,
	agentProfiles,
	agentProfileZips,
	buyerDetails,
	cities,
	cityZips,
	clientProfiles,
	sellerDetails,
	session,
	user,
	userEntitlements,
} from '../../../src/db/tables'
import { structuredNotFitForOptions } from '../../../src/lib/matching/affinities'
import { BUCKET_ORDER } from '../../../src/lib/price-range'
import {
	agentQuestions,
	yearsLicensed,
	type AgentProfile,
	type AgentWorkStyle,
	type YearsLicensed,
} from '../../../src/lib/profile'
import { cityKey } from '../../city-key'
import { ensureAvatarPool, getAvatarFallbackUrls } from '../avatars'
import {
	BROKERAGE_POOLS,
	CITIES,
	CLIENT_TYPES,
	FIRST_NAMES,
	LAST_NAMES,
	REPRESENTATION_SIDES,
	type City,
} from './mocks'
import { pick, randInt } from './stats'
import { pickWeighted, sample, type WeightedOption } from './stats'

const agentAnswerPickers: {
	[K in keyof AgentWorkStyle]: () => NonNullable<AgentWorkStyle[K]>
} = {
	bestClientType: () => pick(agentQuestions['bestClientType'].options.slugs),
	clientDescription: () =>
		pick(agentQuestions['clientDescription'].options.slugs),
	communicationFrequency: () =>
		pick(agentQuestions['communicationFrequency'].options.slugs),
	quickCommunicationChannel: () =>
		pick(agentQuestions['quickCommunicationChannel'].options.slugs),
	updateDeliveryMethod: () =>
		pick(agentQuestions['updateDeliveryMethod'].options.slugs),
	difficultDealInstinct: () =>
		pick(agentQuestions['difficultDealInstinct'].options.slugs),
	responseTime: () => pick(agentQuestions['responseTime'].options.slugs),
	commissionApproach: () =>
		pick(agentQuestions['commissionApproach'].options.slugs),
	unrepresentedBuyerApproach: () =>
		pick(agentQuestions['unrepresentedBuyerApproach'].options.slugs),
}

function pickAnswer<K extends keyof AgentWorkStyle>(
	questionId: K,
): NonNullable<AgentWorkStyle[K]> {
	return agentAnswerPickers[questionId]()
}

// Fields required to seed an agent profile. All values are generated from valid
// option sets, so the cast is safe.
type AgentPersona = {
	representationSide: AgentProfile['representationSide']
	typicalPriceRange: AgentProfile['typicalPriceRange']
	bestClientType: AgentProfile['bestClientType']
	notFitFor: AgentProfile['notFitFor']
	yearsLicensed: YearsLicensed
	clientDescription: AgentProfile['clientDescription']
	communicationFrequency: AgentProfile['communicationFrequency']
	quickCommunicationChannel: AgentProfile['quickCommunicationChannel']
	updateDeliveryMethod: AgentProfile['updateDeliveryMethod']
	difficultDealInstinct: AgentProfile['difficultDealInstinct']
	responseTime: AgentProfile['responseTime']
	commissionApproach: AgentProfile['commissionApproach']
	unrepresentedBuyerApproach: AgentProfile['unrepresentedBuyerApproach']
}

function generatePersona(): AgentPersona {
	const notFitForSlugs = [
		...Object.keys(structuredNotFitForOptions).filter(
			(slug) => slug !== 'other',
		),
		null,
		null,
	]
	const notFitForSlug = pick(notFitForSlugs)

	return {
		representationSide: pickWeighted(REPRESENTATION_SIDES),
		typicalPriceRange: pick(BUCKET_ORDER),
		bestClientType: pick(CLIENT_TYPES),
		notFitFor: notFitForSlug ? [notFitForSlug] : [],
		yearsLicensed: pick(yearsLicensed.slugs),
		clientDescription: pickAnswer('clientDescription'),
		communicationFrequency: pickAnswer('communicationFrequency'),
		quickCommunicationChannel: pickAnswer('quickCommunicationChannel'),
		updateDeliveryMethod: pickAnswer('updateDeliveryMethod'),
		difficultDealInstinct: pickAnswer('difficultDealInstinct'),
		responseTime: pickAnswer('responseTime'),
		commissionApproach: pickAnswer('commissionApproach'),
		unrepresentedBuyerApproach: pickAnswer('unrepresentedBuyerApproach'),
	}
}

async function clearFakeData() {
	console.log('Clearing existing seed data...')

	await db.delete(buyerDetails)
	await db.delete(sellerDetails)
	await db.delete(clientProfiles)
	await db.delete(agentProfiles)
	await db.delete(session)
	await db.delete(account)
	await db.delete(userEntitlements)
	await db.delete(user)

	console.log('Existing seed data cleared.')
}

function generateName(): {
	firstName: string
	lastName: string
	fullName: string
} {
	const firstName = pick(FIRST_NAMES)
	const lastName = pick(LAST_NAMES)
	return { firstName, lastName, fullName: `${firstName} ${lastName}` }
}

function generateEmail(firstName: string, lastName: string): string {
	return `${firstName.toLowerCase()}.${lastName.toLowerCase()}${randInt(1, 999)}@example.com`
}

type CityZipRow = { id: string; zip: string }

type CityData = { cityId: string; zips: CityZipRow[] }

async function loadCityDataByKey(
	locations: readonly City[],
): Promise<Map<string, CityData>> {
	const rows = await db
		.select({ id: cities.id, name: cities.name, state: cities.state })
		.from(cities)
		.where(
			or(
				...locations.map((location) =>
					and(eq(cities.name, location.city), eq(cities.state, location.state)),
				),
			),
		)

	const foundKeys = new Set(rows.map((row) => cityKey(row.name, row.state)))
	const missing = locations.filter(
		(location) => !foundKeys.has(cityKey(location.city, location.state)),
	)
	if (missing.length > 0) {
		throw new Error(
			`No city row for: ${missing
				.map((location) => `${location.city}, ${location.state}`)
				.join('; ')} — run db:init first.`,
		)
	}

	const zipRows = await db
		.select({ id: cityZips.id, cityId: cityZips.cityId, zip: cityZips.zip })
		.from(cityZips)
		.where(
			inArray(
				cityZips.cityId,
				rows.map((row) => row.id),
			),
		)
	const zipsByCityId = new Map<string, CityZipRow[]>()
	for (const row of zipRows) {
		const existing = zipsByCityId.get(row.cityId)
		if (existing) existing.push({ id: row.id, zip: row.zip })
		else zipsByCityId.set(row.cityId, [{ id: row.id, zip: row.zip }])
	}

	const cityDataByKey = new Map<string, CityData>()
	for (const row of rows) {
		cityDataByKey.set(cityKey(row.name, row.state), {
			cityId: row.id,
			zips: zipsByCityId.get(row.id) ?? [],
		})
	}
	return cityDataByKey
}

async function insertAgent(
	location: City,
	cityId: string,
	cityZipRows: CityZipRow[],
	now: Date,
	imageKey: string,
) {
	const persona = generatePersona()
	const { firstName, lastName, fullName } = generateName()
	const email = generateEmail(firstName, lastName)
	const userId = crypto.randomUUID()
	const agentId = crypto.randomUUID()

	await db.insert(user).values({
		id: userId,
		name: fullName,
		email,
		emailVerified: true,
		image: imageKey,
		createdAt: now,
		updatedAt: now,
	})

	await db.insert(agentProfiles).values({
		id: agentId,
		userId,
		cityId,
		representationSide: persona.representationSide,
		typicalPriceRange: persona.typicalPriceRange,
		bestClientType: persona.bestClientType,
		notFitFor: persona.notFitFor,
		brokerageName: pick(BROKERAGE_POOLS),
		licenseNumberState: `LIC-${randInt(100000, 999999)}-${location.state}`,
		yearsLicensed: persona.yearsLicensed,
		clientDescription: persona.clientDescription,
		communicationFrequency: persona.communicationFrequency,
		quickCommunicationChannel: persona.quickCommunicationChannel,
		updateDeliveryMethod: persona.updateDeliveryMethod,
		difficultDealInstinct: persona.difficultDealInstinct,
		responseTime: persona.responseTime,
		commissionApproach: persona.commissionApproach,
		unrepresentedBuyerApproach: persona.unrepresentedBuyerApproach,
		createdAt: now,
		updatedAt: now,
	})

	const picked = sample(
		cityZipRows,
		Math.min(randInt(3, 5), cityZipRows.length),
	)
	await db.insert(agentProfileZips).values(
		picked.map((row) => ({
			id: crypto.randomUUID(),
			profileId: agentId,
			cityZipId: row.id,
			cityId,
			createdAt: now,
		})),
	)
}

const PRIORITY_CITIES = new Set([
	'New York',
	'Los Angeles',
	'Chicago',
	'Houston',
	'Phoenix',
	'Philadelphia',
	'San Antonio',
	'San Diego',
	'Dallas',
	'San Jose',
	'Baltimore',
])

const CITY_WEIGHTS: WeightedOption<City>[] = CITIES.map((city) => ({
	value: city,
	weight: PRIORITY_CITIES.has(city.city) ? 3 : 1,
}))

function pickCity(): City {
	return pickWeighted(CITY_WEIGHTS)
}

export async function seedAgents(count: number) {
	const now = new Date()

	console.log(`Seeding ${count} agents across ${CITIES.length} cities...`)

	const cityDataByKey = await loadCityDataByKey(CITIES)

	await clearFakeData()

	const poolKeys = await ensureAvatarPool(count)
	const sources =
		poolKeys.length >= count
			? poolKeys
			: [...poolKeys, ...getAvatarFallbackUrls()]
	const imageFor = (index: number) => sources[index % sources.length]!

	for (let i = 0; i < count; i++) {
		const location = pickCity()
		const { cityId, zips: cityZipRows } = cityDataByKey.get(
			cityKey(location.city, location.state),
		)!
		if (cityZipRows.length === 0) {
			throw new Error(
				`No city_zips rows for ${location.city}, ${location.state} — run db:init first.`,
			)
		}
		await insertAgent(location, cityId, cityZipRows, now, imageFor(i))

		if ((i + 1) % 50 === 0 || i === count - 1) {
			console.log(`  ${i + 1}/${count} agents seeded`)
		}
	}

	console.log(`\nDone! Successfully seeded ${count} agents.`)
}
