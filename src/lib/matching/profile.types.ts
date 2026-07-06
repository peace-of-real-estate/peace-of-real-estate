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

export type BuyerDraft = BuyerProfileUpdate

export type SellerDraft = SellerProfileUpdate

export type AgentDraft = Partial<AgentProfileCreateInput>
