import {
	createFileRoute,
	redirect,
	useRouterState,
} from '@tanstack/react-router'
import {
	BriefcaseIcon,
	ChartLineIcon,
	MapPinIcon,
	ScrollIcon,
	ShieldCheckIcon,
	UserIcon,
	UsersIcon,
	type Icon,
} from '@phosphor-icons/react'

import {
	SignupWizardShell,
	type SignupWizardStep,
} from '../-components/signup-shell'
import {
	agentDraftSchema,
	agentQuestionIds,
	bestClientType,
	loadAgentProfile,
	representationSide,
	type BestClientTypeSlug,
	type RepresentationSide,
} from '@/lib/profile'
import type { AgentDraft } from '@/lib/profile'
import { isAnswered } from '../-components/quiz/use-question-flow'
import { createLocalStorage } from '@/lib/utils/localstorage'
import { getCurrentSession } from '@/lib/auth/session'

export type AgentFlowStep =
	| 'identity'
	| 'market'
	| 'preferences'
	| 'compliance'
	| 'peacePact'
	| 'preview'

export const agentDraftStorage = createLocalStorage<AgentDraft>(
	'pre-agent-draft',
	agentDraftSchema,
)

const agentFlowSteps = [
	{ id: 'identity', label: 'Identity', icon: UserIcon },
	{ id: 'market', label: 'Market', icon: MapPinIcon },
	{ id: 'preferences', label: 'Preferences', icon: ChartLineIcon },
	{ id: 'compliance', label: 'Compliance', icon: ShieldCheckIcon },
	{ id: 'peacePact', label: 'Peace Pact', icon: ScrollIcon },
] satisfies SignupWizardStep<Exclude<AgentFlowStep, 'preview'>>[]

const representationSides: RepresentationSide[] = [...representationSide.slugs]

export const agentConfig = {
	basePath: '/signup/agent',
	label: 'Agent',
	intentOptions: representationSides,
	clientOptions: [...bestClientType.slugs],
	accent: 'amber',
} satisfies {
	basePath: '/signup/agent'
	label: string
	intentOptions: RepresentationSide[]
	clientOptions: BestClientTypeSlug[]
	accent: 'amber'
}

export const Route = createFileRoute('/signup/(steps)/agent')({
	ssr: false,
	beforeLoad: async ({ location }) => {
		const session = await getCurrentSession()
		if (session && (await loadAgentProfile())) {
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
				: pathname.endsWith('/compliance')
					? 'compliance'
					: pathname.endsWith('/peace-pact')
						? 'peacePact'
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
				draft.firstName !== undefined ||
				draft.city !== undefined ||
				draft.representationSide !== undefined
			}
			getCompletedStepIds={(draft) =>
				agentFlowSteps
					.filter((step) => {
						switch (step.id) {
							case 'identity':
								return Boolean(draft.firstName && draft.lastName)
							case 'market':
								return Boolean(
									draft.city &&
									draft.typicalPriceRange &&
									draft.representationSide,
								)
							case 'preferences':
								return agentQuestionIds.every(
									(id) => id in draft && isAnswered(draft[id]),
								)

							case 'compliance':
								return Boolean(draft.licenseAttested && draft.eoInsuranceStatus)
							case 'peacePact':
								return Boolean(draft.peacePactSigned)
						}
					})
					.map((step) => step.id)
			}
		/>
	)
}

function stepPath(step: AgentFlowStep) {
	if (step === 'preview') return '/signup/preview/agent'
	if (step === 'preferences') return 'preferences'
	return step === 'peacePact' ? 'peace-pact' : step
}

export function getRepresentationIcon(side: RepresentationSide): Icon {
	if (side === 'buyers') return UsersIcon
	if (side === 'sellers') return ChartLineIcon
	return BriefcaseIcon
}
