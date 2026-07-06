import { redirectAuthenticatedUsers } from '@/lib/auth/functions'
import { createFileRoute, Link } from '@tanstack/react-router'
import { ArrowRight, CheckCircle2, Home, Tag } from 'lucide-react'
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
				<FeaturesSection />
			</main>
			<LandingFooter />
			<ProfileTypeDialog
				open={showProfileTypeDialog}
				onOpenChange={setShowProfileTypeDialog}
			/>
		</div>
	)
}

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
						className="hover:bg-muted hover:text-foreground dark:hover:bg-muted/50 inline-flex h-9 items-center justify-center rounded-lg px-4 text-sm font-medium whitespace-nowrap transition-colors"
					>
						Log in
					</Link>
					<button
						type="button"
						onClick={onOpenProfileType}
						className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex h-9 items-center justify-center rounded-lg px-4 text-sm font-medium whitespace-nowrap transition-colors"
					>
						Sign Up
					</button>
				</div>
			</div>
		</header>
	)
}

function LandingFooter() {
	return (
		<footer className="bg-card h-(--app-footer-height) w-full border-t">
			<div className="mx-auto flex h-full max-w-7xl flex-col items-center justify-center gap-2 px-6 md:flex-row md:justify-between md:gap-3 md:px-10">
				<p className="text-muted-foreground text-xs">
					&copy; 2026 Peace of Real Estate. All rights reserved.
				</p>
				<div className="flex gap-6">
					<Link
						to="/signup/agent/intro"
						className="text-muted-foreground text-xs"
					>
						Agent Signup
					</Link>
					<Link to="/" className="text-muted-foreground text-xs">
						Privacy
					</Link>
					<Link to="/" className="text-muted-foreground text-xs">
						Terms
					</Link>
				</div>
			</div>
		</footer>
	)
}

function HeroSection({ onOpenProfileType }: { onOpenProfileType: () => void }) {
	return (
		<section className="bg-card relative w-full overflow-hidden pb-10">
			<div className="mx-auto grid max-w-7xl gap-10 px-6 md:grid-cols-[0.9fr_1.1fr] md:gap-8 lg:px-10">
				<div className="flex max-w-xl flex-col items-start gap-6 md:gap-8">
					<h1 className="font-heading mt-8 text-4xl leading-snug font-bold tracking-tight text-balance md:text-5xl">
						Perfect Agent,
						<br />
						<span className="text-sky">Perfect Home.</span>
					</h1>

					<p className="text-muted-foreground max-w-lg text-base leading-8 md:text-lg">
						The most expensive decision of your life starts with one choice —
						the right agent. PRE is the first platform built to make sure that
						choice is actually right — matched on working style, communication
						expectations, and fit. Built for buyers, sellers, and the
						transparent, authentic agent simultaneously.
					</p>

					<div className="flex flex-wrap items-center gap-4 pt-2">
						<Button
							size="lg"
							className="h-16 cursor-pointer rounded-2xl px-12 text-xl font-bold shadow-lg"
							onClick={onOpenProfileType}
						>
							Find Your Agent
						</Button>
						<Button
							variant="ghost"
							size="lg"
							className="text-muted-foreground hover:text-foreground h-16 rounded-2xl px-6 text-base font-medium"
							asChild
						>
							<Link to="/signup/agent/intro">I’m an Agent</Link>
						</Button>
					</div>
				</div>

				<img
					src="/hero.png"
					alt="Buyer and real estate agent shaking hands outside a home"
					className="w-full max-w-2xl object-contain"
				/>
			</div>
		</section>
	)
}

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

const howItWorksSteps = [
	{
		id: 1,
		title: 'Take a short quiz',
		image: '/step1.png',
	},
	{
		id: 2,
		title: 'Browse Agents',
		image: '/step2.png',
	},
	{
		id: 3,
		title: 'Request an Introduction',
		image: '/step3.png',
	},
]

function HowItWorksSection() {
	return (
		<section
			id="how-it-works"
			className="bg-secondary/40 w-full py-16 md:py-20"
		>
			<div className="mx-auto max-w-6xl px-6 lg:px-10">
				<div className="mb-12 text-center md:mb-16">
					<h2 className="font-heading text-3xl font-semibold tracking-tight md:text-4xl">
						How It Works (3 Steps)
					</h2>
				</div>

				<div className="relative grid gap-10 md:grid-cols-3 md:gap-12">
					<div className="pointer-events-none absolute top-14 left-1/3 hidden w-1/6 -translate-x-1/2 md:block">
						<svg viewBox="0 0 120 24" fill="none" className="w-full">
							<path
								d="M0 12 Q60 0, 120 12"
								stroke="currentColor"
								strokeWidth="1.5"
								strokeDasharray="6 4"
								className="text-sky"
							/>
						</svg>
					</div>
					<div className="pointer-events-none absolute top-14 right-1/3 hidden w-1/6 translate-x-1/2 md:block">
						<svg viewBox="0 0 120 24" fill="none" className="w-full">
							<path
								d="M0 12 Q60 0, 120 12"
								stroke="currentColor"
								strokeWidth="1.5"
								strokeDasharray="6 4"
								className="text-sky"
							/>
						</svg>
					</div>

					{howItWorksSteps.map((step) => (
						<div
							key={step.id}
							className="relative flex flex-col items-center text-center"
						>
							<div className="bg-sky text-primary-foreground mb-4 flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold">
								{step.id}
							</div>

							<img
								src={step.image}
								alt=""
								className="mb-5 h-28 w-28 object-contain md:h-32 md:w-32"
							/>

							<h3 className="font-heading text-muted-foreground text-lg font-semibold">
								{step.title}
							</h3>
						</div>
					))}
				</div>
			</div>
		</section>
	)
}

const featureItems = [
	'Matched to agents based on your communication style, price range, goals, and needs',
	'Peace Pact agents who commit to transparency and putting your interests first',
	'Clear fit rationale before you commit, so you can choose with confidence',
	'Commission coaching, tips, and scripts to help you ask the right questions upfront',
	'Backup matches ready if your first pick is not available',
]

function FeaturesSection() {
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
					<p className="text-sky text-xs font-semibold tracking-wider uppercase">
						Built for buyers
					</p>
					<h2 className="font-heading text-3xl font-semibold tracking-tight md:text-4xl">
						More than agents.
						<br />
						Real partners.
					</h2>

					<ul className="flex flex-col gap-4">
						{featureItems.map((item) => (
							<li key={item} className="flex items-start gap-3">
								<div className="bg-primary/10 mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full">
									<CheckCircle2 className="text-primary h-3.5 w-3.5" />
								</div>
								<span className="text-sm leading-relaxed">{item}</span>
							</li>
						))}
					</ul>

					<Link
						to="/"
						className="text-primary inline-flex items-center gap-1 text-sm font-medium hover:underline"
					>
						Learn more for buyers
						<ArrowRight className="h-4 w-4" />
					</Link>
				</div>
			</div>
		</section>
	)
}
