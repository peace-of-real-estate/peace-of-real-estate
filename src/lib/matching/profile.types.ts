import { createInsertSchema } from 'drizzle-zod'
import { z } from 'zod'

import { agentProfiles, buyerProfiles, sellerProfiles } from '@/db/tables'

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

const buyerDraftSchema = buyerProfileDraftSchema.omit({ role: true }).partial()
const sellerDraftSchema = sellerProfileDraftSchema
	.omit({ role: true })
	.partial()
const agentDraftSchema = agentProfileDraftSchema.partial()

export {
	agentDraftSchema,
	agentProfileDraftSchema,
	buyerDraftSchema,
	buyerProfileDraftSchema,
	sellerDraftSchema,
	sellerProfileDraftSchema,
}

export type BuyerProfile = typeof buyerProfiles.$inferSelect

export type SellerProfile = typeof sellerProfiles.$inferSelect

export type AgentProfile = typeof agentProfiles.$inferSelect

export type BuyerProfileDraftInput = z.infer<typeof buyerProfileDraftSchema>

export type SellerProfileDraftInput = z.infer<typeof sellerProfileDraftSchema>

export type AgentProfileDraftInput = z.infer<typeof agentProfileDraftSchema>

const buyerProfileUpdateSchema = buyerProfileDraftSchema.partial()
const sellerProfileUpdateSchema = sellerProfileDraftSchema.partial()
const agentProfileUpdateSchema = agentProfileDraftSchema.partial()

export type BuyerProfileUpdate = z.infer<typeof buyerProfileUpdateSchema>

export type SellerProfileUpdate = z.infer<typeof sellerProfileUpdateSchema>

export type AgentProfileUpdate = z.infer<typeof agentProfileUpdateSchema>

export type BuyerDraft = Omit<BuyerProfileUpdate, 'role'>

export type SellerDraft = Omit<SellerProfileUpdate, 'role'>

export type AgentDraft = AgentProfileUpdate

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
