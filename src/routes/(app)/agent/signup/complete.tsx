import { createFileRoute, redirect, useNavigate } from '@tanstack/react-router'
import { Loader2 } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

import { Card, CardContent } from '@/components/ui/card'
import { getCurrentSession } from '@/lib/auth/functions'
import {
	completeAgentSignup,
	loadAgentProfile,
	type AgentDraft,
} from '@/lib/matching/profile'
import { createLocalStorage } from '@/lib/utils/localstorage'

const agentDraftStorage = createLocalStorage<AgentDraft>('pre-agent-draft')

export const Route = createFileRoute('/(app)/agent/signup/complete')({
	beforeLoad: async () => {
		const session = await getCurrentSession()
		if (!session) {
			throw redirect({
				to: '/login',
				search: { redirect: '/agent/signup/complete' },
			})
		}

		const profile = await loadAgentProfile()
		if (profile) {
			throw redirect({ to: '/agent/dashboard/introductions' })
		}
	},
	component: AgentSignupCompleteRoute,
})

function AgentSignupCompleteRoute() {
	const navigate = useNavigate()
	const hasSubmitted = useRef(false)
	const [message, setMessage] = useState('Saving your agent profile...')

	useEffect(() => {
		if (hasSubmitted.current) return
		hasSubmitted.current = true

		const draft = agentDraftStorage.load()
		if (!draft) {
			setMessage('We could not find your signup answers.')
			void navigate({ to: '/agent/signup', search: { step: 'intro' } })
			return
		}

		void completeAgentSignup({ data: draft })
			.then(() => {
				agentDraftStorage.clear()
				void navigate({ to: '/agent/dashboard/introductions' })
			})
			.catch((error) => {
				hasSubmitted.current = false
				setMessage('Unable to save your profile. Please try again.')
				console.error('Agent profile creation failed', error)
			})
	}, [navigate])

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
