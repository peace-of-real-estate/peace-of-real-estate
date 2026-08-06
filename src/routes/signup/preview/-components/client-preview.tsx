import { MapPinIcon, UserIcon } from '@phosphor-icons/react'
import { useQuery } from '@tanstack/react-query'
import { ClientOnly, Navigate } from '@tanstack/react-router'
import type { z } from 'zod'

import {
	getProfileSummary,
	ProfileSummaryGrid,
} from '@/components/profile-summary'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { loadCityById } from '@/lib/geography/zip'
import type { ClientPreviewProfile, ClientRole } from '@/lib/profile'
import {
	AgentPreviewCard,
	type MatchDetails,
} from '@/routes/(dashboard)/-components/agent-preview-card'

import { SignupPreviewShell } from './signup-preview-shell'

const clientPreviewMatches: MatchDetails[] = [
	{
		id: 'preview-1',
		name: 'Alex Morgan',
		role: 'agent',
		location: 'Austin, TX',
		zipCodes: ['78704', '78745'],
		fitScore: 97,
		status: 'new',
		date: 'Today',
		experience: '12 years',
		agency: 'PRE Partner Realty',
		specialties: ['First-time buyers', 'Fast timelines', 'Negotiation'],
		about: 'Calm, responsive agent focused on clear expectations.',
		scores: {
			'Working Style': 4.9,
			Communication: 4.8,
			Transparency: 4.9,
			Fit: 5,
		},
	},
	{
		id: 'preview-2',
		name: 'Jordan Lee',
		role: 'agent',
		location: 'Austin, TX',
		zipCodes: ['78701', '78703'],
		fitScore: 94,
		status: 'new',
		date: 'Today',
		experience: '9 years',
		agency: 'Urban Nest Realty',
		specialties: ['Condos', 'Relocation', 'Offer strategy'],
		about: 'Data-driven agent with a direct communication style.',
		scores: {
			'Working Style': 4.7,
			Communication: 4.9,
			Transparency: 4.7,
			Fit: 4.8,
		},
	},
	{
		id: 'preview-3',
		name: 'Sam Rivera',
		role: 'agent',
		location: 'Austin, TX',
		zipCodes: ['78731', '78757'],
		fitScore: 91,
		status: 'new',
		date: 'Today',
		experience: '15 years',
		agency: 'Local Key Realty',
		specialties: ['Move-up buyers', 'Listings', 'Pricing'],
		about: 'Experienced local advisor with strong pricing instincts.',
		scores: {
			'Working Style': 4.6,
			Communication: 4.6,
			Transparency: 4.8,
			Fit: 4.7,
		},
	},
]

export function ClientSignupPreview<P extends ClientPreviewProfile, D>({
	clientRole,
	previewSchema,
	completedDraftSchema,
	draftStorage,
	createProfile,
}: {
	clientRole: ClientRole
	previewSchema: z.ZodType<P>
	completedDraftSchema: z.ZodType
	draftStorage: { load: () => D | null; clear: () => void }
	createProfile: (payload: { data: D }) => Promise<unknown>
}) {
	return (
		<ClientOnly fallback={null}>
			<ClientSignupPreviewContent
				clientRole={clientRole}
				previewSchema={previewSchema}
				completedDraftSchema={completedDraftSchema}
				draftStorage={draftStorage}
				createProfile={createProfile}
			/>
		</ClientOnly>
	)
}

function ClientSignupPreviewContent<P extends ClientPreviewProfile, D>({
	clientRole,
	previewSchema,
	completedDraftSchema,
	draftStorage,
	createProfile,
}: {
	clientRole: ClientRole
	previewSchema: z.ZodType<P>
	completedDraftSchema: z.ZodType
	draftStorage: { load: () => D | null; clear: () => void }
	createProfile: (payload: { data: D }) => Promise<unknown>
}) {
	const parsed = previewSchema.safeParse({
		...draftStorage.load(),
		role: clientRole,
	})
	const quizPath =
		clientRole === 'buyer'
			? '/signup/buyer/location'
			: '/signup/seller/location'
	if (!parsed.success) {
		return <Navigate to={quizPath} replace />
	}

	return (
		<SignupPreviewShell
			redirect={`/${clientRole}/matches`}
			oauthRedirect={`/auth/complete?role=${clientRole}`}
			quizPath={quizPath}
			createProfile={createProfile}
			loadDraft={draftStorage.load}
			validateDraft={(draft) => completedDraftSchema.safeParse(draft).success}
			clearDraft={draftStorage.clear}
			panelTitle={
				<>
					Create your profile to <span className="text-brand">unlock</span> your
					matches
				</>
			}
			panelDescription={`Save your personalized ${clientRole} profile, view ranked agent matches, and connect with agents who fit your style.`}
			mobileTitle="Unlock your matches"
			mobileSubtitle="Create your profile to view full agent matches."
		>
			<div className="mx-auto w-full max-w-2xl space-y-6">
				<ClientPreviewHeader title="Your Profile" />
				<ClientProfilePreviewCard profile={parsed.data} />
				<ClientMatchesPreview />
			</div>
		</SignupPreviewShell>
	)
}

export function ClientPreviewHeader({ title }: { title: string }) {
	return (
		<div>
			<span className="border-amber/40 bg-amber/15 text-amber-foreground mb-2 inline-flex rounded-md border px-2.5 py-0.5 text-xs font-semibold tracking-[0.08em] uppercase">
				Preview
			</span>
			<h2 className="font-heading text-foreground text-3xl tracking-tight md:text-4xl">
				{title}
			</h2>
			<p className="text-muted-foreground mt-2 max-w-md text-base leading-relaxed">
				Based on your quiz answers.
			</p>
		</div>
	)
}

export function ClientProfilePreviewCard({
	profile,
}: {
	profile: ClientPreviewProfile
}) {
	const { data: city, isPending } = useQuery({
		queryKey: ['city', profile.cityId],
		queryFn: () => loadCityById({ data: profile.cityId }),
		staleTime: 1000 * 60 * 60,
	})

	const stateSvgPath = city?.state ? `/states/${city.state}.svg` : undefined
	const summaryItems = getProfileSummary({ role: profile.role, profile })
	const profileTitle =
		city?.name ?? city?.state ?? (profile.role === 'buyer' ? 'Buyer' : 'Seller')

	return (
		<Card className="border-border bg-card gap-0 rounded-lg p-0 shadow-sm">
			<div className="flex items-center gap-4 px-5 pt-5 pb-4">
				<div className="bg-primary/8 text-primary flex h-12 w-12 shrink-0 items-center justify-center rounded-lg">
					{isPending ? (
						<Skeleton className="h-8 w-8 rounded" />
					) : stateSvgPath ? (
						<img
							src={stateSvgPath}
							alt={`${city?.state} state icon`}
							className="h-8 w-8 object-contain opacity-85"
						/>
					) : city?.name ? (
						<MapPinIcon className="h-5 w-5" />
					) : (
						<UserIcon className="h-5 w-5" />
					)}
				</div>
				<div className="min-w-0 flex-1">
					{isPending ? (
						<Skeleton className="h-6 w-32" />
					) : (
						<h3 className="font-heading text-foreground text-xl font-bold tracking-tight">
							{profileTitle}
						</h3>
					)}
				</div>
			</div>
			{summaryItems.length > 0 ? (
				<div className="border-border border-t px-5 pt-4 pb-5">
					<ProfileSummaryGrid items={summaryItems} variant="preview" />
				</div>
			) : null}
		</Card>
	)
}

export function ClientMatchesPreview() {
	return (
		<div className="pt-2">
			<div className="mb-3 px-1">
				<h3 className="font-heading text-foreground text-lg font-bold tracking-tight">
					Your Top Matches
				</h3>
				<p className="text-muted-foreground mt-0.5 text-sm">
					Create an account to unlock full profiles and connect.
				</p>
			</div>
			<div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
				{clientPreviewMatches.map((match) => (
					<AgentPreviewCard key={match.id} match={match} />
				))}
			</div>
		</div>
	)
}
