import {
	defineEnum,
	freeForm,
	questionIds,
	questionRecord,
	single,
	type OptionMeta,
	type SlugOf,
} from '@/lib/profile/question-types'

// --- Profile / business enums ---

export const profileStatus = defineEnum('profile_status', [
	['draft', 'Draft'],
	['essentials_submitted', 'Essentials submitted'],
	['active', 'Active'],
	['enriched', 'Enriched'],
])

export const representationSide = defineEnum('representation_side', [
	['buyers', 'Buyers'],
	['sellers', 'Sellers'],
	['both', 'Both'],
])

export type RepresentationSide = SlugOf<typeof representationSide>

export const yearsLicensed = defineEnum('years_licensed', [
	['0-2', '0-2 years'],
	['3-5', '3-5 years'],
	['6-10', '6-10 years'],
	['10+', '10+ years'],
])

export type YearsLicensed = SlugOf<typeof yearsLicensed>

export const averageTransactions = defineEnum('average_transactions', [
	['0-5', '0-5 per year'],
	['6-15', '6-15 per year'],
	['16-30', '16-30 per year'],
	['30+', '30+ per year'],
])

export type AverageTransactions = SlugOf<typeof averageTransactions>

export const propertyType = defineEnum('property_type', [
	['singleFamily', 'Single-Family'],
	['condoTownhome', 'Condo/Townhome'],
	['multiFamily', 'Multi-family'],
	['land', 'Land'],
])

export type PropertyTypeSlug = SlugOf<typeof propertyType>

export const bestClientType = defineEnum('best_client_type', [
	['firstTime', 'First-time buyers'],
	['moveUp', 'Move-up or downsizing'],
	['relocation', 'Relocation'],
	['luxury', 'Luxury'],
	['investor', 'Investors'],
	['landMultiFamily', 'Land or multi-family'],
	['seller', 'Sellers & listings'],
	['condoTownhome', 'Condos & townhomes'],
	['other', 'Other'],
])

export type BestClientTypeSlug = SlugOf<typeof bestClientType>

export const timeline = defineEnum('timeline', [
	['exploring', 'Just exploring'],
	['1month', '1 month'],
	['2months', '2 months'],
	['3months', '3 months'],
	['4months', '4 months'],
	['5months', '5 months'],
	['6months', '6 months'],
	['7months', '7 months'],
	['8months', '8 months'],
	['9months', '9 months'],
	['10months', '10 months'],
	['11months', '11 months'],
	['12monthsPlus', '12+ months'],
])

// --- Question option sets shared across roles ---

export const quickCommunicationChannel = defineEnum(
	'quick_communication_channel',
	[
		['text', 'Text'],
		['phone', 'Phone'],
		['either', 'Either is fine'],
	],
)

export const updateDeliveryMethod = defineEnum('update_delivery_method', [
	['email', 'Email'],
	['textWithAttachments', 'Text with attachments'],
	['phoneThenEmailRecap', 'Phone, then email recap'],
])

const responseTimeEntries = [
	['within10Min', 'Within 10 minutes'],
	['within30Min', 'Within 30 minutes'],
	['fewHours', 'A few hours'],
	['within24Hours', 'Within 24 hours'],
] as const

export const responseTimeExpectation = defineEnum(
	'response_time_expectation',
	responseTimeEntries,
)

export const involvementLevel = defineEnum('involvement_level', [
	['veryInvolved', 'Very involved'],
	['keyDetails', 'Key details only'],
	['handsOff', 'Hands off'],
])

export const commissionComfort = defineEnum('commission_comfort', [
	['negotiate', 'I want to negotiate'],
	['openOptions', 'I want to understand options'],
	['payFairRate', "I'll pay a fair rate for the right fit"],
	['dontUnderstand', "I'm not sure how commission works"],
])

const involvementLevelMeta: Partial<
	Record<SlugOf<typeof involvementLevel>, OptionMeta>
> = {
	veryInvolved: { level: 3, description: 'I want to see everything' },
	keyDetails: { level: 2, description: 'Keep me in the loop' },
	handsOff: { level: 1, description: 'Tell me when it matters' },
}

// --- Quiz question lists ---

const sharedClientQuestions = [
	single('quickCommunicationChannel', {
		title: 'How do you prefer quick back-and-forth communication?',
		label: 'Quick chat',
		options: quickCommunicationChannel,
	}),
	single('updateDeliveryMethod', {
		title: 'How do you prefer updates, timelines, and documents?',
		label: 'Updates & docs',
		options: updateDeliveryMethod,
	}),
	single('responseTimeExpectation', {
		title: 'How quickly do you expect a response?',
		label: 'Response time',
		options: responseTimeExpectation,
	}),
	single('involvementLevel', {
		title: 'How involved do you want to be?',
		label: 'Involvement',
		options: involvementLevel,
		optionMeta: involvementLevelMeta,
	}),
] as const

const commissionComfortQuestion = (title: string) =>
	single('commissionComfort', {
		title,
		label: 'Commission',
		options: commissionComfort,
	})

const buyerQuestionList = [
	single('experienceLevel', {
		title: 'How familiar does this process feel?',
		label: 'Experience',
		options: defineEnum('buyer_experience_level', [
			['firstTime', "First time; I'll want guidance"],
			['experienced', "I've done this before, but want help staying on track"],
			['veryExperienced', 'I know the process and want a strong operator'],
		]),
	}),
	single('idealAgentRelationship', {
		title: 'What does your ideal agent relationship look like?',
		label: 'Ideal relationship',
		options: defineEnum('buyer_ideal_agent_relationship', [
			['trustedAdvisor', 'Trusted advisor'],
			['thinkingPartner', 'Thinking partner (collaborator)'],
			['skilledExecutor', 'Skilled executor'],
		]),
	}),
	single('decisionMakingNeed', {
		title: 'What do you need most to make a big decision?',
		label: 'Decision support',
		options: defineEnum('buyer_decision_making_need', [
			['numbersData', 'The numbers/data'],
			['timeAndSpace', 'Time and space'],
			['trustedPerspective', 'A trusted perspective'],
			['gutFeeling', 'A gut feeling'],
		]),
	}),
	single('biddingWarResponse', {
		title: 'After losing a bidding war, what do you need from your agent?',
		label: 'After a loss',
		options: defineEnum('buyer_bidding_war_response', [
			['factsOptions', 'Facts & options immediately'],
			['space', 'Space to step back'],
			['reassurance', 'Reassurance'],
			['calmPresence', 'Calm, steady presence'],
		]),
	}),
	...sharedClientQuestions,
	commissionComfortQuestion(
		'How do you plan to handle commission with your agent?',
	),
] as const

export const buyerQuestionIds = questionIds(buyerQuestionList)
export type BuyerQuestionId = (typeof buyerQuestionIds)[number]

export const buyerQuestions = questionRecord(buyerQuestionList)

const sellerQuestionList = [
	single('saleMotivation', {
		title: 'What is driving this sale?',
		label: 'Motivation',
		options: defineEnum('seller_sale_motivation', [
			['lifestyleChange', 'Lifestyle change'],
			['relocation', 'Relocation'],
			['financialPressure', 'Financial pressure'],
			['rightTime', 'Right time'],
			['majorTransition', 'Major life transition'],
			['other', 'Other'],
		]),
	}),
	single('successfulSaleLooksLike', {
		title: 'What does a successful sale look like to you?',
		label: 'Success definition',
		options: defineEnum('seller_successful_sale_looks_like', [
			['maximumPrice', 'Maximum price'],
			['strongPriceSmoothProcess', 'Strong price + smooth process'],
			['speedCertainty', 'Speed and certainty'],
			['mustCloseByDate', 'Must close by a specific date'],
		]),
	}),
	single('homeConnection', {
		title: 'How would you describe your connection to this home?',
		label: 'Home connection',
		options: defineEnum('seller_home_connection', [
			['asset', 'An asset'],
			['goodMemories', 'Good memories'],
			['partOfIdentity', 'Part of my identity'],
			['complicated', 'Complicated feelings'],
		]),
	}),
	single('agentSilencePreference', {
		title: 'When not hearing from your agent, what do you prefer?',
		label: 'Check-ins',
		options: defineEnum('seller_agent_silence_preference', [
			['scheduled', 'Scheduled check-ins'],
			['milestones', 'Milestone updates'],
			['clientLed', 'I reach out when I need something'],
		]),
	}),
	single('representationPreference', {
		title: 'Which matters more to you?',
		label: 'Exclusivity',
		options: defineEnum('seller_representation_preference', [
			['broadConnections', 'Broad connections'],
			['exclusiveRepresentationOnly', 'Exclusive representation only'],
		]),
	}),
	...sharedClientQuestions,
	commissionComfortQuestion(
		'How do you plan to handle listing-agent commission?',
	),
] as const

export const sellerQuestionIds = questionIds(sellerQuestionList)
export type SellerQuestionId = (typeof sellerQuestionIds)[number]

export const sellerQuestions = questionRecord(sellerQuestionList)

const agentQuestionList = [
	single('clientDescription', {
		title: 'How would clients describe working with you?',
		label: 'Client description',
		options: defineEnum('agent_client_description', [
			['strategicDataDriven', 'Strategic and data-driven'],
			['calmSteady', 'Calm and steady'],
			['warmRelational', 'Warm and relational'],
			['efficientDecisive', 'Efficient and decisive'],
		]),
	}),
	single('communicationFrequency', {
		title: 'How often do you communicate during a transaction?',
		label: 'Communication frequency',
		options: defineEnum('agent_communication_frequency', [
			['scheduled', 'Scheduled updates'],
			['milestones', 'At key milestones'],
			['clientLed', 'When client reaches out'],
		]),
	}),
	single('quickCommunicationChannel', {
		title: 'Preferred quick back-and-forth channel?',
		label: 'Quick chat',
		options: quickCommunicationChannel,
	}),
	single('updateDeliveryMethod', {
		title: 'How do you deliver updates, timelines, documents?',
		label: 'Updates & docs',
		options: updateDeliveryMethod,
	}),
	single('difficultDealInstinct', {
		title: 'Instinct when a deal gets difficult?',
		label: 'Difficult deals',
		options: defineEnum('agent_difficult_deal_instinct', [
			['factsFast', 'Get facts fast'],
			['slowItDown', 'Slow it down and regroup'],
			['takeControl', 'Take control of the situation'],
			['deEscalateFirst', 'De-escalate first'],
		]),
	}),
	single('responseTime', {
		title: 'How quickly do you typically respond to clients?',
		label: 'Response time',
		options: defineEnum('agent_response_time', responseTimeEntries),
	}),
	single('commissionApproach', {
		title: 'How do you approach commission conversations?',
		label: 'Commission approach',
		options: defineEnum('agent_commission_approach', [
			['proactiveFixed', 'Proactive, fixed structure'],
			['proactiveOpen', 'Proactive, open to discussion'],
			['reactiveFixed', 'Reactive, fixed structure'],
			['reactiveOpen', 'Reactive, open to discussion'],
		]),
	}),
	single('unrepresentedBuyerApproach', {
		title:
			'If a buyer without an agent wants to see your listing, how do you prefer to handle it?',
		label: 'Unrepresented buyers',
		options: defineEnum('agent_unrepresented_buyer_approach', [
			['referSeparateBrokerage', 'Refer to separate brokerage'],
			['representSellerOnly', 'Represent seller only'],
			['anotherAgentInBrokerage', 'Another agent in my brokerage'],
		]),
	}),
] as const

export const agentQuestionIds = questionIds(agentQuestionList)
export const agentQuestions = questionRecord(agentQuestionList)

export const notFitForQuestion = freeForm('notFitFor', {
	title: 'Who are you NOT the right fit for?',
	label: 'Not fit for',
	allowSkip: true,
})

const agentWorkStyleQuestionList = [
	...agentQuestionList,
	notFitForQuestion,
] as const

export const agentWorkStyleQuestionIds = questionIds(agentWorkStyleQuestionList)
export type AgentWorkStyleQuestionId =
	(typeof agentWorkStyleQuestionIds)[number]

export const agentWorkStyleQuestions = questionRecord(
	agentWorkStyleQuestionList,
)
