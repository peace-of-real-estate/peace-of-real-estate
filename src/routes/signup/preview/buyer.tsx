import { createFileRoute, ClientOnly } from '@tanstack/react-router'

import {
	ClientMatchesPreview,
	ClientPreviewHeader,
	ClientProfilePreviewCard,
	draftToClientPreviewProfile,
} from './-components/client-preview'
import { SignupPreviewShell } from './-components/signup-preview-shell'
import { buyerDraftStorage } from '../(quiz)/buyer/route'
import { createBuyerProfileFromDraft } from '@/lib/matching/profile'
import { buyerProfileDraftSchema } from '@/lib/matching/profile.types'
import type { ClientProfile } from '@/lib/matching/profile'

export const Route = createFileRoute('/signup/preview/buyer')({
	component: BuyerPreviewRoute,
})

function BuyerPreviewRoute() {
	const profile = draftToClientPreviewProfile('buyer', buyerDraftStorage.load())

	return (
		<ClientOnly fallback={null}>
			<BuyerPreview profile={profile} />
		</ClientOnly>
	)
}

export function BuyerPreview({ profile }: { profile: ClientProfile }) {
	return (
		<SignupPreviewShell
			redirect="/buyer/matches"
			oauthRedirect="/auth/complete?role=buyer"
			quizPath="/signup/buyer/location"
			createProfile={createBuyerProfileFromDraft}
			loadDraft={buyerDraftStorage.load}
			validateDraft={(draft) =>
				buyerProfileDraftSchema
					.omit({ role: true, status: true })
					.safeParse(draft).success
			}
			clearDraft={buyerDraftStorage.clear}
			panelTitle={
				<>
					Create your profile to <span className="text-accent">unlock</span>{' '}
					your matches
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
