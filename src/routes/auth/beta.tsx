import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState, useRef } from 'react'
import { ArrowRight, Lock, ShieldCheck, Sparkles } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { authenticateBeta } from '@/lib/auth/beta'

async function authenticateBetaWithPassword(password: string) {
	try {
		const data = await authenticateBeta({ data: { password } })
		return data.success ? 'success' : 'invalid'
	} catch {
		return 'server-error'
	}
}

export const Route = createFileRoute('/auth/beta')({
	component: BetaLogin,
})

function BetaLogin() {
	const navigate = useNavigate()
	const [password, setPassword] = useState('')
	const [error, setError] = useState<'invalid' | 'server' | null>(null)
	const [success, setSuccess] = useState(false)
	const inputRef = useRef<HTMLInputElement>(null)

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		const authResult = await authenticateBetaWithPassword(password)

		if (authResult === 'success') {
			setError(null)
			setSuccess(true)
			setTimeout(async () => {
				await navigate({ to: '/' })
			}, 800)
		} else if (authResult === 'server-error') {
			setError('server')
			inputRef.current?.focus()
		} else {
			setError('invalid')
			setPassword('')
			inputRef.current?.focus()
		}
	}

	return (
		<div className="relative flex min-h-dvh w-full items-center justify-center overflow-hidden px-6 py-12">
			<Card className="relative z-10 w-full max-w-lg">
				<CardContent>
					<div className="mb-8 flex items-center justify-between gap-4">
						<div className="flex h-12 w-12 items-center justify-center">
							<ShieldCheck className="h-6 w-6" />
						</div>
						<div className="text-muted-foreground text-sm">Private Preview</div>
					</div>

					<div className="mb-10 text-center">
						<div className="mx-auto mb-5 inline-flex items-center gap-2 text-xs">
							<Sparkles className="h-3.5 w-3.5" />
							Early Access
						</div>
						<h1 className="mb-4 text-4xl md:text-5xl">
							Step into a calmer way to find your agent.
						</h1>
						<p className="text-muted-foreground mx-auto max-w-sm text-sm leading-relaxed">
							Peace of Real Estate is currently open to invited buyers, sellers,
							agents, and early customers helping shape the matching experience.
						</p>
					</div>

					<form onSubmit={handleSubmit} className="space-y-4">
						<div className="relative">
							<Lock className="text-muted-foreground absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2" />
							<Input
								ref={inputRef}
								type="password"
								value={password}
								onChange={(e) => {
									setPassword(e.target.value)
									setError(null)
								}}
								placeholder="Enter invite password"
								className="pl-11"
							/>
						</div>

						{error === 'invalid' ? (
							<p className="text-destructive text-center text-xs">
								Invite password not recognized. Please try again.
							</p>
						) : null}

						{error === 'server' ? (
							<p className="text-destructive text-center text-xs">
								We couldn't verify the invite password right now. Please try
								again in a moment.
							</p>
						) : null}

						{success ? (
							<p className="text-center text-xs">Access granted. Welcome in.</p>
						) : null}

						<Button type="submit" disabled={success} className="w-full">
							{success ? 'Entering...' : 'Unlock Preview'}
							<ArrowRight className="h-4 w-4" />
						</Button>
					</form>

					<p className="text-muted-foreground mt-8 text-center text-xs leading-relaxed">
						Need an invite?{' '}
						<a
							href="mailto:hello@peaceofrealestate.com"
							className="font-medium underline underline-offset-4"
						>
							Request access
						</a>
					</p>
				</CardContent>
			</Card>
		</div>
	)
}
