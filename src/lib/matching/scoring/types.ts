import type { AgentProfile, ClientProfileRow } from '@/lib/profile/types'

/**
 * Experience and trust signals are intentionally not scoring dimensions:
 * trust attestations (peace pact, license, E&O) are required at signup, so
 * they cannot differentiate agents, and years licensed / volume said little
 * about fit for a specific client.
 */
export type DimensionId =
	| 'location'
	| 'priceFit'
	| 'specialization'
	| 'workingStyle'
	| 'communication'
	| 'businessTerms'

export type MatchSide = 'buyers' | 'sellers'

export type ScoreBucket =
	| 'Location'
	| 'Price Fit'
	| 'Specialization'
	| 'Working Style'
	| 'Communication'
	| 'Business Terms'

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
}

export interface DisqualifierTrace {
	id: string
	label: string
	disqualified: boolean
	detail: string
}

export interface ScoreTrace {
	mode: 'client-scored' | 'fallback'
	side: MatchSide
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
	clientProfile: ClientProfileRow | null
}

export interface FitScoreResult {
	fitScore: number
	scores: Record<ScoreBucket, number>
	disqualified: boolean
	trace: ScoreTrace
}

export interface PriceRangeValue {
	min: number
	max: number
}
