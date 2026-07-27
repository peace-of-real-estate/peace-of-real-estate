import type { CityCenter } from '@/lib/geography/zip'
import type { PriceRange } from '@/lib/price-range'
import type {
	AgentProfile,
	ClientProfile,
	ClientRole,
} from '@/lib/profile/types'

import type { DimensionId } from '../affinities'

export type ScoreBucket =
	| 'Location'
	| 'Price Fit'
	| 'Specialization'
	| 'Working Style'
	| 'Communication'
	| 'Business Terms'

/** Geographic inputs the location dimension actually scored with. */
export interface LocationGeoTrace {
	client: CityCenter
	agent: CityCenter
	centroidMiles: number
	zipFit: number
	cityFit: number
}

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

export interface DimensionResult {
	score: number
	explanation: string
	checks: SubCheck[]
	/** Only set by the location dimension. */
	geo?: LocationGeoTrace | undefined
}

export interface DisqualifierTrace {
	id: string
	label: string
	disqualified: boolean
	detail: string
}

export interface ScoreTrace {
	mode: 'client-scored'
	side: ClientRole
	matchPriorities: string[]
	disqualifiers: DisqualifierTrace[]
	disqualified: boolean
	dimensions: DimensionTrace[]
	/** Weighted dimension total before the disqualifier gate is applied. */
	computedScore: number
	/** computedScore, or 0 if any hard disqualifier fired. */
	fitScore: number
	formula: string
	agentFit?: number
	reciprocalBlend?: number
	stage2?:
		| { linear: number; geometric: number; consumerScore: number }
		| undefined
	notFitPenalty?:
		| { reason: string; scoreBefore: number; scoreAfter: number }
		| undefined
	/** Location-dimension geography, hoisted for map visualizations. */
	geo?: LocationGeoTrace | undefined
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

export type PriceRangeValue = PriceRange
