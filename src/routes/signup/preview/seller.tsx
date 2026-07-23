import { createFileRoute, ClientOnly, Navigate } from '@tanstack/react-router'

import { createSellerProfileFromDraft } from '@/lib/profile'
import type { SellerPreviewProfile } from '@/lib/profile'
import {
	sellerCompletedDraftSchema,
	sellerPreviewProfileSchema,
} from '@/lib/profile/types'

import { sellerDraftStorage } from '../(steps)/seller/route'
import {
	ClientMatchesPreview,
	ClientPreviewHeader,
	ClientProfilePreviewCard,
} from './-components/client-preview'
import { SignupPreviewShell } from './-components/signup-preview-shell'

export const Route = createFileRoute('/signup/preview/seller')({
	ssr: false,
	component: SellerPreviewRoute,
})

function SellerPreviewRoute() {
	const parsed = sellerPreviewProfileSchema.safeParse({
		...sellerDraftStorage.load(),
		role: 'seller',
	})
	if (!parsed.success) {
		return <Navigate to="/signup/seller/location" replace />
	}

	return (
		<ClientOnly fallback={null}>
			<SellerPreview profile={parsed.data} />
		</ClientOnly>
	)
}

function SellerPreview({ profile }: { profile: SellerPreviewProfile }) {
	return (
		<SignupPreviewShell
			redirect="/seller/matches"
			oauthRedirect="/auth/complete?role=seller"
			quizPath="/signup/seller/location"
			createProfile={createSellerProfileFromDraft}
			loadDraft={sellerDraftStorage.load}
			validateDraft={(draft) =>
				sellerCompletedDraftSchema.safeParse(draft).success
			}
			clearDraft={sellerDraftStorage.clear}
			panelTitle={
				<>
					Create your profile to <span className="text-brand">unlock</span> your
					matches
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
