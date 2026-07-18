import { useState } from 'react'
import { toast } from 'sonner'

import { authClient } from '@/lib/auth/client'
import { sanitizeRedirectPath } from '@/lib/utils/redirect'

export type UseGoogleAuthOptions = {
	fallbackRedirect: string
}

export function useGoogleAuth({ fallbackRedirect }: UseGoogleAuthOptions) {
	const [isLoading, setIsLoading] = useState(false)
	const [isAvailable, setIsAvailable] = useState(true)

	const signIn = async () => {
		setIsLoading(true)
		const safeRedirect = sanitizeRedirectPath(fallbackRedirect)
		const callbackURL = new URL(safeRedirect, window.location.origin).toString()

		try {
			const { data, error } = await authClient.signIn.social({
				provider: 'google',
				callbackURL,
			})

			if (error) {
				throw error
			}

			window.location.assign(data?.url ?? safeRedirect)
		} catch (error) {
			if (
				error &&
				typeof error === 'object' &&
				'code' in error &&
				error.code === 'PROVIDER_NOT_FOUND'
			) {
				setIsAvailable(false)
				toast.error(
					'Google login is not configured yet. Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to .env.development.',
				)
			} else {
				toast.error('Google sign-in failed. Try again.')
			}

			setIsLoading(false)
		}
	}

	return { signIn, isLoading, isAvailable }
}
