import { createFileRoute, redirect, useNavigate } from '@tanstack/react-router'
import { Loader2 } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { z } from 'zod'

import { Card, CardContent } from '@/components/ui/card'
import { getCurrentSession } from '@/lib/auth/session'
import {
	completeAgentSignup,
	createBuyerProfileFromDraft,
	createSellerProfileFromDraft,
	loadAgentProfile,
	loadBuyerProfile,
	loadSellerProfile,
	agentDraftSchema,
	buyerDraftSchema,
	sellerDraftSchema,
	type AgentDraft,
	type BuyerDraft,
	type SellerDraft,
} from '@/lib/profile'
import { createLocalStorage } from '@/lib/utils/localstorage'

const completeSearchSchema = z.object({
	role: z.enum(['agent', 'buyer', 'seller']),
})

const agentDraftStorage = createLocalStorage<AgentDraft>(
	'pre-agent-draft',
	agentDraftSchema,
)
const buyerDraftStorage = createLocalStorage<BuyerDraft>(
	'pre-buyer-draft',
	buyerDraftSchema,
)
const sellerDraftStorage = createLocalStorage<SellerDraft>(
	'pre-seller-draft',
	sellerDraftSchema,
)

export const Route = createFileRoute('/auth/complete')({
	validateSearch: completeSearchSchema,
	beforeLoad: async ({ search }) => {
		const session = await getCurrentSession()
		if (!session) {
			throw redirect({
				to: '/auth/login',
				search: { redirect: `/auth/complete?role=${search.role}` },
			})
		}

		if (search.role === 'agent' && (await loadAgentProfile())) {
			throw redirect({ to: '/agent/introductions' })
		}

		if (search.role === 'buyer' && (await loadBuyerProfile())) {
			throw redirect({ to: '/buyer/matches' })
		}

		if (search.role === 'seller' && (await loadSellerProfile())) {
			throw redirect({ to: '/seller/matches' })
		}
	},
	component: SignupCompleteRoute,
})

function SignupCompleteRoute() {
	const { role } = Route.useSearch()
	const navigate = useNavigate()
	const hasSubmitted = useRef(false)
	const [message, setMessage] = useState('Saving your profile...')

	useEffect(() => {
		if (hasSubmitted.current) return
		hasSubmitted.current = true

		if (role === 'agent') {
			let draft: AgentDraft | null
			try {
				draft = agentDraftStorage.load()
			} catch (error) {
				console.error('Failed to load saved agent draft:', error)
				draft = null
			}
			if (!draft) {
				setMessage('We could not find your signup answers.')
				void navigate({ to: '/signup/agent' })
				return
			}

			void completeAgentSignup({ data: draft })
				.then(() => {
					agentDraftStorage.clear()
					void navigate({ to: '/agent/introductions' })
				})
				.catch((error) => {
					hasSubmitted.current = false
					setMessage('Unable to save your profile. Please try again.')
					console.error('Agent profile creation failed', error)
				})
			return
		}

		if (role === 'buyer') {
			let draft: BuyerDraft | null
			try {
				draft = buyerDraftStorage.load()
			} catch (error) {
				console.error('Failed to load saved buyer draft:', error)
				draft = null
			}
			if (!draft) {
				setMessage('We could not find your quiz answers.')
				void navigate({ to: '/signup/buyer/location' })
				return
			}

			void createBuyerProfileFromDraft({ data: draft })
				.then(() => {
					buyerDraftStorage.clear()
					void navigate({ to: '/buyer/matches' })
				})
				.catch((error) => {
					hasSubmitted.current = false
					setMessage('Unable to save your profile. Please try again.')
					console.error('Buyer profile creation failed', error)
				})
			return
		}

		let draft: SellerDraft | null
		try {
			draft = sellerDraftStorage.load()
		} catch (error) {
			console.error('Failed to load saved seller draft:', error)
			draft = null
		}
		if (!draft) {
			setMessage('We could not find your quiz answers.')
			void navigate({ to: '/signup/seller/location' })
			return
		}

		void createSellerProfileFromDraft({ data: draft })
			.then(() => {
				sellerDraftStorage.clear()
				void navigate({ to: '/seller/matches' })
			})
			.catch((error) => {
				hasSubmitted.current = false
				setMessage('Unable to save your profile. Please try again.')
				console.error('Seller profile creation failed', error)
			})
	}, [navigate, role])

	return <CompleteProfileStatus message={message} />
}

function CompleteProfileStatus({ message }: { message: string }) {
	return (
		<div className="flex min-h-dvh items-center justify-center bg-slate-50 px-6 py-12">
			<Card className="w-full max-w-md rounded-3xl border-slate-200 bg-white text-center shadow-sm">
				<CardContent className="flex flex-col items-center gap-4 p-8">
					<div className="bg-primary/10 text-primary flex h-12 w-12 items-center justify-center rounded-2xl">
						<Loader2 className="h-5 w-5 animate-spin" />
					</div>
					<div>
						<h1 className="font-heading text-2xl tracking-tight text-slate-950">
							Completing your profile
						</h1>
						<p className="text-muted-foreground mt-2 text-sm">{message}</p>
					</div>
				</CardContent>
			</Card>
		</div>
	)
}
