import zipcodes from 'zipcodes'

import {
	AGENT_PRICE_RANGES,
	BUCKET_ORDER,
	type PriceRange,
} from '@/lib/price-range'
import type { AgentProfile, ClientProfileRow } from '@/lib/profile/types'
import type {
	BestClientTypeSlug,
	PropertyTypeSlug,
} from '@/lib/profile/profile-fields'

import {
	baseDimensionWeights,
	type DimensionId,
	buyerBiddingWarMatrix,
	buyerDecisionMakingMatrix,
	buyerIdealRelationshipMatrix,
	clientDescriptionAffinityMatrix,
	commissionMatrix,
	dealInstinctAffinityMatrix,
	DIMENSION_IDS,
	DIMENSION_LABELS,
	experienceWeightModulation,
	lookUpAffinity,
	notFitForClientTypeHits,
	notFitForNegativeScore,
	priorityToDimension,
	scoreChannel,
	scoreDelivery,
	scoreFrequency,
	scoreResponseTime,
	scoreSellerFrequency,
	sellerHomeConnectionMatrix,
	sellerRepresentationMatrix,
	sellerStakesModulation,
} from '../affinities'
import type {
	DimensionResult,
	DimensionTrace,
	DisqualifierTrace,
	FitScoreResult,
	MatchSide,
	PriceRangeValue,
	ScoreBucket,
	SubCheck,
} from './types'
import {
	clamp01,
	formatList,
	formatPriceRangeValue,
	parseSerializedPriceRange,
	priceOverlapRatio,
	round2,
	toStars,
} from './utils'

const SCORING_GEOMETRIC_FLOOR = 0.05
const SCORING_LINEAR_WEIGHT = 0.7
const SCORING_GEOMETRIC_WEIGHT = 0.3
const SCORING_RECIPROCAL_AGENT_FLOOR = 0.5

const propertyTypeToClientTypes: Record<
	PropertyTypeSlug,
	BestClientTypeSlug[]
> = {
	singleFamily: ['firstTime', 'moveUp'],
	condoTownhome: ['condoTownhome', 'moveUp'],
	multiFamily: ['landMultiFamily', 'investor'],
	land: ['landMultiFamily', 'investor'],
}

const LUXURY_PRICE_FLOOR = 1_000_000

function buyerExperienceLevel(client: ClientProfileRow): string | undefined {
	return 'experienceLevel' in client ? client.experienceLevel : undefined
}

function sellerSaleMotivation(client: ClientProfileRow): string | undefined {
	return 'saleMotivation' in client ? client.saleMotivation : undefined
}

function sellerSuccessfulSaleLooksLike(
	client: ClientProfileRow,
): string | undefined {
	return 'successfulSaleLooksLike' in client
		? client.successfulSaleLooksLike
		: undefined
}

function buyerInvolvementLevel(client: ClientProfileRow): string | undefined {
	return 'involvementLevel' in client ? client.involvementLevel : undefined
}

function sellerAgentSilencePreference(
	client: ClientProfileRow,
): string | undefined {
	return 'agentSilencePreference' in client
		? client.agentSilencePreference
		: undefined
}

function toMatchSide(side: 'buying' | 'selling'): MatchSide {
	return side === 'buying' ? 'buyers' : 'sellers'
}

function profileCityCenter(
	profile: ClientProfileRow | AgentProfile,
): { lat: number; lng: number } | undefined {
	if (
		profile.cityCenterLatitude == null ||
		profile.cityCenterLongitude == null
	) {
		return undefined
	}
	return { lat: profile.cityCenterLatitude, lng: profile.cityCenterLongitude }
}

function haversineMiles(
	lat1: number,
	lng1: number,
	lat2: number,
	lng2: number,
): number {
	const R = 3958.8 // Earth radius in miles
	const dLat = ((lat2 - lat1) * Math.PI) / 180
	const dLng = ((lng2 - lng1) * Math.PI) / 180
	const a =
		Math.sin(dLat / 2) * Math.sin(dLat / 2) +
		Math.cos((lat1 * Math.PI) / 180) *
			Math.cos((lat2 * Math.PI) / 180) *
			Math.sin(dLng / 2) *
			Math.sin(dLng / 2)
	const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
	return R * c
}

function distanceBetweenZips(zip1: string, zip2: string): number | undefined {
	return zipcodes.distance(zip1, zip2) ?? undefined
}

function distanceScore(miles: number): number {
	if (miles <= 0) return 1.0
	if (miles <= 2) return 0.95
	if (miles <= 5) return 0.8
	if (miles <= 10) return 0.6
	if (miles <= 20) return 0.3
	return 0
}

function centroidOfZips(
	zipCodes: string[],
): { lat: number; lng: number } | undefined {
	let sumLat = 0
	let sumLng = 0
	let count = 0
	for (const zip of zipCodes) {
		const info = zipcodes.lookup(zip)
		if (info) {
			sumLat += info.latitude
			sumLng += info.longitude
			count++
		}
	}
	if (count === 0) return undefined
	return { lat: sumLat / count, lng: sumLng / count }
}

function cityFitScore(centroidMiles: number): number {
	return 0.65 * Math.max(0, 1 - centroidMiles / 50)
}

export function scoreLocation(
	client: ClientProfileRow,
	agent: AgentProfile,
): DimensionResult {
	const clientZips = client.zipCodes ?? []
	const agentZips = agent.zipCodes ?? []

	const checks: SubCheck[] = []
	let bestFitSum = 0

	if (clientZips.length > 0 && agentZips.length > 0) {
		for (const clientZip of clientZips) {
			let best = 0
			for (const agentZip of agentZips) {
				if (clientZip === agentZip) {
					best = Math.max(best, 1.0)
				} else {
					const miles = distanceBetweenZips(clientZip, agentZip)
					if (miles !== undefined) {
						best = Math.max(best, distanceScore(miles))
					}
				}
			}
			bestFitSum += best
		}
	}

	const zipFit = clientZips.length > 0 ? bestFitSum / clientZips.length : 0

	const clientStoredCenter = profileCityCenter(client)
	const agentStoredCenter = profileCityCenter(agent)
	const clientCenter = clientStoredCenter ?? centroidOfZips(clientZips)
	const agentCenter = agentStoredCenter ?? centroidOfZips(agentZips)

	let cityFit = 0
	let centroidMiles: number | undefined
	if (clientCenter && agentCenter) {
		centroidMiles = haversineMiles(
			clientCenter.lat,
			clientCenter.lng,
			agentCenter.lat,
			agentCenter.lng,
		)
		cityFit = cityFitScore(centroidMiles)
	}

	const locationScore = Math.max(zipFit, cityFit)

	const explanationParts: string[] = []
	if (zipFit > 0) explanationParts.push(`zip distance score ${round2(zipFit)}`)
	if (cityFit > 0) explanationParts.push(`city-centroid fit ${round2(cityFit)}`)
	if (explanationParts.length === 0)
		explanationParts.push('no geographic overlap')
	const explanation = explanationParts.join(' · ')

	checks.push({
		label: 'zip codes',
		client: formatList(clientZips),
		agent: formatList(agentZips),
		passed: zipFit > 0,
		effect:
			zipFit > 0
				? `distance-aware zip fit ${round2(zipFit)}`
				: 'no shared/nearby zips',
	})
	checks.push({
		label: 'city centroid',
		client: clientCenter
			? `${round2(clientCenter.lat)}, ${round2(clientCenter.lng)}`
			: '(unresolved)',
		agent: agentCenter
			? `${round2(agentCenter.lat)}, ${round2(agentCenter.lng)}`
			: '(unresolved)',
		passed: cityFit > 0,
		effect:
			cityFit > 0 && centroidMiles !== undefined
				? `continuous taper ${round2(cityFit)} (${round2(centroidMiles)} mi)`
				: 'cities ≥ 50 mi apart or unresolved',
	})

	return {
		score: round2(locationScore),
		explanation,
		checks,
		geo: {
			client: clientCenter
				? {
						...clientCenter,
						source: clientStoredCenter ? 'cityCenter' : 'zipCentroid',
					}
				: undefined,
			agent: agentCenter
				? {
						...agentCenter,
						source: agentStoredCenter ? 'cityCenter' : 'zipCentroid',
					}
				: undefined,
			centroidMiles:
				centroidMiles === undefined ? undefined : round2(centroidMiles),
			zipFit: round2(zipFit),
			cityFit: round2(cityFit),
		},
	}
}

function scorePriceFit(
	client: ClientProfileRow,
	agent: AgentProfile,
): DimensionResult {
	const clientRange = parseSerializedPriceRange(client.priceRange)
	const agentRange = parseSerializedPriceRange(agent.typicalPriceRange)

	const clientCell = clientRange
		? formatPriceRangeValue(clientRange)
		: client.priceRange
			? `"${client.priceRange}" (unparseable)`
			: '(none)'
	const agentCell = agentRange
		? `${agent.typicalPriceRange} (${formatPriceRangeValue(agentRange)})`
		: agent.typicalPriceRange
			? `"${agent.typicalPriceRange}" (unknown bucket)`
			: '(none)'

	if (!clientRange || !agentRange) {
		return {
			score: 0,
			explanation: !clientRange
				? 'client price range missing or unparseable'
				: 'agent price range missing or unparseable',
			checks: [
				{
					label: 'price range',
					client: clientCell,
					agent: agentCell,
					passed: false,
					effect: 'cannot score → 0',
				},
			],
		}
	}

	const bucketIndex = BUCKET_ORDER.findIndex(
		(bucket) => bucket === agent.typicalPriceRange,
	)
	const adjacentBuckets: PriceRange[] = []
	if (bucketIndex >= 0) {
		if (bucketIndex > 0) {
			const prev = AGENT_PRICE_RANGES[BUCKET_ORDER[bucketIndex - 1]!]
			if (prev) adjacentBuckets.push(prev)
		}
		if (bucketIndex < BUCKET_ORDER.length - 1) {
			const next = AGENT_PRICE_RANGES[BUCKET_ORDER[bucketIndex + 1]!]
			if (next) adjacentBuckets.push(next)
		}
	}

	const bucketOverlap = priceOverlapRatio(clientRange, agentRange)
	const adjacentOverlap = adjacentBuckets.length
		? Math.max(
				...adjacentBuckets.map((bucket) =>
					priceOverlapRatio(clientRange, bucket),
				),
			)
		: 0

	const score = Math.min(1, bucketOverlap + 0.4 * adjacentOverlap)

	return {
		score: round2(score),
		explanation:
			score > 0
				? `bucket overlap ${round2(bucketOverlap)} + adjacent ${round2(adjacentOverlap)} → ${round2(score)}`
				: 'price range does not touch bucket or adjacent buckets',
		checks: [
			{
				label: 'price range',
				client: clientCell,
				agent: agentCell,
				passed: score > 0,
				effect: `score ${round2(score)}`,
			},
		],
	}
}

function bucketCentrality(
	clientRange: PriceRangeValue,
	agentBucket: PriceRange,
): number {
	return priceOverlapRatio(clientRange, agentBucket)
}

function expectedClientTypeSources(
	client: ClientProfileRow,
	side: 'buying' | 'selling',
): Map<BestClientTypeSlug, string[]> {
	const sources = new Map<BestClientTypeSlug, string[]>()
	const add = (slug: BestClientTypeSlug, source: string) => {
		const existing = sources.get(slug)
		if (existing) existing.push(source)
		else sources.set(slug, [source])
	}

	if (side === 'selling') add('seller', 'selling side')
	if (side === 'buying') {
		for (const propertyType of client.propertyTypes ?? []) {
			for (const slug of propertyTypeToClientTypes[propertyType] ?? []) {
				add(slug, propertyType)
			}
		}
	}
	const clientRange = parseSerializedPriceRange(client.priceRange)
	if (clientRange && clientRange.min >= LUXURY_PRICE_FLOOR) {
		add('luxury', 'budget ≥ $1M')
	}
	if (side === 'buying') {
		if (buyerExperienceLevel(client) === 'firstTime') {
			add('firstTime', 'first-time buyer')
		}
	}
	return sources
}

export function deriveExpectedClientTypes(
	client: ClientProfileRow,
	side: 'buying' | 'selling',
): BestClientTypeSlug[] {
	return [...expectedClientTypeSources(client, side).keys()]
}

function scoreSpecialization(
	client: ClientProfileRow,
	agent: AgentProfile,
	side: 'buying' | 'selling',
): DimensionResult {
	const sources = expectedClientTypeSources(client, side)
	const expected = [...sources.keys()]
	const agentTypes = agent.bestClientTypes ?? []
	const primary = agentTypes[0]
	const secondary = agentTypes[1]

	const checks: SubCheck[] = []

	if (expected.length === 0) {
		checks.push({
			label: 'client signals',
			client: '(none)',
			agent: formatList(agentTypes),
			passed: null,
			effect: 'neutral 0.5',
		})
		return {
			score: 0.5,
			explanation:
				'client has no property-type, side, or experience signals — neutral 0.5',
			checks,
		}
	}

	let sum = 0
	let creditedMatches = 0
	for (const slug of expected) {
		let match = 0
		if (primary && slug === primary) match = 1.0
		else if (secondary && slug === secondary) match = 0.6
		let source = sources.get(slug) ?? []
		if (primary && slug === primary) source = [...source, 'primary']
		else if (secondary && slug === secondary) source = [...source, 'secondary']
		sum += match
		if (match > 0) creditedMatches++
		checks.push({
			label: slug,
			client: `expected — from ${source.join(', ')}`,
			agent: match > 0 ? 'served' : 'not served',
			passed: match > 0,
			effect: match > 0 ? `match ${match}` : '0',
		})
	}

	const score = sum / expected.length

	return {
		score: round2(score),
		explanation: `agent matches ${creditedMatches} of ${expected.length} expected client types`,
		checks,
	}
}

function getClientTypeFit(
	client: ClientProfileRow,
	agent: AgentProfile,
	side: 'buying' | 'selling',
): number {
	return scoreSpecialization(client, agent, side).score
}

function scoreBuyerWorkingStyle(
	client: ClientProfileRow,
	agent: AgentProfile,
): DimensionResult {
	if (!('decisionMakingNeed' in client)) {
		throw new Error('Expected buyer profile for working-style scoring')
	}

	const checks: SubCheck[] = []

	const decision =
		lookUpAffinity(
			buyerDecisionMakingMatrix,
			client.decisionMakingNeed,
			agent.clientDescription,
		) ?? 0
	checks.push({
		label: 'decision-making need',
		client: client.decisionMakingNeed,
		agent: agent.clientDescription,
		passed: decision >= 0.7,
		effect: `affinity ${round2(decision)}`,
	})

	const bidding =
		lookUpAffinity(
			buyerBiddingWarMatrix,
			client.biddingWarResponse,
			agent.difficultDealInstinct,
		) ?? 0
	checks.push({
		label: 'bidding-war response',
		client: client.biddingWarResponse,
		agent: agent.difficultDealInstinct,
		passed: bidding >= 0.7,
		effect: `affinity ${round2(bidding)}`,
	})

	const ideal =
		lookUpAffinity(
			buyerIdealRelationshipMatrix,
			client.idealAgentRelationship,
			agent.clientDescription,
		) ?? 0
	checks.push({
		label: 'ideal relationship',
		client: client.idealAgentRelationship,
		agent: agent.clientDescription,
		passed: ideal >= 0.7,
		effect: `affinity ${round2(ideal)}`,
	})

	const score = (decision + bidding + ideal) / 3
	return {
		score: round2(score),
		explanation: `decision ${round2(decision)} · bidding ${round2(bidding)} · relationship ${round2(ideal)}`,
		checks,
	}
}

function agentDescriptionScore(
	agentDescription: string,
): Record<string, number> {
	return clientDescriptionAffinityMatrix[agentDescription] ?? {}
}

function agentDealInstinctScore(agentInstinct: string): Record<string, number> {
	return dealInstinctAffinityMatrix[agentInstinct] ?? {}
}

function scoreAgentDeliveryExpectations(
	expectations: string[],
	agent: AgentProfile,
	clientExpectation: string,
): { score: number; checks: SubCheck[] } {
	const descriptionScores = agentDescriptionScore(agent.clientDescription)
	const instinctScores = agentDealInstinctScore(agent.difficultDealInstinct)
	const responseScore = scoreResponseTime(clientExpectation, agent.responseTime)

	let total = 0
	const checks: SubCheck[] = []
	for (const expectation of expectations) {
		let score = 0.6
		let explanation = 'neutral'
		if (
			expectation === 'pricedRight' ||
			expectation === 'greatNegotiatedOutcome'
		) {
			score = Math.max(
				descriptionScores.strategicDataDriven ?? 0,
				descriptionScores.efficientDecisive ?? 0,
			)
			explanation = 'strategic / decisive'
			if (expectation === 'greatNegotiatedOutcome') {
				score = Math.max(
					score,
					instinctScores.takeControl ?? 0,
					instinctScores.factsFast ?? 0,
				)
				explanation = 'strategic / decisive / take-control'
			}
		} else if (expectation === 'keptItCalm') {
			score = Math.max(
				descriptionScores.calmSteady ?? 0,
				instinctScores.deEscalateFirst ?? 0,
			)
			explanation = 'calm / de-escalate'
		} else if (expectation === 'reachableResponsive') {
			score = responseScore
			explanation = 'response-time match'
		} else if (expectation === 'honestStraightforward') {
			score = 0.6
			explanation = 'not directly observable'
		}
		total += score
		checks.push({
			label: expectation,
			client: expectation,
			agent: agent.clientDescription,
			passed: score >= 0.7,
			effect: `${explanation} ${round2(score)}`,
		})
	}

	const count = expectations.length || 1
	return { score: total / count, checks }
}

function scoreSellerWorkingStyle(
	client: ClientProfileRow,
	agent: AgentProfile,
): DimensionResult {
	if (!('homeConnection' in client)) {
		throw new Error('Expected seller profile for working-style scoring')
	}

	const checks: SubCheck[] = []

	const home =
		lookUpAffinity(
			sellerHomeConnectionMatrix,
			client.homeConnection,
			agent.clientDescription,
		) ?? 0
	checks.push({
		label: 'home connection',
		client: client.homeConnection,
		agent: agent.clientDescription,
		passed: home >= 0.7,
		effect: `affinity ${round2(home)}`,
	})

	const representation =
		lookUpAffinity(
			sellerRepresentationMatrix,
			client.representationPreference,
			agent.unrepresentedBuyerApproach,
		) ?? 0
	checks.push({
		label: 'representation preference',
		client: client.representationPreference,
		agent: agent.unrepresentedBuyerApproach,
		passed: representation >= 0.7,
		effect: `affinity ${round2(representation)}`,
	})

	const delivery = scoreAgentDeliveryExpectations(
		client.agentDeliveryExpectations ?? [],
		agent,
		client.responseTimeExpectation,
	)
	checks.push(...delivery.checks)

	const score = (home + representation + delivery.score) / 3
	return {
		score: round2(score),
		explanation: `home ${round2(home)} · representation ${round2(representation)} · delivery ${round2(delivery.score)}`,
		checks,
	}
}

function scoreWorkingStyle(
	client: ClientProfileRow,
	agent: AgentProfile,
	side: 'buying' | 'selling',
): DimensionResult {
	if (side === 'buying') {
		return scoreBuyerWorkingStyle(client, agent)
	}
	return scoreSellerWorkingStyle(client, agent)
}
function scoreCommunication(
	client: ClientProfileRow,
	agent: AgentProfile,
	side: 'buying' | 'selling',
): DimensionResult {
	const checks: SubCheck[] = []

	const channel = scoreChannel(
		client.quickCommunicationChannel,
		agent.quickCommunicationChannel,
	)
	checks.push({
		label: 'quick channel',
		client: client.quickCommunicationChannel,
		agent: agent.quickCommunicationChannel,
		passed: channel >= 0.85,
		effect: `score ${round2(channel)}`,
	})

	const delivery = scoreDelivery(
		client.updateDeliveryMethod,
		agent.updateDeliveryMethod,
	)
	checks.push({
		label: 'update delivery',
		client: client.updateDeliveryMethod,
		agent: agent.updateDeliveryMethod,
		passed: delivery >= 0.7,
		effect: `score ${round2(delivery)}`,
	})

	const clientFrequency =
		side === 'buying'
			? buyerInvolvementLevel(client)
			: sellerAgentSilencePreference(client)
	const frequency =
		clientFrequency != null
			? side === 'buying'
				? scoreFrequency(clientFrequency, agent.communicationFrequency)
				: scoreSellerFrequency(clientFrequency, agent.communicationFrequency)
			: 0.6
	checks.push({
		label: 'frequency',
		client: clientFrequency ?? '(none)',
		agent: agent.communicationFrequency,
		passed: frequency >= 0.7,
		effect: `score ${round2(frequency)}`,
	})

	const response = scoreResponseTime(
		client.responseTimeExpectation,
		agent.responseTime,
	)
	checks.push({
		label: 'response time',
		client: client.responseTimeExpectation,
		agent: agent.responseTime,
		passed: response >= 0.7,
		effect: `score ${round2(response)}`,
	})

	const score = (channel + delivery + frequency + response) / 4
	return {
		score: round2(score),
		explanation: `channel ${round2(channel)} · delivery ${round2(delivery)} · frequency ${round2(frequency)} · response ${round2(response)}`,
		checks,
	}
}

function scoreBusinessTerms(
	client: ClientProfileRow,
	agent: AgentProfile,
): DimensionResult {
	const commission =
		lookUpAffinity(
			commissionMatrix,
			client.commissionComfort,
			agent.commissionApproach,
		) ?? 0

	return {
		score: round2(commission),
		explanation: `commission comfort ${client.commissionComfort} × approach ${agent.commissionApproach} → ${round2(commission)}`,
		checks: [
			{
				label: 'commission',
				client: client.commissionComfort,
				agent: agent.commissionApproach,
				passed: commission >= 0.7,
				effect: `score ${round2(commission)}`,
			},
		],
	}
}

function rankOrderCentroidWeights(
	rankedDimensions: DimensionId[],
): Record<DimensionId, number> {
	const k = rankedDimensions.length
	const weights: Record<DimensionId, number> = { ...baseDimensionWeights }
	for (let i = 0; i < k; i++) {
		const dimension = rankedDimensions[i]
		if (!dimension) continue
		let sum = 0
		for (let j = i; j < k; j++) {
			sum += 1 / (j + 1)
		}
		weights[dimension] = (sum / k) * 100
	}
	return weights
}

function baseRank(): DimensionId[] {
	return [...DIMENSION_IDS].sort(
		(a, b) => baseDimensionWeights[b] - baseDimensionWeights[a],
	)
}

function applyPriorityRanking(
	baseRanks: DimensionId[],
	priorities: string[] | null | undefined,
): DimensionId[] {
	const ranked = [...baseRanks]
	const priorityDimensions: DimensionId[] = []
	for (const priority of priorities ?? []) {
		const dimension = priorityToDimension[priority]
		if (dimension !== undefined) priorityDimensions.push(dimension)
	}
	const seen = new Set<DimensionId>()
	for (const dimension of priorityDimensions) {
		if (seen.has(dimension)) continue
		seen.add(dimension)
		const index = ranked.indexOf(dimension)
		if (index > 0) {
			ranked.splice(index, 1)
			ranked.splice(index - 1, 0, dimension)
		}
	}
	return ranked
}

function addModulations(
	weights: Record<DimensionId, number>,
	modulators: { dimension: DimensionId; source: string; delta: number }[],
	modulation: Partial<Record<DimensionId, number>>,
	source: string,
): void {
	for (const dimension of DIMENSION_IDS) {
		const delta = modulation[dimension]
		if (delta === undefined) continue
		weights[dimension] = (weights[dimension] ?? 0) + delta
		modulators.push({ dimension, source, delta })
	}
}

function applyModulation(
	weights: Record<DimensionId, number>,
	client: ClientProfileRow,
	side: 'buying' | 'selling',
): {
	weights: Record<DimensionId, number>
	modulators: { dimension: DimensionId; source: string; delta: number }[]
} {
	const adjusted = { ...weights }
	const modulators: {
		dimension: DimensionId
		source: string
		delta: number
	}[] = []

	if (side === 'buying') {
		const experienceLevel = buyerExperienceLevel(client)
		if (experienceLevel != null) {
			const modulation = experienceWeightModulation[experienceLevel]
			if (modulation) {
				addModulations(
					adjusted,
					modulators,
					modulation,
					`experienceLevel=${experienceLevel}`,
				)
			}
		}
	} else {
		const saleMotivation = sellerSaleMotivation(client)
		const successfulSaleLooksLike = sellerSuccessfulSaleLooksLike(client)
		if (saleMotivation === 'financialPressure') {
			addModulations(
				adjusted,
				modulators,
				sellerStakesModulation.financialPressure ?? {},
				'saleMotivation=financialPressure',
			)
		}
		const saleModulation =
			successfulSaleLooksLike != null
				? sellerStakesModulation[successfulSaleLooksLike]
				: undefined
		if (saleModulation) {
			addModulations(
				adjusted,
				modulators,
				saleModulation,
				`successfulSaleLooksLike=${successfulSaleLooksLike}`,
			)
		}
	}

	return { weights: adjusted, modulators }
}

function resolveDimensionWeights(
	client: ClientProfileRow,
	side: 'buying' | 'selling',
	applyModulations = true,
): {
	weights: Record<DimensionId, number>
	boosted: Set<DimensionId>
} {
	const baseRanks = baseRank()
	const priorityRanks = applyPriorityRanking(baseRanks, client.matchPriorities)
	const rocWeights = rankOrderCentroidWeights(priorityRanks)

	const raw: Record<DimensionId, number> = { ...baseDimensionWeights }
	for (const dimension of DIMENSION_IDS) {
		raw[dimension] =
			(baseDimensionWeights[dimension] + rocWeights[dimension]) / 2
	}

	const { weights: modulated } = applyModulations
		? applyModulation(raw, client, side)
		: { weights: raw }

	const total = Object.values(modulated).reduce(
		(sum, weight) => sum + weight,
		0,
	)
	const weights: Record<DimensionId, number> = { ...baseDimensionWeights }
	for (const dimension of DIMENSION_IDS) {
		weights[dimension] = Number(
			((modulated[dimension] / total) * 100).toFixed(2),
		)
	}

	const boosted = new Set<DimensionId>()
	for (const dimension of DIMENSION_IDS) {
		if (weights[dimension] > baseDimensionWeights[dimension]) {
			boosted.add(dimension)
		}
	}

	return { weights, boosted }
}

function evaluateDisqualifiers(
	client: ClientProfileRow,
	agent: AgentProfile,
	side: 'buying' | 'selling',
	locationResult: DimensionResult,
	priceResult: DimensionResult,
): DisqualifierTrace[] {
	const expectedSide = side === 'buying' ? 'buyers' : 'sellers'
	const sideMismatch =
		agent.representationSide !== 'both' &&
		agent.representationSide !== expectedSide
	const stateKnown = Boolean(client.state)
	const stateMismatch = Boolean(
		client.state &&
		agent.state &&
		client.state.toLowerCase() !== agent.state.toLowerCase(),
	)

	const locationDisqualified = locationResult.score <= 0
	const priceDisqualified = priceResult.score <= 0

	return [
		{
			id: 'representationSide',
			label: 'Representation side',
			disqualified: sideMismatch,
			detail: `client needs "${side}", agent works "${agent.representationSide}"`,
		},
		{
			id: 'state',
			label: 'State',
			disqualified: stateMismatch,
			detail: stateKnown
				? `client in ${client.state}, agent in ${agent.state}`
				: 'client state unknown — not enforced',
		},
		{
			id: 'location',
			label: 'Location floor',
			disqualified: locationDisqualified,
			detail: locationDisqualified
				? 'no geographic overlap (zip distance > 20 mi and city centroids ≥ 50 mi apart)'
				: `location score ${locationResult.score}`,
		},
		{
			id: 'priceFit',
			label: 'Price contact',
			disqualified: priceDisqualified,
			detail: priceDisqualified
				? 'client range does not touch agent bucket or adjacent buckets'
				: `price score ${priceResult.score}`,
		},
	]
}

function applyNotFitPenalty(
	client: ClientProfileRow,
	agent: AgentProfile,
	side: 'buying' | 'selling',
	score: number,
): { score: number; penalized: boolean; reason: string } {
	const notFitFor = agent.notFitFor ?? []
	if (notFitFor.length === 0) return { score, penalized: false, reason: '' }

	const expected = deriveExpectedClientTypes(client, side)
	for (const slug of notFitFor) {
		const hits = notFitForClientTypeHits[slug]
		if (hits && expected.some((type) => hits.includes(type))) {
			return {
				score: score * notFitForNegativeScore,
				penalized: true,
				reason: slug,
			}
		}
	}
	return { score, penalized: false, reason: '' }
}

function harmonicMean(a: number, b: number): number {
	if (a <= 0 || b <= 0) return 0
	return (2 * a * b) / (a + b)
}

/**
 * Offline experiment knobs for scripts/compare-scoring.ts. Production callers
 * omit this argument; every default reproduces the current pipeline exactly.
 */
export interface ScoringVariant {
	/** 'linearOnly' drops the geometric term from consumerScore. */
	blend?: 'current' | 'linearOnly'
	/** 'multiplier' replaces harmonicMean with consumer × (0.75 + 0.25·agentFit). */
	reciprocity?: 'harmonic' | 'multiplier'
	/** false skips experience/stakes weight modulations. */
	modulations?: boolean
}

export function calculateFitScore(
	agent: AgentProfile,
	client?: ClientProfileRow,
	side: 'buying' | 'selling' = 'buying',
	variant?: ScoringVariant,
): FitScoreResult {
	if (!client) return calculateFallbackScore(agent, side)

	const { weights, boosted } = resolveDimensionWeights(
		client,
		side,
		variant?.modulations ?? true,
	)

	const results: Record<DimensionId, DimensionResult> = {
		location: scoreLocation(client, agent),
		priceFit: scorePriceFit(client, agent),
		specialization: scoreSpecialization(client, agent, side),
		workingStyle: scoreWorkingStyle(client, agent, side),
		communication: scoreCommunication(client, agent, side),
		businessTerms: scoreBusinessTerms(client, agent),
	}

	const normalizedWeights: Record<DimensionId, number> = {
		...baseDimensionWeights,
	}
	for (const dimension of DIMENSION_IDS) {
		normalizedWeights[dimension] = weights[dimension] / 100
	}

	let linear = 0
	let geometric = 1
	for (const dimension of DIMENSION_IDS) {
		const score = results[dimension].score
		const weight = normalizedWeights[dimension]
		linear += weight * score
		geometric *= Math.max(score, SCORING_GEOMETRIC_FLOOR) ** weight
	}
	const consumerScore =
		variant?.blend === 'linearOnly'
			? linear
			: SCORING_LINEAR_WEIGHT * linear + SCORING_GEOMETRIC_WEIGHT * geometric

	const clientRange = parseSerializedPriceRange(client.priceRange)
	const agentRange = parseSerializedPriceRange(agent.typicalPriceRange)
	const centrality =
		clientRange && agentRange
			? clamp01(bucketCentrality(clientRange, agentRange))
			: 0

	const clientTypeFit = getClientTypeFit(client, agent, side)
	const agentFit = (centrality + clientTypeFit) / 2
	const reciprocalBlend =
		variant?.reciprocity === 'multiplier'
			? consumerScore * (0.75 + 0.25 * agentFit)
			: harmonicMean(
					consumerScore,
					SCORING_RECIPROCAL_AGENT_FLOOR + 0.5 * agentFit,
				)

	const baseFinalScore = Math.round(reciprocalBlend * 100)

	const notFitPenalty = applyNotFitPenalty(
		client,
		agent,
		side,
		baseFinalScore / 100,
	)
	const finalScore = notFitPenalty.penalized
		? Math.round(notFitPenalty.score * 100)
		: baseFinalScore

	const dimensions = DIMENSION_IDS.map((id): DimensionTrace => {
		const result = results[id]
		const weight = weights[id]
		return {
			id,
			label: DIMENSION_LABELS[id],
			baseWeight: baseDimensionWeights[id],
			weight: round2(weight),
			boosted: boosted.has(id),
			score: round2(result.score),
			contribution: round2(weight * result.score),
			explanation: result.explanation,
			checks: result.checks,
		}
	})

	const disqualifiers = evaluateDisqualifiers(
		client,
		agent,
		side,
		results.location,
		results.priceFit,
	)
	const disqualified = disqualifiers.some((entry) => entry.disqualified)
	const fitScore = disqualified ? 0 : finalScore

	const scores: Record<ScoreBucket, number> = {
		Location: toStars(results.location.score),
		'Price Fit': toStars(results.priceFit.score),
		Specialization: toStars(results.specialization.score),
		'Working Style': toStars(results.workingStyle.score),
		Communication: toStars(results.communication.score),
		'Business Terms': toStars(results.businessTerms.score),
	}

	const dimensionFormula = dimensions
		.map((dimension) => `${dimension.weight} × ${dimension.score}`)
		.join(' + ')
	const penaltyText = notFitPenalty.penalized
		? `; notFitFor penalty (${notFitPenalty.reason}) → ${finalScore}`
		: ''
	const fullFormula = `consumerScore = ${SCORING_LINEAR_WEIGHT}·linear + ${SCORING_GEOMETRIC_WEIGHT}·geometric; harmonicMean(consumerScore, ${SCORING_RECIPROCAL_AGENT_FLOOR} + 0.5·agentFit) → ${round2(reciprocalBlend)}${penaltyText}; dims: ${dimensionFormula}`

	return {
		fitScore,
		scores,
		disqualified,
		trace: {
			mode: 'client-scored',
			side: toMatchSide(side),
			matchPriorities: client.matchPriorities ?? [],
			disqualifiers,
			disqualified,
			dimensions,
			computedScore: baseFinalScore,
			fitScore,
			formula: disqualified
				? `disqualified (${disqualifiers
						.filter((entry) => entry.disqualified)
						.map((entry) => entry.label)
						.join(', ')}) — ${fullFormula}`
				: fullFormula,
			agentFit: round2(agentFit),
			reciprocalBlend: round2(reciprocalBlend),
			stage2: {
				linear: round2(linear),
				geometric: round2(geometric),
				consumerScore: round2(consumerScore),
			},
			notFitPenalty: notFitPenalty.penalized
				? {
						reason: notFitPenalty.reason,
						scoreBefore: round2(baseFinalScore / 100),
						scoreAfter: round2(notFitPenalty.score),
					}
				: undefined,
			geo: results.location.geo,
		},
	}
}

function calculateFallbackScore(
	agent: AgentProfile,
	side: 'buying' | 'selling',
): FitScoreResult {
	const checks = [
		{
			label: 'representationSide set',
			present: Boolean(agent.representationSide),
		},
		{
			label: 'typicalPriceRange is valid bucket',
			present: Boolean(parseSerializedPriceRange(agent.typicalPriceRange)),
		},
		{
			label: 'bestClientTypes ranked',
			present: agent.bestClientTypes.length >= 2,
		},
		{ label: 'zipCodes non-empty', present: agent.zipCodes.length > 0 },
	]
	const present = checks.filter((check) => check.present)
	const completeness = present.length / checks.length
	const fitScore = Math.round(completeness * 100)
	const stars = toStars(completeness)

	return {
		fitScore,
		scores: {
			Location: stars,
			'Price Fit': stars,
			Specialization: stars,
			'Working Style': stars,
			Communication: stars,
			'Business Terms': stars,
		},
		disqualified: false,
		trace: {
			mode: 'fallback',
			side: toMatchSide(side),
			matchPriorities: [],
			disqualifiers: [],
			disqualified: false,
			dimensions: [],
			computedScore: fitScore,
			fitScore,
			formula: `no client profile — completeness fallback: round(${present.length} / ${checks.length} × 100) = ${fitScore}`,
			fallback: {
				present: present.map((check) => check.label),
				missing: checks
					.filter((check) => !check.present)
					.map((check) => check.label),
			},
		},
	}
}

export const TIE_BAND_THRESHOLD = 3

function hashStringToNumber(input: string): number {
	let hash = 0
	for (let i = 0; i < input.length; i++) {
		const code = input.charCodeAt(i)
		hash = (hash << 5) - hash + code
		hash |= 0
	}
	return Math.abs(hash)
}

export function tieBandRotation(clientId: string, bandSize: number): number {
	if (bandSize <= 1) return 0
	return hashStringToNumber(clientId) % bandSize
}

export function buildTieBands<T extends { score: { fitScore: number } }>(
	sorted: T[],
): T[][] {
	const bands: T[][] = []
	let currentBand: T[] = []

	for (const item of sorted) {
		if (currentBand.length === 0) {
			currentBand.push(item)
			continue
		}

		const lastScore = currentBand[currentBand.length - 1]!.score.fitScore
		if (Math.abs(lastScore - item.score.fitScore) <= TIE_BAND_THRESHOLD) {
			currentBand.push(item)
		} else {
			bands.push(currentBand)
			currentBand = [item]
		}
	}
	if (currentBand.length > 0) bands.push(currentBand)
	return bands
}

export interface RankedTieBandItem<T> {
	item: T
	/** 1-based rank after tie-band rotation — the order shown to the client. */
	displayRank: number
	/** 1-based rank by raw score before rotation. */
	preShuffleRank: number
	bandIndex: number
	bandSize: number
	bandOffset: number
}

export function rankWithTieBandsDetailed<
	T extends { score: { fitScore: number } },
>(scored: T[], clientId?: string): RankedTieBandItem<T>[] {
	const sorted = [...scored].sort((a, b) => b.score.fitScore - a.score.fitScore)
	const bands = buildTieBands(sorted)
	const ranked: RankedTieBandItem<T>[] = []
	let displayRank = 1
	let bandStart = 1
	let bandIndex = 0

	for (const band of bands) {
		const bandSize = band.length
		const bandOffset = clientId ? tieBandRotation(clientId, bandSize) : 0

		for (let position = 0; position < bandSize; position++) {
			const originalIndex = (bandOffset + position) % bandSize
			const item = band[originalIndex]
			if (!item) continue
			ranked.push({
				item,
				displayRank,
				preShuffleRank: bandStart + originalIndex,
				bandIndex,
				bandSize,
				bandOffset,
			})
			displayRank++
		}

		bandStart += bandSize
		bandIndex++
	}

	return ranked
}

export function rankWithTieBands<T extends { score: { fitScore: number } }>(
	scored: T[],
	clientId?: string,
): T[] {
	return rankWithTieBandsDetailed(scored, clientId).map((ranked) => ranked.item)
}
