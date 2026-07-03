import type { Icon } from '@phosphor-icons/react'
import {
	ArrowsLeftRightIcon,
	BarnIcon,
	BuildingApartmentIcon,
	BuildingIcon,
	ClockIcon,
	HouseLineIcon,
	MapPinIcon,
	QuestionIcon,
	TagIcon,
	UserIcon,
} from '@phosphor-icons/react'

import type { RepresentationSide } from '@/lib/matching/profile'
import { propertyTypeOptions } from '@/components/signup/questions'

export type ConsumerFlowStep = 'intro' | 'intent' | 'home' | 'quiz' | 'preview'

export const consumerFlowSteps: {
	id: ConsumerFlowStep
	label: string
	icon: Icon
}[] = [
	{ id: 'intro', label: 'Situation', icon: ClockIcon },
	{ id: 'intent', label: 'Location', icon: MapPinIcon },
	{ id: 'home', label: 'Home', icon: HouseLineIcon },
	{ id: 'quiz', label: 'Preferences', icon: UserIcon },
]

export const timelineOptions = [
	{ slug: 'exploring', label: 'Just exploring' },
	{ slug: '1month', label: '1 month' },
	{ slug: '2months', label: '2 months' },
	{ slug: '3months', label: '3 months' },
	{ slug: '4months', label: '4 months' },
	{ slug: '5months', label: '5 months' },
	{ slug: '6months', label: '6 months' },
	{ slug: '7months', label: '7 months' },
	{ slug: '8months', label: '8 months' },
	{ slug: '9months', label: '9 months' },
	{ slug: '10months', label: '10 months' },
	{ slug: '11months', label: '11 months' },
	{ slug: '12monthsPlus', label: '12+ months' },
] as const

export const consumerConfig = {
	basePath: '/consumer',
	label: 'Consumer',
	intentOptions: ['buying', 'selling'],
	timelineOptions: [...timelineOptions],
	propertyPrompt: 'What type of home are you looking for?',
	propertyOptions: Object.keys(propertyTypeOptions),
	accent: 'navy',
} satisfies {
	basePath: '/consumer'
	label: 'Consumer'
	intentOptions: RepresentationSide[]
	timelineOptions: { slug: string; label: string }[]
	propertyPrompt: string
	propertyOptions: string[]
	accent: 'navy' | 'amber'
}

export function getPropertyIcon(slug: string): Icon {
	if (slug === 'singleFamily') return HouseLineIcon
	if (slug === 'condoTownhome') return BuildingIcon
	if (slug === 'land') return BarnIcon
	if (slug === 'multiFamily') return BuildingApartmentIcon
	return QuestionIcon
}

export function getIntentIcon(intent: RepresentationSide): Icon {
	if (intent === 'buying') return HouseLineIcon
	if (intent === 'selling') return TagIcon
	if (intent === 'both') return ArrowsLeftRightIcon
	return QuestionIcon
}

export function getIntentLabel(intent: RepresentationSide) {
	if (intent === 'buying') return 'Buy'
	if (intent === 'selling') return 'Sell'
	return 'Buy then Sell'
}
