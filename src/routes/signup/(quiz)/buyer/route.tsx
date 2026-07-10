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
	isBuyerPreferencesComplete,
	type ClientDraft,
	type ClientSignupStep,
} from '../-components/client-quiz-fields'
import { createLocalStorage } from '@/lib/utils/localstorage'
import { getCurrentSession } from '@/lib/auth/session'
import { loadBuyerProfile } from '@/lib/matching/profile'
import type { BuyerDraft } from '@/lib/matching/profile'

export const buyerDraftStorage =
	createLocalStorage<BuyerDraft>('pre-buyer-draft')

export type BuyerWizardContext = SignupWizardContext<
	ClientDraft,
	ClientSignupStep
>

const buyerSteps = [
	{ id: 'location', label: 'Location', icon: MapPinIcon },
	{ id: 'home', label: 'Home', icon: HouseLineIcon },
	{ id: 'preferences', label: 'Preferences', icon: UserIcon },
] satisfies SignupWizardStep<Exclude<ClientSignupStep, 'preview'>>[]

export const Route = createFileRoute('/signup/(quiz)/buyer')({
	beforeLoad: async () => {
		const session = await getCurrentSession()
		if (session && (await loadBuyerProfile())) {
			throw redirect({ to: '/buyer/matches' })
		}
	},
	component: BuyerWizardRoute,
})

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
		<SignupWizardShell<ClientDraft, ClientSignupStep>
			steps={buyerSteps}
			currentStepId={currentStepId}
			draftStorage={buyerDraftStorage}
			initialDraft={{ zipCodes: [] }}
			basePath="/signup/buyer"
			getStepPath={(step) =>
				step === 'preview' ? '/signup/preview/buyer' : step
			}
			getHasDraft={(draft) =>
				draft.city !== undefined ||
				draft.quickCommunicationChannel !== undefined
			}
			getCompletedStepIds={(draft) =>
				buyerSteps
					.filter((step) => {
						switch (step.id) {
							case 'location':
								return Boolean(draft.city && draft.state)
							case 'home':
								return Boolean(draft.priceRange && draft.propertyTypes?.length)
							case 'preferences':
								return isBuyerPreferencesComplete(draft)
						}
					})
					.map((step) => step.id)
			}
		/>
	)
}
