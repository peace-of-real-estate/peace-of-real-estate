export function optionKeys<const T extends Record<string, string>>(
	options: T,
): [keyof T & string, ...(keyof T & string)[]] {
	// Object.keys returns string[]; this tuple shape is guaranteed by the caller.
	// oxlint-disable-next-line typescript/consistent-type-assertions
	return Object.keys(options) as [keyof T & string, ...(keyof T & string)[]]
}

export const profileStatusOptions = {
	draft: 'Draft',
	essentials_submitted: 'Essentials submitted',
	active: 'Active',
	enriched: 'Enriched',
} as const

export const representationSideOptions = {
	buying: 'Buying',
	selling: 'Selling',
	both: 'Both',
} as const

export const propertyTypeOptions = {
	singleFamily: 'Single-Family',
	condoTownhome: 'Condo/Townhome',
	multiFamily: 'Multi-family',
	land: 'Land',
} as const

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

export const buyerExperienceLevelOptions = {
	firstTime: "First time; I'll want guidance",
	experienced: "I've done this before, but want help staying on track",
	veryExperienced: 'I know the process and want a strong operator',
} as const

export const buyerIdealAgentRelationshipOptions = {
	trustedAdvisor: 'Trusted advisor',
	thinkingPartner: 'Thinking partner (collaborator)',
	skilledExecutor: 'Skilled executor',
} as const

export const buyerDecisionMakingNeedOptions = {
	numbersData: 'The numbers/data',
	timeAndSpace: 'Time and space',
	trustedPerspective: 'A trusted perspective',
	gutFeeling: 'A gut feeling',
} as const

export const buyerBiddingWarResponseOptions = {
	factsOptions: 'Facts & options immediately',
	space: 'Space to step back',
	reassurance: 'Reassurance',
	calmPresence: 'Calm, steady presence',
} as const

export const quickCommunicationChannelOptions = {
	text: 'Text',
	phone: 'Phone',
	either: 'Either is fine',
} as const

export const updateDeliveryMethodOptions = {
	email: 'Email',
	textWithAttachments: 'Text with attachments',
	phoneThenEmailRecap: 'Phone call then email recap',
} as const

export const involvementLevelOptions = {
	veryInvolved: 'Very involved',
	keyDetails: 'Key details only',
	handsOff: 'Hands off',
} as const

export const responseTimeExpectationOptions = {
	within10Min: 'Within 10 min',
	within30Min: '30 min',
	fewHours: 'A few hours',
	within24Hours: '24 hours',
} as const

export const commissionComfortOptions = {
	negotiate: 'Plan to negotiate',
	openOptions: 'Open but want options first',
	payFairRate: 'Will pay fair rate, not a concern',
	dontUnderstand: "Don't understand it yet",
} as const

export const sellerSaleMotivationOptions = {
	lifestyleChange: 'Lifestyle change',
	relocation: 'Relocation',
	financialPressure: 'Financial pressure',
	rightTime: 'Right time',
	majorTransition: 'Major personal transition',
	other: 'Other',
} as const

export const sellerSuccessfulSaleLooksLikeOptions = {
	maximumPrice: 'Maximum price',
	strongPriceSmoothProcess: 'Strong price + smooth process',
	speedCertainty: 'Speed & certainty',
	mustCloseByDate: 'Must close by a specific date',
} as const

export const sellerAgentDeliveryExpectationsOptions = {
	pricedRight: 'Priced it right',
	greatMarketing: 'Great marketing',
	greatNegotiatedOutcome: 'Great negotiated outcome',
	reachableResponsive: 'Reachable & responsive',
	keptItCalm: 'Kept it calm',
	honestStraightforward: 'Honest & straightforward',
} as const

export const sellerHomeConnectionOptions = {
	asset: "It's an asset",
	goodMemories: 'Good memories, ready to move on',
	partOfIdentity: 'Part of my identity',
	complicated: 'Complicated/emotionally difficult',
} as const

export const sellerAgentSilencePreferenceOptions = {
	scheduled: 'Regular scheduled check-ins',
	milestones: 'Updates at key milestones',
	clientLed: "I'll reach out when needed",
} as const

export const sellerRepresentationPreferenceOptions = {
	broadConnections: 'Broad connections (even with competing loyalties)',
	exclusiveRepresentationOnly: 'Exclusive representation only',
} as const

export const agentClientDescriptionOptions = {
	strategicDataDriven: 'Strategic & data-driven',
	calmSteady: 'Calm & steady',
	warmRelational: 'Warm & relational',
	efficientDecisive: 'Efficient & decisive',
} as const

export const agentCommunicationFrequencyOptions = {
	scheduled: 'Regular scheduled check-ins',
	milestones: 'At key milestones',
	clientLed: 'Client-led pace',
} as const

export const agentDifficultDealInstinctOptions = {
	factsFast: 'Facts fast',
	slowItDown: 'Slow it down',
	takeControl: 'Take control',
	deEscalateFirst: 'De-escalate first',
} as const

export const agentResponseTimeOptions = {
	within10Min: 'Within 10 min',
	within30Min: '30 min',
	fewHours: 'A few hours',
	within24Hours: '24 hours',
} as const

export const agentCommissionApproachOptions = {
	proactiveFixed: 'Proactive & fixed rate',
	proactiveOpen: 'Proactive & open to discussion',
	reactiveFixed: 'Reactive & fixed rate',
	reactiveOpen: 'Reactive & open',
} as const

export const agentUnrepresentedBuyerApproachOptions = {
	referSeparateBrokerage: 'Refer to a separate brokerage',
	representSellerOnly: 'Represent seller only, buyer unrepresented (disclosed)',
	anotherAgentInBrokerage:
		'Another agent at your brokerage represents buyer (disclosed)',
} as const
