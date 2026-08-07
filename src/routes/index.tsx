import {
	ArrowRightIcon,
	CheckCircleIcon,
	ClockIcon,
	HouseIcon,
	ListIcon,
	MapPinIcon,
	ShieldCheckIcon,
	TagIcon,
} from '@phosphor-icons/react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog'
import {
	Sheet,
	SheetContent,
	SheetHeader,
	SheetTitle,
	SheetTrigger,
} from '@/components/ui/sheet'

export const Route = createFileRoute('/')({
	component: LandingPage,
})

function LandingPage() {
	const [showProfileTypeDialog, setShowProfileTypeDialog] = useState(false)

	return (
		<div className="pre-canon flex min-h-dvh flex-col">
			<LandingHeader onOpenProfileType={() => setShowProfileTypeDialog(true)} />
			<main className="flex w-full flex-1 flex-col overflow-x-hidden">
				<HeroSection onOpenProfileType={() => setShowProfileTypeDialog(true)} />
				<HowItWorksSection />
				<FeaturesSection
					onOpenProfileType={() => setShowProfileTypeDialog(true)}
				/>
				<ClosingSection
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
						alt=""
						className="h-8 w-auto shrink-0 md:h-9"
					/>
					<span className="font-heading hidden text-sm font-bold tracking-tight whitespace-nowrap min-[420px]:inline md:text-base">
						Peace of Real Estate
					</span>
				</Link>

				<nav className="hidden items-center gap-7 md:flex">
					<a
						href="#how-it-works"
						className="text-muted-foreground hover:text-foreground text-sm font-medium transition-colors"
					>
						How it works
					</a>
					<a
						href="#agents"
						className="text-muted-foreground hover:text-foreground text-sm font-medium transition-colors"
					>
						For agents
					</a>
				</nav>

				<div className="flex items-center gap-2">
					<Link
						to="/auth/login"
						search={{ redirect: '/' }}
						className="hover:bg-muted hover:text-foreground inline-flex h-9 items-center justify-center rounded-md px-4 text-sm font-medium whitespace-nowrap transition-colors"
					>
						Log in
					</Link>
					<Button
						className="h-9 cursor-pointer px-4 text-sm font-semibold"
						onClick={onOpenProfileType}
					>
						Get matched
					</Button>
					<Sheet>
						<SheetTrigger
							className="hover:bg-muted inline-flex h-9 w-9 items-center justify-center rounded-md transition-colors md:hidden"
							aria-label="Open menu"
						>
							<ListIcon className="h-5 w-5" />
						</SheetTrigger>
						<SheetContent side="right" className="w-72">
							<SheetHeader>
								<SheetTitle className="font-heading">Menu</SheetTitle>
							</SheetHeader>
							<nav className="flex flex-col gap-1 px-4">
								<a
									href="#how-it-works"
									className="hover:bg-muted rounded-md px-3 py-2.5 text-sm font-medium transition-colors"
								>
									How it works
								</a>
								<a
									href="#agents"
									className="hover:bg-muted rounded-md px-3 py-2.5 text-sm font-medium transition-colors"
								>
									For agents
								</a>
							</nav>
						</SheetContent>
					</Sheet>
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

const heroTrustItems = [
	{ icon: ShieldCheckIcon, label: '100% free for clients' },
	{ icon: ClockIcon, label: 'About 2 minutes' },
	{ icon: MapPinIcon, label: 'Now in Baltimore' },
]

function HeroSection({ onOpenProfileType }: { onOpenProfileType: () => void }) {
	return (
		<section className="relative w-full overflow-hidden">
			<div aria-hidden className="absolute inset-0">
				<img
					src="/landing/hero-backdrop.webp"
					alt=""
					className="absolute inset-y-0 right-0 h-full w-full object-cover md:w-[64%]"
				/>
				<div className="from-background via-background/85 absolute inset-0 bg-gradient-to-r to-transparent" />
				<div className="from-background absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t to-transparent" />
			</div>
			<div className="relative mx-auto grid max-w-7xl items-center gap-10 px-6 py-12 md:grid-cols-[1.05fr_1fr] md:gap-14 md:py-16 lg:px-10">
				<div className="flex max-w-xl flex-col items-start gap-6 md:gap-7">
					<h1 className="font-heading text-5xl leading-[1.0] font-bold tracking-tight text-balance md:text-7xl">
						Perfect agent.
						<br />
						Perfect fit.
					</h1>

					<p className="text-muted-foreground max-w-md text-lg leading-8 md:text-xl md:leading-9">
						A free, 2-minute quiz matches you with Baltimore real estate agents
						by how you actually work — ranked by fit, never by who paid.
					</p>

					<div className="flex flex-wrap items-center gap-4">
						<Button
							size="lg"
							className="h-12 cursor-pointer px-7 text-base font-semibold"
							onClick={onOpenProfileType}
						>
							Find my agent
							<ArrowRightIcon className="ml-2 h-4 w-4" />
						</Button>
						<Button variant="link" className="text-base font-medium" asChild>
							<Link to="/signup/agent">I&rsquo;m an agent</Link>
						</Button>
					</div>

					<ul className="flex flex-wrap items-center gap-x-6 gap-y-2 pt-1">
						{heroTrustItems.map((item) => (
							<li
								key={item.label}
								className="text-muted-foreground flex items-center gap-1.5 text-sm"
							>
								<item.icon className="text-primary h-4 w-4" weight="fill" />
								{item.label}
							</li>
						))}
					</ul>
				</div>

				<MatchPreviewCard />
			</div>
		</section>
	)
}

// =============================================================================
// Hero match preview — illustrative demo data, names masked by design
// =============================================================================

const previewMatches = [
	{
		avatar: '/landing/avatar-1.webp',
		score: 94,
		rationale: [
			'Text-first updates, replies within the hour',
			'Evening and weekend availability',
			'Walks first-time buyers through every disclosure',
		],
	},
	{
		avatar: '/landing/avatar-2.webp',
		score: 91,
		rationale: [
			'Video recaps after every showing',
			'Rowhouse and condo specialist',
			'Plain-spoken about trade-offs',
		],
	},
	{
		avatar: '/landing/avatar-3.webp',
		score: 88,
		rationale: [
			'Weekly check-in calls on your schedule',
			'Patient with first-time buyers',
			'Transparent commission breakdown',
		],
	},
]

function MatchPreviewCard() {
	return (
		<div className="match-card-enter bg-card mx-auto w-full max-w-md rounded-2xl p-5 shadow-xl md:p-6">
			<div className="mb-4 flex items-center justify-between">
				<h2 className="font-heading text-lg font-semibold tracking-tight">
					Your matches
				</h2>
				<span className="text-muted-foreground flex items-center gap-1 text-xs">
					<MapPinIcon className="h-3.5 w-3.5" />
					Baltimore, MD
				</span>
			</div>

			<ul className="flex flex-col">
				{previewMatches.map((match, index) => (
					<li
						key={match.avatar}
						className={index > 0 ? 'mt-4 border-t pt-4' : ''}
					>
						<div className="flex items-center gap-3">
							<img
								src={match.avatar}
								alt=""
								className="h-11 w-11 shrink-0 rounded-full object-cover"
							/>
							<div className="flex min-w-0 flex-1 flex-col gap-1.5">
								<div className="bg-muted h-2.5 w-28 rounded-full" />
								<div className="bg-muted h-2 w-20 rounded-full" />
							</div>
							<span className="bg-accent text-accent-foreground shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold">
								{match.score}% fit
							</span>
						</div>

						{index === 0 && (
							<div className="mt-3">
								<p className="text-foreground text-sm font-medium">
									Why this match
								</p>
								<ul className="mt-1.5 flex flex-col gap-1">
									{match.rationale.map((reason) => (
										<li
											key={reason}
											className="text-muted-foreground flex items-start gap-2 text-sm leading-snug"
										>
											<CheckCircleIcon
												className="text-primary mt-0.5 h-3.5 w-3.5 shrink-0"
												weight="fill"
											/>
											{reason}
										</li>
									))}
								</ul>
							</div>
						)}
					</li>
				))}
			</ul>
		</div>
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
			<DialogContent className="sm:max-w-sm">
				<DialogHeader>
					<DialogTitle>What are you planning to do?</DialogTitle>
					<DialogDescription>
						Pick a path — you can always set up the other later.
					</DialogDescription>
				</DialogHeader>

				<div className="grid grid-cols-2 gap-3">
					<Link
						to="/signup/buyer/location"
						className="hover:border-primary/50 hover:bg-muted/50 flex h-11 items-center justify-center gap-2 rounded-md border px-3 text-sm font-semibold transition-colors"
						onClick={() => onOpenChange(false)}
					>
						<HouseIcon className="text-primary size-4" weight="duotone" />
						I&rsquo;m a buyer
					</Link>

					<Link
						to="/signup/seller/location"
						className="hover:border-primary/50 hover:bg-muted/50 flex h-11 items-center justify-center gap-2 rounded-md border px-3 text-sm font-semibold transition-colors"
						onClick={() => onOpenChange(false)}
					>
						<TagIcon className="text-primary size-4" weight="duotone" />
						I&rsquo;m a seller
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
		description:
			'A few quick questions about how you want to buy or sell. About 2 minutes, no signup.',
		image: '/landing/step-1.webp',
		imageAlt:
			'Illustration of a woman completing a short quiz on her phone beside a checklist panel',
	},
	{
		id: 2,
		title: 'Meet your matched agents',
		description:
			'Ranked by fit, never by who paid — with the reasons behind every match.',
		image: '/landing/step-2.webp',
		imageAlt:
			'Illustration of a woman comparing three agent profile cards with fit badges',
	},
	{
		id: 3,
		title: 'Connect with your best fit',
		description:
			'On your terms, when you’re ready. Backup matches if plans change.',
		image: '/landing/step-3.webp',
		imageAlt:
			'Illustration of an agent handing a house key to a woman at a blue rowhouse door',
	},
]

function HowItWorksSection() {
	return (
		<section
			id="how-it-works"
			className="bg-card w-full border-y py-16 md:py-24"
		>
			<div className="mx-auto max-w-6xl px-6 lg:px-10">
				<div className="mb-12 max-w-2xl md:mb-16">
					<h2 className="font-heading text-4xl font-semibold tracking-tight text-balance md:text-5xl">
						How it works
					</h2>
					<p className="text-muted-foreground mt-4 text-lg leading-8">
						Both sides answer the same questions. The match is what’s left when
						your working styles line up.
					</p>
				</div>

				<ol className="grid gap-10 md:grid-cols-3 md:gap-8">
					{howItWorksSteps.map((step) => (
						<li key={step.id}>
							<div className="mb-6 overflow-hidden rounded-2xl">
								<img
									src={step.image}
									alt={step.imageAlt}
									className="aspect-[3/2] w-full object-cover"
									loading="lazy"
								/>
							</div>
							<div className="border-primary border-t-2 pt-5">
								<span className="text-primary font-heading text-sm font-bold tracking-wide">
									Step {step.id}
								</span>
								<h3 className="font-heading mt-2 text-xl leading-snug font-semibold tracking-tight">
									{step.title}
								</h3>
								<p className="text-muted-foreground mt-2 leading-7">
									{step.description}
								</p>
							</div>
						</li>
					))}
				</ol>
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
		rest: 'when the fit is right, you and your agent both win',
	},
]

function FeaturesSection({
	onOpenProfileType,
}: {
	onOpenProfileType: () => void
}) {
	return (
		<section id="buyers" className="w-full py-16 md:py-24">
			<div className="mx-auto grid max-w-6xl items-center gap-12 px-6 md:grid-cols-2 md:gap-16 lg:px-10">
				<div className="relative flex w-full justify-center md:justify-start">
					<img
						src="/match.png"
						alt="Illustration of a hand holding a phone showing a matched agent profile"
						className="w-full max-w-lg object-contain"
						loading="lazy"
					/>
				</div>

				<div className="flex w-full flex-col gap-6">
					<h2 className="font-heading text-4xl font-semibold tracking-tight text-balance md:text-5xl">
						More than agents.
						<br />
						Real partners.
					</h2>

					<ul className="flex flex-col gap-4">
						{featureItems.map((item) => (
							<li key={item.lead} className="flex items-start gap-3">
								<CheckCircleIcon
									className="text-primary mt-0.5 h-5 w-5 shrink-0"
									weight="fill"
								/>
								<span className="leading-7">
									<strong className="font-semibold">{item.lead}</strong> —{' '}
									{item.rest}
								</span>
							</li>
						))}
					</ul>

					<div className="pt-2">
						<Button
							size="lg"
							className="h-12 cursor-pointer px-7 text-base font-semibold"
							onClick={onOpenProfileType}
						>
							Find my agent
							<ArrowRightIcon className="ml-2 h-4 w-4" />
						</Button>
					</div>
				</div>
			</div>
		</section>
	)
}

// =============================================================================
// Closing: one band, both paths
// =============================================================================

function ClosingSection({
	onOpenProfileType,
}: {
	onOpenProfileType: () => void
}) {
	return (
		<section id="agents" className="bg-primary text-primary-foreground w-full">
			<div className="mx-auto max-w-6xl px-6 py-20 md:py-28 lg:px-10">
				<h2 className="font-heading max-w-2xl text-4xl font-bold tracking-tight text-balance md:text-6xl">
					The right agent changes everything.
				</h2>

				<div className="mt-14 grid gap-12 md:mt-20 md:grid-cols-2 md:gap-0">
					<div className="flex flex-col items-start gap-5 md:pr-14">
						<h3 className="font-heading text-2xl font-semibold tracking-tight md:text-3xl">
							Buying or selling?
						</h3>
						<p className="text-primary-foreground/85 max-w-md text-lg leading-8">
							Take the free fit quiz and meet Baltimore agents ranked by how you
							actually work — with the reasons behind every match.
						</p>
						<Button
							size="lg"
							className="bg-card text-primary hover:bg-card/90 h-12 cursor-pointer px-7 text-base font-semibold"
							onClick={onOpenProfileType}
						>
							Find my agent
							<ArrowRightIcon className="ml-2 h-4 w-4" />
						</Button>
						<p className="text-primary-foreground/70 text-sm">
							Free&ensp;·&ensp;No signup&ensp;·&ensp;About 2 minutes
						</p>
					</div>

					<div className="flex flex-col items-start gap-5 border-t border-white/15 pt-12 md:border-t-0 md:border-l md:pt-0 md:pl-14">
						<h3 className="font-heading text-2xl font-semibold tracking-tight md:text-3xl">
							Agents: meet clients who fit how you work.
						</h3>
						<p className="text-primary-foreground/85 max-w-md text-lg leading-8">
							Complete your working-style profile and receive introductions to
							Baltimore clients who match it. No lead buying, no cold lists —
							and you never pay for placement.
						</p>
						<Button
							size="lg"
							variant="outline"
							className="h-12 border-white/40 bg-transparent px-7 text-base font-semibold text-white hover:bg-white/10 hover:text-white"
							asChild
						>
							<Link to="/signup/agent">
								Join the Baltimore beta
								<ArrowRightIcon className="ml-2 h-4 w-4" />
							</Link>
						</Button>
					</div>
				</div>
			</div>
		</section>
	)
}
