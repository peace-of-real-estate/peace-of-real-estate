import { LockOpenIcon, ShieldCheckIcon } from '@phosphor-icons/react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useServerFn } from '@tanstack/react-start'
import { useState } from 'react'
import { toast } from 'sonner'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import type { ClientRole } from '@/lib/introductions/types'
import type { ClientIntroductionsPayload } from '@/lib/introductions/views'
import {
	INTRO_UNLOCK_CURRENCY,
	INTRO_UNLOCK_PRICE_CENTS,
	INTRO_WINDOW_MONTHS,
} from '@/lib/payments/intro-unlock.config'
import { createIntroUnlockCheckout } from '@/lib/payments/server'

const unlockPrice = new Intl.NumberFormat('en-US', {
	style: 'currency',
	currency: INTRO_UNLOCK_CURRENCY,
}).format(INTRO_UNLOCK_PRICE_CENTS / 100)

export function IntroPaywall({
	payload,
	role,
	returnPath,
	queryKey,
}: {
	payload: ClientIntroductionsPayload
	role: ClientRole
	returnPath: '/buyer/introductions' | '/seller/introductions'
	queryKey: readonly unknown[]
}) {
	const createCheckoutFn = useServerFn(createIntroUnlockCheckout)
	const queryClient = useQueryClient()

	const acceptedIntros = payload.introductions.filter(
		(intro) => intro.status === 'accepted',
	)
	// Track deselections so refetched accepted/withdrawn/declined rows are
	// reflected automatically while user unchecks survive re-renders.
	const [deselectedIds, setDeselectedIds] = useState<ReadonlySet<string>>(
		new Set(),
	)
	const selectedIds = acceptedIntros.flatMap((intro) =>
		deselectedIds.has(intro.id) ? [] : [intro.id],
	)

	const unlockMutation = useMutation({
		mutationFn: () =>
			createCheckoutFn({
				data: { role, returnPath, introductionIds: selectedIds },
			}),
		onSuccess: (result) => {
			window.location.assign(result.url)
		},
		onError: async (error) => {
			toast.error(
				error instanceof Error
					? error.message
					: 'Could not start checkout. Try again.',
			)
			await queryClient.invalidateQueries({ queryKey })
		},
	})

	const endsAt = payload.window.endsAt
	if (endsAt) {
		return (
			<Badge variant="secondary" className="gap-1.5 px-3 py-1.5 text-xs">
				<ShieldCheckIcon className="h-3.5 w-3.5" />
				Access active until{' '}
				{new Date(endsAt).toLocaleDateString('en-US', {
					month: 'short',
					day: 'numeric',
					year: 'numeric',
					timeZone: 'UTC',
				})}
			</Badge>
		)
	}

	if (!payload.canPurchase) return null

	const toggle = (id: string, checked: boolean) => {
		setDeselectedIds((previous) => {
			const next = new Set(previous)
			if (checked) {
				next.delete(id)
			} else {
				next.add(id)
			}
			return next
		})
	}

	return (
		<div className="rounded-xl border border-amber-200 bg-amber-50 p-3 dark:border-amber-900 dark:bg-amber-950/20">
			<div className="flex items-center gap-2 text-sm font-semibold">
				<LockOpenIcon className="h-4 w-4" />
				Unlock contact info
			</div>
			<div className="text-muted-foreground mt-1 text-xs">
				Pay {unlockPrice} for {INTRO_WINDOW_MONTHS}-month access to the contact
				info of the agents you select.
			</div>
			<ul className="mt-2 space-y-1.5">
				{acceptedIntros.map((intro) => (
					<li key={intro.id}>
						<label className="flex cursor-pointer items-center gap-2 text-sm">
							<Checkbox
								checked={!deselectedIds.has(intro.id)}
								onCheckedChange={(checked) =>
									toggle(intro.id, checked === true)
								}
							/>
							{intro.agent.name}
						</label>
					</li>
				))}
			</ul>
			<Button
				size="xs"
				className="mt-2"
				onClick={() => unlockMutation.mutate()}
				disabled={unlockMutation.isPending || selectedIds.length === 0}
			>
				{unlockMutation.isPending
					? 'Redirecting…'
					: `Unlock ${selectedIds.length} selected`}
			</Button>
		</div>
	)
}
