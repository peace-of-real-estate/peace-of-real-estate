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
	type SignupWizardContext,
	type SignupWizardStep,
} from '../-components/signup-wizard-shell'
import type { AgentDraft, RepresentationSide } from '@/lib/matching/profile'
import { getCurrentSession } from '@/lib/auth/session'
import { agentDraftSchema, loadAgentProfile } from '@/lib/matching/profile'
import {
	bestClientTypeOptions,
	optionKeys,
	type BestClientTypeSlug,
} from '@/lib/matching/questions'
import { createLocalStorage } from '@/lib/utils/localstorage'

export type AgentFlowStep =
	| 'identity'
	| 'market'
	| 'workStyle'
	| 'compliance'
	| 'peacePact'
	| 'preview'

export type AgentWizardContext = SignupWizardContext<AgentDraft, AgentFlowStep>

export const agentDraftStorage = createLocalStorage<AgentDraft>(
	'pre-agent-draft',
	agentDraftSchema,
)

const agentFlowSteps = [
	{ id: 'identity', label: 'Identity', icon: UserIcon },
	{ id: 'market', label: 'Market', icon: MapPinIcon },
	{ id: 'workStyle', label: 'Work Style', icon: ChartLineIcon },
	{ id: 'compliance', label: 'Compliance', icon: ShieldCheckIcon },
	{ id: 'peacePact', label: 'Peace Pact', icon: ScrollIcon },
] satisfies SignupWizardStep<Exclude<AgentFlowStep, 'preview'>>[]

const representationSides: RepresentationSide[] = ['buying', 'selling', 'both']

export const agentConfig = {
	basePath: '/signup/agent',
	label: 'Agent',
	intentOptions: representationSides,
	clientOptions: optionKeys(bestClientTypeOptions),
	accent: 'amber',
} satisfies {
	basePath: '/signup/agent'
	label: string
	intentOptions: RepresentationSide[]
	clientOptions: BestClientTypeSlug[]
	accent: 'amber'
}

export const yearsLicensedOptions = [
	{ slug: '0-2', label: '0-2 years' },
	{ slug: '3-5', label: '3-5 years' },
	{ slug: '6-10', label: '6-10 years' },
	{ slug: '10+', label: '10+ years' },
] as const

export const averageTransactionsOptions = [
	{ slug: '0-5', label: '0-5 per year' },
	{ slug: '6-15', label: '6-15 per year' },
	{ slug: '16-30', label: '16-30 per year' },
	{ slug: '30+', label: '30+ per year' },
] as const

export const Route = createFileRoute('/signup/(quiz)/agent')({
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
			: pathname.endsWith('/work-style')
				? 'workStyle'
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
							case 'workStyle':
								return Boolean(
									draft.clientDescription &&
									draft.communicationFrequency &&
									draft.quickCommunicationChannel &&
									draft.updateDeliveryMethod &&
									draft.difficultDealInstinct &&
									draft.responseTime &&
									draft.commissionApproach &&
									draft.unrepresentedBuyerApproach,
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

export function stepPath(step: AgentFlowStep) {
	if (step === 'preview') return '/signup/preview/agent'
	if (step === 'workStyle') return 'work-style'
	return step === 'peacePact' ? 'peace-pact' : step
}

export function getRepresentationIcon(side: RepresentationSide): Icon {
	if (side === 'buying') return UsersIcon
	if (side === 'selling') return ChartLineIcon
	return BriefcaseIcon
}

export function getRepresentationLabel(side: RepresentationSide) {
	if (side === 'buying') return 'Buyers'
	if (side === 'selling') return 'Sellers'
	return 'Both'
}

export function getAgentFlowSteps() {
	return agentFlowSteps
}
