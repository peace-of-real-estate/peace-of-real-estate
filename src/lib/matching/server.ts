import { createServerFn } from '@tanstack/react-start'
import { eq } from 'drizzle-orm'

import { buyerProfiles, sellerProfiles } from '@/db/tables'
import { requireUserId } from '@/lib/auth/session'
import { getAvatarUrl } from '@/lib/s3'

import { toAgentMatchData, type AgentMatchData } from './match.view'
import {
	loadAgentProfilesWithCityCenter,
	loadClientProfileWithCityCenter,
} from './profiles'
import {
	calculateFitScore,
	type ClientProfileForScoring,
	type MatchSide,
} from './scoring'

function toScoringSide(side: MatchSide): 'buying' | 'selling' {
	return side === 'buyers' ? 'buying' : 'selling'
}

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
		const profile = await loadClientProfileWithCityCenter(
			buyerProfiles,
			eq(buyerProfiles.userId, userId),
		)
		return loadAgentMatchesForProfile(profile, 'buyers', data)
	})

export const loadSellerAgentMatches = createServerFn({ method: 'GET' })
	.validator((data: MatchPageParam | undefined) => resolveMatchPageParam(data))
	.handler(async ({ data }): Promise<AgentMatchData[]> => {
		const userId = await requireUserId()
		const profile = await loadClientProfileWithCityCenter(
			sellerProfiles,
			eq(sellerProfiles.userId, userId),
		)
		return loadAgentMatchesForProfile(profile, 'sellers', data)
	})

async function loadAgentMatchesForProfile(
	profile: ClientProfileForScoring | undefined,
	side: MatchSide,
	pageParam: MatchPageParam = defaultMatchPageParam,
): Promise<AgentMatchData[]> {
	const results = await loadAgentProfilesWithCityCenter()
	const scored = results.map((row) => ({
		row,
		score: calculateFitScore(row.agent, profile, toScoringSide(side)),
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
