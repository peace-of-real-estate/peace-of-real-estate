import { createFileRoute, ClientOnly, Navigate } from '@tanstack/react-router'

import { createBuyerProfileFromDraft } from '@/lib/profile'
import type { BuyerPreviewProfile } from '@/lib/profile'
import {
	buyerCompletedDraftSchema,
	buyerPreviewProfileSchema,
} from '@/lib/profile/types'

import { buyerDraftStorage } from '../(steps)/buyer/route'
import {
	ClientMatchesPreview,
	ClientPreviewHeader,
	ClientProfilePreviewCard,
} from './-components/client-preview'
import { SignupPreviewShell } from './-components/signup-preview-shell'

export const Route = createFileRoute('/signup/preview/buyer')({
	ssr: false,
	component: BuyerPreviewRoute,
})

function BuyerPreviewRoute() {
	const parsed = buyerPreviewProfileSchema.safeParse({
		...buyerDraftStorage.load(),
		role: 'buyer',
	})
	if (!parsed.success) {
		return <Navigate to="/signup/buyer/location" replace />
	}

	return (
		<ClientOnly fallback={null}>
			<BuyerPreview profile={parsed.data} />
		</ClientOnly>
	)
}

function BuyerPreview({ profile }: { profile: BuyerPreviewProfile }) {
	return (
		<SignupPreviewShell
			redirect="/buyer/matches"
			oauthRedirect="/auth/complete?role=buyer"
			quizPath="/signup/buyer/location"
			createProfile={createBuyerProfileFromDraft}
			loadDraft={buyerDraftStorage.load}
			validateDraft={(draft) =>
				buyerCompletedDraftSchema.safeParse(draft).success
			}
			clearDraft={buyerDraftStorage.clear}
			panelTitle={
				<>
					Create your profile to <span className="text-brand">unlock</span> your
					matches
				</>
			}
			panelDescription="Save your personalized buyer profile, view ranked agent matches, and connect with agents who fit your style."
			mobileTitle="Unlock your matches"
			mobileSubtitle="Create your profile to view full agent matches."
		>
			<div className="mx-auto w-full max-w-2xl space-y-6">
				<ClientPreviewHeader title="Your Profile" />
				<ClientProfilePreviewCard profile={profile} />
				<ClientMatchesPreview />
			</div>
		</SignupPreviewShell>
	)
}
