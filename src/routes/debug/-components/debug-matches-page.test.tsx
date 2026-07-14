import { describe, expect, test } from 'vitest'
import { page } from 'vite-plus/test/browser'
import { renderComponent } from '@tests/support/render/component'
import { expectScreenshot } from '@tests/support/render/screenshot'

import { DebugMatchesPage } from '@/routes/debug/-components/debug-matches-page'
import {
	buildDebugPayload,
	type DebugClientOption,
	type DebugMatchesPayload,
} from '@/lib/matching/debug'
import { calculateFitScore } from '@/lib/matching/scoring'
import type { AgentProfile, BuyerProfile } from '@/lib/profile/types'
import type { ScoredAgent } from '@/lib/matching/debug'

const FIXED_DATE = new Date('2026-01-01T00:00:00Z')

function makeAgent(overrides: Partial<AgentProfile> = {}): AgentProfile {
	return {
		id: 'agent-fixture-1',
		userId: 'user-agent-fixture-1',
		representationSide: 'buyers',
		city: 'Baltimore',
		state: 'MD',
		typicalPriceRange: '400kTo750k',
		bestClientTypes: ['firstTime', 'moveUp'],
		notFitFor: [] satisfies string[],
		firstName: 'Avery',
		lastName: 'Stone',
		brokerageName: 'Harborline Realty',
		email: 'avery@example.com',
		phone: null,
		businessAddress: null,
		billingAddress: null,
		licenseNumberState: 'LIC-123456-MD',
		zipCodes: ['21201', '21202'],
		cityCenterLatitude: null,
		cityCenterLongitude: null,
		yearsLicensed: '6-10',
		averageTransactions: '6-15',
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
		responseTime: 'within30Min',
		commissionApproach: 'proactiveOpen',
		unrepresentedBuyerApproach: 'referSeparateBrokerage',
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
	cityCenterLatitude: null,
	cityCenterLongitude: null,
	timeline: 'exploring',
	priceRange: '400000-600000',
	propertyTypes: ['singleFamily'],
	experienceLevel: 'firstTime',
	quickCommunicationChannel: 'text',
	updateDeliveryMethod: 'email',
	involvementLevel: 'veryInvolved',
	commissionComfort: 'dontUnderstand',
	responseTimeExpectation: 'within30Min',
	idealAgentRelationship: 'thinkingPartner',
	decisionMakingNeed: 'numbersData',
	biddingWarResponse: 'factsOptions',
	matchPriorities: ['priceRange'],
	matchDetails: null,
	createdAt: FIXED_DATE,
	updatedAt: FIXED_DATE,
}

const clientOptions: DebugClientOption[] = [
	{
		id: buyer.id,
		side: 'buying',
		name: 'Test Buyer',
		email: 'buyer@example.com',
		city: buyer.city,
		state: buyer.state,
		priceRange: buyer.priceRange,
	},
]

function scoredAgent(
	agent: AgentProfile,
	fitScore: number,
	disqualified: boolean,
): ScoredAgent {
	const score = calculateFitScore(agent, buyer, 'buying')
	return {
		row: {
			agent,
			user: {
				id: agent.userId,
				name: `${agent.firstName} ${agent.lastName}`,
				email: agent.email ?? '',
				emailVerified: true,
				image: null,
			},
		},
		score: {
			...score,
			fitScore: disqualified ? 0 : fitScore,
			disqualified,
			trace: {
				...score.trace,
				disqualified,
				fitScore: disqualified ? 0 : fitScore,
			},
		},
	}
}

function makePayload(): DebugMatchesPayload {
	const agents = [
		makeAgent({ id: 'agent-1', firstName: 'Avery', lastName: 'Stone' }),
		makeAgent({
			id: 'agent-2',
			firstName: 'Jordan',
			lastName: 'Vale',
			city: 'Annapolis',
			zipCodes: ['21401'],
			typicalPriceRange: '750kTo1_5m',
			bestClientTypes: ['luxury', 'investor'],
		}),
		makeAgent({
			id: 'agent-3',
			firstName: 'Taylor',
			lastName: 'Reed',
			state: 'VA',
			city: 'Richmond',
			zipCodes: ['23220'],
			bestClientTypes: ['investor', 'luxury'],
		}),
	]

	const scored = agents.map((agent, index) =>
		scoredAgent(agent, 90 - index * 2, index === 2),
	)

	const qualified = scored.filter((item) => !item.score.disqualified)
	const disqualified = scored.filter((item) => item.score.disqualified)

	return buildDebugPayload(buyer, 'buying', {
		qualified,
		ranked: qualified,
		disqualified,
		scoreDistribution: [
			{ range: '0-9', count: 0 },
			{ range: '10-19', count: 0 },
			{ range: '20-29', count: 0 },
			{ range: '30-39', count: 0 },
			{ range: '40-49', count: 0 },
			{ range: '50-59', count: 0 },
			{ range: '60-69', count: 0 },
			{ range: '70-79', count: 0 },
			{ range: '80-89', count: 2 },
			{ range: '90-100', count: 1 },
		],
		totalAgents: 3,
	})
}

interface RenderOptions {
	selectedAgentId?: string | undefined
	compareAgentId?: string | undefined
	loadDebugMatches?:
		| ((input: {
				clientId: string
				side: 'buying' | 'selling'
		  }) => Promise<DebugMatchesPayload>)
		| undefined
}

async function renderPage(
	payload: DebugMatchesPayload,
	{ selectedAgentId, compareAgentId, loadDebugMatches }: RenderOptions = {},
) {
	await renderComponent({
		element: (
			<DebugMatchesPage
				clientId={buyer.id}
				side="buying"
				selectedAgentId={selectedAgentId}
				compareAgentId={compareAgentId}
				onSelectClient={() => {}}
				onSelectAgent={() => {}}
				onSetCompare={() => {}}
				loadDebugClientOptions={() => Promise.resolve(clientOptions)}
				loadDebugMatches={
					loadDebugMatches ?? ((_input) => Promise.resolve(payload))
				}
				mapsEnabled={false}
			/>
		),
	})
	// oxlint-disable-next-line typescript/consistent-type-assertions
	return document.querySelector('[class*="h-svh"]') as HTMLElement
}

describe('debug matches page', () => {
	test('cohort overview shows funnel, histogram, weights, and kill counts', async () => {
		const page = await renderPage(makePayload())

		await expect.element(page).toHaveTextContent('debug/matches')
		await expect
			.element(page)
			.toHaveTextContent('3 fetched → 2 passed gates → 2 qualified')
		await expect.element(page).toHaveTextContent('Cohort overview')
		await expect.element(page).toHaveTextContent('fitScore distribution')
		await expect.element(page).toHaveTextContent('Resolved weights')
		await expect.element(page).toHaveTextContent('Gate kill counts')
		await expect
			.element(page)
			.toHaveTextContent('Dimension scores across qualified agents')
		await expectScreenshot(page, { name: 'debug-cohort-overview' })
	}, 60000)

	test('ranking rail shows tie bands, toolbar, and collapsed disqualified section', async () => {
		const page = await renderPage(makePayload())

		await expect.element(page).toHaveTextContent('Avery Stone')
		await expect.element(page).toHaveTextContent('Jordan Vale')
		await expect.element(page).toHaveTextContent('2 agents')
		await expect.element(page).toHaveTextContent('Disqualified (1)')
		await expect.element(page).toHaveTextContent('3 of 3 agents')
		await expectScreenshot(page, { name: 'debug-ranking-rail' })
	}, 60000)

	test('filter narrows the ranking list', async () => {
		const root = await renderPage(makePayload())
		await expect.element(root).toHaveTextContent('Avery Stone')

		await page.getByLabelText('Filter agents').fill('Jordan')

		await expect.element(root).toHaveTextContent('1 of 3 agents')
		await expect.element(root).toHaveTextContent('Jordan Vale')
		await expect
			.element(root)
			.toHaveTextContent('band view disabled while sorted/filtered')
	}, 60000)

	test('pair inspector shows the full score trace', async () => {
		const payload = makePayload()
		const selected = payload.qualified[0]?.agentId
		const page = await renderPage(payload, { selectedAgentId: selected })

		await expect.element(page).toHaveTextContent('Stage 1 — Dimensions')
		await expect.element(page).toHaveTextContent('Hard gates')
		await expect
			.element(page)
			.toHaveTextContent('Score internals (pipeline + blend)')
		await expect.element(page).toHaveTextContent('Raw data')
		await expect.element(page).toHaveTextContent('Final fitScore')
		await expectScreenshot(page, { name: 'debug-pair-inspector' })
	}, 60000)

	test('disqualified agent shows failed gate card', async () => {
		const payload = makePayload()
		const selected = payload.disqualified[0]?.agentId
		const page = await renderPage(payload, { selectedAgentId: selected })

		await expect.element(page).toHaveTextContent('Taylor Reed')
		await expect.element(page).toHaveTextContent('Disqualified — failed gates')
		await expect.element(page).toHaveTextContent('Score before gate')
		await expectScreenshot(page, { name: 'debug-disqualified' })
	}, 60000)

	test('compare view shows both agents with deltas', async () => {
		const payload = makePayload()
		const page = await renderPage(payload, {
			selectedAgentId: payload.qualified[0]?.agentId,
			compareAgentId: payload.qualified[1]?.agentId,
		})

		await expect.element(page).toHaveTextContent('Compare')
		await expect.element(page).toHaveTextContent('Pipeline values')
		await expect.element(page).toHaveTextContent('Dimension scores')
		await expect.element(page).toHaveTextContent('Unpin')
		await expectScreenshot(page, { name: 'debug-compare' })
	}, 60000)

	test('failed matches load shows error state with retry', async () => {
		const page = await renderPage(makePayload(), {
			loadDebugMatches: () =>
				Promise.reject(new Error('Client profile not found')),
		})

		await expect.element(page).toHaveTextContent('Failed to load matches')
		await expect.element(page).toHaveTextContent('Client profile not found')
		await expect.element(page).toHaveTextContent('Retry')
	}, 60000)
})
