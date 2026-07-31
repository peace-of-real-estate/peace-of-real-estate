import { redirect, useNavigate } from '@tanstack/react-router'
import { useCallback } from 'react'
import { z } from 'zod'

import type { ClientRole } from '@/lib/introductions/types'
import {
	ClientIntroductions,
	clientRoleConfig,
} from '@/routes/(dashboard)/-components/client-introductions'

export const clientIntroductionsSearchSchema = z.object({
	unlock: z.literal('success').optional(),
})

export async function requireClientIntroductionsProfile(role: ClientRole) {
	const { loadProfile, signupPath } = clientRoleConfig[role]
	if (!(await loadProfile())) throw redirect({ to: signupPath })
}

export function ClientIntroductionsRoute({
	clientRole,
	unlock,
}: {
	clientRole: ClientRole
	unlock?: string | undefined
}) {
	const navigate = useNavigate()
	const returnPath = clientRoleConfig[clientRole].returnPath
	const clearUnlock = useCallback(() => {
		void navigate({
			to: returnPath,
			search: (previous) => ({ ...previous, unlock: undefined }),
			replace: true,
		})
	}, [navigate, returnPath])

	return (
		<ClientIntroductions
			clientRole={clientRole}
			unlock={unlock}
			onClearUnlock={clearUnlock}
		/>
	)
}
