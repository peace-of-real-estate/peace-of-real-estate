import { createServerFn } from '@tanstack/react-start'

import { requireUserId } from '@/lib/auth/session'
import { Agent, Buyer, Seller } from '@/lib/profile/repository'
import type { ClientProfile, ClientRole } from '@/lib/profile/types'
import { getAvatarUrl } from '@/lib/s3'

import { toAgentMatchData, type AgentMatchData } from './match.view'
import { calculateFitScore } from './scoring'

type MatchPageParam = { offset: number; limit: number }

const defaultMatchPageParam: MatchPageParam = { offset: 0, limit: 10 }

function resolveMatchPageParam(
	data: MatchPageParam | undefined,
): MatchPageParam {
	return {
		offset: data?.offset ?? defaultMatchPageParam.offset,
		limit: data?.limit ?? defaultMatchPageParam.limit,
	}
}

export const loadBuyerAgentMatches = createServerFn({ method: 'GET' })
	.validator((data: MatchPageParam | undefined) => resolveMatchPageParam(data))
	.handler(async ({ data }): Promise<AgentMatchData[]> => {
		const userId = await requireUserId()
		const profile = await Buyer.loadByUserId(userId)
		return loadAgentMatchesForProfile(profile, 'buyer', data)
	})

export const loadSellerAgentMatches = createServerFn({ method: 'GET' })
	.validator((data: MatchPageParam | undefined) => resolveMatchPageParam(data))
	.handler(async ({ data }): Promise<AgentMatchData[]> => {
		const userId = await requireUserId()
		const profile = await Seller.loadByUserId(userId)
		return loadAgentMatchesForProfile(profile, 'seller', data)
	})

async function loadAgentMatchesForProfile(
	profile: ClientProfile | undefined,
	side: ClientRole,
	pageParam: MatchPageParam = defaultMatchPageParam,
): Promise<AgentMatchData[]> {
	const results = await Agent.listWithUsers()
	const scored = results.map((row) => ({
		row,
		score: calculateFitScore(row.agent, profile, side),
	}))
	const byComputedScore = (
		a: (typeof scored)[number],
		b: (typeof scored)[number],
	) => b.score.trace.computedScore - a.score.trace.computedScore
	const qualified = scored.filter(({ score }) => !score.disqualified)
	qualified.sort(byComputedScore)
	const { offset, limit } = pageParam
	const top = qualified.slice(offset, offset + limit)
	return Promise.all(
		top.map(async ({ row, score }) => {
			const avatar = await getAvatarUrl(row.user.image)
			return toAgentMatchData({
				agent: row.agent,
				user: row.user,
				score,
				avatar: avatar ?? undefined,
			})
		}),
	)
}
