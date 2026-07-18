import type { AgentProfile } from '@/lib/profile/types'
import type { FitScoreResult, ScoreBucket } from './scoring/types'

const DIMENSIONS: ScoreBucket[] = [
	'Location',
	'Price Fit',
	'Specialization',
	'Working Style',
	'Communication',
	'Business Terms',
]

/** Placeholder display data — not real agent metrics yet. */
const PLACEHOLDER_AGENT_DISPLAY = {
	about: 'Experienced real estate professional serving the local community.',
	avgDays: 14,
	satisfactionSigned: 4.9,
	satisfactionUnsigned: 4.7,
	fallbackTransactions: '50',
}

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
	scores: Record<string, number>
	stats?: {
		/** Deals-per-year range from the agent's averageTransactions answer, e.g. '6-15'. */
		transactions: string
		avgDays: number
		satisfaction: number
	}
	isTopMatch?: boolean
	avatar?: string
}

interface ToAgentMatchDataInput {
	agent: AgentProfile
	// Deliberately no email: agent contact info stays private until an
	// introduction is accepted.
	user: { name: string }
	score: FitScoreResult
	avatar?: string | undefined
}

export function toAgentMatchData({
	agent,
	user,
	score,
	avatar,
}: ToAgentMatchDataInput): AgentMatchData {
	return {
		id: agent.id,
		name: user.name,
		role: 'agent',
		location: `${agent.city}, ${agent.state}`,
		zipCodes: agent.zipCodes,
		fitScore: score.fitScore,
		status: 'new',
		date: new Date(agent.updatedAt).toLocaleDateString(),
		experience: agent.yearsLicensed ?? '',
		agency: agent.brokerageName ?? '',
		specialties: agent.bestClientTypes,
		about: PLACEHOLDER_AGENT_DISPLAY.about,
		scores: Object.fromEntries(
			DIMENSIONS.map((dimension) => [dimension, score.scores[dimension]!]),
		),
		stats: {
			transactions:
				agent.averageTransactions ??
				PLACEHOLDER_AGENT_DISPLAY.fallbackTransactions,
			avgDays: PLACEHOLDER_AGENT_DISPLAY.avgDays,
			satisfaction: agent.peacePactSigned
				? PLACEHOLDER_AGENT_DISPLAY.satisfactionSigned
				: PLACEHOLDER_AGENT_DISPLAY.satisfactionUnsigned,
		},
		...(avatar ? { avatar } : {}),
	}
}

/**
 * Buckets every scored agent by public fitScore. Disqualified agents have a
 * public fitScore of 0, so they naturally land in the 0-9 bucket alongside
 * genuine low scorers.
 */
export function buildScoreDistribution(
	scores: { fitScore: number }[],
): { range: string; count: number }[] {
	const buckets = Array.from({ length: 10 }, (_, i) => ({
		range: i === 9 ? '90-100' : `${i * 10}-${i * 10 + 9}`,
		count: 0,
	}))
	for (const score of scores) {
		const index = Math.min(9, Math.max(0, Math.floor(score.fitScore / 10)))
		const bucket = buckets[index]
		if (bucket) {
			bucket.count += 1
		}
	}
	return buckets
}
