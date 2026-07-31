import type { CityCenter } from '@/lib/geography/zip'
import {
	AGENT_PRICE_RANGES,
	BUCKET_ORDER,
	toAgentPriceBucket,
	type PriceRange,
} from '@/lib/price-range'
import type { EnjoyedClientTypeSlug } from '@/lib/profile/profile-fields'
import type {
	AgentProfile,
	BuyerProfile,
	ClientProfile,
	ClientRole,
	SellerProfile,
} from '@/lib/profile/types'

import {
	agentDecisionToClient,
	baseDimensionWeights,
	clientDecisionOrder,
	commissionMatrix,
	DIMENSION_IDS,
	DIMENSION_LABELS,
	type DimensionId,
	lookUpAffinity,
	ordinalScore,
	ordinalScores3,
	ordinalScores4,
	riskScores,
} from '../affinities'
import type {
	DimensionResult,
	DimensionTrace,
	DisqualifierTrace,
	FitScoreResult,
	PriceRangeValue,
	ScoreBucket,
} from './types'
import {
	clamp01,
	formatList,
	formatPriceRangeValue,
	priceOverlapRatio,
	round2,
	toStars,
} from './utils'

export const SCORING_GEOMETRIC_FLOOR = 0.05
export const SCORING_LINEAR_WEIGHT = 0.7
export const SCORING_GEOMETRIC_WEIGHT = 0.3
export const SCORING_RECIPROCAL_AGENT_FLOOR = 0.5

const LUXURY_PRICE_FLOOR = 1_000_000

function haversineMiles(
	lat1: number,
	lng1: number,
	lat2: number,
	lng2: number,
): number {
	const earthRadiusMiles = 3958.8
	const dLat = ((lat2 - lat1) * Math.PI) / 180
	const dLng = ((lng2 - lng1) * Math.PI) / 180
	const a =
		Math.sin(dLat / 2) * Math.sin(dLat / 2) +
		Math.cos((lat1 * Math.PI) / 180) *
			Math.cos((lat2 * Math.PI) / 180) *
			Math.sin(dLng / 2) *
			Math.sin(dLng / 2)
	const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
	return earthRadiusMiles * c
}

function distanceBetweenZips(
	clientCenter: CityCenter,
	agentCenter: CityCenter,
): number {
	return haversineMiles(
		clientCenter.lat,
		clientCenter.lng,
		agentCenter.lat,
		agentCenter.lng,
	)
}

function distanceScore(miles: number): number {
	if (miles <= 0) return 1
	if (miles <= 2) return 0.95
	if (miles <= 5) return 0.8
	if (miles <= 10) return 0.6
	if (miles <= 20) return 0.3
	return 0
}

function cityFitScore(centroidMiles: number): number {
	return 0.65 * Math.max(0, 1 - centroidMiles / 50)
}

export function scoreLocation(
	client: ClientProfile,
	agent: AgentProfile,
): DimensionResult {
	const clientCenters = new Map(
		client.geography.map(({ zip, center }) => [zip, center]),
	)
	const agentCenters = new Map(
		agent.geography.map(({ zip, center }) => [zip, center]),
	)
	const clientZips = [...clientCenters.keys()]
	const agentZips = [...agentCenters.keys()]

	let bestFitSum = 0
	if (clientCenters.size > 0 && agentCenters.size > 0) {
		for (const [clientZip, clientCenter] of clientCenters) {
			let best = 0
			for (const [agentZip, agentCenter] of agentCenters) {
				best = Math.max(
					best,
					clientZip === agentZip
						? 1
						: distanceScore(distanceBetweenZips(clientCenter, agentCenter)),
				)
			}
			bestFitSum += best
		}
	}

	const zipFit = clientZips.length > 0 ? bestFitSum / clientZips.length : 0
	const clientCenter = client.city.center
	const agentCenter = agent.city.center
	const centroidMiles = haversineMiles(
		clientCenter.lat,
		clientCenter.lng,
		agentCenter.lat,
		agentCenter.lng,
	)
	const cityFit = cityFitScore(centroidMiles)
	const locationScore = Math.max(zipFit, cityFit)

	return {
		score: round2(locationScore),
		explanation:
			locationScore > 0
				? `zip ${round2(zipFit)} · city ${round2(cityFit)}`
				: 'no geographic overlap',
		checks: [
			{
				label: 'zip codes',
				client: formatList(clientZips),
				agent: formatList(agentZips),
				passed: zipFit > 0,
				effect: `distance-aware zip fit ${round2(zipFit)}`,
			},
			{
				label: 'city centroid',
				client: `${round2(clientCenter.lat)}, ${round2(clientCenter.lng)}`,
				agent: `${round2(agentCenter.lat)}, ${round2(agentCenter.lng)}`,
				passed: cityFit > 0,
				effect: `continuous taper ${round2(cityFit)} (${round2(centroidMiles)} mi)`,
			},
		],
		geo: {
			client: clientCenter,
			agent: agentCenter,
			centroidMiles: round2(centroidMiles),
			zipFit: round2(zipFit),
			cityFit: round2(cityFit),
		},
	}
}

function clientPriceRange(client: ClientProfile): PriceRange {
	return { min: client.priceMin, max: client.priceMax }
}

function scorePriceFit(
	client: ClientProfile,
	agent: AgentProfile,
): DimensionResult {
	const clientRange = clientPriceRange(client)
	const agentBucket = toAgentPriceBucket(agent.typicalPriceRange)
	const agentRange = agentBucket ? AGENT_PRICE_RANGES[agentBucket] : undefined
	const agentCell = agentRange
		? `${agent.typicalPriceRange} (${formatPriceRangeValue(agentRange)})`
		: agent.typicalPriceRange

	if (!agentRange) {
		return {
			score: 0,
			explanation: 'agent price range missing or unparseable',
			checks: [
				{
					label: 'price range',
					client: formatPriceRangeValue(clientRange),
					agent: agentCell,
					passed: false,
					effect: 'cannot score → 0',
				},
			],
		}
	}

	const bucketIndex = agentBucket ? BUCKET_ORDER.indexOf(agentBucket) : -1
	const adjacentBuckets: PriceRange[] = []
	if (bucketIndex > 0)
		adjacentBuckets.push(AGENT_PRICE_RANGES[BUCKET_ORDER[bucketIndex - 1]!]!)
	if (bucketIndex < BUCKET_ORDER.length - 1)
		adjacentBuckets.push(AGENT_PRICE_RANGES[BUCKET_ORDER[bucketIndex + 1]!]!)

	const bucketOverlap = priceOverlapRatio(clientRange, agentRange)
	const adjacentOverlap = adjacentBuckets.length
		? Math.max(
				...adjacentBuckets.map((range) =>
					priceOverlapRatio(clientRange, range),
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
				client: formatPriceRangeValue(clientRange),
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

type ClientSideProfile =
	| { side: 'buyer'; client: BuyerProfile }
	| { side: 'seller'; client: SellerProfile }

function toClientSideProfile(client: ClientProfile): ClientSideProfile {
	return client.role === 'buyer'
		? { side: 'buyer', client }
		: { side: 'seller', client }
}

function expectedClientTypeSources(
	clientBySide: ClientSideProfile,
): Map<EnjoyedClientTypeSlug, string[]> {
	const sources = new Map<EnjoyedClientTypeSlug, string[]>()
	const add = (slug: EnjoyedClientTypeSlug, source: string) => {
		const existing = sources.get(slug)
		if (existing) existing.push(source)
		else sources.set(slug, [source])
	}

	if (clientBySide.side === 'buyer') {
		if (clientBySide.client.buyingExperience === 'firstTime') {
			add('firstTimeBuyers', 'first-time buyer')
		}
		if (clientBySide.client.buyingExperience === 'severalTimes') {
			add('experiencedLowMaintenance', 'experienced buyer')
		}
	} else {
		if (clientBySide.client.sellingMotivation === 'lifeChange') {
			add('lifeChangeSellers', 'life change')
		}
		if (clientBySide.client.sellingMotivation === 'relocating') {
			add('relocating', 'relocating')
		}
	}
	if (clientBySide.client.priceMin >= LUXURY_PRICE_FLOOR)
		add('luxury', 'budget ≥ $1M')
	return sources
}

export function deriveExpectedClientTypes(
	client: ClientProfile,
): EnjoyedClientTypeSlug[] {
	return [...expectedClientTypeSources(toClientSideProfile(client)).keys()]
}

function overlapCount(
	left: readonly string[],
	right: readonly string[],
): number {
	const rightSet = new Set(right)
	return left.filter((value) => rightSet.has(value)).length
}

function scoreSpecialization(
	clientBySide: ClientSideProfile,
	agent: AgentProfile,
): DimensionResult {
	const sources = expectedClientTypeSources(clientBySide)
	const expected = [...sources.keys()]
	const enjoyedClients = agent.enjoyedClients ?? []
	const clientTypeScore = expected.length
		? expected.some((slug) => enjoyedClients.includes(slug))
			? 1
			: 0.4
		: 0.5
	const clientSpecialties = clientBySide.client.situationSpecialties ?? []
	const agentSpecialties = agent.specialties ?? []
	const specialtyScore = clientSpecialties.length
		? overlapCount(clientSpecialties, agentSpecialties) /
			clientSpecialties.length
		: 0.5
	const score = (clientTypeScore + specialtyScore) / 2

	return {
		score: round2(score),
		explanation: `client type ${round2(clientTypeScore)} · specialty ${round2(specialtyScore)}`,
		checks: [
			{
				label: 'client types',
				client: expected.length ? formatList(expected) : '(none)',
				agent: enjoyedClients.length ? formatList(enjoyedClients) : '(none)',
				passed:
					clientTypeScore >= 0.7
						? true
						: clientTypeScore === 0.5
							? null
							: false,
				effect: `score ${round2(clientTypeScore)}`,
			},
			{
				label: 'special situations',
				client: clientSpecialties.length
					? formatList(clientSpecialties)
					: '(none)',
				agent: agentSpecialties.length
					? formatList(agentSpecialties)
					: '(none)',
				passed:
					specialtyScore >= 0.7 ? true : specialtyScore === 0.5 ? null : false,
				effect: `score ${round2(specialtyScore)}`,
			},
		],
	}
}

function simpleDimension(
	label: string,
	client: string,
	agent: string,
	score: number,
): DimensionResult {
	return {
		score: round2(score),
		explanation: `${label} → ${round2(score)}`,
		checks: [
			{
				label,
				client,
				agent,
				passed: score >= 0.7,
				effect: `score ${round2(score)}`,
			},
		],
	}
}

function scoreDecisions(
	client: ClientProfile,
	agent: AgentProfile,
): DimensionResult {
	const score = ordinalScore(
		clientDecisionOrder,
		client.decisionStyle,
		agentDecisionToClient[agent.clientDecisionStyle],
		ordinalScores4,
	)
	return simpleDimension(
		'decision style',
		client.decisionStyle,
		agent.clientDecisionStyle,
		score,
	)
}

function scoreRisk(
	client: ClientProfile,
	agent: AgentProfile,
): DimensionResult {
	const score = ordinalScore(
		['noRisk', 'lowRisk', 'moderateRisk', 'allIn'],
		client.riskComfort,
		agent.riskAdviceComfort,
		riskScores,
	)
	return simpleDimension(
		'risk comfort',
		client.riskComfort,
		agent.riskAdviceComfort,
		score,
	)
}

function scoreCommunication(
	client: ClientProfile,
	agent: AgentProfile,
): DimensionResult {
	const score = ordinalScore(
		['whenItMatters', 'regularCheckins', 'handsOn'],
		client.contactStyle,
		agent.clientContactStyle,
		ordinalScores3,
	)
	return simpleDimension(
		'contact style',
		client.contactStyle,
		agent.clientContactStyle,
		score,
	)
}

function scoreCommission(
	client: ClientProfile,
	agent: AgentProfile,
): DimensionResult {
	const score =
		lookUpAffinity(
			commissionMatrix,
			client.commissionPlan,
			agent.commissionStyle,
		) ?? 0
	return simpleDimension(
		'commission',
		client.commissionPlan,
		agent.commissionStyle,
		score,
	)
}

function evaluateDisqualifiers(
	client: ClientProfile,
	agent: AgentProfile,
	side: ClientRole,
	locationResult: DimensionResult,
	priceResult: DimensionResult,
): DisqualifierTrace[] {
	const sideMismatch = agent.representationSide !== side
	const stateMismatch = client.city.state !== agent.city.state
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
			detail: `client in ${client.city.state}, agent in ${agent.city.state}`,
		},
		{
			id: 'location',
			label: 'Location floor',
			disqualified: locationResult.score <= 0,
			detail:
				locationResult.score <= 0
					? 'no geographic overlap'
					: `location score ${locationResult.score}`,
		},
		{
			id: 'priceFit',
			label: 'Price contact',
			disqualified: priceResult.score <= 0,
			detail:
				priceResult.score <= 0
					? 'client range does not touch agent bucket or adjacent buckets'
					: `price score ${priceResult.score}`,
		},
	]
}

function harmonicMean(a: number, b: number): number {
	if (a <= 0 || b <= 0) return 0
	return (2 * a * b) / (a + b)
}

export function calculateFitScore(
	agent: AgentProfile,
	client: ClientProfile,
): FitScoreResult {
	const clientBySide = toClientSideProfile(client)
	const results: Record<DimensionId, DimensionResult> = {
		location: scoreLocation(client, agent),
		priceFit: scorePriceFit(client, agent),
		specialization: scoreSpecialization(clientBySide, agent),
		decisions: scoreDecisions(client, agent),
		communication: scoreCommunication(client, agent),
		risk: scoreRisk(client, agent),
		commission: scoreCommission(client, agent),
	}

	const normalizedWeights: Record<DimensionId, number> = {
		location: baseDimensionWeights.location / 100,
		priceFit: baseDimensionWeights.priceFit / 100,
		specialization: baseDimensionWeights.specialization / 100,
		decisions: baseDimensionWeights.decisions / 100,
		communication: baseDimensionWeights.communication / 100,
		risk: baseDimensionWeights.risk / 100,
		commission: baseDimensionWeights.commission / 100,
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
		SCORING_LINEAR_WEIGHT * linear + SCORING_GEOMETRIC_WEIGHT * geometric
	const agentBucket = toAgentPriceBucket(agent.typicalPriceRange)
	const agentRange = agentBucket ? AGENT_PRICE_RANGES[agentBucket] : undefined
	const centrality = agentRange
		? clamp01(bucketCentrality(clientPriceRange(client), agentRange))
		: 0
	const agentFit = (centrality + results.specialization.score) / 2
	const reciprocalBlend = harmonicMean(
		consumerScore,
		SCORING_RECIPROCAL_AGENT_FLOOR + 0.5 * agentFit,
	)
	const computedScore = Math.round(reciprocalBlend * 100)

	const dimensions = DIMENSION_IDS.map((id): DimensionTrace => {
		const result = results[id]
		const weight = baseDimensionWeights[id]
		return {
			id,
			label: DIMENSION_LABELS[id],
			weight: round2(weight),
			score: round2(result.score),
			contribution: round2(weight * result.score),
			explanation: result.explanation,
			checks: result.checks,
		}
	})

	const disqualifiers = evaluateDisqualifiers(
		client,
		agent,
		clientBySide.side,
		results.location,
		results.priceFit,
	)
	const disqualified = disqualifiers.some((entry) => entry.disqualified)
	const fitScore = disqualified ? 0 : computedScore
	const scores: Record<ScoreBucket, number> = {
		Location: toStars(results.location.score),
		'Price Fit': toStars(results.priceFit.score),
		Specialization: toStars(results.specialization.score),
		'Decision Support': toStars(results.decisions.score),
		Communication: toStars(results.communication.score),
		'Risk Comfort': toStars(results.risk.score),
		Commission: toStars(results.commission.score),
	}
	const dimensionFormula = dimensions
		.map((dimension) => `${dimension.weight} × ${dimension.score}`)
		.join(' + ')
	const fullFormula = `consumerScore = ${SCORING_LINEAR_WEIGHT}·linear + ${SCORING_GEOMETRIC_WEIGHT}·geometric; harmonicMean(consumerScore, ${SCORING_RECIPROCAL_AGENT_FLOOR} + 0.5·agentFit) → ${round2(reciprocalBlend)}; dims: ${dimensionFormula}`

	return {
		fitScore,
		scores,
		disqualified,
		trace: {
			mode: 'client-scored',
			side: clientBySide.side,
			disqualifiers,
			disqualified,
			dimensions,
			computedScore,
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
			geo: results.location.geo,
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
	displayRank: number
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
