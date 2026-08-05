import {
	agentDecisionStyle,
	clientDecisionStyle,
} from '@/lib/profile/profile-fields'
import type { SlugOf } from '@/lib/profile/question-types'

export type AffinityMatrix = Record<string, Record<string, number>>

export const ordinalScores3 = [1, 0.6, 0.25] as const
export const ordinalScores4 = [1, 0.7, 0.35, 0.1] as const
export const riskScores = [1, 0.7, 0.4, 0.15] as const

export type ClientDecisionSlug = SlugOf<typeof clientDecisionStyle>
export type AgentDecisionSlug = SlugOf<typeof agentDecisionStyle>

export const clientDecisionOrder: readonly ClientDecisionSlug[] = [
	'letThemLead',
	'walkMeThrough',
	'middleGround',
	'finalCall',
]

export const agentDecisionToClient: Record<
	AgentDecisionSlug,
	ClientDecisionSlug
> = {
	theyLetMeLead: 'letThemLead',
	walkThroughFollow: 'walkMeThrough',
	middleGround: 'middleGround',
	theirCall: 'finalCall',
}

export function ordinalScore(
	order: readonly string[],
	clientSlug: string,
	agentSlug: string,
	scores: readonly number[],
): number {
	const clientIndex = order.indexOf(clientSlug)
	const agentIndex = order.indexOf(agentSlug)
	if (clientIndex === -1 || agentIndex === -1) return 0
	return scores[Math.abs(clientIndex - agentIndex)] ?? 0
}

export const commissionMatrix: AffinityMatrix = {
	negotiate: {
		openToNegotiating: 1,
		walkThroughRate: 0.5,
		rateIsSet: 0.1,
	},
	discussThenDecide: {
		openToNegotiating: 0.9,
		walkThroughRate: 1,
		rateIsSet: 0.5,
	},
	acceptRate: {
		openToNegotiating: 0.8,
		walkThroughRate: 1,
		rateIsSet: 1,
	},
}

export const baseDimensionWeights = {
	location: 26,
	priceFit: 18,
	specialization: 16,
	decisions: 12,
	communication: 15,
	risk: 7,
	commission: 6,
} as const

export type DimensionId = keyof typeof baseDimensionWeights

export const DIMENSION_IDS: DimensionId[] = [
	'location',
	'priceFit',
	'specialization',
	'decisions',
	'communication',
	'risk',
	'commission',
]

export const DIMENSION_LABELS: Record<DimensionId, string> = {
	location: 'Location',
	priceFit: 'Price fit',
	specialization: 'Specialization',
	decisions: 'Decision support',
	communication: 'Communication',
	risk: 'Risk comfort',
	commission: 'Commission',
}

export function lookUpAffinity(
	matrix: AffinityMatrix,
	clientSlug: string,
	agentSlug: string,
): number | undefined {
	const row = matrix[clientSlug]
	if (!row) return undefined
	return row[agentSlug]
}
