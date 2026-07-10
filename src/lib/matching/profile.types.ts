import { createInsertSchema } from 'drizzle-zod'
import { z } from 'zod'

import { agentProfiles, buyerProfiles, sellerProfiles } from '@/db/tables'

export type BuyerProfile = typeof buyerProfiles.$inferSelect

export type SellerProfile = typeof sellerProfiles.$inferSelect

export type AgentProfile = typeof agentProfiles.$inferSelect

const agentProfileDraftSchema = createInsertSchema(agentProfiles)
	.omit({
		id: true,
		userId: true,
		createdAt: true,
		updatedAt: true,
	})
	.extend({
		role: z.literal('agent'),
	})

const buyerProfileDraftSchema = createInsertSchema(buyerProfiles)
	.omit({
		id: true,
		userId: true,
		createdAt: true,
		updatedAt: true,
	})
	.extend({
		role: z.literal('buyer'),
	})

const sellerProfileDraftSchema = createInsertSchema(sellerProfiles)
	.omit({
		id: true,
		userId: true,
		createdAt: true,
		updatedAt: true,
	})
	.extend({
		role: z.literal('seller'),
	})

export {
	agentProfileDraftSchema,
	buyerProfileDraftSchema,
	sellerProfileDraftSchema,
}

export type BuyerProfileDraftInput = z.infer<typeof buyerProfileDraftSchema>

export type SellerProfileDraftInput = z.infer<typeof sellerProfileDraftSchema>

export type AgentProfileDraftInput = z.infer<typeof agentProfileDraftSchema>

export type BuyerProfileUpdate = Partial<BuyerProfileDraftInput>

export type SellerProfileUpdate = Partial<SellerProfileDraftInput>

export type AgentProfileUpdate = Partial<AgentProfileDraftInput>

export type BuyerDraft = Omit<BuyerProfileUpdate, 'role'>

export type SellerDraft = Omit<SellerProfileUpdate, 'role'>

export type AgentDraft = Partial<AgentProfileDraftInput>

export const buyerClientProfileSchema = buyerProfileDraftSchema
	.partial()
	.extend({
		role: z.literal('buyer'),
	})

export const sellerClientProfileSchema = sellerProfileDraftSchema
	.partial()
	.extend({
		role: z.literal('seller'),
	})

export type BuyerClientProfile = z.infer<typeof buyerClientProfileSchema>

export type SellerClientProfile = z.infer<typeof sellerClientProfileSchema>

export type ClientProfile = BuyerClientProfile | SellerClientProfile
