import { createInsertSchema } from 'drizzle-zod'
import { z } from 'zod'

import {
	agentProfiles,
	buyerDetails,
	clientProfiles,
	clientRole,
	sellerDetails,
} from '@/db/tables'
import { agentPriceBucketSchema } from '@/lib/price-range'
import {
	agentQuestionIds,
	clientWorkStyleQuestionIds,
} from '@/lib/profile/profile-fields'
import type { PreferencesFor } from '@/lib/profile/question-types'

export const agentInsertSchema = createInsertSchema(agentProfiles, {
	typicalPriceRange: agentPriceBucketSchema,
}).omit({
	id: true,
	userId: true,
	createdAt: true,
	updatedAt: true,
})

const clientProfileInsertSchema = createInsertSchema(clientProfiles).omit({
	id: true,
	userId: true,
	role: true,
	createdAt: true,
	updatedAt: true,
})

const buyerDetailsInsertSchema = createInsertSchema(buyerDetails).omit({
	clientProfileId: true,
	role: true,
})

const sellerDetailsInsertSchema = createInsertSchema(sellerDetails).omit({
	clientProfileId: true,
	role: true,
})

export const buyerInsertSchema = clientProfileInsertSchema.merge(
	buyerDetailsInsertSchema,
)

export const sellerInsertSchema = clientProfileInsertSchema.merge(
	sellerDetailsInsertSchema,
)

export const buyerDraftSchema = buyerInsertSchema.partial()
export const sellerDraftSchema = sellerInsertSchema.partial()
export const agentDraftSchema = agentInsertSchema.partial()

type ClientProfileBase = Omit<typeof clientProfiles.$inferSelect, 'role'>

export type ClientRole = (typeof clientRole.enumValues)[number]

export type BuyerProfile = ClientProfileBase &
	Omit<typeof buyerDetails.$inferSelect, 'clientProfileId' | 'role'>

export type SellerProfile = ClientProfileBase &
	Omit<typeof sellerDetails.$inferSelect, 'clientProfileId' | 'role'>

export type AgentProfile = typeof agentProfiles.$inferSelect

export type ClientProfileRow = BuyerProfile | SellerProfile

export type ClientWorkStyle = PreferencesFor<
	typeof clientProfiles.$inferSelect,
	typeof clientWorkStyleQuestionIds
>

export type BuyerDraft = z.infer<typeof buyerDraftSchema>

export type SellerDraft = z.infer<typeof sellerDraftSchema>

export type AgentDraft = z.infer<typeof agentDraftSchema>

export type AgentWorkStyle = PreferencesFor<AgentDraft, typeof agentQuestionIds>

export const buyerClientProfileSchema = buyerDraftSchema.extend({
	role: z.literal('buyer'),
})

export const sellerClientProfileSchema = sellerDraftSchema.extend({
	role: z.literal('seller'),
})

export type ClientProfile =
	| z.infer<typeof buyerClientProfileSchema>
	| z.infer<typeof sellerClientProfileSchema>
