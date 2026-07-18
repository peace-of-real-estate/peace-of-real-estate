import { createServerFn } from '@tanstack/react-start'
import { eq } from 'drizzle-orm'
import { db } from '@/db/connection'
import { agentProfiles, buyerProfiles, sellerProfiles, user } from '@/db/tables'
import { requireUserId } from '@/lib/auth/session'
import { type ClientProfileRow } from '@/lib/profile/types'
import { getAvatarUrl } from '@/lib/s3'
import { toAgentMatchData, type AgentMatchData } from './match.view'
import { calculateFitScore, rankWithTieBands, type MatchSide } from './scoring'

function toScoringSide(side: MatchSide): 'buying' | 'selling' {
	return side === 'buyers' ? 'buying' : 'selling'
}

type MatchPageParam = { offset: number; limit: number }

const defaultMatchPageParam: MatchPageParam = { offset: 0, limit: 10 }
const MAX_MATCH_PAGE_LIMIT = 50

function clampInteger(value: unknown, fallback: number, max: number): number {
	if (typeof value !== 'number' || !Number.isFinite(value)) return fallback
	return Math.min(max, Math.max(0, Math.floor(value)))
}

function resolveMatchPageParam(
	data: MatchPageParam | undefined,
): MatchPageParam {
	return {
		offset: clampInteger(
			data?.offset,
			defaultMatchPageParam.offset,
			Number.MAX_SAFE_INTEGER,
		),
		limit: clampInteger(
			data?.limit,
			defaultMatchPageParam.limit,
			MAX_MATCH_PAGE_LIMIT,
		),
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
	// The dashboard routes redirect profileless users to signup; a direct call
	// without a profile gets no matches rather than completeness-fallback
	// scores dressed up as fit scores.
	if (!profile) return []
	const results = await db
		.select({ agent: agentProfiles, user })
		.from(agentProfiles)
		.innerJoin(user, eq(agentProfiles.userId, user.id))
		.orderBy(agentProfiles.id)
	const scored = results.map((row) => ({
		row,
		score: calculateFitScore(row.agent, profile, toScoringSide(side)),
	}))
	const qualified = scored.filter(({ score }) => !score.disqualified)
	const ranked = rankWithTieBands(qualified, profile.id)
	const { offset, limit } = pageParam
	const top = ranked.slice(offset, offset + limit)
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
