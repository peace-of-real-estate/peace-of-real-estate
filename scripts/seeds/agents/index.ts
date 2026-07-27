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
	averageTransactions,
	yearsLicensed,
	type AgentProfile,
	type AgentWorkStyle,
	type AverageTransactions,
	type YearsLicensed,
} from '../../../src/lib/profile'
import { cityKey } from '../../city-key'
import { ensureAvatarPool, getAvatarFallbackUrls } from '../avatars'
import {
	BROKERAGE_POOLS,
	CITIES,
	CLIENT_TYPES,
	EMPLOYMENT_STATUSES,
	EO_INSURANCE_STATUSES,
	FIRST_NAMES,
	LAST_NAMES,
	REPRESENTATION_SIDES,
	type City,
} from './mocks'
import { buildAddress, buildPhone, pick, randInt } from './stats'
import { pickWeighted, sample, type WeightedOption } from './stats'

const agentAnswerPickers: {
	[K in keyof AgentWorkStyle]: () => NonNullable<AgentWorkStyle[K]>
} = {
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
	bestClientTypes: AgentProfile['bestClientTypes']
	notFitFor: AgentProfile['notFitFor']
	yearsLicensed: YearsLicensed
	averageTransactions: AverageTransactions
	employmentStatus: string
	clientDescription: AgentProfile['clientDescription']
	communicationFrequency: AgentProfile['communicationFrequency']
	quickCommunicationChannel: AgentProfile['quickCommunicationChannel']
	updateDeliveryMethod: AgentProfile['updateDeliveryMethod']
	difficultDealInstinct: AgentProfile['difficultDealInstinct']
	responseTime: AgentProfile['responseTime']
	commissionApproach: AgentProfile['commissionApproach']
	unrepresentedBuyerApproach: AgentProfile['unrepresentedBuyerApproach']
	eoInsuranceStatus: string
	peacePactSigned: boolean
	usePaxWriter: boolean
}

function generatePersona(): AgentPersona {
	const clientTypeCount = randInt(2, 4)
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
		bestClientTypes: sample(CLIENT_TYPES, clientTypeCount),
		notFitFor: notFitForSlug ? [notFitForSlug] : [],
		yearsLicensed: pick(yearsLicensed.slugs),
		averageTransactions: pick(averageTransactions.slugs),
		employmentStatus: pick(EMPLOYMENT_STATUSES),
		clientDescription: pickAnswer('clientDescription'),
		communicationFrequency: pickAnswer('communicationFrequency'),
		quickCommunicationChannel: pickAnswer('quickCommunicationChannel'),
		updateDeliveryMethod: pickAnswer('updateDeliveryMethod'),
		difficultDealInstinct: pickAnswer('difficultDealInstinct'),
		responseTime: pickAnswer('responseTime'),
		commissionApproach: pickAnswer('commissionApproach'),
		unrepresentedBuyerApproach: pickAnswer('unrepresentedBuyerApproach'),
		eoInsuranceStatus: pick(EO_INSURANCE_STATUSES),
		peacePactSigned: Math.random() < 0.75,
		usePaxWriter: Math.random() < 0.8,
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
	const addressZip = pick(cityZipRows).zip

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
		bestClientTypes: persona.bestClientTypes,
		notFitFor: persona.notFitFor,
		firstName,
		lastName,
		brokerageName: pick(BROKERAGE_POOLS),
		email,
		phone: buildPhone(),
		businessAddress: buildAddress(location, addressZip),
		licenseNumberState: `LIC-${randInt(100000, 999999)}-${location.state}`,
		yearsLicensed: persona.yearsLicensed,
		averageTransactions: persona.averageTransactions,
		employmentStatus: persona.employmentStatus,
		clientDescription: persona.clientDescription,
		communicationFrequency: persona.communicationFrequency,
		quickCommunicationChannel: persona.quickCommunicationChannel,
		updateDeliveryMethod: persona.updateDeliveryMethod,
		difficultDealInstinct: persona.difficultDealInstinct,
		responseTime: persona.responseTime,
		commissionApproach: persona.commissionApproach,
		unrepresentedBuyerApproach: persona.unrepresentedBuyerApproach,
		usePaxWriter: persona.usePaxWriter,
		licenseAttested: true,
		eoInsuranceStatus: persona.eoInsuranceStatus,
		peacePactSigned: persona.peacePactSigned,
		peacePactSignature: `${firstName} ${lastName}`,
		peacePactSignedAt: persona.peacePactSigned
			? new Date(now.getTime() - randInt(0, 90) * 86400000)
			: null,
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
	const missingCities = CITIES.filter(
		(location) => !cityDataByKey.has(cityKey(location.city, location.state)),
	)
	if (missingCities.length > 0) {
		throw new Error(
			`No city row for: ${missingCities
				.map((location) => `${location.city}, ${location.state}`)
				.join('; ')} — run db:init first.`,
		)
	}

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
