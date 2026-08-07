import { createInsertSchema } from 'drizzle-orm/zod'
import { z } from 'zod'

import {
	agentProfiles,
	buyerDetails,
	clientProfiles,
	sellerDetails,
} from '@/db/schema'
import { BUCKET_ORDER, PRICE_MAX, PRICE_MIN } from '@/lib/price-range'

// Classic-zod twins of the mini schemas in price-range.ts — drizzle-zod
// refinement overrides must be classic schemas. Both derive from the same
// constants; schema-parity.unit.test.ts pins the derivations together.
const priceBoundSchema = z.number().int().min(PRICE_MIN).max(PRICE_MAX)
const agentPriceBucketSchema = z.enum(BUCKET_ORDER)

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
