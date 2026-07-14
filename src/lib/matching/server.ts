import { createServerFn } from '@tanstack/react-start'
import { eq } from 'drizzle-orm'
import { db } from '@/db/connection'
import { agentProfiles, buyerProfiles, sellerProfiles, user } from '@/db/tables'
import { requireUserId } from '@/lib/auth/session'
import { type ClientProfileRow } from '@/lib/profile/types'
import { getAvatarUrl } from '@/lib/s3'
import {
	buildScoreDistribution,
	toAgentMatchData,
	type AgentMatchData,
} from './match.view'
import { calculateFitScore, type MatchSide } from './scoring'

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
		const [profile] = await db
			.select()
			.from(buyerProfiles)
			.where(eq(buyerProfiles.userId, userId))
			.limit(1)
		return loadAgentMatchesForProfile(profile, 'buyers', data)
	})

export const loadSellerAgentMatches = createServerFn({ method: 'GET' })
	.validator((data: MatchPageParam | undefined) => resolveMatchPageParam(data))
	.handler(async ({ data }): Promise<AgentMatchData[]> => {
		const userId = await requireUserId()
		const [profile] = await db
			.select()
			.from(sellerProfiles)
			.where(eq(sellerProfiles.userId, userId))
			.limit(1)
		return loadAgentMatchesForProfile(profile, 'sellers', data)
	})

async function loadAgentMatchesForProfile(
	profile: ClientProfileRow | undefined,
	side: MatchSide,
	pageParam: MatchPageParam = defaultMatchPageParam,
): Promise<AgentMatchData[]> {
	const results = await db
		.select({ agent: agentProfiles, user })
		.from(agentProfiles)
		.innerJoin(user, eq(agentProfiles.userId, user.id))
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
	const scoreDistribution = buildScoreDistribution(
		scored.map(({ score }) => score),
	)
	return Promise.all(
		top.map(async ({ row, score }, index) => {
			const avatar = await getAvatarUrl(row.user.image)
			return toAgentMatchData({
				agent: row.agent,
				user: row.user,
				score,
				profile,
				rank: offset + index + 1,
				totalAgents: scored.length,
				qualifiedCount: qualified.length,
				scoreDistribution,
				avatar: avatar ?? undefined,
			})
		}),
	)
}
