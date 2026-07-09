import { z } from 'zod'

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
		return answer
			.map((slug) => question.options[slug])
			.filter((label): label is string => typeof label === 'string')
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

export function optionKeys<const T extends Record<string, string>>(
	options: T,
): [keyof T & string, ...(keyof T & string)[]] {
	return Object.keys(options) as [keyof T & string, ...(keyof T & string)[]]
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
		options: {
			firstTime: "First time; I'll want guidance",
			experienced: "I've done this before, but want help staying on track",
			veryExperienced: 'I know the process and want a strong operator',
		} as const,
	},
	idealAgentRelationship: {
		title: 'What does your ideal agent relationship look like?',
		label: 'Ideal relationship',
		options: {
			trustedAdvisor: 'Trusted advisor',
			thinkingPartner: 'Thinking partner (collaborator)',
			skilledExecutor: 'Skilled executor',
		} as const,
	},
	decisionMakingNeed: {
		title: 'What do you need most to make a big decision?',
		label: 'Decision support',
		options: {
			numbersData: 'The numbers/data',
			timeAndSpace: 'Time and space',
			trustedPerspective: 'A trusted perspective',
			gutFeeling: 'A gut feeling',
		} as const,
	},
	biddingWarResponse: {
		title: 'After losing a bidding war, what do you need from your agent?',
		label: 'After a loss',
		options: {
			factsOptions: 'Facts & options immediately',
			space: 'Space to step back',
			reassurance: 'Reassurance',
			calmPresence: 'Calm, steady presence',
		} as const,
	},
	quickCommunicationChannel: {
		title: 'How do you prefer quick back-and-forth communication?',
		label: 'Quick chat',
		options: {
			text: 'Text',
			phone: 'Phone',
			either: 'Either is fine',
		} as const,
	},
	updateDeliveryMethod: {
		title: 'How do you prefer updates, timelines, and documents?',
		label: 'Updates & docs',
		options: {
			email: 'Email',
			textWithAttachments: 'Text with attachments',
			phoneThenEmailRecap: 'Phone call then email recap',
		} as const,
	},
	involvementLevel: {
		title: 'How involved do you want to be?',
		label: 'Involvement',
		options: {
			veryInvolved: 'Very involved',
			keyDetails: 'Key details only',
			handsOff: 'Hands off',
		} as const,
	},
	responseTimeExpectation: {
		title: 'How quickly do you expect a response?',
		label: 'Response time',
		options: {
			within10Min: 'Within 10 min',
			within30Min: '30 min',
			fewHours: 'A few hours',
			within24Hours: '24 hours',
		} as const,
	},
	commissionComfort: {
		title: 'How do you plan to handle commission with your agent?',
		label: 'Commission',
		options: {
			negotiate: 'Plan to negotiate',
			openOptions: 'Open but want options first',
			payFairRate: 'Will pay fair rate, not a concern',
			dontUnderstand: "Don't understand it yet",
		} as const,
	},
} satisfies AnswerLabels

export const sellerAnswerLabels = {
	saleMotivation: {
		title: 'What is driving this sale?',
		label: 'Motivation',
		options: {
			lifestyleChange: 'Lifestyle change',
			relocation: 'Relocation',
			financialPressure: 'Financial pressure',
			rightTime: 'Right time',
			majorTransition: 'Major personal transition',
			other: 'Other',
		} as const,
	},
	successfulSaleLooksLike: {
		title: 'What does a successful sale look like to you?',
		label: 'Success definition',
		options: {
			maximumPrice: 'Maximum price',
			strongPriceSmoothProcess: 'Strong price + smooth process',
			speedCertainty: 'Speed & certainty',
			mustCloseByDate: 'Must close by a specific date',
		} as const,
	},
	involvementLevel: {
		title: 'How involved do you want to be?',
		label: 'Involvement',
		options: {
			veryInvolved: 'Very involved',
			keepMeInformed: 'Keep me informed',
			handsOff: 'Hands off',
		} as const,
	},
	quickCommunicationChannel: {
		title: 'How do you prefer quick back-and-forth communication?',
		label: 'Quick chat',
		options: {
			text: 'Text',
			phone: 'Phone',
			either: 'Either is fine',
		} as const,
	},
	updateDeliveryMethod: {
		title: 'How do you prefer updates, timelines, and documents?',
		label: 'Updates & docs',
		options: {
			email: 'Email',
			textWithAttachments: 'Text with attachments',
			phoneThenEmailRecap: 'Phone call then email recap',
		} as const,
	},
	agentDeliveryExpectations: {
		title: 'What would make you feel your agent delivered? (choose up to 2)',
		label: 'Delivery expectations',
		options: {
			pricedRight: 'Priced it right',
			greatMarketing: 'Great marketing',
			greatNegotiatedOutcome: 'Great negotiated outcome',
			reachableResponsive: 'Reachable & responsive',
			keptItCalm: 'Kept it calm',
			honestStraightforward: 'Honest & straightforward',
		} as const,
		multiple: true,
	},
	homeConnection: {
		title: 'How would you describe your connection to this home?',
		label: 'Home connection',
		options: {
			asset: "It's an asset",
			goodMemories: 'Good memories, ready to move on',
			partOfIdentity: 'Part of my identity',
			complicated: 'Complicated/emotionally difficult',
		} as const,
	},
	agentSilencePreference: {
		title: 'When not hearing from your agent, what do you prefer?',
		label: 'Check-ins',
		options: {
			scheduled: 'Regular scheduled check-ins',
			milestones: 'Updates at key milestones',
			clientLed: "I'll reach out when needed",
		} as const,
	},
	representationPreference: {
		title: 'Which matters more to you?',
		label: 'Exclusivity',
		options: {
			broadConnections: 'Broad connections (even with competing loyalties)',
			exclusiveRepresentationOnly: 'Exclusive representation only',
		} as const,
	},
	responseTimeExpectation: {
		title: 'How quickly do you expect a response?',
		label: 'Response time',
		options: {
			within10Min: 'Within 10 min',
			within30Min: '30 min',
			fewHours: 'A few hours',
			within24Hours: '24 hours',
		} as const,
	},
	commissionComfort: {
		title: 'How do you plan to handle listing-agent commission?',
		label: 'Commission',
		options: {
			negotiate: 'Plan to negotiate',
			openOptions: 'Open but want options first',
			payFairRate: 'Will pay fair rate, not a concern',
			dontUnderstand: "Don't understand it yet",
		} as const,
	},
} satisfies AnswerLabels

export const agentAnswerLabels = {
	clientDescription: {
		title: 'How would clients describe working with you?',
		label: 'Client description',
		options: {
			strategicDataDriven: 'Strategic & data-driven',
			calmSteady: 'Calm & steady',
			warmRelational: 'Warm & relational',
			efficientDecisive: 'Efficient & decisive',
		} as const,
	},
	communicationFrequency: {
		title: 'How often do you communicate during a transaction?',
		label: 'Communication frequency',
		options: {
			scheduled: 'Regular scheduled check-ins',
			milestones: 'At key milestones',
			clientLed: 'Client-led pace',
		} as const,
	},
	quickCommunicationChannel: {
		title: 'Preferred quick back-and-forth channel?',
		label: 'Quick chat',
		options: {
			text: 'Text',
			phone: 'Phone',
			either: 'Either is fine',
		} as const,
	},
	updateDeliveryMethod: {
		title: 'How do you deliver updates, timelines, documents?',
		label: 'Updates & docs',
		options: {
			email: 'Email',
			textWithAttachments: 'Text with attachments',
			phoneThenEmailRecap: 'Phone call then email recap',
		} as const,
	},
	difficultDealInstinct: {
		title: 'Instinct when a deal gets difficult?',
		label: 'Difficult deals',
		options: {
			factsFast: 'Facts fast',
			slowItDown: 'Slow it down',
			takeControl: 'Take control',
			deEscalateFirst: 'De-escalate first',
		} as const,
	},
	responseTime: {
		title: 'How quickly do you typically respond to clients?',
		label: 'Response time',
		options: {
			within10Min: 'Within 10 min',
			within30Min: '30 min',
			fewHours: 'A few hours',
			within24Hours: '24 hours',
		} as const,
	},
	commissionApproach: {
		title: 'How do you approach commission conversations?',
		label: 'Commission approach',
		options: {
			proactiveFixed: 'Proactive & fixed rate',
			proactiveOpen: 'Proactive & open to discussion',
			reactiveFixed: 'Reactive & fixed rate',
			reactiveOpen: 'Reactive & open',
		} as const,
	},
	unrepresentedBuyerApproach: {
		title: 'Unrepresented buyer approaches your listing — what do you do?',
		label: 'Unrepresented buyers',
		options: {
			referSeparateBrokerage: 'Refer to a separate brokerage',
			representSellerOnly:
				'Represent seller only, buyer unrepresented (disclosed)',
			anotherAgentInBrokerage:
				'Another agent at your brokerage represents buyer (disclosed)',
		} as const,
	},
} satisfies AnswerLabels

export const bestClientTypeOptions = {
	firstTime: 'First-time buyers',
	moveUp: 'Move-up or downsizing',
	relocation: 'Relocation',
	luxury: 'Luxury',
	investor: 'Investors',
	landMultiFamily: 'Land or multi-family',
	seller: 'Sellers & listings',
	condoTownhome: 'Condos & townhomes',
	other: 'Other',
} as const

export const bestClientTypeLabels: Record<string, string> =
	bestClientTypeOptions

export type BestClientTypeSlug = keyof typeof bestClientTypeOptions

export const propertyTypeOptions = {
	singleFamily: 'Single-Family',
	condoTownhome: 'Condo/Townhome',
	multiFamily: 'Multi-family',
	land: 'Land',
} as const

export type PropertyTypeSlug = keyof typeof propertyTypeOptions

export const propertyTypesSchema = z.array(
	z.enum(optionKeys(propertyTypeOptions)),
)

export const bestClientTypesSchema = z.array(
	z.enum(optionKeys(bestClientTypeOptions)),
)

export const buyerAnswerSchema = z.object({
	experienceLevel: z.enum(
		optionKeys(buyerAnswerLabels.experienceLevel.options),
	),
	idealAgentRelationship: z.enum(
		optionKeys(buyerAnswerLabels.idealAgentRelationship.options),
	),
	decisionMakingNeed: z.enum(
		optionKeys(buyerAnswerLabels.decisionMakingNeed.options),
	),
	biddingWarResponse: z.enum(
		optionKeys(buyerAnswerLabels.biddingWarResponse.options),
	),
	quickCommunicationChannel: z.enum(
		optionKeys(buyerAnswerLabels.quickCommunicationChannel.options),
	),
	updateDeliveryMethod: z.enum(
		optionKeys(buyerAnswerLabels.updateDeliveryMethod.options),
	),
	involvementLevel: z.enum(
		optionKeys(buyerAnswerLabels.involvementLevel.options),
	),
	responseTimeExpectation: z.enum(
		optionKeys(buyerAnswerLabels.responseTimeExpectation.options),
	),
	commissionComfort: z.enum(
		optionKeys(buyerAnswerLabels.commissionComfort.options),
	),
})

export const sellerAnswerSchema = z.object({
	saleMotivation: z.enum(optionKeys(sellerAnswerLabels.saleMotivation.options)),
	successfulSaleLooksLike: z.enum(
		optionKeys(sellerAnswerLabels.successfulSaleLooksLike.options),
	),
	involvementLevel: z.enum(
		optionKeys(sellerAnswerLabels.involvementLevel.options),
	),
	quickCommunicationChannel: z.enum(
		optionKeys(sellerAnswerLabels.quickCommunicationChannel.options),
	),
	updateDeliveryMethod: z.enum(
		optionKeys(sellerAnswerLabels.updateDeliveryMethod.options),
	),
	agentDeliveryExpectations: z.array(
		z.enum(optionKeys(sellerAnswerLabels.agentDeliveryExpectations.options)),
	),
	homeConnection: z.enum(optionKeys(sellerAnswerLabels.homeConnection.options)),
	agentSilencePreference: z.enum(
		optionKeys(sellerAnswerLabels.agentSilencePreference.options),
	),
	representationPreference: z.enum(
		optionKeys(sellerAnswerLabels.representationPreference.options),
	),
	responseTimeExpectation: z.enum(
		optionKeys(sellerAnswerLabels.responseTimeExpectation.options),
	),
	commissionComfort: z.enum(
		optionKeys(sellerAnswerLabels.commissionComfort.options),
	),
})

export const agentAnswerSchema = z.object({
	clientDescription: z.enum(
		optionKeys(agentAnswerLabels.clientDescription.options),
	),
	communicationFrequency: z.enum(
		optionKeys(agentAnswerLabels.communicationFrequency.options),
	),
	quickCommunicationChannel: z.enum(
		optionKeys(agentAnswerLabels.quickCommunicationChannel.options),
	),
	updateDeliveryMethod: z.enum(
		optionKeys(agentAnswerLabels.updateDeliveryMethod.options),
	),
	difficultDealInstinct: z.enum(
		optionKeys(agentAnswerLabels.difficultDealInstinct.options),
	),
	responseTime: z.enum(optionKeys(agentAnswerLabels.responseTime.options)),
	commissionApproach: z.enum(
		optionKeys(agentAnswerLabels.commissionApproach.options),
	),
	unrepresentedBuyerApproach: z.enum(
		optionKeys(agentAnswerLabels.unrepresentedBuyerApproach.options),
	),
})
