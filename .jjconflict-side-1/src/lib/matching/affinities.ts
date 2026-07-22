export type AffinityMatrix = Record<string, Record<string, number>>

type ResponseTimeSlug =
	| 'within10Min'
	| 'within30Min'
	| 'fewHours'
	| 'within24Hours'

const RESPONSE_TIME_STEPS: ResponseTimeSlug[] = [
	'within10Min',
	'within30Min',
	'fewHours',
	'within24Hours',
]

function responseTimeIndex(slug: string): number {
	return RESPONSE_TIME_STEPS.findIndex((step) => step === slug)
}

export const clientDescriptionAffinityMatrix: AffinityMatrix = {
	strategicDataDriven: {
		strategicDataDriven: 1.0,
		calmSteady: 0.4,
		warmRelational: 0.2,
		efficientDecisive: 0.7,
	},
	calmSteady: {
		strategicDataDriven: 0.4,
		calmSteady: 1.0,
		warmRelational: 0.7,
		efficientDecisive: 0.2,
	},
	warmRelational: {
		strategicDataDriven: 0.2,
		calmSteady: 0.7,
		warmRelational: 1.0,
		efficientDecisive: 0.3,
	},
	efficientDecisive: {
		strategicDataDriven: 0.7,
		calmSteady: 0.2,
		warmRelational: 0.3,
		efficientDecisive: 1.0,
	},
}

export const dealInstinctAffinityMatrix: AffinityMatrix = {
	factsFast: {
		factsFast: 1.0,
		slowItDown: 0.3,
		takeControl: 0.6,
		deEscalateFirst: 0.4,
	},
	slowItDown: {
		factsFast: 0.3,
		slowItDown: 1.0,
		takeControl: 0.2,
		deEscalateFirst: 0.7,
	},
	takeControl: {
		factsFast: 0.6,
		slowItDown: 0.2,
		takeControl: 1.0,
		deEscalateFirst: 0.5,
	},
	deEscalateFirst: {
		factsFast: 0.4,
		slowItDown: 0.7,
		takeControl: 0.5,
		deEscalateFirst: 1.0,
	},
}

export const buyerDecisionMakingMatrix: AffinityMatrix = {
	numbersData: {
		strategicDataDriven: 1.0,
		calmSteady: 0.4,
		warmRelational: 0.2,
		efficientDecisive: 0.7,
	},
	timeAndSpace: {
		strategicDataDriven: 0.4,
		calmSteady: 1.0,
		warmRelational: 0.7,
		efficientDecisive: 0.2,
	},
	trustedPerspective: {
		strategicDataDriven: 0.5,
		calmSteady: 0.8,
		warmRelational: 1.0,
		efficientDecisive: 0.4,
	},
	gutFeeling: {
		strategicDataDriven: 0.3,
		calmSteady: 0.8,
		warmRelational: 1.0,
		efficientDecisive: 0.5,
	},
}

export const buyerBiddingWarMatrix: AffinityMatrix = {
	factsOptions: {
		factsFast: 1.0,
		slowItDown: 0.3,
		takeControl: 0.6,
		deEscalateFirst: 0.4,
	},
	space: {
		factsFast: 0.3,
		slowItDown: 1.0,
		takeControl: 0.2,
		deEscalateFirst: 0.7,
	},
	reassurance: {
		factsFast: 0.4,
		slowItDown: 0.7,
		takeControl: 0.4,
		deEscalateFirst: 1.0,
	},
	calmPresence: {
		factsFast: 0.4,
		slowItDown: 0.8,
		takeControl: 0.5,
		deEscalateFirst: 1.0,
	},
}

export const buyerIdealRelationshipMatrix: AffinityMatrix = {
	trustedAdvisor: {
		strategicDataDriven: 0.5,
		calmSteady: 0.9,
		warmRelational: 1.0,
		efficientDecisive: 0.4,
	},
	thinkingPartner: {
		strategicDataDriven: 1.0,
		calmSteady: 0.7,
		warmRelational: 0.8,
		efficientDecisive: 0.4,
	},
	skilledExecutor: {
		strategicDataDriven: 0.8,
		calmSteady: 0.4,
		warmRelational: 0.3,
		efficientDecisive: 1.0,
	},
}

export const sellerHomeConnectionMatrix: AffinityMatrix = {
	asset: {
		strategicDataDriven: 1.0,
		calmSteady: 0.5,
		warmRelational: 0.4,
		efficientDecisive: 0.9,
	},
	goodMemories: {
		strategicDataDriven: 0.6,
		calmSteady: 0.9,
		warmRelational: 0.9,
		efficientDecisive: 0.6,
	},
	partOfIdentity: {
		strategicDataDriven: 0.2,
		calmSteady: 0.9,
		warmRelational: 1.0,
		efficientDecisive: 0.2,
	},
	complicated: {
		strategicDataDriven: 0.2,
		calmSteady: 1.0,
		warmRelational: 0.8,
		efficientDecisive: 0.2,
	},
}

export const sellerRepresentationMatrix: AffinityMatrix = {
	broadConnections: {
		referSeparateBrokerage: 0.6,
		representSellerOnly: 0.8,
		anotherAgentInBrokerage: 1.0,
	},
	exclusiveRepresentationOnly: {
		referSeparateBrokerage: 1.0,
		representSellerOnly: 0.8,
		anotherAgentInBrokerage: 0.15,
	},
}

export const commissionMatrix: AffinityMatrix = {
	negotiate: {
		proactiveFixed: 0.3,
		proactiveOpen: 1.0,
		reactiveFixed: 0.1,
		reactiveOpen: 0.8,
	},
	openOptions: {
		proactiveFixed: 0.7,
		proactiveOpen: 1.0,
		reactiveFixed: 0.3,
		reactiveOpen: 0.6,
	},
	payFairRate: {
		proactiveFixed: 1.0,
		proactiveOpen: 0.8,
		reactiveFixed: 0.7,
		reactiveOpen: 0.6,
	},
	dontUnderstand: {
		proactiveFixed: 0.9,
		proactiveOpen: 1.0,
		reactiveFixed: 0.2,
		reactiveOpen: 0.2,
	},
}

const frequencyMatrix: AffinityMatrix = {
	veryInvolved: {
		scheduled: 1.0,
		milestones: 0.4,
		clientLed: 0.7,
	},
	keyDetails: {
		scheduled: 0.6,
		milestones: 1.0,
		clientLed: 0.6,
	},
	handsOff: {
		scheduled: 0.3,
		milestones: 0.8,
		clientLed: 1.0,
	},
}

const sellerFrequencyMatrix: AffinityMatrix = {
	scheduled: {
		scheduled: 1.0,
		milestones: 0.4,
		clientLed: 0.7,
	},
	milestones: {
		scheduled: 0.6,
		milestones: 1.0,
		clientLed: 0.6,
	},
	clientLed: {
		scheduled: 0.3,
		milestones: 0.8,
		clientLed: 1.0,
	},
}

export function scoreChannel(
	clientChannel: string,
	agentChannel: string,
): number {
	if (clientChannel === agentChannel) return 1.0
	if (clientChannel === 'either' || agentChannel === 'either') return 0.85
	return 0.2
}

export function scoreDelivery(
	clientDelivery: string,
	agentDelivery: string,
): number {
	if (clientDelivery === agentDelivery) return 1.0
	return 0.6
}

export function scoreResponseTime(
	clientExpectation: string,
	agentResponseTime: string,
): number {
	const clientIndex = responseTimeIndex(clientExpectation)
	const agentIndex = responseTimeIndex(agentResponseTime)
	const gap = agentIndex - clientIndex
	if (gap <= 0) return 1.0
	if (gap === 1) return 0.5
	return 0.15
}

export function scoreFrequency(
	clientFrequency: string,
	agentFrequency: string,
): number {
	const row = frequencyMatrix[clientFrequency]
	if (!row) return 0.6
	return row[agentFrequency] ?? 0.6
}

export function scoreSellerFrequency(
	clientFrequency: string,
	agentFrequency: string,
): number {
	const row = sellerFrequencyMatrix[clientFrequency]
	if (!row) return 0.6
	return row[agentFrequency] ?? 0.6
}

export const structuredNotFitForOptions: Record<string, string> = {
	investors: 'Investors or flippers',
	fixerUpper: 'Fixer-upper / heavy renovation buyers',
	luxury: 'Luxury or estate sales',
	entryLevel: 'Entry-level / first-time buyers',
	shortTimeline: 'Clients who need to close in under 30 days',
	unrepresentedBuyers: 'Unrepresented buyers in dual agency',
	outOfArea: 'Clients outside my metro area',
	dailyUpdates: 'Clients who want daily updates',
	commercial: 'Commercial or multi-family investors',
	remoteOnly: 'Clients who only want virtual/remote service',
	other: 'Other (free-form)',
}

export const notFitForClientTypeHits: Record<string, string[]> = {
	investors: ['investor'],
	fixerUpper: ['investor'],
	luxury: ['luxury'],
	entryLevel: ['firstTime'],
	commercial: ['investor', 'landMultiFamily'],
}

export const notFitForNegativeScore = 0.3

/**
 * Experience and trust signals are intentionally not scoring dimensions:
 * trust attestations (peace pact, license, E&O) are required at signup, so
 * they cannot differentiate agents, and years licensed / volume said little
 * about fit for a specific client.
 */
export const baseDimensionWeights = {
	location: 22,
	priceFit: 16,
	specialization: 14,
	workingStyle: 28,
	communication: 13,
	businessTerms: 7,
} as const

export type DimensionId = keyof typeof baseDimensionWeights

export const DIMENSION_IDS: DimensionId[] = [
	'location',
	'priceFit',
	'specialization',
	'workingStyle',
	'communication',
	'businessTerms',
]

export const DIMENSION_LABELS: Record<DimensionId, string> = {
	location: 'Location',
	priceFit: 'Price fit',
	specialization: 'Specialization',
	workingStyle: 'Working style & temperament',
	communication: 'Communication',
	businessTerms: 'Business terms',
}

export const priorityToDimension: Record<string, DimensionId> = {
	priceRange: 'priceFit',
	propertyTypes: 'specialization',
	state: 'location',
	city: 'location',
	zipCodes: 'location',
	quickCommunicationChannel: 'communication',
	updateDeliveryMethod: 'communication',
	responseTimeExpectation: 'communication',
	commissionComfort: 'businessTerms',
	idealAgentRelationship: 'workingStyle',
	decisionMakingNeed: 'workingStyle',
	biddingWarResponse: 'workingStyle',
	homeConnection: 'workingStyle',
	agentDeliveryExpectations: 'workingStyle',
	representationPreference: 'businessTerms',
}

export const experienceWeightModulation: Record<
	string,
	Partial<Record<DimensionId, number>>
> = {
	firstTime: { workingStyle: 4 },
	veryExperienced: { communication: 3, priceFit: 3 },
}

export const sellerStakesModulation: Record<
	string,
	Partial<Record<DimensionId, number>>
> = {
	financialPressure: { communication: 3, businessTerms: 2 },
	speedCertainty: { communication: 3, businessTerms: 2 },
	mustCloseByDate: { communication: 3, businessTerms: 2 },
	maximumPrice: { workingStyle: 3, priceFit: 2 },
}

export function lookUpAffinity(
	matrix: AffinityMatrix,
	clientSlug: string,
	agentSlug: string,
): number | undefined {
	const row = matrix[clientSlug]
	if (!row) return undefined
	return row[agentSlug]
}
