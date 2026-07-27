import { createServerFn } from '@tanstack/react-start'
import { eq } from 'drizzle-orm'
import { z } from 'zod'

import { db } from '@/db/connection'
import { cities, clientProfiles, user } from '@/db/tables'
import { requireUserId } from '@/lib/auth/session'
import { formatCityName } from '@/lib/geography/zip'
import { buildScoreDistribution } from '@/lib/matching/match.view'
import {
	calculateFitScore,
	rankWithTieBandsDetailed,
	TIE_BAND_THRESHOLD,
	type FitScoreResult,
	type ScoreTrace,
} from '@/lib/matching/scoring'
import type { PriceRange } from '@/lib/price-range'
import { Agent, Buyer, Seller } from '@/lib/profile/repository'
import type {
	AgentProfile,
	ClientProfile,
	ClientRole,
} from '@/lib/profile/types'

export type DebugClientOption = {
	id: string
	side: ClientRole
	name: string | null
	email: string | null
	cityName: string
	state: string
	priceRange: PriceRange
}

export type DebugMatch = {
	agentId: string
	name: string | null
	brokerage: string | null
	location: string
	fitScore: number
	disqualified: boolean
	displayRank: number
	preShuffleRank: number
	bandIndex: number
	bandSize: number
	bandOffset: number
	trace: ScoreTrace
	agentProfile: AgentProfile
}

export type ScoredAgent = {
	row: Awaited<ReturnType<typeof Agent.listWithUsers>>[number]
	score: FitScoreResult
}

export type ScoredAgentsResult = {
	qualified: ScoredAgent[]
	disqualified: ScoredAgent[]
	scoreDistribution: { range: string; count: number }[]
	totalAgents: number
}

export type DebugMatchesPayload = {
	side: ClientRole
	clientProfile: ClientProfile
	totalAgents: number
	qualifiedCount: number
	scoreDistribution: { range: string; count: number }[]
	tieBandThreshold: number
	qualified: DebugMatch[]
	disqualified: DebugMatch[]
}

const loadDebugMatchesInput = z.object({
	clientId: z.string(),
	side: z.enum(['buyer', 'seller']),
})

export function buildDebugPayload(
	clientProfile: ClientProfile,
	side: ClientRole,
	{
		qualified,
		disqualified,
		scoreDistribution,
		totalAgents,
	}: ScoredAgentsResult,
): DebugMatchesPayload {
	const qualifiedOut: DebugMatch[] = rankWithTieBandsDetailed(
		qualified,
		clientProfile.id,
	).map(({ item, ...ranks }) => scoredAgentToDebugMatch(item, ranks, false))

	// Rank disqualified agents by their would-be score so the rail is scannable.
	const disqualifiedOut: DebugMatch[] = [...disqualified]
		.sort((a, b) => b.score.trace.computedScore - a.score.trace.computedScore)
		.map((item, index) =>
			scoredAgentToDebugMatch(
				item,
				{
					displayRank: qualified.length + index + 1,
					preShuffleRank: qualified.length + index + 1,
					bandIndex: -1,
					bandSize: 1,
					bandOffset: 0,
				},
				true,
			),
		)

	return {
		side,
		clientProfile,
		totalAgents,
		qualifiedCount: qualified.length,
		scoreDistribution,
		tieBandThreshold: TIE_BAND_THRESHOLD,
		qualified: qualifiedOut,
		disqualified: disqualifiedOut,
	}
}

function scoredAgentToDebugMatch(
	{ row, score }: ScoredAgent,
	{
		displayRank,
		preShuffleRank,
		bandIndex,
		bandSize,
		bandOffset,
	}: {
		displayRank: number
		preShuffleRank: number
		bandIndex: number
		bandSize: number
		bandOffset: number
	},
	disqualified: boolean,
): DebugMatch {
	return {
		agentId: row.agent.id,
		name: row.user.name,
		brokerage: row.agent.brokerageName,
		location: formatCityName(row.agent.city),
		fitScore: score.fitScore,
		disqualified,
		displayRank,
		preShuffleRank,
		bandIndex,
		bandSize,
		bandOffset,
		trace: score.trace,
		agentProfile: row.agent,
	}
}

export const loadDebugClientOptions = createServerFn({ method: 'GET' }).handler(
	async (): Promise<DebugClientOption[]> => {
		await requireUserId()
		const clients = await db
			.select({
				profile: clientProfiles,
				user,
				cityName: cities.name,
				state: cities.state,
			})
			.from(clientProfiles)
			.innerJoin(user, eq(clientProfiles.userId, user.id))
			.innerJoin(cities, eq(clientProfiles.cityId, cities.id))
			.orderBy(clientProfiles.role)

		return clients.map((row) => ({
			id: row.profile.id,
			side: row.profile.role,
			name: row.user.name,
			email: row.user.email,
			cityName: row.cityName,
			state: row.state,
			priceRange: { min: row.profile.priceMin, max: row.profile.priceMax },
		}))
	},
)

async function loadProfile(
	clientId: string,
	side: ClientRole,
): Promise<ClientProfile | null> {
	const profile =
		side === 'buyer'
			? await Buyer.loadById(clientId)
			: await Seller.loadById(clientId)
	return profile ?? null
}

async function loadScoreAgentsForProfile({
	data,
}: {
	data: { clientId: string; side: ClientRole }
}): Promise<{
	profile: ClientProfile
	scored: ScoredAgentsResult
}> {
	const profile = await loadProfile(data.clientId, data.side)
	if (!profile) {
		throw new Error(`Client profile not found: ${data.clientId}`)
	}

	const results = await Agent.listWithUsers()

	const scored = results.map((row) => ({
		row,
		score: calculateFitScore(row.agent, profile, data.side),
	}))

	const qualified = scored.filter((item) => !item.score.disqualified)
	const disqualified = scored.filter((item) => item.score.disqualified)
	qualified.sort(
		(a, b) => b.score.trace.computedScore - a.score.trace.computedScore,
	)

	const scoreDistribution = buildScoreDistribution(
		scored.map((item) => item.score),
	)

	return {
		profile,
		scored: {
			qualified,
			disqualified,
			scoreDistribution,
			totalAgents: scored.length,
		},
	}
}

export const loadDebugMatches = createServerFn({ method: 'GET' })
	.validator((data: { clientId: string; side: ClientRole }) =>
		loadDebugMatchesInput.parse(data),
	)
	.handler(async ({ data }): Promise<DebugMatchesPayload> => {
		await requireUserId()

		const { profile, scored } = await loadScoreAgentsForProfile({ data })
		return buildDebugPayload(profile, data.side, scored)
	})
