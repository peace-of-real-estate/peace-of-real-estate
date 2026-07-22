import {
	EnvelopeIcon,
	LockIcon,
	SpinnerIcon,
	UserIcon,
} from '@phosphor-icons/react'
import { Link } from '@tanstack/react-router'
import { useNavigate } from '@tanstack/react-router'
import { motion } from 'framer-motion'
import { useState } from 'react'
import { toast } from 'sonner'

import { GoogleAuthButton } from '@/components/google-auth-button'
import { Button } from '@/components/ui/button'
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
	SheetTrigger,
} from '@/components/ui/sheet'
import { authClient } from '@/lib/auth/client'
import { useGoogleAuth } from '@/lib/auth/use-google-auth'

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
						<FieldLabel htmlFor={nameId} className="sr-only lg:not-sr-only">
							Full name
						</FieldLabel>
						<div className="relative">
							<UserIcon className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
							<Input
								id={nameId}
								placeholder="Jordan Lee"
								value={name}
								onChange={(event) => setName(event.target.value)}
								disabled={isSubmitting || isGoogleLoading}
								required
								className="h-9 pl-10 text-sm lg:h-11 lg:text-base"
							/>
						</div>
					</Field>
					<Field>
						<FieldLabel htmlFor={emailId} className="sr-only lg:not-sr-only">
							Email address
						</FieldLabel>
						<div className="relative">
							<EnvelopeIcon className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
							<Input
								id={emailId}
								type="email"
								placeholder="you@example.com"
								value={email}
								onChange={(event) => setEmail(event.target.value)}
								disabled={isSubmitting || isGoogleLoading}
								autoComplete="email"
								required
								className="h-9 pl-10 text-sm lg:h-11 lg:text-base"
							/>
						</div>
					</Field>
					<Field>
						<FieldLabel htmlFor={passwordId} className="sr-only lg:not-sr-only">
							Password
						</FieldLabel>
						<div className="relative">
							<LockIcon className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
							<Input
								id={passwordId}
								type="password"
								placeholder="Choose a password"
								value={password}
								onChange={(event) => setPassword(event.target.value)}
								disabled={isSubmitting || isGoogleLoading}
								autoComplete="new-password"
								required
								className="h-9 pl-10 text-sm lg:h-11 lg:text-base"
							/>
						</div>
					</Field>
					<Button
						type="submit"
						disabled={isSubmitting || isGoogleLoading}
						className="h-9 w-full text-sm font-semibold lg:h-11 lg:text-base"
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
					<div className="text-muted-foreground relative py-0 text-center text-xs lg:py-1">
						<span className="bg-sidebar relative z-10 px-3">or</span>
						<div className="bg-border absolute top-1/2 left-0 h-px w-full" />
					</div>

					<GoogleAuthButton
						fallbackRedirect={oauthRedirect}
						onClick={handleGoogleSignIn}
						isLoading={isGoogleLoading}
						className="h-9 w-full text-sm font-medium lg:h-11 lg:text-base"
						disabled={isSubmitting}
					>
						Continue with Google
					</GoogleAuthButton>
				</>
			) : null}

			{showTerms ? (
				<p className="text-muted-foreground text-center text-xs leading-snug">
					By creating an account, you agree to our{' '}
					<a
						href="/terms"
						className="text-brand hover:text-primary underline underline-offset-2"
					>
						Terms of Service
					</a>{' '}
					and{' '}
					<a
						href="/privacy"
						className="text-brand hover:text-primary underline underline-offset-2"
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
		<div className="bg-background min-h-dvh w-full">
			<motion.div
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
				transition={{ duration: 0.45, ease: 'easeOut' }}
				className="mx-auto grid min-h-dvh w-full lg:grid-cols-[minmax(420px,1fr)_1.4fr]"
			>
				<div className="bg-sidebar relative order-2 hidden flex-col justify-center border-r px-6 py-10 sm:px-10 lg:sticky lg:top-0 lg:order-1 lg:flex lg:h-dvh lg:px-12 lg:py-16 xl:px-20">
					<div className="mx-auto w-full max-w-md">
						<div className="mb-3 lg:mb-8">
							<Link
								to="/"
								className="text-foreground mb-8 hidden items-center gap-3 text-lg font-semibold lg:inline-flex"
							>
								<img
									src="/logomark-theme.svg"
									alt="Peace of Real Estate"
									className="h-10 w-10"
								/>
								Peace of Real Estate
							</Link>
							<h1 className="font-heading text-xl tracking-tight lg:text-3xl xl:text-4xl">
								{panelTitle}
							</h1>
							<p className="text-muted-foreground mt-1 text-xs leading-relaxed lg:mt-3 lg:text-base">
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
			<div className="bg-card fixed inset-x-0 bottom-0 z-30 border-t px-4 pt-5 pb-[calc(1.75rem+env(safe-area-inset-bottom))] shadow-lg lg:hidden">
				<div className="mx-auto w-full max-w-md space-y-3">
					<div>
						<h2 className="font-heading text-xl leading-tight font-bold">
							{title}
						</h2>
						<p className="text-muted-foreground mt-1 text-sm leading-snug">
							{subtitle}
						</p>
					</div>
					<div className="grid grid-cols-2 gap-2">
						<SheetTrigger asChild>
							<Button className="h-11 px-4 text-sm font-semibold">
								{ctaLabel}
							</Button>
						</SheetTrigger>
						<GoogleAuthButton
							fallbackRedirect={oauthRedirect}
							className="h-11 px-4 text-sm font-semibold"
							aria-label="Continue with Google"
						>
							Google
						</GoogleAuthButton>
					</div>
				</div>
			</div>

			<SheetContent
				side="bottom"
				className="max-h-[92dvh] overflow-y-auto px-4 pt-5 pb-[calc(1rem+env(safe-area-inset-bottom))] lg:hidden"
			>
				<SheetHeader className="px-0 pt-0 pb-4 text-left">
					<SheetTitle className="font-heading pr-10 text-2xl tracking-tight">
						Create your profile
					</SheetTitle>
					<SheetDescription>
						Save your profile and start matching.
					</SheetDescription>
				</SheetHeader>
				<SignupForm {...signupFormProps} idPrefix="mobile-signup" />
			</SheetContent>
		</Sheet>
	)
}
