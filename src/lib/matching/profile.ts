import { createServerFn } from '@tanstack/react-start'
import { eq } from 'drizzle-orm'
import { db } from '@/db/connection'
import { agentProfiles, consumerProfiles, user } from '@/db/tables'
import { requireUserId } from '@/lib/auth/functions'
import { calculateFitScore, type AgentMatchData } from '@/lib/matching/scoring'
import { getAvatarUrl } from '@/lib/s3'
import {
	agentProfileCreateSchema,
	consumerProfileCreateSchema,
	type ConsumerProfileUpdate,
} from '@/lib/matching/profile.types'

export type {
	ConsumerProfileStatus,
	RepresentationSide,
} from '@/lib/matching/profile.db'

export {
	agentProfileColumns,
	consumerProfileColumns,
} from '@/lib/matching/profile.db'

export {
	agentProfileCreateSchema,
	consumerProfileCreateSchema,
} from '@/lib/matching/profile.types'

export type {
	AgentDraft,
	AgentProfile,
	AgentProfileCreateInput,
	ConsumerDraft,
	ConsumerProfile,
	ConsumerProfileCreateInput,
	ConsumerProfileUpdate,
} from '@/lib/matching/profile.types'

export const loadConsumerProfile = createServerFn({ method: 'GET' }).handler(
	async () => {
		const userId = await requireUserId()
		const [profile] = await db
			.select()
			.from(consumerProfiles)
			.where(eq(consumerProfiles.userId, userId))
			.limit(1)
		return profile ?? null
	},
)

export const createConsumerProfileFromDraft = createServerFn({ method: 'POST' })
	.validator((data: ConsumerProfileUpdate) => data)
	.handler(async ({ data }) => {
		const userId = await requireUserId()
		const now = new Date()

		const existing = await db
			.select({ id: consumerProfiles.id })
			.from(consumerProfiles)
			.where(eq(consumerProfiles.userId, userId))
			.limit(1)

		if (existing[0]) {
			throw new Error('Consumer profile already exists')
		}

		const insert = consumerProfileCreateSchema.parse({
			...data,
			status: 'active',
		})

		await db.insert(consumerProfiles).values({
			id: crypto.randomUUID(),
			userId,
			...insert,
			createdAt: now,
			updatedAt: now,
		})

		return { success: true }
	})

export const completeAgentSignup = createServerFn({ method: 'POST' })
	.validator((data: unknown) => agentProfileCreateSchema.parse(data))
	.handler(async ({ data }) => {
		const userId = await requireUserId()
		const now = new Date()

		const existing = await db
			.select({ id: agentProfiles.id })
			.from(agentProfiles)
			.where(eq(agentProfiles.userId, userId))
			.limit(1)

		if (existing[0]) {
			throw new Error('Agent profile already exists')
		}

		const insert = {
			id: crypto.randomUUID(),
			userId,
			...data,
			createdAt: now,
			updatedAt: now,
		}

		await db.insert(agentProfiles).values(insert)
		return { success: true }
	})

export const loadAgentProfile = createServerFn({ method: 'GET' }).handler(
	async () => {
		const userId = await requireUserId()
		const [profile] = await db
			.select()
			.from(agentProfiles)
			.where(eq(agentProfiles.userId, userId))
			.limit(1)
		return profile ?? null
	},
)

export const loadAgentMatches = createServerFn({ method: 'GET' }).handler(
	async (): Promise<AgentMatchData[]> => {
		const userId = await requireUserId()

		const [consumer] = await db
			.select()
			.from(consumerProfiles)
			.where(eq(consumerProfiles.userId, userId))
			.limit(1)

		const results = await db
			.select({
				agent: agentProfiles,
				user,
			})
			.from(agentProfiles)
			.innerJoin(user, eq(agentProfiles.userId, user.id))

		const scored = results.map((row) => ({
			row,
			score: calculateFitScore(row.agent, consumer),
		}))

		scored.sort((a, b) => b.score.fitScore - a.score.fitScore)
		const top = scored.slice(0, 5)

		return Promise.all(
			top.map(async ({ row, score }, index) => {
				const avatar = await getAvatarUrl(row.user.image)

				return {
					id: row.agent.id,
					name: row.user.name,
					role: 'agent' as const,
					location: `${row.agent.city}, ${row.agent.state}`,
					zipCodes: row.agent.zipCodes,
					fitScore: score.fitScore,
					status: 'new' as const,
					date: new Date(row.agent.updatedAt).toLocaleDateString(),
					experience: row.agent.yearsLicensed ?? '',
					agency: row.agent.brokerageName ?? '',
					specialties: row.agent.bestClientTypes,
					about:
						'Experienced real estate professional serving the local community.',
					scores: score.scores,
					contact: {
						email: row.user.email,
					},
					stats: {
						transactions: Number(row.agent.averageTransactions) || 50,
						avgDays: 14,
						satisfaction: row.agent.peacePactSigned ? 4.9 : 4.7,
					},
					isTopMatch: index === 0,
					...(avatar ? { avatar } : {}),
				}
			}),
		)
	},
)
