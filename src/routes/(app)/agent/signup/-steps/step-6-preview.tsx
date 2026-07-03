import { Link } from '@tanstack/react-router'
import {
	Banknote,
	Briefcase,
	Clock,
	Home,
	MapPin,
	Shield,
	Star,
	User,
	Zap,
} from 'lucide-react'
import { motion } from 'framer-motion'
import { z } from 'zod'

import { AgentPreviewCard } from '@/components/match/card'
import { MobileSignupBanner } from '@/components/signup/mobile-signup-banner'
import { SignupForm } from '@/components/signup/signup-form'
import { Card } from '@/components/ui/card'
import { consumerMatches } from '@/routes/(app)/consumer/signup/-steps/mock-matches'
import {
	agentProfileCreateSchema,
	completeAgentSignup,
} from '@/lib/matching/profile'
import type { AgentDraft } from '@/lib/matching/profile'
import { createLocalStorage } from '@/lib/utils/localstorage'
import { bestClientTypeLabels } from '@/components/signup/questions'
import {
	formatPriceRange,
	parsePriceRange,
} from '@/components/signup/price-range'
import { useIsBelowDesktop } from '@/hooks/use-is-below-desktop'

const agentDraftStorage = createLocalStorage<AgentDraft>('pre-agent-draft')

const agentPreviewProfileSchema = agentProfileCreateSchema.partial().extend({
	zipCodes: z.array(z.string()).default([]),
	bestClientTypes: z.array(z.string()).default([]),
})

export type AgentPreviewProfile = z.infer<typeof agentPreviewProfileSchema>

export function draftToPreviewProfile(draft: AgentDraft): AgentPreviewProfile {
	return agentPreviewProfileSchema.parse(draft)
}

export function AgentPreview({ profile }: { profile: AgentPreviewProfile }) {
	const showMobileSignup = useIsBelowDesktop()

	return (
		<div className="min-h-dvh w-full bg-slate-50">
			<motion.div
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
				transition={{ duration: 0.45, ease: 'easeOut' }}
				className="mx-auto grid min-h-dvh w-full max-w-[1440px] lg:grid-cols-[minmax(420px,1fr)_1.4fr]"
			>
				{/* Signup / activate panel */}
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
								Create your profile to{' '}
								<span className="text-accent">start matching</span> with
								consumers
							</h1>
							<p className="mt-1 text-xs leading-relaxed text-white/70 lg:mt-3 lg:text-base">
								Save your agent profile, appear in consumer matches, and build
								your reputation over time.
							</p>
						</div>

						<SignupForm
							idPrefix="desktop-signup"
							redirect="/agent/dashboard/introductions"
							oauthRedirect="/agent/signup/complete"
							createProfile={completeAgentSignup}
							loadDraft={agentDraftStorage.load}
							clearDraft={agentDraftStorage.clear}
							submitLabel="Activate profile"
							showTerms={false}
						/>
					</div>
				</div>

				{/* Preview panel */}
				<div className="order-1 flex flex-col px-5 pt-8 pb-[calc(12rem+env(safe-area-inset-bottom))] sm:px-8 lg:order-2 lg:justify-center lg:px-12 lg:py-16 xl:px-20">
					<div className="mx-auto w-full max-w-2xl space-y-6">
						<div>
							<span className="mb-2 inline-flex rounded-full border border-amber-300 bg-amber-100 px-3 py-1 text-xs font-bold tracking-[0.16em] text-amber-900 uppercase">
								Preview
							</span>
							<h2 className="font-heading text-3xl tracking-tight text-slate-950 md:text-4xl">
								Your Agent Profile
							</h2>
							<p className="text-muted-foreground mt-2 max-w-md text-base leading-relaxed">
								Based on your essentials. Consumers will see this when you
								match.
							</p>
						</div>

						<AgentProfileCard profile={profile} />
						<AgentMatchesPreview />
					</div>
				</div>
			</motion.div>
			{showMobileSignup ? (
				<MobileSignupBanner
					title="Activate your profile"
					subtitle="Create your account to start matching with consumers."
					ctaLabel="Create account"
					redirect="/agent/dashboard/introductions"
					oauthRedirect="/agent/signup/complete"
					createProfile={completeAgentSignup}
					loadDraft={agentDraftStorage.load}
					clearDraft={agentDraftStorage.clear}
					submitLabel="Activate profile"
					showTerms={false}
				/>
			) : null}
		</div>
	)
}

function statIcon(label: string) {
	const normalized = label.toLowerCase()
	if (normalized.includes('price') || normalized.includes('budget'))
		return Banknote
	if (normalized.includes('side') || normalized.includes('clients'))
		return Briefcase
	if (normalized.includes('area') || normalized.includes('location'))
		return MapPin
	if (normalized.includes('license') || normalized.includes('insured'))
		return Shield
	if (normalized.includes('experience') || normalized.includes('years'))
		return Star
	if (normalized.includes('transaction') || normalized.includes('volume'))
		return Home
	if (normalized.includes('contact') || normalized.includes('response'))
		return Clock
	if (normalized.includes('brokerage') || normalized.includes('work'))
		return Briefcase
	return Zap
}

function getProfileStats(profile: AgentPreviewProfile) {
	const stats: { label: string; value: string }[] = []

	if (profile.typicalPriceRange) {
		stats.push({
			label: 'Typical price range',
			value: formatPriceRange(parsePriceRange(profile.typicalPriceRange)),
		})
	}

	if (profile.representationSide) {
		const labels: Record<string, string> = {
			buying: 'Buyer representation',
			selling: 'Seller representation',
			both: 'Buyers & sellers',
		}
		stats.push({
			label: 'Representation',
			value: labels[profile.representationSide] ?? profile.representationSide,
		})
	}

	if (profile.zipCodes.length > 0) {
		stats.push({
			label: 'Service areas',
			value: profile.zipCodes.slice(0, 3).join(', '),
		})
	}

	if (profile.bestClientTypes.length > 0) {
		stats.push({
			label: 'Best clients',
			value: profile.bestClientTypes
				.map((slug) => bestClientTypeLabels[slug] ?? slug)
				.join(', '),
		})
	}

	if (profile.yearsLicensed) {
		const labels: Record<string, string> = {
			'0-2': '0-2 years',
			'3-5': '3-5 years',
			'6-10': '6-10 years',
			'10+': '10+ years',
		}
		stats.push({
			label: 'Experience',
			value: labels[profile.yearsLicensed] ?? profile.yearsLicensed,
		})
	}

	if (profile.averageTransactions) {
		const labels: Record<string, string> = {
			'0-5': '0-5 per year',
			'6-15': '6-15 per year',
			'16-30': '16-30 per year',
			'30+': '30+ per year',
		}
		stats.push({
			label: 'Transaction volume',
			value: labels[profile.averageTransactions] ?? profile.averageTransactions,
		})
	}

	if (profile.eoInsuranceStatus) {
		stats.push({
			label: 'E&O insurance',
			value: profile.eoInsuranceStatus,
		})
	}

	return stats
}

function AgentProfileCard({ profile }: { profile: AgentPreviewProfile }) {
	const summaryItems = getProfileStats(profile)
	const fullName = [profile.firstName, profile.lastName]
		.filter(Boolean)
		.join(' ')
	const title = fullName || 'Your Agent Profile'
	const subtitle = profile.brokerageName
		? `${profile.brokerageName}${profile.zipCodes[0] ? ` · ${profile.zipCodes[0]}` : ''}`
		: profile.zipCodes[0]

	return (
		<Card className="gap-0 rounded-2xl border-slate-200 bg-white p-0 shadow-sm">
			<div className="flex items-center gap-4 px-5 pt-5 pb-4">
				<div className="bg-primary/8 text-primary flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl">
					<User className="h-5 w-5" />
				</div>
				<div className="min-w-0 flex-1">
					<h3 className="font-heading text-xl font-bold tracking-tight text-slate-950">
						{title}
					</h3>
					{subtitle ? (
						<p className="text-muted-foreground text-sm">{subtitle}</p>
					) : null}
				</div>
			</div>

			{summaryItems.length > 0 ? (
				<div className="grid grid-cols-1 gap-3 border-t border-slate-100 px-5 pt-4 pb-5 sm:grid-cols-2">
					{summaryItems.map((item) => {
						const Icon = statIcon(item.label)
						return (
							<div key={item.label} className="flex items-start gap-3">
								<div className="text-primary mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-slate-50">
									<Icon className="h-4 w-4" />
								</div>
								<div className="min-w-0 flex-1">
									<p className="text-muted-foreground text-[10px] font-bold tracking-[0.15em] uppercase">
										{item.label}
									</p>
									<p className="text-sm font-semibold text-slate-950">
										{item.value}
									</p>
								</div>
							</div>
						)
					})}
				</div>
			) : null}
		</Card>
	)
}

function AgentMatchesPreview() {
	const previewMatches = consumerMatches.slice(0, 3)

	return (
		<div className="pt-2">
			<div className="mb-3 px-1">
				<h3 className="font-heading text-lg font-bold tracking-tight text-slate-950">
					Your consumer matches will look like this
				</h3>
				<p className="text-muted-foreground mt-0.5 text-sm">
					Create your account to start appearing in consumer matches.
				</p>
			</div>
			<div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
				{previewMatches.map((match) => (
					<AgentPreviewCard key={match.id} match={match} />
				))}
			</div>
		</div>
	)
}
