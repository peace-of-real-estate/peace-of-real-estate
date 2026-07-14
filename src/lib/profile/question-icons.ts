import type { ElementType } from 'react'
import {
	Clock,
	Home,
	Mail,
	MessageSquare,
	Scale,
	Shield,
	Star,
	Target,
	User,
	Zap,
} from 'lucide-react'
import type {
	AgentWorkStyleQuestionId,
	BuyerQuestionId,
	SellerQuestionId,
} from './profile-fields'

export const questionIconMap = {
	// Buyer
	experienceLevel: Star,
	idealAgentRelationship: MessageSquare,
	decisionMakingNeed: Scale,
	biddingWarResponse: Target,
	quickCommunicationChannel: MessageSquare,
	updateDeliveryMethod: Mail,
	responseTimeExpectation: Clock,
	involvementLevel: Target,
	commissionComfort: Shield,

	// Seller
	saleMotivation: Star,
	successfulSaleLooksLike: Target,
	homeConnection: Home,
	agentSilencePreference: Clock,
	representationPreference: Shield,
	agentDeliveryExpectations: Home,

	// Agent
	clientDescription: User,
	communicationFrequency: MessageSquare,
	difficultDealInstinct: Scale,
	responseTime: Clock,
	commissionApproach: Shield,
	unrepresentedBuyerApproach: Zap,

	// Free form
	notFitFor: User,
} satisfies Record<
	BuyerQuestionId | SellerQuestionId | AgentWorkStyleQuestionId,
	ElementType
>

export function getQuestionIcon(questionId: string): ElementType {
	return (
		Object.entries(questionIconMap).find(([id]) => id === questionId)?.[1] ??
		User
	)
}
