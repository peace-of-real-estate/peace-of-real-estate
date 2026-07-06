import { redirectAuthenticatedUsers } from '@/lib/auth/functions'
import { createFileRoute, Link } from '@tanstack/react-router'
import { ArrowRight, CheckCircle2, Home, Tag } from 'lucide-react'
import { Star, ShieldCheck, Clock } from '@phosphor-icons/react'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog'

export const Route = createFileRoute('/')({
	beforeLoad: redirectAuthenticatedUsers,
	component: LandingPage,
})

function LandingPage() {
	const [showProfileTypeDialog, setShowProfileTypeDialog] = useState(false)

	return (
		<div className="flex min-h-dvh flex-col">
			<LandingHeader onOpenProfileType={() => setShowProfileTypeDialog(true)} />
			<main className="flex w-full flex-1 flex-col overflow-x-hidden">
				<HeroSection onOpenProfileType={() => setShowProfileTypeDialog(true)} />
				<HowItWorksSection />
				<FeaturesSection
					onOpenProfileType={() => setShowProfileTypeDialog(true)}
				/>
			</main>
			<LandingFooter />
			<ProfileTypeDialog
				open={showProfileTypeDialog}
				onOpenChange={setShowProfileTypeDialog}
			/>
		</div>
	)
}

// =============================================================================
// Header
// =============================================================================

function LandingHeader({
	onOpenProfileType,
}: {
	onOpenProfileType: () => void
}) {
	return (
		<header className="bg-card sticky top-0 z-50 h-(--app-header-height) border-b">
			<div className="mx-auto flex h-full w-full max-w-7xl items-center justify-between px-5 lg:px-10">
				<Link to="/" className="flex items-center gap-2.5">
					<img
						src="/logomark-theme.svg"
						alt="Peace of Real Estate"
						className="h-8 w-auto shrink-0 md:h-9"
					/>
					<span className="font-heading text-sm font-semibold whitespace-nowrap md:text-base">
						Peace of Real Estate
					</span>
				</Link>

				<div className="flex items-center gap-2">
					<Link
						to="/auth/login"
						search={{ redirect: '/' }}
						className="hover:bg-muted hover:text-foreground inline-flex h-9 items-center justify-center rounded-xl px-4 text-sm font-medium whitespace-nowrap transition-colors"
					>
						Log in
					</Link>
					<button
						type="button"
						onClick={onOpenProfileType}
						className="bg-primary text-primary-foreground hover:bg-primary/85 inline-flex h-9 items-center justify-center rounded-xl px-4 text-sm font-medium whitespace-nowrap transition-colors"
					>
						Sign Up
					</button>
				</div>
			</div>
		</header>
	)
}

// =============================================================================
// Footer
// =============================================================================

function LandingFooter() {
	return (
		<footer className="bg-card h-(--app-footer-height) w-full border-t">
			<div className="mx-auto flex h-full max-w-7xl flex-col items-center justify-center gap-2 px-6 md:flex-row md:justify-between md:gap-3 md:px-10">
				<p className="text-muted-foreground text-xs">
					&copy; 2026 Peace of Real Estate. All rights reserved.
				</p>
				<div className="flex gap-6">
					<Link
						to="/signup/agent"
						className="text-muted-foreground hover:text-foreground text-xs transition-colors"
					>
						Agent Signup
					</Link>
					<Link
						to="/"
						className="text-muted-foreground hover:text-foreground text-xs transition-colors"
					>
						Privacy
					</Link>
					<Link
						to="/"
						className="text-muted-foreground hover:text-foreground text-xs transition-colors"
					>
						Terms
					</Link>
				</div>
			</div>
		</footer>
	)
}

// =============================================================================
// Hero
// =============================================================================

function HeroSection({ onOpenProfileType }: { onOpenProfileType: () => void }) {
	return (
		<section className="bg-card relative w-full overflow-hidden">
			<div className="mx-auto grid max-w-7xl gap-12 px-6 pt-10 pb-12 md:grid-cols-[1fr_1.1fr] md:gap-14 md:pt-14 md:pb-16 lg:px-10">
				<div className="flex max-w-lg flex-col items-start gap-6 md:gap-7">
					<h1 className="font-heading mt-2 text-4xl leading-[1.05] font-bold tracking-tight text-balance md:mt-4 md:text-5xl lg:text-[3.25rem]">
						Perfect Agent.
						<br />
						<span className="text-sky">Perfect Home.</span>
					</h1>

					<p className="text-muted-foreground max-w-md text-lg leading-8 md:text-xl md:leading-9">
						The right agent makes every difference. Get matched on working
						style, communication, and true fit. Not ad spend.
					</p>

					<div className="flex flex-col gap-4 pt-1">
						<div className="flex flex-wrap items-center gap-3">
							<Button
								size="lg"
								className="h-12 cursor-pointer rounded-xl px-7 text-base font-semibold shadow-md"
								onClick={onOpenProfileType}
							>
								Find an Agent
								<ArrowRight className="ml-2 h-4 w-4" />
							</Button>
							<Button
								variant="outline"
								size="lg"
								className="h-12 rounded-xl px-5 text-base font-medium"
								asChild
							>
								<Link to="/signup/agent">I am an Agent</Link>
							</Button>
						</div>

						<div className="text-muted-foreground flex flex-wrap items-center gap-x-4 gap-y-1.5 pt-1 text-xs font-medium md:text-sm">
							<span className="inline-flex items-center gap-1.5">
								<Star className="text-gold h-3.5 w-3.5" weight="fill" />
								Free
							</span>
							<span className="inline-flex items-center gap-1.5">
								<ShieldCheck className="text-gold h-3.5 w-3.5" />
								No signup
							</span>
							<span className="inline-flex items-center gap-1.5">
								<Clock className="text-gold h-3.5 w-3.5" />
								About 2 minutes
							</span>
						</div>
					</div>
				</div>

				<div className="relative flex items-center justify-center">
					<div className="bg-sky/15 absolute inset-0 rounded-full blur-3xl" />
					<img
						src="/hero.png"
						alt="Buyer and real estate agent shaking hands outside a home"
						className="relative z-10 w-full max-w-lg object-contain md:max-w-xl"
					/>
				</div>
			</div>
		</section>
	)
}

// =============================================================================
// Profile type dialog
// =============================================================================

function ProfileTypeDialog({
	open,
	onOpenChange,
}: {
	open: boolean
	onOpenChange: (open: boolean) => void
}) {
	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-lg">
				<DialogHeader>
					<DialogTitle>What are you planning to do?</DialogTitle>
					<DialogDescription>
						Choose the path that fits you. You can specialize the buyer and
						seller flows separately from here.
					</DialogDescription>
				</DialogHeader>

				<div className="grid gap-3 sm:grid-cols-2">
					<Link
						to="/signup/buyer/location"
						className="hover:border-primary hover:bg-primary/5 group rounded-2xl border p-5 text-left transition-colors"
						onClick={() => onOpenChange(false)}
					>
						<div className="bg-primary/10 text-primary mb-4 flex size-11 items-center justify-center rounded-xl">
							<Home className="size-5" />
						</div>
						<h3 className="font-heading text-lg font-semibold">
							I want to buy
						</h3>
						<p className="text-muted-foreground mt-1 text-sm">
							Find agents who fit your home search.
						</p>
					</Link>

					<Link
						to="/signup/seller/location"
						className="hover:border-primary hover:bg-primary/5 group rounded-2xl border p-5 text-left transition-colors"
						onClick={() => onOpenChange(false)}
					>
						<div className="bg-primary/10 text-primary mb-4 flex size-11 items-center justify-center rounded-xl">
							<Tag className="size-5" />
						</div>
						<h3 className="font-heading text-lg font-semibold">
							I want to sell
						</h3>
						<p className="text-muted-foreground mt-1 text-sm">
							Find agents who fit your listing goals.
						</p>
					</Link>
				</div>
			</DialogContent>
		</Dialog>
	)
}

// =============================================================================
// How it works
// =============================================================================

const howItWorksSteps = [
	{
		id: 1,
		title: 'Tell us about your move',
		description: 'A few quick questions, ~2 min',
		image: '/step1.png',
	},
	{
		id: 2,
		title: 'Meet your matched agents',
		description: 'Ranked by fit, never by who paid',
		image: '/step2.png',
	},
	{
		id: 3,
		title: 'Connect with your best fit',
		description: 'On your terms, when you’re ready',
		image: '/step3.png',
	},
]

function HowItWorksSection() {
	return (
		<section id="how-it-works" className="w-full py-16 md:py-20">
			<div className="mx-auto max-w-6xl px-6 lg:px-10">
				<div className="mb-12 text-center md:mb-14">
					<h2 className="font-heading text-3xl font-semibold tracking-tight md:text-4xl">
						How It Works
					</h2>
					<p className="text-muted-foreground mt-3 text-lg">
						Three simple steps to your perfect agent match
					</p>
				</div>

				<div className="grid gap-8 md:grid-cols-3">
					{howItWorksSteps.map((step) => (
						<div
							key={step.id}
							className="border-border bg-card relative flex flex-col items-center rounded-2xl border p-6 text-center shadow-sm transition-shadow hover:shadow-md"
						>
							<div className="mb-5 flex h-40 w-full items-center justify-center overflow-hidden rounded-xl">
								<img
									src={step.image}
									alt=""
									className="h-full w-full object-contain p-3"
								/>
							</div>

							<div className="flex items-start gap-3">
								<div className="bg-primary text-primary-foreground mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold shadow-sm">
									{step.id}
								</div>
								<div className="text-left">
									<h3 className="font-heading text-foreground text-base leading-tight font-semibold">
										{step.title}
									</h3>
									<p className="text-muted-foreground mt-0.5 text-sm leading-snug">
										{step.description}
									</p>
								</div>
							</div>
						</div>
					))}
				</div>
			</div>
		</section>
	)
}

// =============================================================================
// Features
// =============================================================================

const featureItems = [
	{
		lead: 'Matched to you',
		rest: 'on fit, working style, communication preference, and transparency',
	},
	{
		lead: 'Peace Pact agents',
		rest: 'committed to transparency and putting your interests first',
	},
	{
		lead: 'Clear fit rationale',
		rest: 'see why each agent fits before you commit',
	},
	{
		lead: 'Commission coaching',
		rest: 'tips and scripts so you ask the right questions upfront',
	},
	{
		lead: 'Backup matches ready',
		rest: 'if your first pick isn’t available, you’re not stuck',
	},
	{
		lead: 'Built for both sides',
		rest: 'PRE serves you and the transparent, authentic agent at once; when the fit is right, everyone wins',
	},
]

function FeaturesSection({
	onOpenProfileType,
}: {
	onOpenProfileType: () => void
}) {
	return (
		<section id="buyers" className="bg-card w-full py-16 md:py-20">
			<div className="mx-auto grid max-w-6xl items-center gap-12 px-6 md:grid-cols-2 md:gap-16 lg:px-10">
				<div className="relative flex w-full justify-center md:justify-start">
					<div className="bg-sky/10 absolute inset-x-8 top-14 bottom-10 rounded-full blur-3xl" />
					<img
						src="/match.png"
						alt="Agent match preview on a phone"
						className="relative z-10 w-full max-w-lg rounded-[2rem] object-contain"
					/>
				</div>

				<div className="flex w-full flex-col gap-6">
					<p className="text-primary text-xs font-semibold tracking-wider uppercase">
						For buyers and sellers
					</p>
					<h2 className="font-heading text-3xl font-semibold tracking-tight md:text-4xl">
						More than agents.
						<br />
						Real partners.
					</h2>

					<ul className="flex flex-col gap-4">
						{featureItems.map((item) => (
							<li key={item.lead} className="flex items-start gap-3">
								<div className="bg-primary/10 mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full">
									<CheckCircle2 className="text-primary h-3.5 w-3.5" />
								</div>
								<span className="text-sm leading-relaxed">
									<strong>{item.lead}</strong> — {item.rest}
								</span>
							</li>
						))}
					</ul>

					<div className="flex flex-col items-start gap-3 pt-2">
						<Button
							size="lg"
							className="h-12 cursor-pointer rounded-xl px-7 text-base font-semibold shadow-md"
							onClick={onOpenProfileType}
						>
							Find My Agent
							<ArrowRight className="ml-2 h-4 w-4" />
						</Button>
						<button
							type="button"
							className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm font-medium transition-colors hover:underline"
							onClick={() =>
								document
									.getElementById('how-it-works')
									?.scrollIntoView({ behavior: 'smooth' })
							}
						>
							Learn more
						</button>
					</div>
				</div>
			</div>
		</section>
	)
}
