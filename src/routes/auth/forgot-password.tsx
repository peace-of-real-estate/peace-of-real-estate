import { Link, createFileRoute } from '@tanstack/react-router'

import { useState } from 'react'
import { toast } from 'sonner'

import { redirectAuthenticatedUsers } from '@/lib/auth/functions'
import { authClient } from '@/lib/auth/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { SpinnerIcon } from '@phosphor-icons/react'

export const Route = createFileRoute('/auth/forgot-password')({
	beforeLoad: redirectAuthenticatedUsers,
	component: ForgotPasswordRoute,
})

function ForgotPasswordRoute() {
	const [email, setEmail] = useState('')
	const [isSubmitting, setIsSubmitting] = useState(false)
	const [isSent, setIsSent] = useState(false)

	const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault()

		if (isSubmitting) {
			return
		}

		setIsSubmitting(true)

		try {
			const { error } = await authClient.requestPasswordReset({
				email: email.trim(),
				redirectTo: '/auth/reset-password',
			})

			if (error) {
				throw error
			}

			setIsSent(true)
		} catch (error) {
			const message =
				error && typeof error === 'object' && 'message' in error
					? String(error.message)
					: 'Unable to request password reset. Try again.'

			toast.error(message)
			console.error('Password reset request failed', error)
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
					<h1 className="text-3xl">Reset password</h1>
					<p className="text-muted-foreground mt-2 text-sm">
						Enter your email and we&apos;ll send you a reset link.
					</p>
				</div>
				<Card className="w-full">
					<CardContent className="pt-6">
						{isSent ? (
							<div className="text-muted-foreground text-center text-sm">
								If an account exists for{' '}
								<span className="text-foreground font-medium">{email}</span>,
								we&apos;ve sent a password reset link.
							</div>
						) : (
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
											disabled={isSubmitting}
											autoComplete="email"
											required
										/>
									</Field>
									<Button
										type="submit"
										disabled={isSubmitting}
										className="w-full"
									>
										{isSubmitting ? (
											<SpinnerIcon className="h-4 w-4 animate-spin" />
										) : null}
										Send reset link
									</Button>
									<p className="text-muted-foreground text-center text-sm">
										Remember your password?{' '}
										<Link
											to="/auth/login"
											className="text-foreground font-medium underline underline-offset-4"
										>
											Sign in
										</Link>
									</p>
								</FieldGroup>
							</form>
						)}
					</CardContent>
				</Card>
			</div>
		</div>
	)
}
