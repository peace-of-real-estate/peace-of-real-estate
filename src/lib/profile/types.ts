import { createInsertSchema } from 'drizzle-zod'
import { z } from 'zod'

import { agentProfiles, buyerProfiles, sellerProfiles } from '@/db/tables'
import { agentPriceBucketSchema, priceBoundSchema } from '@/lib/price-range'
import {
	agentQuestionIds,
	bestClientType,
	propertyType,
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

export const buyerInsertSchema = createInsertSchema(buyerProfiles, {
	priceMin: priceBoundSchema,
	priceMax: priceBoundSchema,
}).omit({
	id: true,
	userId: true,
	createdAt: true,
	updatedAt: true,
})

export const sellerInsertSchema = createInsertSchema(sellerProfiles, {
	priceMin: priceBoundSchema,
	priceMax: priceBoundSchema,
}).omit({
	id: true,
	userId: true,
	createdAt: true,
	updatedAt: true,
})

export const buyerDraftSchema = buyerInsertSchema.partial()
export const sellerDraftSchema = sellerInsertSchema.partial()
export const agentDraftSchema = agentInsertSchema.partial()

const buyerCompletedDraftBaseSchema = buyerInsertSchema.omit({
	status: true,
})
const sellerCompletedDraftBaseSchema = sellerInsertSchema.omit({
	status: true,
})

function hasOrderedPriceRange({
	priceMin,
	priceMax,
}: {
	priceMin: number
	priceMax: number
}) {
	return priceMin <= priceMax
}

export const buyerCompletedDraftSchema =
	buyerCompletedDraftBaseSchema.refine(hasOrderedPriceRange)
export const sellerCompletedDraftSchema =
	sellerCompletedDraftBaseSchema.refine(hasOrderedPriceRange)
export const agentCompletedDraftSchema = agentInsertSchema

export type BuyerProfile = typeof buyerProfiles.$inferSelect

export type SellerProfile = typeof sellerProfiles.$inferSelect

export type AgentProfile = typeof agentProfiles.$inferSelect

export type ClientProfileRow = BuyerProfile | SellerProfile

export type BuyerDraft = z.infer<typeof buyerDraftSchema>

export type SellerDraft = z.infer<typeof sellerDraftSchema>

export type AgentDraft = z.infer<typeof agentDraftSchema>

export type AgentWorkStyle = PreferencesFor<AgentDraft, typeof agentQuestionIds>

const previewPropertyTypesSchema = z.array(z.enum(propertyType.slugs)).min(1)

export const buyerPreviewProfileSchema = buyerCompletedDraftBaseSchema
	.extend({
		role: z.literal('buyer'),
		propertyTypes: previewPropertyTypesSchema,
	})
	.refine(hasOrderedPriceRange)

export const sellerPreviewProfileSchema = sellerCompletedDraftBaseSchema
	.extend({
		role: z.literal('seller'),
		propertyTypes: previewPropertyTypesSchema,
	})
	.refine(hasOrderedPriceRange)

export const agentPreviewProfileSchema = agentCompletedDraftSchema.extend({
	zipCodes: z.array(z.string()),
	bestClientTypes: z.array(z.enum(bestClientType.slugs)).min(1),
})

export type BuyerPreviewProfile = z.infer<typeof buyerPreviewProfileSchema>

export type SellerPreviewProfile = z.infer<typeof sellerPreviewProfileSchema>

export type AgentPreviewProfile = z.infer<typeof agentPreviewProfileSchema>

export type ClientPreviewProfile = BuyerPreviewProfile | SellerPreviewProfile
