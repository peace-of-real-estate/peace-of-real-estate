import { z } from 'zod'

import {
	agentClientDescriptionOptions,
	agentCommunicationFrequencyOptions,
	agentCommissionApproachOptions,
	agentDifficultDealInstinctOptions,
	agentResponseTimeOptions,
	agentUnrepresentedBuyerApproachOptions,
	bestClientTypeOptions,
	buyerBiddingWarResponseOptions,
	buyerDecisionMakingNeedOptions,
	buyerExperienceLevelOptions,
	buyerIdealAgentRelationshipOptions,
	commissionComfortOptions,
	involvementLevelOptions,
	optionKeys,
	propertyTypeOptions,
	quickCommunicationChannelOptions,
	responseTimeExpectationOptions,
	sellerAgentDeliveryExpectationsOptions,
	sellerAgentSilencePreferenceOptions,
	sellerHomeConnectionOptions,
	sellerRepresentationPreferenceOptions,
	sellerSaleMotivationOptions,
	sellerSuccessfulSaleLooksLikeOptions,
	updateDeliveryMethodOptions,
} from '@/lib/matching/enums'

export type Question = {
	id: string
	title: string
	options: Readonly<Record<string, string>>
	multiple?: boolean | undefined
	freeForm?: boolean | undefined
	allowSkip?: boolean | undefined
}

export type AnswerValue = string | string[] | null

export type Answers = Record<string, AnswerValue>

export const answerValueSchema: z.ZodType<AnswerValue> = z.union([
	z.string(),
	z.array(z.string()),
	z.null(),
])

export const answersSchema: z.ZodType<Answers> = z.record(
	z.string(),
	answerValueSchema,
)

export function questionOptionEntries(question: Question): [string, string][] {
	return Object.entries(question.options)
}

export function questionOptionSlugs(question: Question): string[] {
	return Object.keys(question.options)
}

export function questionOptionLabel(question: Question, slug: string): string {
	return question.options[slug] ?? slug
}

export function getAnswerSummary(
	question: Question,
	answer: AnswerValue | undefined,
): string {
	if (answer === undefined || answer === '' || answer === null) {
		return 'Not answered'
	}

	if (question.freeForm && typeof answer === 'string') {
		return answer.trim() || 'Not answered'
	}

	if (Array.isArray(answer)) {
		const labels = answer.map((slug) => question.options[slug]).filter(Boolean)
		return labels.length > 0 ? labels.join(', ') : 'Not answered'
	}

	return question.options[answer] ?? 'Not answered'
}

export function getMultiSelectSummary(
	question: Question,
	answer: AnswerValue | undefined,
): string[] {
	if (answer === undefined || answer === null) return []
	if (Array.isArray(answer)) {
		const labels: string[] = []
		for (const slug of answer) {
			const label = question.options[slug]
			if (label) labels.push(label)
		}
		return labels
	}
	const label = question.options[answer]
	return label ? [label] : []
}

export function isMultiSelect(question: Question): boolean {
	return question.multiple === true
}

export function isFreeForm(question: Question): boolean {
	return question.freeForm === true
}

export type AnswerLabelConfig = {
	title: string
	label: string
	options: Readonly<Record<string, string>>
	multiple?: boolean
}

export type AnswerLabels = Record<string, AnswerLabelConfig>

export function getAnswerLabel(
	labels: AnswerLabels,
	questionId: string,
): AnswerLabelConfig | undefined {
	return labels[questionId]
}

export const buyerAnswerLabels = {
	experienceLevel: {
		title: 'How familiar does this process feel?',
		label: 'Experience',
		options: buyerExperienceLevelOptions,
	},
	idealAgentRelationship: {
		title: 'What does your ideal agent relationship look like?',
		label: 'Ideal relationship',
		options: buyerIdealAgentRelationshipOptions,
	},
	decisionMakingNeed: {
		title: 'What do you need most to make a big decision?',
		label: 'Decision support',
		options: buyerDecisionMakingNeedOptions,
	},
	biddingWarResponse: {
		title: 'After losing a bidding war, what do you need from your agent?',
		label: 'After a loss',
		options: buyerBiddingWarResponseOptions,
	},
	quickCommunicationChannel: {
		title: 'How do you prefer quick back-and-forth communication?',
		label: 'Quick chat',
		options: quickCommunicationChannelOptions,
	},
	updateDeliveryMethod: {
		title: 'How do you prefer updates, timelines, and documents?',
		label: 'Updates & docs',
		options: updateDeliveryMethodOptions,
	},
	involvementLevel: {
		title: 'How involved do you want to be?',
		label: 'Involvement',
		options: involvementLevelOptions,
	},
	responseTimeExpectation: {
		title: 'How quickly do you expect a response?',
		label: 'Response time',
		options: responseTimeExpectationOptions,
	},
	commissionComfort: {
		title: 'How do you plan to handle commission with your agent?',
		label: 'Commission',
		options: commissionComfortOptions,
	},
} satisfies AnswerLabels

export const sellerAnswerLabels = {
	saleMotivation: {
		title: 'What is driving this sale?',
		label: 'Motivation',
		options: sellerSaleMotivationOptions,
	},
	successfulSaleLooksLike: {
		title: 'What does a successful sale look like to you?',
		label: 'Success definition',
		options: sellerSuccessfulSaleLooksLikeOptions,
	},
	involvementLevel: {
		title: 'How involved do you want to be?',
		label: 'Involvement',
		options: involvementLevelOptions,
	},
	quickCommunicationChannel: {
		title: 'How do you prefer quick back-and-forth communication?',
		label: 'Quick chat',
		options: quickCommunicationChannelOptions,
	},
	updateDeliveryMethod: {
		title: 'How do you prefer updates, timelines, and documents?',
		label: 'Updates & docs',
		options: updateDeliveryMethodOptions,
	},
	agentDeliveryExpectations: {
		title: 'What would make you feel your agent delivered? (choose up to 2)',
		label: 'Delivery expectations',
		options: sellerAgentDeliveryExpectationsOptions,
		multiple: true,
	},
	homeConnection: {
		title: 'How would you describe your connection to this home?',
		label: 'Home connection',
		options: sellerHomeConnectionOptions,
	},
	agentSilencePreference: {
		title: 'When not hearing from your agent, what do you prefer?',
		label: 'Check-ins',
		options: sellerAgentSilencePreferenceOptions,
	},
	representationPreference: {
		title: 'Which matters more to you?',
		label: 'Exclusivity',
		options: sellerRepresentationPreferenceOptions,
	},
	responseTimeExpectation: {
		title: 'How quickly do you expect a response?',
		label: 'Response time',
		options: responseTimeExpectationOptions,
	},
	commissionComfort: {
		title: 'How do you plan to handle listing-agent commission?',
		label: 'Commission',
		options: commissionComfortOptions,
	},
} satisfies AnswerLabels

export const agentAnswerLabels = {
	clientDescription: {
		title: 'How would clients describe working with you?',
		label: 'Client description',
		options: agentClientDescriptionOptions,
	},
	communicationFrequency: {
		title: 'How often do you communicate during a transaction?',
		label: 'Communication frequency',
		options: agentCommunicationFrequencyOptions,
	},
	quickCommunicationChannel: {
		title: 'Preferred quick back-and-forth channel?',
		label: 'Quick chat',
		options: quickCommunicationChannelOptions,
	},
	updateDeliveryMethod: {
		title: 'How do you deliver updates, timelines, documents?',
		label: 'Updates & docs',
		options: updateDeliveryMethodOptions,
	},
	difficultDealInstinct: {
		title: 'Instinct when a deal gets difficult?',
		label: 'Difficult deals',
		options: agentDifficultDealInstinctOptions,
	},
	responseTime: {
		title: 'How quickly do you typically respond to clients?',
		label: 'Response time',
		options: agentResponseTimeOptions,
	},
	commissionApproach: {
		title: 'How do you approach commission conversations?',
		label: 'Commission approach',
		options: agentCommissionApproachOptions,
	},
	unrepresentedBuyerApproach: {
		title: 'Unrepresented buyer approaches your listing — what do you do?',
		label: 'Unrepresented buyers',
		options: agentUnrepresentedBuyerApproachOptions,
	},
} satisfies AnswerLabels

export {
	bestClientTypeOptions,
	propertyTypeOptions,
	optionKeys,
} from '@/lib/matching/enums'

export const bestClientTypeLabels: Record<string, string> =
	bestClientTypeOptions

export type BestClientTypeSlug = keyof typeof bestClientTypeOptions

export type PropertyTypeSlug = keyof typeof propertyTypeOptions

const propertyTypeSlugSchema = z.enum(optionKeys(propertyTypeOptions))

export function getPropertyTypeLabel(type: string): string {
	const parsed = propertyTypeSlugSchema.safeParse(type)
	return parsed.success ? propertyTypeOptions[parsed.data] : type
}

export const propertyTypesSchema = z.array(
	z.enum(optionKeys(propertyTypeOptions)),
)

export const bestClientTypesSchema = z.array(
	z.enum(optionKeys(bestClientTypeOptions)),
)

export const buyerAnswerSchema = z.object({
	experienceLevel: z.enum(optionKeys(buyerExperienceLevelOptions)),
	idealAgentRelationship: z.enum(
		optionKeys(buyerIdealAgentRelationshipOptions),
	),
	decisionMakingNeed: z.enum(optionKeys(buyerDecisionMakingNeedOptions)),
	biddingWarResponse: z.enum(optionKeys(buyerBiddingWarResponseOptions)),
	quickCommunicationChannel: z.enum(
		optionKeys(quickCommunicationChannelOptions),
	),
	updateDeliveryMethod: z.enum(optionKeys(updateDeliveryMethodOptions)),
	involvementLevel: z.enum(optionKeys(involvementLevelOptions)),
	responseTimeExpectation: z.enum(optionKeys(responseTimeExpectationOptions)),
	commissionComfort: z.enum(optionKeys(commissionComfortOptions)),
})

export const sellerAnswerSchema = z.object({
	saleMotivation: z.enum(optionKeys(sellerSaleMotivationOptions)),
	successfulSaleLooksLike: z.enum(
		optionKeys(sellerSuccessfulSaleLooksLikeOptions),
	),
	involvementLevel: z.enum(optionKeys(involvementLevelOptions)),
	quickCommunicationChannel: z.enum(
		optionKeys(quickCommunicationChannelOptions),
	),
	updateDeliveryMethod: z.enum(optionKeys(updateDeliveryMethodOptions)),
	agentDeliveryExpectations: z.array(
		z.enum(optionKeys(sellerAgentDeliveryExpectationsOptions)),
	),
	homeConnection: z.enum(optionKeys(sellerHomeConnectionOptions)),
	agentSilencePreference: z.enum(
		optionKeys(sellerAgentSilencePreferenceOptions),
	),
	representationPreference: z.enum(
		optionKeys(sellerRepresentationPreferenceOptions),
	),
	responseTimeExpectation: z.enum(optionKeys(responseTimeExpectationOptions)),
	commissionComfort: z.enum(optionKeys(commissionComfortOptions)),
})

export const agentAnswerSchema = z.object({
	clientDescription: z.enum(optionKeys(agentClientDescriptionOptions)),
	communicationFrequency: z.enum(
		optionKeys(agentCommunicationFrequencyOptions),
	),
	quickCommunicationChannel: z.enum(
		optionKeys(quickCommunicationChannelOptions),
	),
	updateDeliveryMethod: z.enum(optionKeys(updateDeliveryMethodOptions)),
	difficultDealInstinct: z.enum(optionKeys(agentDifficultDealInstinctOptions)),
	responseTime: z.enum(optionKeys(agentResponseTimeOptions)),
	commissionApproach: z.enum(optionKeys(agentCommissionApproachOptions)),
	unrepresentedBuyerApproach: z.enum(
		optionKeys(agentUnrepresentedBuyerApproachOptions),
	),
})
