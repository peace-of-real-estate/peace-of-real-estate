import { createServerFn } from '@tanstack/react-start'
import { getRequestUrl } from '@tanstack/react-start/server'
import { z } from 'zod'

import { db } from '@/db/connection'
import { clientRole } from '@/db/schema'
import { requireUserId } from '@/lib/auth/session'
import { MAX_ACTIVE_INTROS } from '@/lib/introductions/guards'

import { createIntroUnlockCheckout as createCheckout } from './intro-unlock'

const createIntroUnlockCheckoutSchema = z.object({
	role: z.enum(clientRole.enumValues),
	returnPath: z.enum(['/buyer/introductions', '/seller/introductions']),
	introductionIds: z.array(z.string()).min(1).max(MAX_ACTIVE_INTROS),
})

export const createIntroUnlockCheckout = createServerFn({ method: 'POST' })
	.validator((data: unknown) => createIntroUnlockCheckoutSchema.parse(data))
	.handler(async ({ data }) => {
		const userId = await requireUserId()
		return createCheckout(db, {
			userId,
			role: data.role,
			origin: getRequestUrl().origin,
			returnPath: data.returnPath,
			introductionIds: data.introductionIds,
		})
	})
