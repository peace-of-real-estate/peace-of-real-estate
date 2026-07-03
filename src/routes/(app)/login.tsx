import { Link, createFileRoute } from '@tanstack/react-router'
import { Loader2 } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { z } from 'zod'

import { GoogleIcon } from '@/components/icons/google'
import { redirectAuthenticatedUsers } from '@/lib/auth/functions'
import { useGoogleSignIn } from '@/hooks/use-google-sign-in'
import { authClient } from '@/lib/auth/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'

const DEFAULT_POST_AUTH_REDIRECT = '/consumer/dashboard/matches'

export const Route = createFileRoute('/(app)/login')({
	validateSearch: z.object({
		redirect: z.string().optional(),
	}),
	beforeLoad: redirectAuthenticatedUsers,
	component: LoginRoute,
})

function LoginRoute() {
	const search = Route.useSearch()
	return <Login {...(search.redirect ? { redirect: search.redirect } : {})} />
}

export function Login({ redirect }: { redirect?: string }) {
	const resolvedRedirect =
		redirect && redirect !== '/account' ? redirect : DEFAULT_POST_AUTH_REDIRECT
	const [email, setEmail] = useState('')
	const [password, setPassword] = useState('')
	const [isSubmitting, setIsSubmitting] = useState(false)
	const {
		signIn: handleGoogleSignIn,
		isLoading: isGoogleLoading,
		isAvailable: googleAvailable,
	} = useGoogleSignIn({
		fallbackRedirect: resolvedRedirect,
	})

	const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault()

		if (isSubmitting) {
			return
		}

		setIsSubmitting(true)

		const callbackURL = new URL(
			resolvedRedirect,
			window.location.origin,
		).toString()

		try {
			const { data, error } = await authClient.signIn.email({
				email: email.trim(),
				password,
				callbackURL,
			})

			if (error) {
				throw error
			}

			window.location.assign(data?.url ?? resolvedRedirect)
		} catch (error) {
			const message =
				error && typeof error === 'object' && 'message' in error
					? String(error.message)
					: 'Unable to sign in. Check email and password.'

			toast.error(message)
			console.error('Sign-in failed', error)
			setIsSubmitting(false)
		}
	}

	return (
		<div className="flex h-full w-full flex-1 items-center justify-center px-6 py-12">
			<div className="flex w-full max-w-md flex-col items-center gap-8">
				<div className="text-center">
					<div className="text-muted-foreground mb-3 text-sm">
						Authentication
					</div>
					<h1 className="text-3xl">Welcome Back</h1>
				</div>
				<Card className="w-full">
					<CardContent className="pt-6">
						<div className="space-y-6">
							{googleAvailable ? (
								<>
									<Button
										type="button"
										onClick={handleGoogleSignIn}
										disabled={isGoogleLoading || isSubmitting}
										variant="outline"
										className="w-full"
									>
										{isGoogleLoading ? (
											<Loader2 className="h-4 w-4 animate-spin" />
										) : (
											<GoogleIcon className="h-5 w-5" />
										)}
										Sign in with Google
									</Button>

									<div className="text-muted-foreground relative py-2 text-center text-xs tracking-[0.2em] uppercase">
										<span className="bg-background relative z-10 px-3">or</span>
										<div className="bg-border absolute top-1/2 left-0 h-px w-full" />
									</div>
								</>
							) : null}

							<form className="space-y-6" onSubmit={handleSubmit}>
								<FieldGroup>
									<Field>
										<FieldLabel htmlFor="email">Email</FieldLabel>
										<Input
											id="email"
											type="email"
											placeholder="you@example.com"
											value={email}
											onChange={(event) => setEmail(event.target.value)}
											disabled={isSubmitting || isGoogleLoading}
											autoComplete="email"
											required
										/>
									</Field>
									<Field>
										<FieldLabel htmlFor="password">Password</FieldLabel>
										<Input
											id="password"
											type="password"
											placeholder="Enter password"
											value={password}
											onChange={(event) => setPassword(event.target.value)}
											disabled={isSubmitting || isGoogleLoading}
											autoComplete="current-password"
											required
										/>
									</Field>
									<Button
										type="submit"
										disabled={isSubmitting || isGoogleLoading}
										className="w-full"
									>
										{isSubmitting ? (
											<Loader2 className="h-4 w-4 animate-spin" />
										) : null}
										Sign in
									</Button>
									<p className="text-muted-foreground text-center text-sm">
										Don&apos;t have an account?{' '}
										<Link
											to="/consumer/signup"
											search={
												redirect
													? { step: 'intro', redirect }
													: { step: 'intro' }
											}
											className="text-foreground font-medium underline underline-offset-4"
										>
											Create profile
										</Link>
									</p>
								</FieldGroup>
							</form>
						</div>
					</CardContent>
				</Card>
			</div>
		</div>
	)
}
