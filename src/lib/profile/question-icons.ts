import {
	BriefcaseIcon,
	ChatIcon,
	CurrencyDollarIcon,
	HouseIcon,
	ScalesIcon,
	ShieldIcon,
	StarIcon,
	TargetIcon,
	UserIcon,
} from '@phosphor-icons/react'
import type { ElementType } from 'react'

import type {
	AgentQuestionId,
	BuyerQuestionId,
	SellerQuestionId,
} from './profile-fields'

const clientSharedQuestionIcons = {
	decisionStyle: ScalesIcon,
	contactStyle: ChatIcon,
	riskComfort: ShieldIcon,
	commissionPlan: CurrencyDollarIcon,
	situationSpecialties: BriefcaseIcon,
} as const

const questionIconMap = {
	buyingExperience: StarIcon,
	sellingMotivation: HouseIcon,
	...clientSharedQuestionIcons,
	enjoyedClients: BriefcaseIcon,
	clientDecisionStyle: ScalesIcon,
	clientContactStyle: ChatIcon,
	riskAdviceComfort: ShieldIcon,
	commissionStyle: CurrencyDollarIcon,
	specialties: BriefcaseIcon,
	energyFocus: TargetIcon,
} satisfies Record<
	BuyerQuestionId | SellerQuestionId | AgentQuestionId,
	ElementType
>

export function getQuestionIcon(questionId: string): ElementType {
	return (
		Object.entries(questionIconMap).find(([id]) => id === questionId)?.[1] ??
		UserIcon
	)
}
