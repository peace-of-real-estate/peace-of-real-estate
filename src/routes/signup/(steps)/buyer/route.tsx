import { HouseLineIcon, MapPinIcon, UserIcon } from '@phosphor-icons/react'
import {
	createFileRoute,
	redirect,
	useRouterState,
} from '@tanstack/react-router'

import { getCurrentSession } from '@/lib/auth/session'
import { buyerDraftSchema } from '@/lib/profile'
import type { BuyerDraft } from '@/lib/profile'
import { buyerQuestionIds, buyerQuestions } from '@/lib/profile'
import { loadExistingProfileRoles } from '@/lib/profile/server'
import { createLocalStorage } from '@/lib/utils/localstorage'

import { isQuestionAnswered } from '../-components/quiz/use-question-flow'
import {
	SignupWizardShell,
	type SignupWizardStep,
} from '../-components/signup-shell'

export const buyerDraftStorage = createLocalStorage<BuyerDraft>(
	'pre-buyer-draft',
	buyerDraftSchema,
)

export type ClientSignupStep = 'location' | 'home' | 'preferences' | 'preview'

const buyerSteps = [
	{ id: 'location', label: 'Location', icon: MapPinIcon },
	{ id: 'home', label: 'Home', icon: HouseLineIcon },
	{ id: 'preferences', label: 'Preferences', icon: UserIcon },
] satisfies SignupWizardStep<Exclude<ClientSignupStep, 'preview'>>[]

export const Route = createFileRoute('/signup/(steps)/buyer')({
	ssr: false,
	beforeLoad: async () => {
		const session = await getCurrentSession()
		if (session && (await loadExistingProfileRoles()).includes('buyer')) {
			throw redirect({ to: '/buyer/matches' })
		}
	},
	component: BuyerWizardRoute,
})

function isBuyerPreferencesComplete(state: BuyerDraft): boolean {
	return buyerQuestionIds.every((id) =>
		isQuestionAnswered(buyerQuestions[id], state[id]),
	)
}

function BuyerWizardRoute() {
	const pathname = useRouterState({
		select: (state) => state.location.pathname,
	})
	const currentStepId = pathname.endsWith('/home')
		? 'home'
		: pathname.endsWith('/preferences')
			? 'preferences'
			: 'location'

	return (
		<SignupWizardShell<BuyerDraft, ClientSignupStep>
			steps={buyerSteps}
			currentStepId={currentStepId}
			draftStorage={buyerDraftStorage}
			initialDraft={{ zipCodes: [] }}
			basePath="/signup/buyer"
			getStepPath={(step) =>
				step === 'preview' ? '/signup/preview/buyer' : step
			}
			getHasDraft={(draft) =>
				draft.cityId !== undefined || draft.buyingExperience !== undefined
			}
			getCompletedStepIds={(draft) =>
				buyerSteps
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
								return isBuyerPreferencesComplete(draft)
						}
					})
					.map((step) => step.id)
			}
		/>
	)
}
