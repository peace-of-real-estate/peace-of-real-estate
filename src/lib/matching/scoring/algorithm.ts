import type { AgentProfile, ClientProfileRow } from '@/lib/profile/types'
import type { BestClientTypeSlug, PropertyTypeSlug } from '@/lib/profile'
import { clientMatchingColumns } from '@/lib/profile/db'

import type {
	DimensionId,
	DimensionResult,
	DimensionTrace,
	DisqualifierTrace,
	FitScoreResult,
	MatchSide,
} from './types'
import {
	formatList,
	formatPriceRangeValue,
	parseSerializedPriceRange,
	priceOverlapRatio,
	round2,
	toStars,
} from './utils'

export interface DimensionSpec {
	id: DimensionId
	label: string
	scoreLabel: string
	baseWeight: number
	score: (
		client: ClientProfileRow,
		agent: AgentProfile,
		side: MatchSide,
	) => DimensionResult
}

/**
 * matchPriorities stores client question ids; each maps to the scoring
 * dimension it should boost (×1.5, then weights renormalize to 100).
 */
const PRIORITY_TO_DIMENSION: Partial<
	Record<keyof typeof clientMatchingColumns, DimensionId>
> = {
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

export function scoreLocation(
	client: ClientProfileRow,
	agent: AgentProfile,
	_side: MatchSide,
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
	client: ClientProfileRow,
	agent: AgentProfile,
	_side: MatchSide,
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
	client: ClientProfileRow,
	side: MatchSide,
): Map<BestClientTypeSlug, string[]> {
	const sources = new Map<BestClientTypeSlug, string[]>()
	const add = (slug: BestClientTypeSlug, source: string) => {
		const existing = sources.get(slug)
		if (existing) existing.push(source)
		else sources.set(slug, [source])
	}

	if (side === 'sellers') add('seller', 'selling side')
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
	client: ClientProfileRow,
	side: MatchSide,
): BestClientTypeSlug[] {
	return [...expectedClientTypeSources(client, side).keys()]
}

export function scoreClientFit(
	client: ClientProfileRow,
	agent: AgentProfile,
	side: MatchSide,
): DimensionResult {
	const sources = expectedClientTypeSources(client, side)
	const expected: BestClientTypeSlug[] = [...sources.keys()]
	const agentTypes: BestClientTypeSlug[] = agent.bestClientTypes
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

export const DIMENSIONS: readonly DimensionSpec[] = [
	{
		id: 'location',
		label: 'Location',
		scoreLabel: 'Location',
		baseWeight: 40,
		score: scoreLocation,
	},
	{
		id: 'priceFit',
		label: 'Price fit',
		scoreLabel: 'Price Fit',
		baseWeight: 35,
		score: scorePriceFit,
	},
	{
		id: 'clientFit',
		label: 'Client-type fit',
		scoreLabel: 'Client Fit',
		baseWeight: 25,
		score: scoreClientFit,
	},
]

function dimensionRecord(
	getValue: (dimension: DimensionSpec) => number,
): Record<DimensionId, number> {
	const [location, priceFit, clientFit] = DIMENSIONS
	if (!location || !priceFit || !clientFit) {
		throw new Error('Scoring dimensions are not configured')
	}
	return {
		location: getValue(location),
		priceFit: getValue(priceFit),
		clientFit: getValue(clientFit),
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
		const dimension = Object.entries(PRIORITY_TO_DIMENSION).find(
			([field]) => field === priority,
		)?.[1]
		if (dimension) boosted.add(dimension)
	}

	const raw = dimensionRecord((dimension) =>
		boosted.has(dimension.id)
			? dimension.baseWeight * PRIORITY_BOOST
			: dimension.baseWeight,
	)

	const total = Object.values(raw).reduce((sum, weight) => sum + weight, 0)
	const weights = dimensionRecord(
		(dimension) => (raw[dimension.id] / total) * 100,
	)

	return { weights, boosted }
}

function evaluateDisqualifiers(
	client: ClientProfileRow,
	agent: AgentProfile,
	side: MatchSide,
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

export function calculateFitScore(
	agent: AgentProfile,
	client?: ClientProfileRow,
	side: MatchSide = 'buyers',
): FitScoreResult {
	if (!client) return calculateFallbackScore(agent, side)

	const { weights, boosted } = resolveDimensionWeights(client.matchPriorities)

	const results = DIMENSIONS.map((dimension) => ({
		dimension,
		result: dimension.score(client, agent, side),
	}))
	const dimensions = results.map(({ dimension, result }): DimensionTrace => {
		return {
			id: dimension.id,
			label: dimension.label,
			baseWeight: dimension.baseWeight,
			weight: round2(weights[dimension.id]),
			boosted: boosted.has(dimension.id),
			score: round2(result.score),
			contribution: round2(weights[dimension.id] * result.score),
			explanation: result.explanation,
			checks: result.checks,
		}
	})

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

	const scores = dimensionRecord((dimension) => {
		const result = results.find((entry) => entry.dimension.id === dimension.id)
		return toStars(result?.result.score ?? 0)
	})

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
	side: MatchSide,
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
		scores: dimensionRecord(() => stars),
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
