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
import { getCurrentSession } from '@/lib/auth/functions'
import { loadAgentProfile } from '@/lib/matching/profile'
import { bestClientTypeLabels } from '@/lib/matching/questions'
import { createLocalStorage } from '@/lib/utils/localstorage'

export type AgentFlowStep =
	| 'intro'
	| 'identity'
	| 'market'
	| 'compliance'
	| 'peacePact'
	| 'preview'

export type AgentWizardContext = SignupWizardContext<AgentDraft, AgentFlowStep>

export const agentDraftStorage =
	createLocalStorage<AgentDraft>('pre-agent-draft')

const agentFlowSteps = [
	{ id: 'intro', label: 'Start', icon: UserIcon },
	{ id: 'identity', label: 'Identity', icon: UserIcon },
	{ id: 'market', label: 'Market', icon: MapPinIcon },
	{ id: 'compliance', label: 'Compliance', icon: ShieldCheckIcon },
	{ id: 'peacePact', label: 'Peace Pact', icon: ScrollIcon },
] satisfies SignupWizardStep<Exclude<AgentFlowStep, 'preview'>>[]

export const agentConfig = {
	basePath: '/signup/agent',
	label: 'Agent',
	intentOptions: ['buying', 'selling', 'both'] as RepresentationSide[],
	clientOptions: Object.keys(bestClientTypeLabels),
	accent: 'amber',
} satisfies {
	basePath: '/signup/agent'
	label: string
	intentOptions: RepresentationSide[]
	clientOptions: string[]
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
	beforeLoad: async () => {
		const session = await getCurrentSession()
		if (session && (await loadAgentProfile())) {
			throw redirect({ to: '/agent/introductions' })
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
			: pathname.endsWith('/compliance')
				? 'compliance'
				: pathname.endsWith('/peace-pact')
					? 'peacePact'
					: 'intro'

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
							case 'compliance':
								return Boolean(draft.licenseAttested && draft.eoInsuranceStatus)
							case 'peacePact':
								return Boolean(draft.peacePactSigned)
							case 'intro':
								return false
						}
					})
					.map((step) => step.id)
			}
		/>
	)
}

export function stepPath(step: AgentFlowStep) {
	if (step === 'preview') return '/signup/preview/agent'
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
