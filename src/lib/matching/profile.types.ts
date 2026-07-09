import { createInsertSchema } from 'drizzle-zod'
import { z } from 'zod'

import { agentProfiles, buyerProfiles, sellerProfiles } from '@/db/tables'

export type BuyerProfile = typeof buyerProfiles.$inferSelect

export type SellerProfile = typeof sellerProfiles.$inferSelect

export type AgentProfile = typeof agentProfiles.$inferSelect

const agentProfileCreateSchema = createInsertSchema(agentProfiles)
	.omit({
		id: true,
		userId: true,
		createdAt: true,
		updatedAt: true,
	})
	.extend({
		representationSide: z.enum(['buying', 'selling', 'both']),
		role: z.literal('agent'),
	})

const buyerProfileCreateSchema = createInsertSchema(buyerProfiles)
	.omit({
		id: true,
		userId: true,
		createdAt: true,
		updatedAt: true,
	})
	.extend({
		status: z.enum(['draft', 'essentials_submitted', 'active', 'enriched']),
		role: z.literal('buyer'),
	})

const sellerProfileCreateSchema = createInsertSchema(sellerProfiles)
	.omit({
		id: true,
		userId: true,
		createdAt: true,
		updatedAt: true,
	})
	.extend({
		status: z.enum(['draft', 'essentials_submitted', 'active', 'enriched']),
		role: z.literal('seller'),
	})

export {
	agentProfileCreateSchema,
	buyerProfileCreateSchema,
	sellerProfileCreateSchema,
}

export type BuyerProfileCreateInput = z.infer<typeof buyerProfileCreateSchema>

export type SellerProfileCreateInput = z.infer<typeof sellerProfileCreateSchema>

export type AgentProfileCreateInput = z.infer<typeof agentProfileCreateSchema>

export type BuyerProfileUpdate = Partial<BuyerProfileCreateInput>

export type SellerProfileUpdate = Partial<SellerProfileCreateInput>

export type AgentProfileUpdate = Partial<AgentProfileCreateInput>

export type BuyerDraft = Omit<BuyerProfileUpdate, 'role'>

export type SellerDraft = Omit<SellerProfileUpdate, 'role'>

export type AgentDraft = Partial<AgentProfileCreateInput>

export type BuyerClientProfile = Omit<
	BuyerProfile,
	'id' | 'userId' | 'createdAt' | 'updatedAt'
> & {
	role: 'buyer'
}

export type SellerClientProfile = Omit<
	SellerProfile,
	'id' | 'userId' | 'createdAt' | 'updatedAt'
> & {
	role: 'seller'
}

export type ClientProfile = BuyerClientProfile | SellerClientProfile

// oxlint-disable-next-line typescript/consistent-type-assertions
export const buyerClientProfileSchema = buyerProfileCreateSchema
	.partial()
	.extend({
		role: z.literal('buyer'),
	}) as z.ZodType<BuyerClientProfile>

// oxlint-disable-next-line typescript/consistent-type-assertions
export const sellerClientProfileSchema = sellerProfileCreateSchema
	.partial()
	.extend({
		role: z.literal('seller'),
	}) as z.ZodType<SellerClientProfile>
