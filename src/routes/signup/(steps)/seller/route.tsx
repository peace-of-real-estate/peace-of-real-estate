import {
	createFileRoute,
	redirect,
	useRouterState,
} from '@tanstack/react-router'
import { HouseLineIcon, MapPinIcon, UserIcon } from '@phosphor-icons/react'

import {
	SignupWizardShell,
	type SignupWizardContextValue,
	type SignupWizardStep,
} from '../-components/signup-shell'
import { createLocalStorage } from '@/lib/utils/localstorage'
import { getCurrentSession } from '@/lib/auth/session'
import { loadSellerProfile, sellerDraftSchema } from '@/lib/profile'
import type { SellerDraft } from '@/lib/profile'
import { sellerQuestionIds } from '@/lib/profile'
import { isAnswered } from '../-components/quiz/use-question-flow'

export const sellerDraftStorage = createLocalStorage<SellerDraft>(
	'pre-seller-draft',
	sellerDraftSchema,
)

export type ClientSignupStep = 'location' | 'home' | 'preferences' | 'preview'

export type SellerWizardContext = SignupWizardContextValue<
	SellerDraft,
	ClientSignupStep
>

const sellerSteps = [
	{ id: 'location', label: 'Location', icon: MapPinIcon },
	{ id: 'home', label: 'Home', icon: HouseLineIcon },
	{ id: 'preferences', label: 'Preferences', icon: UserIcon },
] satisfies SignupWizardStep<Exclude<ClientSignupStep, 'preview'>>[]

export const Route = createFileRoute('/signup/(steps)/seller')({
	beforeLoad: async () => {
		const session = await getCurrentSession()
		if (session && (await loadSellerProfile())) {
			throw redirect({ to: '/seller/matches' })
		}
	},
	component: SellerWizardRoute,
})

function isSellerPreferencesComplete(state: SellerDraft): boolean {
	return sellerQuestionIds.every((id) => isAnswered(state[id]))
}

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
		<SignupWizardShell<SellerDraft, ClientSignupStep>
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

export { isSellerPreferencesComplete }
