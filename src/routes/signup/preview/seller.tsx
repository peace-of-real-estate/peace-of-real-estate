import { createFileRoute } from '@tanstack/react-router'

import { seller } from '@/lib/profile'
import {
	sellerCompletedDraftSchema,
	sellerPreviewProfileSchema,
} from '@/lib/profile/types'

import { sellerDraftStorage } from '../(steps)/seller/route'
import { ClientSignupPreview } from './-components/client-preview'

export const Route = createFileRoute('/signup/preview/seller')({
	ssr: false,
	component: SellerPreviewRoute,
})

function SellerPreviewRoute() {
	return (
		<ClientSignupPreview
			clientRole="seller"
			previewSchema={sellerPreviewProfileSchema}
			completedDraftSchema={sellerCompletedDraftSchema}
			draftStorage={sellerDraftStorage}
			createProfile={seller.createProfileFromDraft}
		/>
	)
}
