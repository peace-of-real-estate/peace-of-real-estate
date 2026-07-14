import { createInsertSchema } from 'drizzle-zod'
import { z } from 'zod'

import { agentProfiles, buyerProfiles, sellerProfiles } from '@/db/tables'
import { agentQuestionIds } from '@/lib/profile/profile-fields'
import type { PreferencesFor } from '@/lib/profile/question-types'

export const agentInsertSchema = createInsertSchema(agentProfiles).omit({
	id: true,
	userId: true,
	createdAt: true,
	updatedAt: true,
})

export const buyerInsertSchema = createInsertSchema(buyerProfiles).omit({
	id: true,
	userId: true,
	createdAt: true,
	updatedAt: true,
})

export const sellerInsertSchema = createInsertSchema(sellerProfiles).omit({
	id: true,
	userId: true,
	createdAt: true,
	updatedAt: true,
})

export const buyerDraftSchema = buyerInsertSchema.partial()
export const sellerDraftSchema = sellerInsertSchema.partial()
export const agentDraftSchema = agentInsertSchema.partial()

export type BuyerProfile = typeof buyerProfiles.$inferSelect

export type SellerProfile = typeof sellerProfiles.$inferSelect

export type AgentProfile = typeof agentProfiles.$inferSelect

export type ClientProfileRow = BuyerProfile | SellerProfile

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
