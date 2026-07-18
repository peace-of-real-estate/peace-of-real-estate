import { createServerFn } from '@tanstack/react-start'
import { eq, inArray, or, sql, type SQL } from 'drizzle-orm'
import { db } from '@/db/connection'
import { agentProfiles, buyerProfiles, sellerProfiles, user } from '@/db/tables'
import { requireUserId } from '@/lib/auth/session'
import { type ClientProfileRow } from '@/lib/profile/types'
import { getAvatarUrl } from '@/lib/s3'
import { toAgentMatchData, type AgentMatchData } from './match.view'
import {
	calculateFitScore,
	rankWithTieBands,
	type FitScoreResult,
	type MatchSide,
} from './scoring'

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

type RankedAgentScore = { agentId: string; score: FitScoreResult }

const RANKED_MATCHES_CACHE_MAX_ENTRIES = 100
const rankedMatchesCache = new Map<string, RankedAgentScore[]>()

async function agentSetVersion(sideFilter: SQL | undefined): Promise<string> {
	const [row] = await db
		.select({
			agentCount: sql<number>`count(*)::int`,
			latestUpdate: sql<string>`coalesce(max(${agentProfiles.updatedAt})::text, '')`,
		})
		.from(agentProfiles)
		.where(sideFilter)
	return `${row?.agentCount ?? 0}:${row?.latestUpdate ?? ''}`
}

async function loadAgentMatchesForProfile(
	profile: ClientProfileRow | undefined,
	side: MatchSide,
	pageParam: MatchPageParam = defaultMatchPageParam,
): Promise<AgentMatchData[]> {
	// The dashboard routes redirect profileless users to signup; a direct call
	// without a profile gets no matches rather than completeness-fallback
	// scores dressed up as fit scores.
	if (!profile) return []
	const { offset, limit } = pageParam
	const sideFilter = or(
		eq(agentProfiles.representationSide, 'both'),
		eq(agentProfiles.representationSide, side),
	)
	const cacheKey = [
		side,
		profile.id,
		profile.updatedAt.getTime(),
		await agentSetVersion(sideFilter),
	].join(':')
	let ranked = rankedMatchesCache.get(cacheKey)
	if (!ranked) {
		const agents = await db
			.select({ agent: agentProfiles })
			.from(agentProfiles)
			.where(sideFilter)
			.orderBy(agentProfiles.id)
		const scored = agents.map(({ agent }) => ({
			agentId: agent.id,
			score: calculateFitScore(agent, profile, toScoringSide(side)),
		}))
		const qualified = scored.filter(({ score }) => !score.disqualified)
		ranked = rankWithTieBands(qualified, profile.id)
		if (rankedMatchesCache.size >= RANKED_MATCHES_CACHE_MAX_ENTRIES) {
			const oldest = rankedMatchesCache.keys().next().value
			if (oldest !== undefined) rankedMatchesCache.delete(oldest)
		}
		rankedMatchesCache.set(cacheKey, ranked)
	}
	const top = ranked.slice(offset, offset + limit)
	if (top.length === 0) return []
	const rows = await db
		.select({ agent: agentProfiles, user })
		.from(agentProfiles)
		.innerJoin(user, eq(agentProfiles.userId, user.id))
		.where(
			inArray(
				agentProfiles.id,
				top.map(({ agentId }) => agentId),
			),
		)
	const rowsById = new Map(rows.map((row) => [row.agent.id, row]))
	const page = await Promise.all(
		top.map(async ({ agentId, score }) => {
			const row = rowsById.get(agentId)
			if (!row) return null
			const avatar = await getAvatarUrl(row.user.image)
			return toAgentMatchData({
				agent: row.agent,
				user: row.user,
				score,
				avatar: avatar ?? undefined,
			})
		}),
	)
	return page.filter((match) => match !== null)
}
