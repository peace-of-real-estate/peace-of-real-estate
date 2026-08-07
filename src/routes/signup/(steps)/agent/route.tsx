import { ChartLineIcon, MapPinIcon, UserIcon } from '@phosphor-icons/react'
import {
	createFileRoute,
	redirect,
	useRouterState,
} from '@tanstack/react-router'

import { getCurrentSession } from '@/lib/auth/session'
import {
	agentDraftSchema,
	agentQuestionIds,
	agentQuestions,
} from '@/lib/profile'
import type { AgentDraft } from '@/lib/profile'
import { loadExistingProfileRoles } from '@/lib/profile/server'
import { createLocalStorage } from '@/lib/utils/localstorage'

import { isQuestionAnswered } from '../-components/quiz/use-question-flow'
import {
	SignupWizardShell,
	type SignupWizardStep,
} from '../-components/signup-shell'

export type AgentFlowStep = 'identity' | 'market' | 'preferences' | 'preview'

export const agentDraftStorage = createLocalStorage<AgentDraft>(
	'pre-agent-draft',
	agentDraftSchema,
)

const agentFlowSteps = [
	{ id: 'identity', label: 'Practice', icon: UserIcon },
	{ id: 'market', label: 'Market', icon: MapPinIcon },
	{ id: 'preferences', label: 'Preferences', icon: ChartLineIcon },
] satisfies SignupWizardStep<Exclude<AgentFlowStep, 'preview'>>[]

export const Route = createFileRoute('/signup/(steps)/agent')({
	ssr: false,
	beforeLoad: async ({ location }) => {
		const session = await getCurrentSession()
		if (session && (await loadExistingProfileRoles()).includes('agent')) {
			throw redirect({ to: '/agent/introductions' })
		}
		if (location.pathname === '/signup/agent') {
			throw redirect({ to: '/signup/agent/identity' })
		}
	},
	component: AgentWizardRoute,
})

function AgentWizardRoute() {
	const pathname = useRouterState({
		select: (state) => state.location.pathname,
	})
	const currentStepId = pathname.endsWith('/identity')
		? 'identity'
		: pathname.endsWith('/market')
			? 'market'
			: pathname.endsWith('/preferences')
				? 'preferences'
				: 'identity'

	return (
		<SignupWizardShell
			steps={agentFlowSteps}
			currentStepId={currentStepId}
			draftStorage={agentDraftStorage}
			initialDraft={{}}
			basePath="/signup/agent"
			getStepPath={stepPath}
			getHasDraft={(draft) =>
				draft.brokerageName !== undefined ||
				draft.cityId !== undefined ||
				draft.representationSide !== undefined
			}
			getCompletedStepIds={(draft) =>
				agentFlowSteps
					.filter((step) => {
						switch (step.id) {
							case 'identity':
								return Boolean(
									draft.brokerageName &&
									draft.licenseNumberState &&
									draft.yearsLicensed &&
									draft.representationSide,
								)
							case 'market':
								return Boolean(
									draft.cityId &&
									draft.zipCodes?.length &&
									draft.typicalPriceRange,
								)
							case 'preferences':
								return agentQuestionIds.every((id) =>
									isQuestionAnswered(agentQuestions[id], draft[id]),
								)
						}
					})
					.map((step) => step.id)
			}
		/>
	)
}

function stepPath(step: AgentFlowStep) {
	if (step === 'preview') return '/signup/preview/agent'
	return step
}
