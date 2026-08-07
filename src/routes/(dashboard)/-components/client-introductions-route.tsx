import { redirect } from '@tanstack/react-router'
import { z } from 'zod/mini'

import { buyer, seller } from '@/lib/profile/server'
import type { ClientRole } from '@/lib/profile/types'

// Route-logic module: retained in the entry chunk via validateSearch/beforeLoad.
// Components must not live here — importing one would drag the dashboard
// component tree into the entry (see client-introductions.tsx for those).
export const clientIntroductionsSearchSchema = z.object({
	unlock: z.optional(z.literal('success')),
})

export const clientRoleConfig: Record<
	ClientRole,
	{
		loadProfile: () => Promise<{ id: string } | null>
		returnPath: '/buyer/introductions' | '/seller/introductions'
		signupPath: '/signup/buyer/location' | '/signup/seller/location'
	}
> = {
	buyer: {
		loadProfile: buyer.loadProfile,
		returnPath: '/buyer/introductions',
		signupPath: '/signup/buyer/location',
	},
	seller: {
		loadProfile: seller.loadProfile,
		returnPath: '/seller/introductions',
		signupPath: '/signup/seller/location',
	},
}

export async function requireClientIntroductionsProfile(role: ClientRole) {
	const { loadProfile, signupPath } = clientRoleConfig[role]
	if (!(await loadProfile())) throw redirect({ to: signupPath })
}
