import { Link } from '@tanstack/react-router'

import { motion } from 'framer-motion'
import { useNavigate } from '@tanstack/react-router'

import { useState } from 'react'
import { toast } from 'sonner'

import { GoogleAuthButton } from '@/components/google-auth-button'
import { useGoogleAuth } from '@/hooks/use-google-auth'
import { authClient } from '@/lib/auth/client'
import { Button } from '@/components/ui/button'
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
	SheetTrigger,
} from '@/components/ui/sheet'
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import {
	EnvelopeIcon,
	LockIcon,
	SpinnerIcon,
	UserIcon,
} from '@phosphor-icons/react'

export type SignupFormProps<TData = unknown> = {
	idPrefix?: string
	redirect: string
	oauthRedirect?: string
	quizPath: string
	createProfile: (payload: { data: TData }) => Promise<unknown>
	loadDraft: () => TData | null
	validateDraft: (draft: TData) => boolean
	clearDraft: () => void
	submitLabel?: string
	showTerms?: boolean
}

function SignupForm<TData>({
	idPrefix = 'signup',
	redirect,
	oauthRedirect = redirect,
	quizPath,
	createProfile,
	loadDraft,
	validateDraft,
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
	} = useGoogleAuth({
		fallbackRedirect: oauthRedirect,
	})

	const nameId = `${idPrefix}-name`
	const emailId = `${idPrefix}-email`
	const passwordId = `${idPrefix}-password`

	const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault()
		if (isSubmitting) return

		const draft = loadDraft()
		if (!draft || !validateDraft(draft)) {
			toast.error('Please complete your profile before creating an account.')
			await navigate({ to: quizPath })
			return
		}

		setIsSubmitting(true)

		try {
			const { error } = await authClient.signUp.email({
				name: name.trim(),
				email: email.trim(),
				password,
			})
			if (error) throw error

			await createProfile({ data: draft })
			clearDraft()

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
							<UserIcon className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-white/50" />
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
							<EnvelopeIcon className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-white/50" />
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
							<LockIcon className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-white/50" />
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
							<SpinnerIcon className="mr-2 h-4 w-4 animate-spin" />
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

					<GoogleAuthButton
						fallbackRedirect={oauthRedirect}
						onClick={handleGoogleSignIn}
						isLoading={isGoogleLoading}
						className="h-9 w-full rounded-xl border-white bg-white text-sm font-medium text-slate-950 hover:bg-slate-100 hover:text-slate-950 lg:h-11 lg:text-base"
						disabled={isSubmitting}
					>
						Continue with Google
					</GoogleAuthButton>
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

export type SignupPreviewShellProps<TData> = SignupFormProps<TData> & {
	panelTitle: React.ReactNode
	panelDescription: React.ReactNode
	mobileTitle: string
	mobileSubtitle: string
	mobileCtaLabel?: string
	children: React.ReactNode
}

export function SignupPreviewShell<TData>({
	panelTitle,
	panelDescription,
	mobileTitle,
	mobileSubtitle,
	mobileCtaLabel = 'Create account',
	children,
	...signupFormProps
}: SignupPreviewShellProps<TData>) {
	return (
		<div className="min-h-dvh w-full bg-slate-50">
			<motion.div
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
				transition={{ duration: 0.45, ease: 'easeOut' }}
				className="mx-auto grid min-h-dvh w-full max-w-[1440px] lg:grid-cols-[minmax(420px,1fr)_1.4fr]"
			>
				<div className="bg-primary relative order-2 hidden flex-col justify-center px-6 py-10 text-white sm:px-10 lg:sticky lg:top-0 lg:order-1 lg:flex lg:h-dvh lg:px-12 lg:py-16 xl:px-20">
					<div className="mx-auto w-full max-w-md">
						<div className="mb-3 lg:mb-8">
							<Link
								to="/"
								className="mb-8 hidden items-center gap-3 text-lg font-semibold text-white hover:text-white lg:inline-flex"
							>
								<img
									src="/logomark-light.svg"
									alt="Peace of Real Estate"
									className="h-10 w-10"
								/>
								Peace of Real Estate
							</Link>
							<h1 className="font-heading text-xl tracking-tight text-white lg:text-3xl xl:text-4xl">
								{panelTitle}
							</h1>
							<p className="mt-1 text-xs leading-relaxed text-white/70 lg:mt-3 lg:text-base">
								{panelDescription}
							</p>
						</div>
						<SignupForm {...signupFormProps} idPrefix="desktop-signup" />
					</div>
				</div>

				<div className="order-1 flex flex-col px-5 pt-8 max-lg:pb-[calc(12rem+env(safe-area-inset-bottom))] sm:px-8 lg:order-2 lg:justify-center lg:px-12 lg:py-16 xl:px-20">
					{children}
				</div>
			</motion.div>
			<MobileSignupBanner
				{...signupFormProps}
				title={mobileTitle}
				subtitle={mobileSubtitle}
				ctaLabel={mobileCtaLabel}
			/>
		</div>
	)
}

function MobileSignupBanner<TData>({
	title,
	subtitle,
	ctaLabel = 'Create account',
	...signupFormProps
}: SignupFormProps<TData> & {
	title: string
	subtitle: string
	ctaLabel?: string
}) {
	const redirect = signupFormProps.redirect
	const oauthRedirect = signupFormProps.oauthRedirect ?? redirect

	return (
		<Sheet>
			<div className="bg-primary fixed inset-x-0 bottom-0 z-30 rounded-t-3xl px-4 pt-5 pb-[calc(1.75rem+env(safe-area-inset-bottom))] text-white shadow-2xl shadow-slate-950/30 lg:hidden">
				<div className="mx-auto w-full max-w-md space-y-3">
					<div>
						<h2 className="font-heading text-xl leading-tight font-bold text-white">
							{title}
						</h2>
						<p className="mt-1 text-sm leading-snug text-white/70">
							{subtitle}
						</p>
					</div>
					<div className="grid grid-cols-2 gap-2">
						<SheetTrigger asChild>
							<Button className="bg-accent text-accent-foreground hover:bg-accent/90 h-11 rounded-xl px-4 text-sm font-semibold">
								{ctaLabel}
							</Button>
						</SheetTrigger>
						<GoogleAuthButton
							fallbackRedirect={oauthRedirect}
							className="h-11 rounded-xl border-white bg-white px-4 text-sm font-semibold text-slate-950 hover:bg-slate-100 hover:text-slate-950"
							aria-label="Continue with Google"
						>
							Google
						</GoogleAuthButton>
					</div>
				</div>
			</div>

			<SheetContent
				side="bottom"
				className="bg-primary max-h-[92dvh] overflow-y-auto rounded-t-3xl border-white/10 px-4 pt-5 pb-[calc(1rem+env(safe-area-inset-bottom))] text-white lg:hidden"
			>
				<SheetHeader className="px-0 pt-0 pb-4 text-left">
					<SheetTitle className="font-heading pr-10 text-2xl tracking-tight text-white">
						Create your profile
					</SheetTitle>
					<SheetDescription className="text-white/70">
						Save your profile and start matching.
					</SheetDescription>
				</SheetHeader>
				<SignupForm {...signupFormProps} idPrefix="mobile-signup" />
			</SheetContent>
		</Sheet>
	)
}
