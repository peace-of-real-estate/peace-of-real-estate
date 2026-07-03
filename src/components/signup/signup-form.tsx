import { useNavigate } from '@tanstack/react-router'
import { Lock, Loader2, Mail, User } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import { GoogleIcon } from '@/components/icons/google'
import { useGoogleSignIn } from '@/hooks/use-google-sign-in'
import { authClient } from '@/lib/auth/client'
import { Button } from '@/components/ui/button'
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'

export type SignupFormProps<TData = unknown> = {
	idPrefix?: string
	redirect: string
	oauthRedirect?: string
	createProfile: (payload: { data: TData }) => Promise<unknown>
	loadDraft: () => TData | null
	clearDraft: () => void
	submitLabel?: string
	showTerms?: boolean
}

export function SignupForm<TData>({
	idPrefix = 'signup',
	redirect,
	oauthRedirect = redirect,
	createProfile,
	loadDraft,
	clearDraft,
	submitLabel = 'Create my account',
	showTerms = true,
}: SignupFormProps<TData>) {
	const navigate = useNavigate()
	const [name, setName] = useState('')
	const [email, setEmail] = useState('')
	const [password, setPassword] = useState('')
	const [isSubmitting, setIsSubmitting] = useState(false)
	const {
		signIn: handleGoogleSignIn,
		isLoading: isGoogleLoading,
		isAvailable: googleAvailable,
	} = useGoogleSignIn({
		fallbackRedirect: oauthRedirect,
	})

	const nameId = `${idPrefix}-name`
	const emailId = `${idPrefix}-email`
	const passwordId = `${idPrefix}-password`

	const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault()
		if (isSubmitting) return
		setIsSubmitting(true)

		try {
			const { error } = await authClient.signUp.email({
				name: name.trim(),
				email: email.trim(),
				password,
			})
			if (error) throw error

			const draft = loadDraft()
			if (draft) {
				await createProfile({ data: draft })
				clearDraft()
			}

			await navigate({ to: redirect })
		} catch (error) {
			const message =
				error && typeof error === 'object' && 'message' in error
					? String(error.message)
					: 'Unable to create account. Try again.'
			toast.error(message)
			console.error('Sign-up failed', error)
			setIsSubmitting(false)
		}
	}

	return (
		<div className="space-y-3 lg:space-y-5">
			<form className="space-y-3 lg:space-y-4" onSubmit={handleSubmit}>
				<FieldGroup className="gap-2 lg:gap-7">
					<Field>
						<FieldLabel
							htmlFor={nameId}
							className="sr-only lg:not-sr-only lg:text-white/80"
						>
							Full name
						</FieldLabel>
						<div className="relative">
							<User className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-white/50" />
							<Input
								id={nameId}
								placeholder="Jordan Lee"
								value={name}
								onChange={(event) => setName(event.target.value)}
								disabled={isSubmitting || isGoogleLoading}
								required
								className="h-9 rounded-xl border-white/20 bg-white/10 pl-10 text-sm text-white placeholder:text-white/40 lg:h-11 lg:text-base"
							/>
						</div>
					</Field>
					<Field>
						<FieldLabel
							htmlFor={emailId}
							className="sr-only lg:not-sr-only lg:text-white/80"
						>
							Email address
						</FieldLabel>
						<div className="relative">
							<Mail className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-white/50" />
							<Input
								id={emailId}
								type="email"
								placeholder="you@example.com"
								value={email}
								onChange={(event) => setEmail(event.target.value)}
								disabled={isSubmitting || isGoogleLoading}
								autoComplete="email"
								required
								className="h-9 rounded-xl border-white/20 bg-white/10 pl-10 text-sm text-white placeholder:text-white/40 lg:h-11 lg:text-base"
							/>
						</div>
					</Field>
					<Field>
						<FieldLabel
							htmlFor={passwordId}
							className="sr-only lg:not-sr-only lg:text-white/80"
						>
							Password
						</FieldLabel>
						<div className="relative">
							<Lock className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-white/50" />
							<Input
								id={passwordId}
								type="password"
								placeholder="Choose a password"
								value={password}
								onChange={(event) => setPassword(event.target.value)}
								disabled={isSubmitting || isGoogleLoading}
								autoComplete="new-password"
								required
								className="h-9 rounded-xl border-white/20 bg-white/10 pl-10 text-sm text-white placeholder:text-white/40 lg:h-11 lg:text-base"
							/>
						</div>
					</Field>
					<Button
						type="submit"
						disabled={isSubmitting || isGoogleLoading}
						className="bg-accent text-accent-foreground hover:bg-accent/90 h-9 w-full rounded-xl text-sm font-semibold lg:h-11 lg:text-base"
					>
						{isSubmitting ? (
							<Loader2 className="mr-2 h-4 w-4 animate-spin" />
						) : null}
						{submitLabel}
					</Button>
				</FieldGroup>
			</form>

			{googleAvailable ? (
				<>
					<div className="relative py-0 text-center text-xs text-white/40 lg:py-1">
						<span className="relative z-10 px-3 text-white/50">or</span>
						<div className="absolute top-1/2 left-0 h-px w-full bg-white/20" />
					</div>

					<Button
						type="button"
						onClick={handleGoogleSignIn}
						disabled={isGoogleLoading || isSubmitting}
						variant="outline"
						className="h-9 w-full rounded-xl border-white bg-white text-sm font-medium text-slate-950 hover:bg-slate-100 hover:text-slate-950 lg:h-11 lg:text-base"
					>
						{isGoogleLoading ? (
							<Loader2 className="mr-2 h-4 w-4 animate-spin" />
						) : (
							<GoogleIcon className="mr-2 h-5 w-5" />
						)}
						Continue with Google
					</Button>
				</>
			) : null}

			{showTerms ? (
				<p className="text-center text-[10px] leading-snug text-white/50 lg:text-xs">
					By creating an account, you agree to our{' '}
					<a
						href="/terms"
						className="text-white/80 underline underline-offset-2 hover:text-white"
					>
						Terms of Service
					</a>{' '}
					and{' '}
					<a
						href="/privacy"
						className="text-white/80 underline underline-offset-2 hover:text-white"
					>
						Privacy Policy
					</a>
					.
				</p>
			) : null}
		</div>
	)
}
