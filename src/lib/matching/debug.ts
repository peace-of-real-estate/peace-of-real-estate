import { createServerFn } from '@tanstack/react-start'
import { eq } from 'drizzle-orm'
import { z } from 'zod'

import { db } from '@/db/connection'
import { agentProfiles, buyerProfiles, sellerProfiles, user } from '@/db/tables'
import { requireUserId } from '@/lib/auth/session'
import { buildScoreDistribution } from '@/lib/matching/match.view'
import {
	calculateFitScore,
	rankWithTieBandsDetailed,
	TIE_BAND_THRESHOLD,
	type ScoreTrace,
} from '@/lib/matching/scoring'
import type { AgentProfile, ClientProfileRow } from '@/lib/profile/types'

export type DebugClientOption = {
	id: string
	side: 'buying' | 'selling'
	name: string | null
	email: string | null
	city: string
	state: string
	priceRange: string
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
	row: {
		agent: AgentProfile
		user: {
			id: string
			name: string | null
			email: string
			emailVerified: boolean
			image: string | null
		}
	}
	score: {
		fitScore: number
		scores: Record<string, number>
		disqualified: boolean
		trace: ScoreTrace
	}
}

export type ScoredAgentsResult = {
	qualified: ScoredAgent[]
	ranked: ScoredAgent[]
	disqualified: ScoredAgent[]
	scoreDistribution: { range: string; count: number }[]
	totalAgents: number
}

export type DebugMatchesPayload = {
	side: 'buying' | 'selling'
	clientProfile: ClientProfileRow
	totalAgents: number
	qualifiedCount: number
	scoreDistribution: { range: string; count: number }[]
	tieBandThreshold: number
	qualified: DebugMatch[]
	disqualified: DebugMatch[]
}

const loadDebugMatchesInput = z.object({
	clientId: z.string(),
	side: z.enum(['buying', 'selling']),
})

export function buildDebugPayload(
	clientProfile: ClientProfileRow,
	side: 'buying' | 'selling',
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
		location: `${row.agent.city}, ${row.agent.state}`,
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

		const buyers = await db
			.select({
				buyer: buyerProfiles,
				user,
			})
			.from(buyerProfiles)
			.innerJoin(user, eq(buyerProfiles.userId, user.id))

		const sellers = await db
			.select({
				seller: sellerProfiles,
				user,
			})
			.from(sellerProfiles)
			.innerJoin(user, eq(sellerProfiles.userId, user.id))

		return [
			...buyers.map((row) => ({
				id: row.buyer.id,
				side: 'buying' as const,
				name: row.user.name,
				email: row.user.email,
				city: row.buyer.city,
				state: row.buyer.state,
				priceRange: row.buyer.priceRange,
			})),
			...sellers.map((row) => ({
				id: row.seller.id,
				side: 'selling' as const,
				name: row.user.name,
				email: row.user.email,
				city: row.seller.city,
				state: row.seller.state,
				priceRange: row.seller.priceRange,
			})),
		]
	},
)

async function loadProfile(
	clientId: string,
	side: 'buying' | 'selling',
): Promise<ClientProfileRow | null> {
	const table = side === 'buying' ? buyerProfiles : sellerProfiles
	const [profile] = await db
		.select()
		.from(table)
		.where(eq(table.id, clientId))
		.limit(1)
	return profile ?? null
}

async function loadScoreAgentsForProfile({
	data,
}: {
	data: { clientId: string; side: 'buying' | 'selling' }
}): Promise<{
	profile: ClientProfileRow
	scored: ScoredAgentsResult
}> {
	const profile = await loadProfile(data.clientId, data.side)
	if (!profile) {
		throw new Error(`Client profile not found: ${data.clientId}`)
	}

	const results = await db
		.select({ agent: agentProfiles, user })
		.from(agentProfiles)
		.innerJoin(user, eq(agentProfiles.userId, user.id))

	const scored = results.map((row) => ({
		row: {
			agent: row.agent,
			user: {
				id: row.user.id,
				name: row.user.name,
				email: row.user.email,
				emailVerified: row.user.emailVerified,
				image: row.user.image,
			},
		},
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
			ranked: qualified,
			disqualified,
			scoreDistribution,
			totalAgents: scored.length,
		},
	}
}

export const loadDebugMatches = createServerFn({ method: 'GET' })
	.validator((data: { clientId: string; side: 'buying' | 'selling' }) =>
		loadDebugMatchesInput.parse(data),
	)
	.handler(async ({ data }): Promise<DebugMatchesPayload> => {
		await requireUserId()

		const { profile, scored } = await loadScoreAgentsForProfile({ data })
		return buildDebugPayload(profile, data.side, scored)
	})
