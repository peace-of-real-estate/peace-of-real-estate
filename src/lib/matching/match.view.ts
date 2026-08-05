import { formatCityName } from '@/lib/geography/zip'
import { bestClientType } from '@/lib/profile/profile-fields'
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
	bestClientType: string
	scores: Record<string, number>
	avatar?: string
}

interface ToAgentMatchDataInput {
	agent: AgentProfile
	user: { name: string; email: string }
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
		location: formatCityName(agent.city),
		zipCodes: agent.geography.map(({ zip }) => zip),
		fitScore: score.fitScore,
		status: 'new',
		date: new Date(agent.updatedAt).toLocaleDateString(),
		experience: agent.yearsLicensed ?? '',
		agency: agent.brokerageName ?? '',
		bestClientType: bestClientType.labels[agent.bestClientType],
		scores: Object.fromEntries(
			DIMENSIONS.map((dimension) => [dimension, score.scores[dimension]!]),
		),
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
