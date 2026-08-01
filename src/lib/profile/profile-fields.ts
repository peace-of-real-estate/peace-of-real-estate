import {
	defineEnum,
	multi,
	questionIds,
	questionRecord,
	single,
	type SlugOf,
} from '@/lib/profile/question-types'

export const profileStatus = defineEnum('profile_status', [
	['draft', 'Draft'],
	['essentials_submitted', 'Essentials submitted'],
	['active', 'Active'],
	['enriched', 'Enriched'],
])

export type ProfileStatus = SlugOf<typeof profileStatus>

export const representationSide = defineEnum('representation_side', [
	['buyer', 'Buyers'],
	['seller', 'Sellers'],
])

export type RepresentationSide = SlugOf<typeof representationSide>

export const yearsLicensed = defineEnum('years_licensed', [
	['0-2', '0-2 years'],
	['3-5', '3-5 years'],
	['6-10', '6-10 years'],
	['10+', '10+ years'],
])

export type YearsLicensed = SlugOf<typeof yearsLicensed>

export const propertyType = defineEnum('property_type', [
	['singleFamily', 'Single-Family'],
	['condoTownhome', 'Condo/Townhome'],
	['multiFamily', 'Multi-family'],
	['land', 'Land'],
])

export type PropertyTypeSlug = SlugOf<typeof propertyType>

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

export const riskComfort = defineEnum('risk_comfort', [
	['noRisk', 'No avoidable risk'],
	['lowRisk', 'Low risk'],
	['moderateRisk', 'Moderate risk'],
	['allIn', 'High risk when the upside justifies it'],
])

export const contactStyle = defineEnum('contact_style', [
	['whenItMatters', 'Only when it matters'],
	['regularCheckins', 'Regular texts, calls for anything major'],
	['handsOn', 'Frequent contact — calls and walkthroughs'],
])

export const specialty = defineEnum('specialty', [
	['vaMilitary', 'VA / military'],
	['fhaDownPayment', 'FHA / down payment help'],
	['assumableLoans', 'Assumable loans'],
	['bridgeLoans', 'Bridge loans'],
	['ownerFinancing', 'Owner financing'],
	['renovationLoans', 'Renovation loans'],
	['exchange1031', '1031 exchange'],
	['reverseMortgage', 'Reverse mortgage'],
	['investmentRental', 'Investment / rental'],
	['newConstruction', 'New construction'],
	['shortSales', 'Short sales'],
	['probateEstate', 'Probate / estate'],
	['tenantOccupied', 'Tenant-occupied property'],
	['auction', 'Auction'],
	['multigenerational', 'Multigenerational'],
	['seniors55Plus', '55+ / seniors'],
	['relocationOutOfState', 'Out-of-state relocation'],
	['internationalBuyers', 'International buyers'],
])

export const buyerExperience = defineEnum('buyer_experience', [
	['firstTime', 'First time'],
	['onceOrTwice', 'Once or twice'],
	['severalTimes', 'Several times'],
])

export const sellerMotivation = defineEnum('seller_motivation', [
	['differentSize', 'Need a different size or setup'],
	['relocating', 'Relocating'],
	['lifeChange', 'Major life change'],
	['rightTime', 'It is simply the right time'],
])

export const enjoyedClientType = defineEnum('enjoyed_client_type', [
	['firstTimeBuyers', 'First-time buyers'],
	['firstTimeSellers', 'First-time sellers'],
	['moveUp', 'Move-up buyers'],
	['downsizers', 'Downsizers'],
	['relocating', 'Relocating clients'],
	['experiencedLowMaintenance', 'Experienced, low-maintenance clients'],
	['luxury', 'Luxury clients'],
	['investors', 'Investors'],
	['lifeChangeSellers', 'Life-change sellers'],
])

export type EnjoyedClientTypeSlug = SlugOf<typeof enjoyedClientType>

export const agentEnergyFocus = defineEnum('agent_energy_focus', [
	['fightHard', 'Fighting hard'],
	['calm', 'Staying calm and steady'],
	['moveFast', 'Moving fast'],
	['spotProblems', 'Spotting problems early'],
	['explainSteps', 'Explaining each step'],
	['localKnowledge', 'Local knowledge'],
])

export const clientDecisionStyle = defineEnum('client_decision_style', [
	['letThemLead', 'Let me lead'],
	['walkMeThrough', 'Walk me through it'],
	['middleGround', 'Meet me in the middle'],
	['finalCall', 'Give your view, but I make the final call'],
])

export const agentDecisionStyle = defineEnum('agent_decision_style', [
	['theyLetMeLead', 'They let me lead'],
	['walkThroughFollow', 'I walk them through it'],
	['middleGround', 'We meet in the middle'],
	['theirCall', 'I advise, they decide'],
])

export const clientCommissionPlan = defineEnum('client_commission_plan', [
	['negotiate', 'I plan to negotiate'],
	['discussThenDecide', 'Discuss it, then decide'],
	['acceptRate', 'Accept the stated rate if the fit is right'],
])

export const agentCommissionStyle = defineEnum('agent_commission_style', [
	['openToNegotiating', 'Open to negotiating'],
	['walkThroughRate', "I'll walk you through my rate"],
	['rateIsSet', 'My rate is set'],
])

const sharedClientQuestions = [
	single('decisionStyle', {
		title: 'How do you want decisions to work with your agent?',
		label: 'Decision style',
		options: clientDecisionStyle,
	}),
	single('contactStyle', {
		title: 'How do you want your agent to stay in touch?',
		label: 'Staying in touch',
		options: contactStyle,
	}),
	single('riskComfort', {
		title: 'How comfortable are you with risk?',
		label: 'Risk comfort',
		options: riskComfort,
	}),
	single('commissionPlan', {
		title: 'How do you plan to handle commission?',
		label: 'Commission plan',
		options: clientCommissionPlan,
	}),
	multi('situationSpecialties', {
		title: 'Do any special situations apply?',
		label: 'Special situations',
		options: specialty,
		minSelections: 0,
		maxSelections: 5,
	}),
] as const

const buyerQuestionList = [
	single('buyingExperience', {
		title: 'Have you bought a home before?',
		label: 'Buying experience',
		options: buyerExperience,
	}),
	...sharedClientQuestions,
] as const

export const buyerQuestionIds = questionIds(buyerQuestionList)
export type BuyerQuestionId = (typeof buyerQuestionIds)[number]
export const buyerQuestions = questionRecord(buyerQuestionList)

const sellerQuestionList = [
	single('sellingMotivation', {
		title: 'What is motivating your sale?',
		label: 'Selling motivation',
		options: sellerMotivation,
	}),
	...sharedClientQuestions,
] as const

export const sellerQuestionIds = questionIds(sellerQuestionList)
export type SellerQuestionId = (typeof sellerQuestionIds)[number]
export const sellerQuestions = questionRecord(sellerQuestionList)

const agentQuestionList = [
	multi('enjoyedClients', {
		title: 'Which clients do you most enjoy working with?',
		label: 'Enjoyed clients',
		options: enjoyedClientType,
		minSelections: 1,
		maxSelections: 2,
	}),
	single('clientDecisionStyle', {
		title: 'How do decisions work with your best clients?',
		label: 'Client decisions',
		options: agentDecisionStyle,
	}),
	single('clientContactStyle', {
		title: 'How do you usually keep clients updated?',
		label: 'Client updates',
		options: contactStyle,
	}),
	single('riskAdviceComfort', {
		title: 'How much risk are you comfortable advising through?',
		label: 'Risk advice',
		options: riskComfort,
	}),
	single('commissionStyle', {
		title: 'How do you approach commission?',
		label: 'Commission style',
		options: agentCommissionStyle,
	}),
	multi('specialties', {
		title: 'Which special situations are you strongest in?',
		label: 'Specialties',
		options: specialty,
		minSelections: 0,
		maxSelections: 5,
	}),
	multi('energyFocus', {
		title: 'Where do you put the most energy?',
		label: 'Energy focus',
		options: agentEnergyFocus,
		minSelections: 2,
		maxSelections: 2,
	}),
] as const

export const agentQuestionIds = questionIds(agentQuestionList)
export type AgentQuestionId = (typeof agentQuestionIds)[number]
export const agentQuestions = questionRecord(agentQuestionList)
