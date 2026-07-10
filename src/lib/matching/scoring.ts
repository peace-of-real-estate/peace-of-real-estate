import { parseMinMaxRange } from '@/lib/matching/price-range'

import type {
	AgentProfile,
	BuyerProfile,
	SellerProfile,
} from '@/lib/matching/profile.types'
import type {
	BestClientTypeSlug,
	PropertyTypeSlug,
} from '@/lib/matching/questions'

type ClientProfile = BuyerProfile | SellerProfile

export interface AgentMatchData {
	id: string
	name: string
	role: 'agent'
	location: string
	zipCodes: string[]
	fitScore: number
	status: 'new' | 'pending' | 'accepted'
	date: string
	experience?: string
	agency?: string
	specialties: string[]
	about: string
	scores: Record<ScoreBucket, number>
	contact?: {
		phone?: string
		email?: string
	}
	stats?: {
		transactions: number
		avgDays: number
		satisfaction: number
	}
	isTopMatch?: boolean
	avatar?: string
	debug?: MatchDebugInfo
}

export type ScoreBucket = 'Location' | 'Price Fit' | 'Client Fit'

/**
 * Experience and trust signals are intentionally not scoring dimensions:
 * trust attestations (peace pact, license, E&O) are required at signup, so
 * they cannot differentiate agents, and years licensed / volume said little
 * about fit for a specific client.
 */
export type DimensionId = 'location' | 'priceFit' | 'clientFit'

const DIMENSION_IDS: DimensionId[] = ['location', 'priceFit', 'clientFit']

/** One row of a dimension's client-vs-agent comparison table. */
export interface SubCheck {
	label: string
	client: string
	agent: string
	passed: boolean | null
	effect: string
}

export interface DimensionTrace {
	id: DimensionId
	label: string
	baseWeight: number
	weight: number
	boosted: boolean
	score: number
	contribution: number
	explanation: string
	checks: SubCheck[]
}

export interface DisqualifierTrace {
	id: string
	label: string
	disqualified: boolean
	detail: string
}

export interface ScoreTrace {
	mode: 'client-scored' | 'fallback'
	side: 'buying' | 'selling'
	matchPriorities: string[]
	disqualifiers: DisqualifierTrace[]
	disqualified: boolean
	dimensions: DimensionTrace[]
	/** Weighted dimension total before the disqualifier gate is applied. */
	computedScore: number
	/** computedScore, or 0 if any hard disqualifier fired. */
	fitScore: number
	formula: string
	fallback?: {
		present: string[]
		missing: string[]
	}
}

export interface MatchDebugInfo {
	rank: number
	totalAgents: number
	qualifiedCount: number
	scoreDistribution: { range: string; count: number }[]
	trace: ScoreTrace
	agentProfile: AgentProfile
	clientProfile: ClientProfile | null
}

export interface FitScoreResult {
	fitScore: number
	scores: Record<ScoreBucket, number>
	disqualified: boolean
	trace: ScoreTrace
}

export const BASE_WEIGHTS: Record<DimensionId, number> = {
	location: 40,
	priceFit: 35,
	clientFit: 25,
}

const DIMENSION_LABELS: Record<DimensionId, string> = {
	location: 'Location',
	priceFit: 'Price fit',
	clientFit: 'Client-type fit',
}

/**
 * matchPriorities stores client question ids; each maps to the scoring
 * dimension it should boost (×1.5, then weights renormalize to 100).
 */
const PRIORITY_TO_DIMENSION: Record<string, DimensionId> = {
	priceRange: 'priceFit',
	propertyTypes: 'clientFit',
	state: 'location',
	city: 'location',
	zipCodes: 'location',
}

const PRIORITY_BOOST = 1.5

/** Buyer property-type slugs → agent bestClientTypes slugs that serve them. */
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

export interface PriceRangeValue {
	min: number
	max: number
}

/**
 * Strict parser for the app's serialized "min-max" price format
 * (see serializePriceRange in price-range.ts). Returns undefined for
 * anything else so callers can trace unparseable data instead of
 * silently substituting defaults.
 */
export function parseSerializedPriceRange(
	value: string | null | undefined,
): PriceRangeValue | undefined {
	return parseMinMaxRange(value)
}

/**
 * Fraction of the client's price range that the agent's typical range
 * covers, in [0, 1]. A point range (min === max) scores 1 when the agent
 * covers that price.
 */
export function priceOverlapRatio(
	client: PriceRangeValue,
	agent: PriceRangeValue,
): number {
	const overlap =
		Math.min(client.max, agent.max) - Math.max(client.min, agent.min)
	const span = client.max - client.min
	if (span <= 0) return overlap >= 0 ? 1 : 0
	return Math.max(0, Math.min(1, overlap / span))
}

function formatList(values: string[] | null | undefined): string {
	if (!values || values.length === 0) return '(none)'
	return values.join(', ')
}

function formatPriceRangeValue(range: PriceRangeValue): string {
	return `$${range.min.toLocaleString()}–$${range.max.toLocaleString()}`
}

function clamp01(value: number): number {
	return Math.max(0, Math.min(1, value))
}

function round2(value: number): number {
	return Number(value.toFixed(2))
}

interface DimensionResult {
	score: number
	explanation: string
	checks: SubCheck[]
}

export function scoreLocation(
	client: ClientProfile,
	agent: AgentProfile,
): DimensionResult {
	const clientZips = client.zipCodes ?? []
	const zipOverlap = agent.zipCodes.filter((zip) => clientZips.includes(zip))
	const sameState = Boolean(
		client.state &&
		agent.state &&
		client.state.toLowerCase() === agent.state.toLowerCase(),
	)
	const sameCity =
		sameState &&
		Boolean(
			client.city &&
			agent.city &&
			client.city.toLowerCase() === agent.city.toLowerCase(),
		)

	let score = 0
	let explanation = 'no geographic overlap'
	if (zipOverlap.length > 0) {
		score = 1
		explanation = `agent serves ${zipOverlap.length} of the client's zip codes`
	} else if (sameCity) {
		score = 0.75
		explanation = 'same city, no shared zip codes'
	} else if (sameState) {
		score = 0.4
		explanation = 'same state, different city'
	}

	return {
		score,
		explanation,
		checks: [
			{
				label: 'zip codes',
				client: formatList(clientZips),
				agent: formatList(agent.zipCodes),
				passed: zipOverlap.length > 0,
				effect:
					zipOverlap.length > 0
						? `share ${formatList(zipOverlap)} → score 1.0`
						: 'no shared zips',
			},
			{
				label: 'city',
				client: client.city ?? '(none)',
				agent: agent.city,
				passed: sameCity,
				effect: sameCity ? 'score ≥ 0.75' : '—',
			},
			{
				label: 'state',
				client: client.state ?? '(none)',
				agent: agent.state,
				passed: sameState,
				effect: sameState ? 'score ≥ 0.4' : '—',
			},
		],
	}
}

export function scorePriceFit(
	client: ClientProfile,
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
		? formatPriceRangeValue(agentRange)
		: agent.typicalPriceRange
			? `"${agent.typicalPriceRange}" (unparseable)`
			: '(none)'

	if (!clientRange || !agentRange) {
		return {
			score: 0,
			explanation: !clientRange
				? 'client price range missing or unparseable'
				: 'agent price range unparseable (expected serialized "min-max")',
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

	const ratio = priceOverlapRatio(clientRange, agentRange)
	return {
		score: ratio,
		explanation:
			ratio > 0
				? `agent covers ${Math.round(ratio * 100)}% of the client's price range`
				: 'price ranges do not overlap',
		checks: [
			{
				label: 'price range',
				client: clientCell,
				agent: agentCell,
				passed: ratio > 0,
				effect: `covers ${Math.round(ratio * 100)}% → score ${round2(ratio)}`,
			},
		],
	}
}

/**
 * Maps each expected agent bestClientTypes slug to the client signals that
 * produced it (side, property types, budget).
 */
function expectedClientTypeSources(
	client: ClientProfile,
	side: 'buying' | 'selling',
): Map<BestClientTypeSlug, string[]> {
	const sources = new Map<BestClientTypeSlug, string[]>()
	const add = (slug: BestClientTypeSlug, source: string) => {
		const existing = sources.get(slug)
		if (existing) existing.push(source)
		else sources.set(slug, [source])
	}

	if (side === 'selling') add('seller', 'selling side')
	for (const propertyType of client.propertyTypes ?? []) {
		for (const slug of propertyTypeToClientTypes[propertyType] ?? []) {
			add(slug, propertyType)
		}
	}
	const clientRange = parseSerializedPriceRange(client.priceRange)
	if (clientRange && clientRange.min >= LUXURY_PRICE_FLOOR) {
		add('luxury', 'budget ≥ $1M')
	}
	return sources
}

/**
 * Derives the agent bestClientTypes slugs a client should be served by,
 * from their property types, side, and budget.
 */
export function deriveExpectedClientTypes(
	client: ClientProfile,
	side: 'buying' | 'selling',
): BestClientTypeSlug[] {
	return [...expectedClientTypeSources(client, side).keys()]
}

export function scoreClientFit(
	client: ClientProfile,
	agent: AgentProfile,
	side: 'buying' | 'selling',
): DimensionResult {
	const sources = expectedClientTypeSources(client, side)
	const expected = [...sources.keys()]
	const agentTypes = agent.bestClientTypes
	const matched = expected.filter((slug) => agentTypes.includes(slug))

	if (expected.length === 0) {
		return {
			score: 0.5,
			explanation: 'client has no property types or side signals — neutral 0.5',
			checks: [
				{
					label: 'client signals',
					client: '(none)',
					agent: formatList(agentTypes),
					passed: null,
					effect: 'neutral 0.5',
				},
			],
		}
	}

	const score = matched.length / expected.length
	return {
		score,
		explanation: `agent serves ${matched.length} of ${expected.length} expected client types`,
		checks: expected.map((slug) => ({
			label: slug,
			client: `expected — from ${(sources.get(slug) ?? []).join(', ')}`,
			agent: agentTypes.includes(slug) ? 'serves' : 'not served',
			passed: agentTypes.includes(slug),
			effect: `1/${expected.length}`,
		})),
	}
}

/**
 * Applies matchPriorities boosts to the base weights and renormalizes so
 * the weights always sum to 100.
 */
export function resolveDimensionWeights(
	priorities: string[] | null | undefined,
): { weights: Record<DimensionId, number>; boosted: Set<DimensionId> } {
	const boosted = new Set<DimensionId>()
	for (const priority of priorities ?? []) {
		const dimension = PRIORITY_TO_DIMENSION[priority]
		if (dimension) boosted.add(dimension)
	}

	const raw: Record<DimensionId, number> = { ...BASE_WEIGHTS }
	for (const id of DIMENSION_IDS) {
		const weight = BASE_WEIGHTS[id]
		raw[id] = boosted.has(id) ? weight * PRIORITY_BOOST : weight
	}

	const total = Object.values(raw).reduce((sum, weight) => sum + weight, 0)
	const weights: Record<DimensionId, number> = { ...raw }
	for (const id of DIMENSION_IDS) {
		const weight = raw[id]
		weights[id] = (weight / total) * 100
	}

	return { weights, boosted }
}

function evaluateDisqualifiers(
	client: ClientProfile,
	agent: AgentProfile,
	side: 'buying' | 'selling',
): DisqualifierTrace[] {
	const sideMismatch =
		agent.representationSide !== 'both' && agent.representationSide !== side
	const stateKnown = Boolean(client.state)
	const stateMismatch = Boolean(
		client.state &&
		agent.state &&
		client.state.toLowerCase() !== agent.state.toLowerCase(),
	)

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
	]
}

function toStars(score: number): number {
	return Number((1 + clamp01(score) * 4).toFixed(1))
}

export function calculateFitScore(
	agent: AgentProfile,
	client?: ClientProfile,
	side: 'buying' | 'selling' = 'buying',
): FitScoreResult {
	if (!client) return calculateFallbackScore(agent, side)

	const { weights, boosted } = resolveDimensionWeights(client.matchPriorities)

	const results: Record<DimensionId, DimensionResult> = {
		location: scoreLocation(client, agent),
		priceFit: scorePriceFit(client, agent),
		clientFit: scoreClientFit(client, agent, side),
	}

	const dimensions = DIMENSION_IDS.map(
		(id): DimensionTrace => ({
			id,
			label: DIMENSION_LABELS[id],
			baseWeight: BASE_WEIGHTS[id],
			weight: round2(weights[id]),
			boosted: boosted.has(id),
			score: round2(results[id].score),
			contribution: round2(weights[id] * results[id].score),
			explanation: results[id].explanation,
			checks: results[id].checks,
		}),
	)

	const computedScore = Math.max(
		0,
		Math.min(
			100,
			Math.round(
				dimensions.reduce((sum, dimension) => sum + dimension.contribution, 0),
			),
		),
	)

	const disqualifiers = evaluateDisqualifiers(client, agent, side)
	const disqualified = disqualifiers.some((entry) => entry.disqualified)
	// A disqualified agent is not a match, full stop — the underlying
	// dimension total is kept in computedScore for debugging only.
	const fitScore = disqualified ? 0 : computedScore

	const scores: Record<ScoreBucket, number> = {
		Location: toStars(results.location.score),
		'Price Fit': toStars(results.priceFit.score),
		'Client Fit': toStars(results.clientFit.score),
	}

	const dimensionFormula = `round(${dimensions
		.map((dimension) => `${round2(dimension.weight)} × ${dimension.score}`)
		.join(' + ')}) = ${computedScore}`

	return {
		fitScore,
		scores,
		disqualified,
		trace: {
			mode: 'client-scored',
			side,
			matchPriorities: client.matchPriorities ?? [],
			disqualifiers,
			disqualified,
			dimensions,
			computedScore,
			fitScore,
			formula: disqualified
				? `disqualified (${disqualifiers
						.filter((entry) => entry.disqualified)
						.map((entry) => entry.label)
						.join(', ')}) — dimensions ${dimensionFormula} → fitScore = 0`
				: dimensionFormula,
		},
	}
}

/**
 * No client profile to score against: rank agents by profile completeness
 * so the list is still stable and explainable.
 */
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
			label: 'typicalPriceRange parseable',
			present: Boolean(parseSerializedPriceRange(agent.typicalPriceRange)),
		},
		{
			label: 'bestClientTypes non-empty',
			present: agent.bestClientTypes.length > 0,
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
			'Client Fit': stars,
		},
		disqualified: false,
		trace: {
			mode: 'fallback',
			side,
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
