import { createFileRoute } from '@tanstack/react-router'

import {
	ClientMatchesPreview,
	ClientProfilePreviewCard,
	draftToClientPreviewProfile,
} from './-components/client-preview'
import { SignupPreviewShell } from './-components/signup-preview-shell'
import { sellerDraftStorage } from '../(quiz)/seller/route'
import { createSellerProfileFromDraft } from '@/lib/matching/profile'

export const Route = createFileRoute('/signup/preview/seller')({
	component: SellerPreviewRoute,
})

function SellerPreviewRoute() {
	const profile = draftToClientPreviewProfile(
		'seller',
		sellerDraftStorage.load(),
	)

	return (
		<SignupPreviewShell
			redirect="/seller/matches"
			oauthRedirect="/auth/complete?role=seller"
			createProfile={createSellerProfileFromDraft}
			loadDraft={sellerDraftStorage.load}
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
				<PreviewHeader />
				<ClientProfilePreviewCard profile={profile} />
				<ClientMatchesPreview />
			</div>
		</SignupPreviewShell>
	)
}

function PreviewHeader() {
	return (
		<div>
			<span className="mb-2 inline-flex rounded-full border border-amber-300 bg-amber-100 px-3 py-1 text-xs font-bold tracking-[0.16em] text-amber-900 uppercase">
				Preview
			</span>
			<h2 className="font-heading text-3xl tracking-tight text-slate-950 md:text-4xl">
				Your Profile
			</h2>
			<p className="text-muted-foreground mt-2 max-w-md text-base leading-relaxed">
				Based on your quiz answers.
			</p>
		</div>
	)
}
