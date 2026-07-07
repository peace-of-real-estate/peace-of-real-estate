import { z } from 'zod'

export type Question = {
	id: string
	title: string
	options: Record<string, string>
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

type AnswerLabelConfig = {
	title: string
	label: string
	options: Record<string, string>
	multiple?: boolean
}

export type AnswerLabels = Record<string, AnswerLabelConfig>

export const buyerAnswerLabels: AnswerLabels = {
	experienceLevel: {
		title: 'How familiar does this process feel?',
		label: 'Experience',
		options: {
			firstTime: "First time; I'll want guidance",
			experienced: "I've done this before, but want help staying on track",
			veryExperienced: 'I know the process and want a strong operator',
		},
	},
	idealAgentRelationship: {
		title: 'What does your ideal agent relationship look like?',
		label: 'Ideal relationship',
		options: {
			trustedAdvisor: 'Trusted advisor',
			thinkingPartner: 'Thinking partner (collaborator)',
			skilledExecutor: 'Skilled executor',
		},
	},
	decisionMakingNeed: {
		title: 'What do you need most to make a big decision?',
		label: 'Decision support',
		options: {
			numbersData: 'The numbers/data',
			timeAndSpace: 'Time and space',
			trustedPerspective: 'A trusted perspective',
			gutFeeling: 'A gut feeling',
		},
	},
	biddingWarResponse: {
		title: 'After losing a bidding war, what do you need from your agent?',
		label: 'After a loss',
		options: {
			factsOptions: 'Facts & options immediately',
			space: 'Space to step back',
			reassurance: 'Reassurance',
			calmPresence: 'Calm, steady presence',
		},
	},
	quickCommunicationChannel: {
		title: 'How do you prefer quick back-and-forth communication?',
		label: 'Quick chat',
		options: {
			text: 'Text',
			phone: 'Phone',
			either: 'Either is fine',
		},
	},
	updateDeliveryMethod: {
		title: 'How do you prefer updates, timelines, and documents?',
		label: 'Updates & docs',
		options: {
			email: 'Email',
			textWithAttachments: 'Text with attachments',
			phoneThenEmailRecap: 'Phone call then email recap',
		},
	},
	involvementLevel: {
		title: 'How involved do you want to be?',
		label: 'Involvement',
		options: {
			veryInvolved: 'Very involved',
			keyDetails: 'Key details only',
			handsOff: 'Hands off',
		},
	},
	responseTimeExpectation: {
		title: 'How quickly do you expect a response?',
		label: 'Response time',
		options: {
			within10Min: 'Within 10 min',
			within30Min: '30 min',
			fewHours: 'A few hours',
			within24Hours: '24 hours',
		},
	},
	commissionComfort: {
		title: 'How do you plan to handle commission with your agent?',
		label: 'Commission',
		options: {
			negotiate: 'Plan to negotiate',
			openOptions: 'Open but want options first',
			payFairRate: 'Will pay fair rate, not a concern',
			dontUnderstand: "Don't understand it yet",
		},
	},
}

export const sellerAnswerLabels: AnswerLabels = {
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
		},
	},
	successfulSaleLooksLike: {
		title: 'What does a successful sale look like to you?',
		label: 'Success definition',
		options: {
			maximumPrice: 'Maximum price',
			strongPriceSmoothProcess: 'Strong price + smooth process',
			speedCertainty: 'Speed & certainty',
			mustCloseByDate: 'Must close by a specific date',
		},
	},
	involvementLevel: {
		title: 'How involved do you want to be?',
		label: 'Involvement',
		options: {
			veryInvolved: 'Very involved',
			keepMeInformed: 'Keep me informed',
			handsOff: 'Hands off',
		},
	},
	quickCommunicationChannel: {
		title: 'How do you prefer quick back-and-forth communication?',
		label: 'Quick chat',
		options: {
			text: 'Text',
			phone: 'Phone',
			either: 'Either is fine',
		},
	},
	updateDeliveryMethod: {
		title: 'How do you prefer updates, timelines, and documents?',
		label: 'Updates & docs',
		options: {
			email: 'Email',
			textWithAttachments: 'Text with attachments',
			phoneThenEmailRecap: 'Phone call then email recap',
		},
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
		},
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
		},
	},
	agentSilencePreference: {
		title: 'When not hearing from your agent, what do you prefer?',
		label: 'Check-ins',
		options: {
			scheduled: 'Regular scheduled check-ins',
			milestones: 'Updates at key milestones',
			clientLed: "I'll reach out when needed",
		},
	},
	representationPreference: {
		title: 'Which matters more to you?',
		label: 'Exclusivity',
		options: {
			broadConnections: 'Broad connections (even with competing loyalties)',
			exclusiveRepresentationOnly: 'Exclusive representation only',
		},
	},
	responseTimeExpectation: {
		title: 'How quickly do you expect a response?',
		label: 'Response time',
		options: {
			within10Min: 'Within 10 min',
			within30Min: '30 min',
			fewHours: 'A few hours',
			within24Hours: '24 hours',
		},
	},
	commissionComfort: {
		title: 'How do you plan to handle listing-agent commission?',
		label: 'Commission',
		options: {
			negotiate: 'Plan to negotiate',
			openOptions: 'Open but want options first',
			payFairRate: 'Will pay fair rate, not a concern',
			dontUnderstand: "Don't understand it yet",
		},
	},
}

export const agentAnswerLabels: AnswerLabels = {
	typicalPriceRange: {
		title: 'What is your typical price range?',
		label: 'Price range',
		options: {
			under400k: 'Under $400k',
			'400kTo750k': '$400k–$750k',
			'750kTo1_5M': '$750k–$1.5M',
			'1_5MPlus': '$1.5M and above',
		},
	},
	clientDescription: {
		title: 'How would clients describe working with you?',
		label: 'Client description',
		options: {
			strategicDataDriven: 'Strategic & data-driven',
			calmSteady: 'Calm & steady',
			warmRelational: 'Warm & relational',
			efficientDecisive: 'Efficient & decisive',
		},
	},
	communicationFrequency: {
		title: 'How often do you communicate during a transaction?',
		label: 'Communication frequency',
		options: {
			scheduled: 'Regular scheduled check-ins',
			milestones: 'At key milestones',
			clientLed: 'Client-led pace',
		},
	},
	quickCommunicationChannel: {
		title: 'Preferred quick back-and-forth channel?',
		label: 'Quick chat',
		options: {
			text: 'Text',
			phone: 'Phone',
			either: 'Either is fine',
		},
	},
	updateDeliveryMethod: {
		title: 'How do you deliver updates, timelines, documents?',
		label: 'Updates & docs',
		options: {
			email: 'Email',
			textWithAttachments: 'Text with attachments',
			phoneThenEmailRecap: 'Phone call then email recap',
		},
	},
	difficultDealInstinct: {
		title: 'Instinct when a deal gets difficult?',
		label: 'Difficult deals',
		options: {
			factsFast: 'Facts fast',
			slowItDown: 'Slow it down',
			takeControl: 'Take control',
			deEscalateFirst: 'De-escalate first',
		},
	},
	responseTime: {
		title: 'How quickly do you typically respond to clients?',
		label: 'Response time',
		options: {
			within10Min: 'Within 10 min',
			within30Min: '30 min',
			fewHours: 'A few hours',
			within24Hours: '24 hours',
		},
	},
	commissionApproach: {
		title: 'How do you approach commission conversations?',
		label: 'Commission approach',
		options: {
			proactiveFixed: 'Proactive & fixed rate',
			proactiveOpen: 'Proactive & open to discussion',
			reactiveFixed: 'Reactive & fixed rate',
			reactiveOpen: 'Reactive & open',
		},
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
		},
	},
}

export const bestClientTypeLabels: Record<string, string> = {
	firstTime: 'First-time buyers',
	moveUp: 'Move-up or downsizing',
	relocation: 'Relocation',
	luxury: 'Luxury',
	investor: 'Investors',
	landMultiFamily: 'Land or multi-family',
	seller: 'Sellers & listings',
	condoTownhome: 'Condos & townhomes',
	other: 'Other',
}

export const propertyTypeOptions = {
	singleFamily: 'Single-Family',
	condoTownhome: 'Condo/Townhome',
	multiFamily: 'Multi-family',
	land: 'Land',
} as const
