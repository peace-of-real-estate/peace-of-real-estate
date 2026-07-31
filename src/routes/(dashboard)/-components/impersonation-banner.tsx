import { WarningIcon } from '@phosphor-icons/react'
import { useRouter } from '@tanstack/react-router'
import { useState } from 'react'
import { toast } from 'sonner'

import { authClient } from '@/lib/auth/client'

export function ImpersonationBanner() {
	const router = useRouter()
	const { data } = authClient.useSession()
	const impersonatedBy = data?.session.impersonatedBy
	const [isReturning, setIsReturning] = useState(false)

	if (!impersonatedBy) return null

	const handleReturn = async () => {
		setIsReturning(true)
		try {
			await authClient.admin.stopImpersonating()
		} catch {
			toast.error('Could not stop impersonating. Try again.')
			setIsReturning(false)
			return
		}
		await router.navigate({ to: '/admin/users' })
		await router.invalidate()
	}

	return (
		<div className="bg-destructive/15 text-destructive flex items-center justify-between gap-4 border-b px-4 py-2 text-sm">
			<span className="flex items-center gap-1.5">
				<WarningIcon className="h-4 w-4" />
				Impersonating <span className="font-mono">{data?.user.email}</span>
			</span>
			<button
				type="button"
				disabled={isReturning}
				onClick={() => void handleReturn()}
				className="bg-destructive text-destructive-foreground rounded-md px-3 py-1 text-xs font-medium disabled:opacity-60"
			>
				{isReturning ? 'Returning…' : 'Return to admin'}
			</button>
		</div>
	)
}
