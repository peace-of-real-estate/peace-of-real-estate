import { Link, createFileRoute, redirect } from '@tanstack/react-router'
import {
	ArrowRightLeft,
	Award,
	Banknote,
	Check,
	ChevronDown,
	Clock,
	Home,
	MapPin,
	MessageSquare,
	Pencil,
	Scale,
	Send,
	Shield,
	Star,
	Target,
	Users,
	Zap,
} from 'lucide-react'
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { DashboardPage, DashboardPageMobileNav } from '@/components/dashboard'
import type { MatchDetails } from '@/components/match/card'
import { authClient } from '@/lib/auth/client'
import { loadAgentMatches, loadConsumerProfile } from '@/lib/matching/profile'
import { consumerAnswerLabels } from '@/components/signup/questions'
import type { ConsumerProfile } from '@/lib/matching/profile'
import {
	formatPriceRange,
	parsePriceRange,
} from '@/components/signup/price-range'
import { cn } from '@/lib/utils/ui'

import { resolveStateCode } from '@/lib/geography/states'

function statIcon(label: string) {
	const normalized = label.toLowerCase()
	if (normalized.includes('budget') || normalized.includes('price'))
		return Banknote
	if (normalized.includes('communication')) return MessageSquare
	if (normalized.includes('involvement')) return Target
	if (normalized.includes('exclusiv')) return Shield
	if (normalized.includes('negotiation')) return Scale
	if (normalized.includes('response')) return Clock
	if (normalized.includes('experience') || normalized.includes('buyer'))
		return Star
	if (normalized.includes('property') || normalized.includes('home'))
		return Home
	if (normalized.includes('location')) return MapPin
	return Zap
}

export const Route = createFileRoute('/(app)/consumer/dashboard/matches')({
	beforeLoad: async () => {
		const consumerProfile = await loadConsumerProfile()

		if (!consumerProfile) {
			throw redirect({ to: '/consumer/signup', search: { step: 'intro' } })
		}
	},
	component: MatchesRoute,
})

function MatchesRoute() {
	return <Matches />
}

function Matches() {
	const [selectedMatchIds, setSelectedMatchIds] = useState<string[]>([])
	const { data: session } = authClient.useSession()

	const { data: matches = [], isLoading } = useQuery({
		queryKey: ['agent-matches'],
		queryFn: loadAgentMatches,
	})
	const { data: consumerProfile } = useQuery({
		queryKey: ['consumer-profile'],
		queryFn: loadConsumerProfile,
	})
	const stateCode = resolveStateCode(consumerProfile?.state ?? undefined)

	const toggleSelectedMatch = (matchId: string) => {
		setSelectedMatchIds((current) => {
			if (current.includes(matchId)) {
				return current.filter((id) => id !== matchId)
			}

			if (current.length >= 3) {
				return current
			}

			return [...current, matchId]
		})
	}

	return (
		<DashboardPage>
			<DashboardPageMobileNav label="Menu" />
			<div className="mx-auto w-full max-w-4xl">
				<div className="mb-8 flex items-center gap-4">
					<div className="from-primary to-primary/70 text-primary-foreground shadow-primary/20 ring-primary/20 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br shadow-sm ring-1">
						<ArrowRightLeft className="h-5 w-5" />
					</div>
					<div>
						<h1 className="text-3xl">Matches</h1>
					</div>
				</div>

				<div className="mb-6 space-y-3">
					<PreferencesSummaryCard
						settings={consumerProfile}
						name={session?.user?.name}
						state={stateCode}
					/>
				</div>

				<div>
					{isLoading ? (
						<Card className="py-16 text-center">
							<p className="text-muted-foreground text-sm">
								Loading matches...
							</p>
						</Card>
					) : matches.length === 0 ? (
						<Card className="py-16 text-center">
							<Users className="text-muted-foreground mx-auto mb-4 h-12 w-12" />
							<p className="text-muted-foreground text-sm">
								No matches available yet.
							</p>
						</Card>
					) : (
						<Card className="overflow-hidden p-0">
							<MatchListHeader selectedCount={selectedMatchIds.length} />
							<div className="divide-y">
								{matches.map((match) => (
									<CompactMatchRow
										key={match.id}
										match={match}
										selected={selectedMatchIds.includes(match.id)}
										selectionDisabled={
											selectedMatchIds.length >= 3 &&
											!selectedMatchIds.includes(match.id)
										}
										onToggleSelected={() => toggleSelectedMatch(match.id)}
									/>
								))}
							</div>
						</Card>
					)}
				</div>
			</div>
		</DashboardPage>
	)
}

function PreferencesSummaryCard({
	settings,
	name,
	state,
}: {
	settings: ConsumerProfile | null | undefined
	name?: string | null | undefined
	state?: string | undefined
}) {
	const items = getPreferenceSummaryItems(settings)
	const stateSvgFile = state ? `/states/${state}.svg` : null

	return (
		<Card className="p-4">
			<div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
				<div>
					<div className="mb-5 flex items-center gap-3">
						<div className="bg-primary/8 text-primary flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl">
							{stateSvgFile ? (
								<img
									src={stateSvgFile}
									alt={`${state} state icon`}
									className="h-8 w-8 object-contain opacity-85"
								/>
							) : (
								<MapPin className="h-5 w-5" />
							)}
						</div>
						<div>
							<p className="font-heading text-xl font-bold tracking-tight">
								{name ?? 'Your profile'}
							</p>
						</div>
					</div>

					<div className="grid gap-x-8 gap-y-4 sm:grid-cols-2 lg:grid-cols-3">
						{items.map((item) => {
							const Icon = statIcon(item.label)
							return (
								<div
									key={item.label}
									className="flex min-w-0 items-start gap-3"
								>
									<div className="text-primary bg-secondary/70 mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg">
										<Icon className="h-3.5 w-3.5" />
									</div>
									<div className="min-w-0">
										<p className="text-muted-foreground text-[9px] font-bold tracking-[0.15em] uppercase">
											{item.label}
										</p>
										<p className="truncate text-sm font-semibold">
											{item.value}
										</p>
									</div>
								</div>
							)
						})}
					</div>
				</div>

				<Button asChild variant="outline" size="sm" className="shrink-0">
					<Link to="/consumer/dashboard/search-preferences">
						<Pencil className="mr-1 h-3.5 w-3.5" />
						Edit Preferences
					</Link>
				</Button>
			</div>
		</Card>
	)
}

function MatchListHeader({ selectedCount }: { selectedCount: number }) {
	return (
		<div className="flex flex-col gap-3 border-b px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
			<div>
				<p className="text-sm font-medium">Choose 1-3 agents to invite</p>
				<p className="text-muted-foreground text-xs">
					{selectedCount} of 3 selected. Expand a row for more details before
					sending.
				</p>
			</div>
			<Button disabled={selectedCount === 0}>
				<Send className="mr-2 h-4 w-4" />
				{selectedCount > 0
					? `Send ${selectedCount} Invitation${selectedCount === 1 ? '' : 's'}`
					: 'Send Invitations'}
			</Button>
		</div>
	)
}

function getPreferenceSummaryItems(
	profile: ConsumerProfile | null | undefined,
) {
	if (!profile) return []

	const profileItems = [
		profile.city ? { label: 'City', value: profile.city } : null,
		profile.state ? { label: 'State', value: profile.state } : null,
		profile.priceRange
			? {
					label: 'Budget',
					value: formatPriceRange(parsePriceRange(profile.priceRange)),
				}
			: null,
		profile.propertyTypes?.length
			? {
					label: 'Home Type',
					value: profile.propertyTypes.join(', '),
				}
			: null,
	]

	const answerItems = Object.entries(consumerAnswerLabels)
		.map(([id, config]) => {
			const answer = profile[id as keyof ConsumerProfile] as
				| string
				| string[]
				| undefined
			if (answer === undefined || answer === '') return null
			const value = Array.isArray(answer)
				? answer.map((slug) => config.options[slug] ?? slug).join(', ')
				: (config.options[answer] ?? answer)
			return { label: config.label, value }
		})
		.filter((item): item is { label: string; value: string } => item !== null)

	return [...profileItems, ...answerItems]
		.filter((item): item is { label: string; value: string } => item !== null)
		.slice(0, 6)
}

function CompactMatchRow({
	match,
	selected,
	selectionDisabled,
	onToggleSelected,
}: {
	match: MatchDetails
	selected: boolean
	selectionDisabled: boolean
	onToggleSelected: () => void
}) {
	const statusLabel =
		match.status.charAt(0).toUpperCase() + match.status.slice(1)
	const topSpecialties = match.specialties.slice(0, 3)
	const hiddenSpecialties = match.specialties.length - topSpecialties.length

	return (
		<details
			className={cn(
				'group/match',
				selected && 'bg-primary/[0.03] ring-1 ring-inset ring-primary/25',
			)}
		>
			<summary className="hover:bg-muted/50 grid cursor-pointer list-none gap-3 px-4 py-3 transition sm:grid-cols-[7rem_4.25rem_minmax(0,1fr)_auto] sm:items-center [&::-webkit-details-marker]:hidden">
				<Button
					type="button"
					variant={selected ? 'default' : 'outline'}
					size="sm"
					className="w-fit"
					disabled={selectionDisabled}
					onClick={(event) => {
						event.preventDefault()
						event.stopPropagation()
						onToggleSelected()
					}}
				>
					{selected && <Check className="mr-1 h-3 w-3" />}
					{selected ? 'Selected' : 'Select'}
				</Button>

				<div className="flex items-center gap-3 sm:block">
					<div className="bg-background rounded-xl border px-3 py-2 text-center">
						<div className="text-lg leading-none font-semibold">
							{match.fitScore}%
						</div>
						<div className="text-muted-foreground mt-1 text-[10px] tracking-wide uppercase">
							Fit
						</div>
					</div>
				</div>

				<div className="min-w-0">
					<div className="flex flex-wrap items-center gap-x-3 gap-y-1">
						<h3 className="truncate font-semibold">{match.name}</h3>
						<span className="text-muted-foreground rounded-full border px-2 py-0.5 text-[11px] font-medium">
							{statusLabel}
						</span>
					</div>
					<p className="text-muted-foreground mt-0.5 truncate text-sm">
						{match.agency}
					</p>
					<div className="text-muted-foreground mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
						<span className="inline-flex items-center gap-1">
							<MapPin className="h-3 w-3" />
							{match.location}
						</span>
						{match.experience && (
							<span className="inline-flex items-center gap-1">
								<Award className="h-3 w-3" />
								{match.experience}
							</span>
						)}
					</div>
				</div>

				<div className="flex items-center justify-between gap-3 sm:justify-end">
					<div className="hidden max-w-64 flex-wrap justify-end gap-1.5 md:flex">
						{topSpecialties.map((specialty) => (
							<span
								key={specialty}
								className="bg-secondary rounded-full px-2 py-0.5 text-[11px]"
							>
								{specialty}
							</span>
						))}
						{hiddenSpecialties > 0 && (
							<span className="bg-secondary rounded-full px-2 py-0.5 text-[11px]">
								+{hiddenSpecialties}
							</span>
						)}
					</div>
					<ChevronDown className="text-muted-foreground h-4 w-4 transition group-open/match:rotate-180" />
				</div>
			</summary>

			<div className="bg-muted/20 border-t px-4 py-4">
				<div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_17rem]">
					<div className="space-y-4">
						<p className="text-muted-foreground text-sm leading-relaxed">
							{match.about}
						</p>

						<div className="flex flex-wrap gap-1.5 md:hidden">
							{match.specialties.map((specialty) => (
								<span
									key={specialty}
									className="bg-secondary rounded-full px-2 py-0.5 text-[11px]"
								>
									{specialty}
								</span>
							))}
						</div>

						<div className="grid gap-3 sm:grid-cols-2">
							{Object.entries(match.scores).map(([label, score]) => (
								<ScoreLine key={label} label={label} score={score} />
							))}
						</div>
					</div>

					<div className="bg-background space-y-3 rounded-xl border p-3 text-sm">
						{match.stats && (
							<div className="grid grid-cols-3 gap-2 text-center">
								<Stat label="Deals" value={match.stats.transactions} />
								<Stat label="Days" value={match.stats.avgDays} />
								<Stat label="Rating" value={match.stats.satisfaction} />
							</div>
						)}

						{match.contact && (
							<div className="text-muted-foreground space-y-1 border-t pt-3 text-xs">
								{match.contact.phone && <div>{match.contact.phone}</div>}
								{match.contact.email && <div>{match.contact.email}</div>}
							</div>
						)}
						<Button
							className="w-full"
							variant={selected ? 'default' : 'outline'}
							disabled={selectionDisabled}
							onClick={onToggleSelected}
						>
							{selected ? 'Remove from invitations' : 'Select for invitation'}
						</Button>
					</div>
				</div>
			</div>
		</details>
	)
}

function ScoreLine({ label, score }: { label: string; score: number }) {
	return (
		<div>
			<div className="mb-1 flex items-center justify-between text-xs">
				<span className="text-muted-foreground">{label}</span>
				<span>{score.toFixed(1)}</span>
			</div>
			<div className="bg-border h-1 overflow-hidden rounded-full">
				<div
					className="bg-primary h-full"
					style={{ width: `${(score / 5) * 100}%` }}
				/>
			</div>
		</div>
	)
}

function Stat({ label, value }: { label: string; value: number }) {
	return (
		<div>
			<div className="font-semibold">{value}</div>
			<div className="text-muted-foreground text-[10px] tracking-wide uppercase">
				{label}
			</div>
		</div>
	)
}
