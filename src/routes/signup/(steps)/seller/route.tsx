import { HouseLineIcon, MapPinIcon, UserIcon } from '@phosphor-icons/react'
import {
	createFileRoute,
	redirect,
	useRouterState,
} from '@tanstack/react-router'

import { getCurrentSession } from '@/lib/auth/session'
import { loadExistingProfileRoles, sellerDraftSchema } from '@/lib/profile'
import type { SellerDraft } from '@/lib/profile'
import { sellerQuestionIds } from '@/lib/profile'
import { createLocalStorage } from '@/lib/utils/localstorage'

import { isAnswered } from '../-components/quiz/use-question-flow'
import {
	SignupWizardShell,
	type SignupWizardStep,
} from '../-components/signup-shell'

export const sellerDraftStorage = createLocalStorage<SellerDraft>(
	'pre-seller-draft',
	sellerDraftSchema,
)

export type ClientSignupStep = 'location' | 'home' | 'preferences' | 'preview'

const sellerSteps = [
	{ id: 'location', label: 'Location', icon: MapPinIcon },
	{ id: 'home', label: 'Home', icon: HouseLineIcon },
	{ id: 'preferences', label: 'Preferences', icon: UserIcon },
] satisfies SignupWizardStep<Exclude<ClientSignupStep, 'preview'>>[]

export const Route = createFileRoute('/signup/(steps)/seller')({
	ssr: false,
	beforeLoad: async () => {
		const session = await getCurrentSession()
		if (session && (await loadExistingProfileRoles()).includes('seller')) {
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
				draft.cityId !== undefined ||
				draft.quickCommunicationChannel !== undefined
			}
			getCompletedStepIds={(draft) =>
				sellerSteps
					.filter((step) => {
						switch (step.id) {
							case 'location':
								return Boolean(draft.cityId)
							case 'home':
								return Boolean(
									draft.priceMin !== undefined &&
									draft.priceMax !== undefined &&
									draft.propertyTypes?.length,
								)
							case 'preferences':
								return isSellerPreferencesComplete(draft)
						}
					})
					.map((step) => step.id)
			}
		/>
	)
}
