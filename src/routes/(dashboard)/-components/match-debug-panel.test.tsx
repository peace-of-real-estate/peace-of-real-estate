import { describe, test } from 'vitest'
import { renderComponent } from '@tests/support/render/component'
import { expectScreenshot } from '@tests/support/render/screenshot'

import { MatchDebugPanel } from '@/routes/(dashboard)/-components/match-debug-panel'
import { calculateFitScore } from '@/lib/matching/scoring'
import type { AgentMatchData, MatchDebugInfo } from '@/lib/matching/scoring'
import type { AgentProfile, BuyerProfile } from '@/lib/matching/profile.types'

const FIXED_DATE = new Date('2026-01-01T00:00:00Z')

function makeAgent(overrides: Partial<AgentProfile> = {}): AgentProfile {
	return {
		id: 'agent-fixture-1',
		userId: 'user-agent-fixture-1',
		representationSide: 'both',
		city: 'Baltimore',
		state: 'MD',
		typicalPriceRange: '300000-600000',
		bestClientTypes: ['firstTime', 'moveUp'],
		notFitFor: null,
		firstName: 'Avery',
		lastName: 'Stone',
		brokerageName: 'Harborline Realty',
		email: 'avery@example.com',
		phone: null,
		businessAddress: null,
		billingAddress: null,
		licenseNumberState: 'LIC-123456-MD',
		zipCodes: ['21201', '21202'],
		yearsLicensed: '5-10 years',
		averageTransactions: '10-15 per year',
		employmentStatus: 'Realtor',
		licenseProof: null,
		usePaxWriter: true,
		licenseAttested: true,
		eoInsuranceStatus: 'Active',
		peacePactSigned: true,
		peacePactSignature: 'Avery Stone',
		peacePactSignedAt: FIXED_DATE,
		clientDescription: 'strategicDataDriven',
		communicationFrequency: 'scheduled',
		quickCommunicationChannel: 'text',
		updateDeliveryMethod: 'email',
		difficultDealInstinct: 'factsFast',
		responseTime: 'within10Min',
		commissionApproach: 'proactiveOpen',
		unrepresentedBuyerApproach: 'representSellerOnly',
		createdAt: FIXED_DATE,
		updatedAt: FIXED_DATE,
		...overrides,
	}
}

const buyer: BuyerProfile = {
	id: 'buyer-fixture-1',
	userId: 'user-buyer-fixture-1',
	status: 'active',
	state: 'MD',
	city: 'Baltimore',
	zipCodes: ['21201', '21205'],
	timeline: 'exploring',
	priceRange: '400000-600000',
	propertyTypes: ['singleFamily'],
	experienceLevel: 'firstTime',
	quickCommunicationChannel: 'text',
	updateDeliveryMethod: 'email',
	involvementLevel: 'veryInvolved',
	commissionComfort: 'negotiate',
	responseTimeExpectation: 'within10Min',
	idealAgentRelationship: 'trustedAdvisor',
	decisionMakingNeed: 'numbersData',
	biddingWarResponse: 'factsOptions',
	matchPriorities: ['priceRange'],
	matchDetails: null,
	createdAt: FIXED_DATE,
	updatedAt: FIXED_DATE,
}

const scoreDistribution = [
	{ range: '0-9', count: 0 },
	{ range: '10-19', count: 4 },
	{ range: '20-29', count: 31 },
	{ range: '30-39', count: 102 },
	{ range: '40-49', count: 214 },
	{ range: '50-59', count: 187 },
	{ range: '60-69', count: 96 },
	{ range: '70-79', count: 41 },
	{ range: '80-89', count: 9 },
	{ range: '90-100', count: 2 },
]

function makeMatch(input: {
	rank: number
	name: string
	agent: AgentProfile
	client?: BuyerProfile
}): AgentMatchData {
	const score = calculateFitScore(input.agent, input.client, 'buying')
	const debug: MatchDebugInfo = {
		rank: input.rank,
		totalAgents: 1000,
		qualifiedCount: 686,
		scoreDistribution,
		trace: score.trace,
		agentProfile: input.agent,
		clientProfile: input.client ?? null,
	}

	return {
		id: input.agent.id,
		name: input.name,
		role: 'agent',
		location: `${input.agent.city}, ${input.agent.state}`,
		zipCodes: input.agent.zipCodes,
		fitScore: score.fitScore,
		status: 'new',
		date: '1/1/2026',
		agency: input.agent.brokerageName,
		specialties: input.agent.bestClientTypes,
		about: 'Fixture agent for debug panel screenshots.',
		scores: score.scores,
		debug,
	}
}

const matches: AgentMatchData[] = [
	makeMatch({
		rank: 1,
		name: 'Avery Stone',
		agent: makeAgent(),
		client: buyer,
	}),
	makeMatch({
		rank: 2,
		name: 'Jordan Vale',
		agent: makeAgent({
			id: 'agent-fixture-2',
			city: 'Annapolis',
			zipCodes: ['21401'],
			typicalPriceRange: '550000-900000',
			bestClientTypes: ['luxury', 'investor'],
			yearsLicensed: 'Less than 1 year',
			averageTransactions: null,
			peacePactSigned: false,
			eoInsuranceStatus: 'Pending',
		}),
		client: buyer,
	}),
	makeMatch({
		rank: 3,
		name: 'Sam Rios (fallback)',
		agent: makeAgent({
			id: 'agent-fixture-3',
			typicalPriceRange: 'legacy $250k - $500k',
			bestClientTypes: [],
			peacePactSigned: false,
		}),
	}),
]

async function renderPanel(panelMatches: AgentMatchData[]) {
	await renderComponent({
		element: (
			<div className="bg-background mx-auto max-w-4xl p-6">
				<MatchDebugPanel matches={panelMatches} />
			</div>
		),
	})
	return document.querySelector('.max-w-4xl') as HTMLElement
}

/** Expands the nth top-level match row (native <details>, uncontrolled). */
function expandRow(panel: HTMLElement, index: number) {
	const rows = panel.querySelectorAll<HTMLDetailsElement>(
		'[data-slot="match-debug-row"]',
	)
	rows[index]!.open = true
}

describe('match debug panel', () => {
	test('collapsed rows look like the normal match list', async () => {
		const panel = await renderPanel(matches)
		await expectScreenshot(panel, {
			name: 'collapsed-list',
			viewport: { width: 1240, height: 700 },
		})
	}, 60000)

	test('header and strong match trace', async () => {
		const panel = await renderPanel([matches[0]!])
		expandRow(panel, 0)
		await expectScreenshot(panel, {
			name: 'strong-match',
			viewport: { width: 1240, height: 2300 },
		})
	}, 60000)

	test('weak match trace with failing checks', async () => {
		const panel = await renderPanel([matches[1]!])
		expandRow(panel, 0)
		await expectScreenshot(panel, {
			name: 'weak-match',
			viewport: { width: 1240, height: 2450 },
		})
	}, 60000)

	test('fallback trace without client profile', async () => {
		const panel = await renderPanel([matches[2]!])
		expandRow(panel, 0)
		await expectScreenshot(panel, {
			name: 'fallback-match',
			viewport: { width: 1240, height: 1400 },
		})
	}, 60000)
})
