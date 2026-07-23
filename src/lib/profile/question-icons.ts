import {
	ChatIcon,
	ClockIcon,
	EnvelopeIcon,
	HouseIcon,
	LightningIcon,
	ScalesIcon,
	ShieldIcon,
	StarIcon,
	TargetIcon,
	UserIcon,
} from '@phosphor-icons/react'
import type { ElementType } from 'react'

import type {
	AgentWorkStyleQuestionId,
	BuyerQuestionId,
	SellerQuestionId,
} from './profile-fields'

const questionIconMap = {
	// Buyer
	experienceLevel: StarIcon,
	idealAgentRelationship: ChatIcon,
	decisionMakingNeed: ScalesIcon,
	biddingWarResponse: TargetIcon,
	quickCommunicationChannel: ChatIcon,
	updateDeliveryMethod: EnvelopeIcon,
	responseTimeExpectation: ClockIcon,
	involvementLevel: TargetIcon,
	commissionComfort: ShieldIcon,

	// Seller
	saleMotivation: StarIcon,
	successfulSaleLooksLike: TargetIcon,
	homeConnection: HouseIcon,
	agentSilencePreference: ClockIcon,
	representationPreference: ShieldIcon,

	// Agent
	clientDescription: UserIcon,
	communicationFrequency: ChatIcon,
	difficultDealInstinct: ScalesIcon,
	responseTime: ClockIcon,
	commissionApproach: ShieldIcon,
	unrepresentedBuyerApproach: LightningIcon,

	// Free form
	notFitFor: UserIcon,
} satisfies Record<
	BuyerQuestionId | SellerQuestionId | AgentWorkStyleQuestionId,
	ElementType
>

export function getQuestionIcon(questionId: string): ElementType {
	return (
		Object.entries(questionIconMap).find(([id]) => id === questionId)?.[1] ??
		UserIcon
	)
}
