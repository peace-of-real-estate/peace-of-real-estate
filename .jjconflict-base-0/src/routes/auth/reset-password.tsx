import { SpinnerIcon } from '@phosphor-icons/react'
import { Link, createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { toast } from 'sonner'
import { z } from 'zod'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { authClient } from '@/lib/auth/client'

export const Route = createFileRoute('/auth/reset-password')({
	validateSearch: z.object({
		token: z.string(),
	}),
	component: ResetPasswordRoute,
})

function ResetPasswordRoute() {
	const { token } = Route.useSearch()
	const [password, setPassword] = useState('')
	const [confirmPassword, setConfirmPassword] = useState('')
	const [isSubmitting, setIsSubmitting] = useState(false)
	const [isComplete, setIsComplete] = useState(false)

	const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault()

		if (isSubmitting) {
			return
		}

		if (password !== confirmPassword) {
			toast.error('Passwords do not match.')
			return
		}

		setIsSubmitting(true)

		try {
			const { error } = await authClient.resetPassword({
				token,
				newPassword: password,
			})

			if (error) {
				throw error
			}

			setIsComplete(true)
		} catch (error) {
			const message =
				error && typeof error === 'object' && 'message' in error
					? String(error.message)
					: 'Unable to reset password. The link may be expired or invalid.'

			toast.error(message)
			console.error('Password reset failed', error)
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
					<h1 className="text-3xl">Create new password</h1>
				</div>
				<Card className="w-full">
					<CardContent className="pt-6">
						{isComplete ? (
							<div className="space-y-4 text-center">
								<p className="text-muted-foreground text-sm">
									Your password has been updated.
								</p>
								<Button asChild className="w-full">
									<Link to="/auth/login">Sign in</Link>
								</Button>
							</div>
						) : (
							<form className="space-y-6" onSubmit={handleSubmit}>
								<FieldGroup>
									<Field>
										<FieldLabel htmlFor="password">New password</FieldLabel>
										<Input
											id="password"
											type="password"
											placeholder="Enter a new password"
											value={password}
											onChange={(event) => setPassword(event.target.value)}
											disabled={isSubmitting}
											autoComplete="new-password"
											required
											minLength={8}
										/>
									</Field>
									<Field>
										<FieldLabel htmlFor="confirm-password">
											Confirm password
										</FieldLabel>
										<Input
											id="confirm-password"
											type="password"
											placeholder="Confirm your new password"
											value={confirmPassword}
											onChange={(event) =>
												setConfirmPassword(event.target.value)
											}
											disabled={isSubmitting}
											autoComplete="new-password"
											required
											minLength={8}
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
										Reset password
									</Button>
								</FieldGroup>
							</form>
						)}
					</CardContent>
				</Card>
			</div>
		</div>
	)
}
