import { createFileRoute } from '@tanstack/react-router'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { SUPPORT_EMAIL } from '@/lib/constants'
import { authenticateBeta } from '@/lib/auth/beta.functions'
import {
	ArrowRightIcon,
	LockIcon,
	ShieldCheckIcon,
	SparkleIcon,
} from '@phosphor-icons/react'
import { z } from 'zod'

export const Route = createFileRoute('/auth/beta')({
	validateSearch: z.object({ error: z.enum(['invalid', 'server']).optional() }),
	component: BetaLogin,
})

function BetaLogin() {
	const { error } = Route.useSearch()

	return (
		<div className="relative flex min-h-dvh w-full items-center justify-center overflow-hidden px-6 py-12">
			<Card className="relative z-10 w-full max-w-lg">
				<CardContent>
					<div className="mb-8 flex items-center justify-between gap-4">
						<div className="flex h-12 w-12 items-center justify-center">
							<ShieldCheckIcon className="h-6 w-6" />
						</div>
						<div className="text-muted-foreground text-sm">Private Preview</div>
					</div>

					<div className="mb-10 text-center">
						<div className="mx-auto mb-5 inline-flex items-center gap-2 text-xs">
							<SparkleIcon className="h-3.5 w-3.5" />
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

					<form
						action={authenticateBeta.url}
						method="post"
						className="space-y-4"
					>
						<div className="relative">
							<LockIcon className="text-muted-foreground absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2" />
							<Input
								name="password"
								type="password"
								placeholder="Enter invite password"
								required
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

						<Button type="submit" className="w-full">
							Unlock Preview
							<ArrowRightIcon className="h-4 w-4" />
						</Button>
					</form>

					<p className="text-muted-foreground mt-8 text-center text-xs leading-relaxed">
						Need an invite?{' '}
						<a
							href={`mailto:${SUPPORT_EMAIL}`}
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
