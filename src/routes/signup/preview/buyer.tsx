import { createFileRoute } from '@tanstack/react-router'

import { buyer } from '@/lib/profile'
import {
	buyerCompletedDraftSchema,
	buyerPreviewProfileSchema,
} from '@/lib/profile/types'

import { buyerDraftStorage } from '../(steps)/buyer/route'
import { ClientSignupPreview } from './-components/client-preview'

export const Route = createFileRoute('/signup/preview/buyer')({
	component: BuyerPreviewRoute,
})

function BuyerPreviewRoute() {
	return (
		<ClientSignupPreview
			clientRole="buyer"
			previewSchema={buyerPreviewProfileSchema}
			completedDraftSchema={buyerCompletedDraftSchema}
			draftStorage={buyerDraftStorage}
			createProfile={buyer.createProfileFromDraft}
		/>
	)
}
