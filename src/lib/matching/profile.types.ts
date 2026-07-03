import { createInsertSchema } from 'drizzle-zod'
import { z } from 'zod'

import { agentProfiles, consumerProfiles } from '@/db/tables'

export type ConsumerProfile = typeof consumerProfiles.$inferSelect

export type AgentProfile = typeof agentProfiles.$inferSelect

const consumerProfileCreateSchema = createInsertSchema(consumerProfiles)
	.omit({
		id: true,
		userId: true,
		createdAt: true,
		updatedAt: true,
	})
	.extend({
		intent: z.enum(['buying', 'selling', 'both']),
		status: z.enum(['draft', 'essentials_submitted', 'active', 'enriched']),
	})

const agentProfileCreateSchema = createInsertSchema(agentProfiles)
	.omit({
		id: true,
		userId: true,
		createdAt: true,
		updatedAt: true,
	})
	.extend({
		representationSide: z.enum(['buying', 'selling', 'both']),
	})

export { consumerProfileCreateSchema, agentProfileCreateSchema }

export type ConsumerProfileCreateInput = z.infer<
	typeof consumerProfileCreateSchema
>

export type AgentProfileCreateInput = z.infer<typeof agentProfileCreateSchema>

export type ConsumerProfileUpdate = Partial<ConsumerProfileCreateInput>

export type AgentProfileUpdate = Partial<AgentProfileCreateInput>

export type ConsumerDraft = ConsumerProfileUpdate

export type AgentDraft = Partial<AgentProfileCreateInput>

export function hasCompletedConsumerIntake(
	profile: ConsumerProfile | null | undefined,
) {
	return Boolean(
		profile?.preferredContactMethod ||
		profile?.involvementLevel ||
		profile?.representationPreference ||
		profile?.commissionComfort,
	)
}
