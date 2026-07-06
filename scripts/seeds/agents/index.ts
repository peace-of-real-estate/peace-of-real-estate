import { approxLabel, buildAddress, buildPhone, pick, randInt } from './stats'
import {
	BROKERAGE_POOLS,
	CITIES,
	CLIENT_TYPES,
	EMPLOYMENT_STATUSES,
	EO_INSURANCE_STATUSES,
	FIRST_NAMES,
	LAST_NAMES,
	NOT_FIT_FOR,
	PRICE_BY_TIER,
	PRICE_TIERS,
	REPRESENTATION_SIDES,
	TRANSACTION_LABELS,
	YEARS_LABELS,
	type City,
} from './mocks'

import { pickWeighted, sample } from './stats'

import { db } from '../../../src/db/connection'
import {
	account,
	agentProfiles,
	buyerProfiles,
	sellerProfiles,
	session,
	user,
	userEntitlements,
} from '../../../src/db/tables'
import { uploadAgentAvatar } from '../avatars'

function generatePersona() {
	const priceTier = pickWeighted(PRICE_TIERS)
	const years = randInt(1, 30)
	const avgTrans = randInt(3, 60)
	const clientTypeCount = randInt(2, 4)

	return {
		representationSide: pickWeighted(REPRESENTATION_SIDES),
		typicalPriceRange: pick(PRICE_BY_TIER[priceTier]!),
		bestClientTypes: sample(CLIENT_TYPES, clientTypeCount),
		notFitFor: pick(NOT_FIT_FOR),
		yearsLicensed: approxLabel(YEARS_LABELS, years),
		averageTransactions: approxLabel(TRANSACTION_LABELS, avgTrans),
		employmentStatus: pick(EMPLOYMENT_STATUSES),
		eoInsuranceStatus: pick(EO_INSURANCE_STATUSES),
		peacePactSigned: Math.random() < 0.75,
		usePaxWriter: Math.random() < 0.8,
	}
}

async function clearFakeData() {
	console.log('Clearing existing seed data...')

	await db.delete(sellerProfiles)
	await db.delete(buyerProfiles)
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

async function insertAgent(location: City, now: Date) {
	const persona = generatePersona()
	const { firstName, lastName, fullName } = generateName()
	const email = generateEmail(firstName, lastName)
	const userId = crypto.randomUUID()
	const agentId = crypto.randomUUID()

	const imageKey = await uploadAgentAvatar(agentId, email)

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
		city: location.city,
		state: location.state,
		representationSide: persona.representationSide,
		typicalPriceRange: persona.typicalPriceRange,
		bestClientTypes: persona.bestClientTypes,
		notFitFor: persona.notFitFor,
		firstName,
		lastName,
		brokerageName: pick(BROKERAGE_POOLS),
		email,
		phone: buildPhone(),
		businessAddress: buildAddress(location),
		billingAddress: buildAddress(location),
		licenseNumberState: `LIC-${randInt(100000, 999999)}-${location.state}`,
		zipCodes: location.zips.slice(0, 3),
		yearsLicensed: persona.yearsLicensed,
		averageTransactions: persona.averageTransactions,
		employmentStatus: persona.employmentStatus,
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
}

export async function seedAgents(count: number) {
	const now = new Date()

	await clearFakeData()

	console.log(`Seeding ${count} agents in Baltimore...`)

	const baltimore = CITIES.find((city) => city.city === 'Baltimore')!

	for (let i = 0; i < count; i++) {
		await insertAgent(baltimore, now)

		if ((i + 1) % 50 === 0 || i === count - 1) {
			console.log(`  ${i + 1}/${count} agents seeded`)
		}
	}

	console.log(`\nDone! Successfully seeded ${count} agents.`)
}
