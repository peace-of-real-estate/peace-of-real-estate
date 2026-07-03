import { Loader2 } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import { GoogleIcon } from '@/components/icons/google'
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
import { SignupForm, type SignupFormProps } from './signup-form'

type MobileSignupBannerProps<TData> = SignupFormProps<TData> & {
	title: string
	subtitle: string
	ctaLabel?: string
}

export function MobileSignupBanner<TData>({
	title,
	subtitle,
	ctaLabel = 'Create account',
	...signupFormProps
}: MobileSignupBannerProps<TData>) {
	const [isGoogleLoading, setIsGoogleLoading] = useState(false)
	const redirect = signupFormProps.redirect

	const handleGoogleSignIn = async () => {
		setIsGoogleLoading(true)
		const callbackURL = new URL(redirect, window.location.origin).toString()
		try {
			const { data, error } = await authClient.signIn.social({
				provider: 'google',
				callbackURL,
			})
			if (error) throw error
			window.location.assign(data?.url ?? redirect)
		} catch (error) {
			if (
				error &&
				typeof error === 'object' &&
				'code' in error &&
				error.code === 'PROVIDER_NOT_FOUND'
			) {
				toast.error(
					'Google login is not configured yet. Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to .env.development.',
				)
			} else {
				toast.error('Google sign-in failed. Try again.')
			}
			console.error('Google sign-in failed', error)
			setIsGoogleLoading(false)
		}
	}

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
						<Button
							type="button"
							onClick={handleGoogleSignIn}
							disabled={isGoogleLoading}
							variant="outline"
							className="h-11 rounded-xl border-white bg-white px-4 text-sm font-semibold text-slate-950 hover:bg-slate-100 hover:text-slate-950"
							aria-label="Continue with Google"
						>
							{isGoogleLoading ? (
								<Loader2 className="mr-2 h-4 w-4 animate-spin" />
							) : (
								<GoogleIcon className="mr-2 h-5 w-5" />
							)}
							Google
						</Button>
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
