import { createFileRoute, ClientOnly } from '@tanstack/react-router'

import {
	ClientMatchesPreview,
	ClientPreviewHeader,
	ClientProfilePreviewCard,
	draftToClientPreviewProfile,
} from './-components/client-preview'
import { SignupPreviewShell } from './-components/signup-preview-shell'
import { sellerDraftStorage } from '../(quiz)/seller/route'
import { createSellerProfileFromDraft } from '@/lib/matching/profile'
import { sellerProfileCreateSchema } from '@/lib/matching/profile.types'
import type { ClientProfile } from '@/lib/matching/profile'

export const Route = createFileRoute('/signup/preview/seller')({
	component: SellerPreviewRoute,
})

function SellerPreviewRoute() {
	const profile = draftToClientPreviewProfile(
		'seller',
		sellerDraftStorage.load(),
	)

	return (
		<ClientOnly fallback={null}>
			<SellerPreview profile={profile} />
		</ClientOnly>
	)
}

export function SellerPreview({ profile }: { profile: ClientProfile }) {
	return (
		<SignupPreviewShell
			redirect="/seller/matches"
			oauthRedirect="/auth/complete?role=seller"
			quizPath="/signup/seller/location"
			createProfile={createSellerProfileFromDraft}
			loadDraft={sellerDraftStorage.load}
			validateDraft={(draft) =>
				sellerProfileCreateSchema
					.omit({ role: true, status: true })
					.safeParse(draft).success
			}
			clearDraft={sellerDraftStorage.clear}
			panelTitle={
				<>
					Create your profile to <span className="text-accent">unlock</span>{' '}
					your matches
				</>
			}
			panelDescription="Save your personalized seller profile, view ranked agent matches, and connect with agents who fit your style."
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
