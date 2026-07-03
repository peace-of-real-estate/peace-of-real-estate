import type { Icon } from '@phosphor-icons/react'
import {
	BriefcaseIcon,
	ChartLineIcon,
	MapPinIcon,
	ScrollIcon,
	ShieldCheckIcon,
	UserIcon,
	UsersIcon,
} from '@phosphor-icons/react'

import type { RepresentationSide } from '@/lib/matching/profile'
import { bestClientTypeLabels } from '@/components/signup/questions'

export type AgentFlowStep =
	| 'intro'
	| 'identity'
	| 'market'
	| 'compliance'
	| 'peacePact'
	| 'preview'

export const agentFlowSteps: {
	id: AgentFlowStep
	label: string
	icon: Icon
}[] = [
	{ id: 'intro', label: 'Start', icon: UserIcon },
	{ id: 'identity', label: 'Identity', icon: UserIcon },
	{ id: 'market', label: 'Market', icon: MapPinIcon },
	{ id: 'compliance', label: 'Compliance', icon: ShieldCheckIcon },
	{ id: 'peacePact', label: 'Peace Pact', icon: ScrollIcon },
]

export const stepOrder: AgentFlowStep[] = [
	'intro',
	'identity',
	'market',
	'compliance',
	'peacePact',
]

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

export const agentConfig = {
	basePath: '/agent',
	label: 'Agent',
	intentOptions: ['buying', 'selling', 'both'] as RepresentationSide[],
	clientOptions: Object.keys(bestClientTypeLabels),
	accent: 'amber',
} satisfies {
	basePath: '/agent'
	label: string
	intentOptions: RepresentationSide[]
	clientOptions: string[]
	accent: 'amber'
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
