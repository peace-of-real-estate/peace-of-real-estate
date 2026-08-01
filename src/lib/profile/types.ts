import { createInsertSchema } from 'drizzle-orm/zod'
import { z } from 'zod'

import {
	agentProfiles,
	buyerDetails,
	clientProfiles,
	clientRole,
	sellerDetails,
} from '@/db/schema'
import type { ResolvedCity, ZipGeography } from '@/lib/geography/zip'
import { agentPriceBucketSchema, priceBoundSchema } from '@/lib/price-range'
import { agentQuestionIds, propertyType } from '@/lib/profile/profile-fields'
import type { PreferencesFor } from '@/lib/profile/question-types'

export const agentInsertSchema = createInsertSchema(agentProfiles, {
	typicalPriceRange: agentPriceBucketSchema,
})
	.omit({
		id: true,
		userId: true,
		createdAt: true,
		updatedAt: true,
	})
	.extend({
		// Not a column — carried through signup and persisted as
		// `agent_profile_zips` join rows instead.
		zipCodes: z.array(z.string()).default([]),
	})

export const clientProfileInsertSchema = createInsertSchema(clientProfiles, {
	priceMin: priceBoundSchema,
	priceMax: priceBoundSchema,
})
	.omit({
		id: true,
		userId: true,
		role: true,
		createdAt: true,
		updatedAt: true,
	})
	.extend({
		// Not a column — carried through signup and persisted as
		// `client_profile_zips` join rows instead.
		zipCodes: z.array(z.string()).default([]),
	})

export const buyerDetailsInsertSchema = createInsertSchema(buyerDetails).omit({
	clientProfileId: true,
	role: true,
})

export const sellerDetailsInsertSchema = createInsertSchema(sellerDetails).omit(
	{
		clientProfileId: true,
		role: true,
	},
)

export const buyerInsertSchema = clientProfileInsertSchema.extend(
	buyerDetailsInsertSchema.shape,
)

export const sellerInsertSchema = clientProfileInsertSchema.extend(
	sellerDetailsInsertSchema.shape,
)

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

type ResolvedGeography = {
	city: ResolvedCity
	geography: ZipGeography
}

export type ClientRole = (typeof clientRole.enumValues)[number]

export type ProfileRole = ClientRole | 'agent'

export const dashboardPaths = {
	agent: '/agent/introductions',
	buyer: '/buyer/matches',
	seller: '/seller/matches',
} as const satisfies Record<ProfileRole, string>

export function resolveDashboardTarget(roles: ProfileRole[]): string {
	const [first] = roles
	if (!first) return '/signup/buyer'
	if (roles.length > 1) return '/choose-role'
	return dashboardPaths[first]
}

type ClientProfileBase = Omit<
	typeof clientProfiles.$inferSelect,
	'role' | 'cityId'
>

export type BuyerProfile = ClientProfileBase &
	Omit<typeof buyerDetails.$inferSelect, 'clientProfileId' | 'role'> &
	ResolvedGeography & { role: 'buyer' }

export type SellerProfile = ClientProfileBase &
	Omit<typeof sellerDetails.$inferSelect, 'clientProfileId' | 'role'> &
	ResolvedGeography & { role: 'seller' }

export type AgentProfile = Omit<typeof agentProfiles.$inferSelect, 'cityId'> &
	ResolvedGeography

export type ClientProfile = BuyerProfile | SellerProfile

export type ClientWorkStyle = Pick<
	ClientProfile,
	| 'decisionStyle'
	| 'contactStyle'
	| 'riskComfort'
	| 'commissionPlan'
	| 'situationSpecialties'
>

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
})

export type BuyerPreviewProfile = z.infer<typeof buyerPreviewProfileSchema>

export type SellerPreviewProfile = z.infer<typeof sellerPreviewProfileSchema>

export type AgentPreviewProfile = z.infer<typeof agentPreviewProfileSchema>

export type ClientPreviewProfile = BuyerPreviewProfile | SellerPreviewProfile
