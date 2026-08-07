import {
	CheckCircleIcon,
	ClipboardTextIcon,
	HandshakeIcon,
	HouseIcon,
	LockIcon,
	MapPinIcon,
	RankingIcon,
	TagIcon,
	XCircleIcon,
} from '@phosphor-icons/react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { useState } from 'react'

import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog'
import { SUPPORT_EMAIL } from '@/lib/constants'

export const Route = createFileRoute('/')({
	component: LandingPage,
})

function LandingPage() {
	const [showProfileTypeDialog, setShowProfileTypeDialog] = useState(false)

	return (
		<div className="flex min-h-dvh flex-col">
			<DirectionContract />
			<LandingHeader onOpenProfileType={() => setShowProfileTypeDialog(true)} />
			<main className="flex w-full flex-1 flex-col overflow-x-hidden">
				<HeroSection onOpenProfileType={() => setShowProfileTypeDialog(true)} />
				<HowItWorksSection />
				<FeaturesSection
					onOpenProfileType={() => setShowProfileTypeDialog(true)}
				/>
				<AgentBandSection />
				<FinalCtaSection
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

// Seed dba74cdc; approved comp .impeccable/mocks/comp-c-editorial.webp
function DirectionContract() {
	return (
		<span
			hidden
			dangerouslySetInnerHTML={{
				__html: `<!--
THESIS: The category standard played straight at Compass/Opendoor craft — an editorial split hero where the match card itself, tier pills and visible rationale, is the proof. Refuses the experimental worlds and the old navy SaaS template alike.
OWN-WORLD: official brand palette (user-pinned 2026-08-07, supersedes the rolled teal/off-white): brand navy #024A70 the single action voice, sky-tint #E0F2FE pills, slate ink/muted/hairlines on white + slate-50 wash, DM Sans bold tight-tracked, 16-20px cards, one soft ink shadow, warm rowhouse photography, flat illustrated avatars.
STORY: "Matched by mutual fit, never ad spend" is believed because the why is visible inside real product UI; a buyer or seller starts the free quiz; agents take their own band.
FIRST VIEWPORT: 45:55 editorial split; headline + CTA + trust row on the left panel; full-bleed photo strip right; the match card straddling the seam; hero height fixed to viewport minus header minus a 6rem peek so How-it-works always crests the fold.
FORM: canon via decision page, seed dba74cdc, approved comp .impeccable/mocks/comp-c-editorial.webp.
FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, and DESIGN.md
-->`,
			}}
		/>
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
		<header className="border-border sticky top-0 z-40 w-full border-b bg-white/85 backdrop-blur-md">
			<div className="mx-auto flex h-18 w-full max-w-7xl items-center justify-between px-6 lg:px-10">
				<Link to="/" className="flex items-center gap-2.5">
					<img
						src="/logomark-theme.svg"
						alt=""
						className="h-8 w-auto shrink-0"
					/>
					<span className="text-lg font-bold tracking-tight whitespace-nowrap">
						Peace of Real Estate
					</span>
				</Link>

				<nav className="hidden items-center gap-8 md:flex">
					<a
						href="#how-it-works"
						className="text-muted-foreground hover:text-foreground text-sm font-medium transition-colors"
					>
						How it works
					</a>
					<a
						href="#buyers"
						className="text-muted-foreground hover:text-foreground text-sm font-medium transition-colors"
					>
						For buyers &amp; sellers
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
						className="hover:bg-muted hidden h-10 items-center justify-center rounded-[10px] px-4 text-sm font-medium whitespace-nowrap transition-colors sm:inline-flex"
					>
						Log in
					</Link>
					<button
						type="button"
						onClick={onOpenProfileType}
						className="bg-primary hover:bg-primary-deep inline-flex h-10 items-center justify-center rounded-[10px] px-4 text-sm font-semibold whitespace-nowrap text-white transition-colors"
					>
						Get matched
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
		<footer className="border-border w-full border-t">
			<div className="mx-auto max-w-7xl px-6 py-14 lg:px-10">
				<div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
					<div className="flex flex-col gap-3">
						<Link to="/" className="flex items-center gap-2.5">
							<img
								src="/logomark-theme.svg"
								alt=""
								className="h-7 w-auto shrink-0"
							/>
							<span className="text-base font-bold tracking-tight whitespace-nowrap">
								Peace of Real Estate
							</span>
						</Link>
						<p className="text-muted-foreground max-w-xs text-sm leading-relaxed">
							Matched by mutual fit, never ad spend. Now in Baltimore beta.
						</p>
					</div>

					<nav aria-label="Product" className="flex flex-col gap-2.5">
						<p className="text-[0.8125rem] font-semibold">Product</p>
						<a
							href="#how-it-works"
							className="text-muted-foreground hover:text-foreground text-sm transition-colors"
						>
							How it works
						</a>
						<a
							href="#buyers"
							className="text-muted-foreground hover:text-foreground text-sm transition-colors"
						>
							For buyers &amp; sellers
						</a>
						<Link
							to="/signup/agent"
							className="text-muted-foreground hover:text-foreground text-sm transition-colors"
						>
							For agents
						</Link>
					</nav>

					<nav aria-label="Resources" className="flex flex-col gap-2.5">
						<p className="text-[0.8125rem] font-semibold">Resources</p>
						{placeholderArticles.map((title) => (
							<span
								key={title}
								className="text-muted-foreground flex items-baseline gap-2 text-sm"
							>
								{title}
								<span className="text-xs font-medium tracking-wide uppercase">
									Soon
								</span>
							</span>
						))}
					</nav>

					<nav aria-label="Support" className="flex flex-col gap-2.5">
						<p className="text-[0.8125rem] font-semibold">Support</p>
						<a
							href={`mailto:${SUPPORT_EMAIL}`}
							className="text-muted-foreground hover:text-foreground text-sm transition-colors"
						>
							{SUPPORT_EMAIL}
						</a>
						<a
							href={`mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent('Bug report')}`}
							className="text-muted-foreground hover:text-foreground text-sm transition-colors"
						>
							Report a bug
						</a>
					</nav>
				</div>

				<div className="border-border mt-12 flex flex-col items-start justify-between gap-2 border-t pt-6 md:flex-row md:items-center">
					<p className="text-muted-foreground text-[0.8125rem]">
						&copy; 2026 Peace of Real Estate. All rights reserved.
					</p>
					<Link
						to="/signup/agent"
						className="text-muted-foreground hover:text-foreground text-[0.8125rem] font-medium transition-colors"
					>
						Agent Signup
					</Link>
				</div>
			</div>
		</footer>
	)
}

const placeholderArticles = [
	'How to interview a buyer’s agent',
	'What commission actually pays for',
	'Red flags in an agent’s first reply',
]

// =============================================================================
// Hero
// =============================================================================

const matchRows = [
	{
		avatar: '/landing/avatar-1.webp',
		detail: 'Fells Point · 8 yrs exp',
		tier: 'Best fit',
		rationale: [
			'You want neighborhood expertise in Baltimore City.',
			'You value clear communication and proactive guidance.',
		],
		why: null,
	},
	{
		avatar: '/landing/avatar-2.webp',
		detail: 'Canton · 6 yrs exp',
		tier: 'Strong fit',
		rationale: null,
		why: 'Matches your pace and communication style.',
	},
	{
		avatar: '/landing/avatar-3.webp',
		detail: 'Charles Village · 10 yrs exp',
		tier: 'Good fit',
		rationale: null,
		why: 'Deep experience; works a bit more hands-off.',
	},
]

function HeroSection({ onOpenProfileType }: { onOpenProfileType: () => void }) {
	return (
		<section className="border-border w-full border-b">
			<div className="grid lg:h-[calc(100dvh-4.5rem-11rem)] lg:min-h-[34rem] lg:grid-cols-[45fr_55fr]">
				<div className="flex flex-col justify-center px-6 py-12 md:px-12 lg:pr-0 lg:pl-[max(2.5rem,calc((100vw-80rem)/2+2.5rem))]">
					<div>
						<h1 className="max-w-[27rem] text-[2.75rem] leading-[1.02] font-bold tracking-[-0.03em] text-balance md:text-6xl lg:text-[3.5rem]">
							Meet the agent who fits the way you work.
						</h1>

						<p className="text-muted-foreground mt-6 max-w-[22rem] text-lg leading-8">
							A 2-minute quiz on both sides. Matches ranked by mutual fit, never
							ad spend — with the reasons shown.
						</p>

						<div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-3">
							<button
								type="button"
								onClick={onOpenProfileType}
								className="pre-btn-primary"
							>
								Get matched free
							</button>
							<Link
								to="/signup/agent"
								className="text-primary hover:text-primary-deep text-base font-semibold underline-offset-4 transition-colors hover:underline"
							>
								I&rsquo;m an agent
							</Link>
						</div>

						<ul className="text-muted-foreground mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-[0.8125rem] font-medium">
							<li className="flex items-center gap-1.5">
								<LockIcon className="text-primary size-3.5" />
								100% free
							</li>
							<li className="flex items-center gap-1.5">
								<XCircleIcon className="text-primary size-3.5" />
								No obligations
							</li>
							<li className="flex items-center gap-1.5">
								<MapPinIcon className="text-primary size-3.5" />
								Baltimore beta
							</li>
						</ul>
					</div>
				</div>

				<div className="relative lg:flex lg:items-center">
					<img
						src="/landing/hero-rowhouses.webp"
						alt="A Baltimore rowhouse street with marble steps in warm daylight"
						className="h-72 w-full object-cover md:h-96 lg:absolute lg:inset-0 lg:h-full lg:max-h-none"
					/>
					<MatchCard />
				</div>
			</div>
		</section>
	)
}

function MatchCard() {
	return (
		<div
			aria-label="Illustrative example of matched agents"
			className="pre-match-card relative z-10 mx-6 -mt-20 w-[calc(100%-3rem)] max-w-sm p-6 md:mx-12 md:-mt-24 lg:mx-0 lg:mt-0 lg:-ml-16 lg:w-full"
		>
			<div className="flex items-baseline justify-between gap-3">
				<p className="text-muted-foreground text-[0.8125rem] font-medium">
					Your matches
				</p>
				<p className="text-muted-foreground text-[0.8125rem]">
					Ranked by mutual fit
				</p>
			</div>

			<div className="divide-border mt-3 flex flex-col divide-y">
				{matchRows.map((row) => (
					<div key={row.tier} className="py-4 first:pt-1 last:pb-0">
						<div className="flex items-center gap-3.5">
							<img
								src={row.avatar}
								alt=""
								className="h-12 w-12 shrink-0 rounded-full object-cover"
							/>
							<div className="flex min-w-0 flex-1 flex-col gap-1.5">
								<span className="block h-3 w-24 rounded-full bg-slate-200" />
								<span className="text-muted-foreground text-[0.8125rem]">
									{row.detail}
								</span>
							</div>
							<span className="pre-chip">{row.tier}</span>
						</div>

						{row.why ? (
							<p className="text-muted-foreground mt-2 pl-[3.75rem] text-[0.8125rem] leading-snug">
								{row.why}
							</p>
						) : null}

						{row.rationale ? (
							<div className="mt-4">
								<p className="text-sm font-semibold">Why this match</p>
								<ul className="mt-2 flex flex-col gap-1.5">
									{row.rationale.map((reason) => (
										<li
											key={reason}
											className="text-muted-foreground flex items-start gap-2 text-sm leading-snug"
										>
											<CheckCircleIcon
												className="text-primary mt-0.5 size-4 shrink-0"
												weight="fill"
											/>
											{reason}
										</li>
									))}
								</ul>
							</div>
						) : null}
					</div>
				))}
			</div>
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
						<HouseIcon className="text-brand size-4" weight="duotone" />
						I'm a buyer
					</Link>

					<Link
						to="/signup/seller/location"
						className="hover:border-primary/50 hover:bg-muted/50 flex h-11 items-center justify-center gap-2 rounded-md border px-3 text-sm font-semibold transition-colors"
						onClick={() => onOpenChange(false)}
					>
						<TagIcon className="text-brand size-4" weight="duotone" />
						I'm a seller
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
		numeral: '01',
		icon: ClipboardTextIcon,
		title: 'Tell us about your move',
		description: 'A quick 2-minute quiz about how you want to buy or sell.',
	},
	{
		numeral: '02',
		icon: RankingIcon,
		title: 'See your matches',
		description:
			'Agents ranked by mutual fit, never by who paid — with the reasons shown.',
	},
	{
		numeral: '03',
		icon: HandshakeIcon,
		title: 'Connect on your terms',
		description:
			'The quiz is free. You only pay if you choose an introduction.',
	},
]

function HowItWorksSection() {
	return (
		<section
			id="how-it-works"
			className="bg-wash w-full pt-14 pb-20 md:pt-16 md:pb-28"
		>
			<div className="mx-auto max-w-7xl px-6 lg:px-10">
				<h2 className="text-4xl font-bold tracking-[-0.025em] text-balance md:text-[2.5rem]">
					How it works
				</h2>

				<div className="mt-10 grid gap-5 md:grid-cols-3">
					{howItWorksSteps.map((step) => (
						<div
							key={step.numeral}
							className="border-border flex flex-col gap-5 rounded-[18px] border bg-white p-7"
						>
							<div className="flex items-center gap-3">
								<span className="text-primary text-2xl font-bold">
									{step.numeral}
								</span>
								<step.icon
									className="text-muted-foreground size-6"
									weight="duotone"
								/>
							</div>
							<div>
								<h3 className="text-lg leading-snug font-semibold">
									{step.title}
								</h3>
								<p className="text-muted-foreground mt-1.5 text-sm leading-relaxed">
									{step.description}
								</p>
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
		rest: 'a standing commitment to transparency and your interests first',
	},
	{
		lead: 'Clear fit rationale',
		rest: 'see why each agent fits before you commit',
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
		<section id="buyers" className="w-full bg-white py-20 md:py-28">
			<div className="mx-auto grid max-w-7xl items-center gap-12 px-6 md:grid-cols-2 md:gap-16 lg:px-10">
				<div className="relative">
					<div className="overflow-hidden rounded-[18px]">
						<img
							src="/landing/features-illustration.webp"
							alt="Illustration of a sunlit kitchen table with a laptop and home-buying paperwork"
							className="aspect-[4/3] w-full object-cover"
						/>
					</div>
					<div className="pre-artifact-card relative z-10 mx-4 -mt-12 p-5 md:absolute md:bottom-6 md:left-6 md:mx-0 md:mt-0 md:max-w-xs">
						<p className="text-primary text-[0.8125rem] font-semibold">
							Commission coaching
						</p>
						<p className="mt-2 text-sm leading-snug font-medium">
							&ldquo;What&rsquo;s your commission — and what exactly does it
							include?&rdquo;
						</p>
						<p className="text-muted-foreground mt-2 text-[0.8125rem] leading-relaxed">
							Tips and scripts, so you ask the right questions upfront.
						</p>
					</div>
				</div>

				<div className="flex w-full flex-col gap-7">
					<div className="flex flex-col items-start gap-4">
						<span className="pre-chip">For buyers &amp; sellers</span>
						<h2 className="text-4xl font-bold tracking-[-0.025em] text-balance md:text-[2.5rem]">
							More than agents. Real partners.
						</h2>
					</div>

					<ul className="flex flex-col gap-4">
						{featureItems.map((item) => (
							<li key={item.lead} className="flex items-start gap-3">
								<CheckCircleIcon
									className="text-primary mt-0.5 size-5 shrink-0"
									weight="fill"
								/>
								<span className="text-[0.9375rem] leading-relaxed">
									<strong>{item.lead}</strong> — {item.rest}
								</span>
							</li>
						))}
					</ul>

					<div className="pt-1">
						<button
							type="button"
							onClick={onOpenProfileType}
							className="pre-btn-primary"
						>
							Get matched free
						</button>
					</div>
				</div>
			</div>
		</section>
	)
}

// =============================================================================
// Agent band
// =============================================================================

function AgentBandSection() {
	return (
		<section id="agents" className="bg-wash w-full py-20 md:py-28">
			<div className="mx-auto grid max-w-7xl items-center gap-12 px-6 md:grid-cols-2 md:gap-16 lg:px-10">
				<div className="flex w-full flex-col gap-7 max-md:order-2">
					<div className="flex flex-col items-start gap-4">
						<span className="pre-chip">For agents</span>
						<h2 className="text-4xl font-bold tracking-[-0.025em] text-balance md:text-[2.5rem]">
							Clients who fit how you work.
						</h2>
					</div>
					<p className="text-muted-foreground max-w-md text-lg leading-8">
						No lead buying, no cold scripts. You&rsquo;re introduced to clients
						who picked you for how you actually work — and you both see why.
					</p>
					<div className="pt-1">
						<Link to="/signup/agent" className="pre-btn-outline">
							Join as an agent
						</Link>
					</div>
				</div>

				<div className="overflow-hidden rounded-[18px] max-md:order-1">
					<img
						src="/landing/agent-illustration.webp"
						alt="Illustration of a real estate agent reviewing paperwork at a rowhouse desk"
						className="aspect-[4/3] w-full object-cover"
					/>
				</div>
			</div>
		</section>
	)
}

// =============================================================================
// Final CTA
// =============================================================================

function FinalCtaSection({
	onOpenProfileType,
}: {
	onOpenProfileType: () => void
}) {
	return (
		<section className="bg-primary w-full py-20 md:py-28">
			<div className="mx-auto flex max-w-7xl flex-col items-start gap-7 px-6 lg:px-10">
				<h2 className="max-w-2xl text-4xl font-bold tracking-[-0.025em] text-balance text-white md:text-[2.75rem]">
					Find your fit in Baltimore.
				</h2>
				<p className="max-w-xl text-lg leading-8 text-white/80">
					Two minutes, no signup. Meet the agents who fit how you want to buy or
					sell.
				</p>
				<button
					type="button"
					onClick={onOpenProfileType}
					className="text-primary inline-flex h-13 cursor-pointer items-center justify-center rounded-[10px] bg-white px-7 text-base font-semibold transition-colors hover:bg-white/90"
				>
					Get matched free
				</button>
				<p className="text-[0.8125rem] text-white/70">
					100% free&ensp;·&ensp;No obligations&ensp;·&ensp;Baltimore beta
				</p>
			</div>
		</section>
	)
}
