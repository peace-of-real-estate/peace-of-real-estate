import {
	createFileRoute,
	redirect,
	useRouterState,
} from '@tanstack/react-router'
import { HouseLineIcon, MapPinIcon, UserIcon } from '@phosphor-icons/react'

import {
	SignupWizardShell,
	type SignupWizardContext,
	type SignupWizardStep,
} from '../-components/signup-wizard-shell'
import {
	isSellerPreferencesComplete,
	type ClientDraft,
	type ClientSignupStep,
} from '../-components/client-quiz-fields'
import { createLocalStorage } from '@/lib/utils/localstorage'
import { getCurrentSession } from '@/lib/auth/session'
import { loadSellerProfile, sellerDraftSchema } from '@/lib/matching/profile'
import type { SellerDraft } from '@/lib/matching/profile'

export const sellerDraftStorage = createLocalStorage<SellerDraft>(
	'pre-seller-draft',
	sellerDraftSchema,
)

export type SellerWizardContext = SignupWizardContext<
	ClientDraft,
	ClientSignupStep
>

const sellerSteps = [
	{ id: 'location', label: 'Location', icon: MapPinIcon },
	{ id: 'home', label: 'Home', icon: HouseLineIcon },
	{ id: 'preferences', label: 'Preferences', icon: UserIcon },
] satisfies SignupWizardStep<Exclude<ClientSignupStep, 'preview'>>[]

export const Route = createFileRoute('/signup/(quiz)/seller')({
	beforeLoad: async () => {
		const session = await getCurrentSession()
		if (session && (await loadSellerProfile())) {
			throw redirect({ to: '/seller/matches' })
		}
	},
	component: SellerWizardRoute,
})

function SellerWizardRoute() {
	const pathname = useRouterState({
		select: (state) => state.location.pathname,
	})
	const currentStepId = pathname.endsWith('/home')
		? 'home'
		: pathname.endsWith('/preferences')
			? 'preferences'
			: 'location'

	return (
		<SignupWizardShell<ClientDraft, ClientSignupStep>
			steps={sellerSteps}
			currentStepId={currentStepId}
			draftStorage={sellerDraftStorage}
			initialDraft={{ zipCodes: [] }}
			basePath="/signup/seller"
			getStepPath={(step) =>
				step === 'preview' ? '/signup/preview/seller' : step
			}
			getHasDraft={(draft) =>
				draft.city !== undefined ||
				draft.quickCommunicationChannel !== undefined
			}
			getCompletedStepIds={(draft) =>
				sellerSteps
					.filter((step) => {
						switch (step.id) {
							case 'location':
								return Boolean(draft.city && draft.state)
							case 'home':
								return Boolean(draft.priceRange && draft.propertyTypes?.length)
							case 'preferences':
								return isSellerPreferencesComplete(draft)
						}
					})
					.map((step) => step.id)
			}
		/>
	)
}
