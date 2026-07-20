import { makeAgent } from '@tests/support/fixtures/data/agent-profile'
import { makeBuyerProfile } from '@tests/support/fixtures/data/buyer-profile'
import { geoOf } from '@tests/support/fixtures/geography'
import { renderComponent } from '@tests/support/render/component'
import { expectScreenshot } from '@tests/support/render/screenshot'
import { page } from 'vite-plus/test/browser'
import { describe, expect, test } from 'vitest'

import {
	buildDebugPayload,
	type DebugClientOption,
	type DebugMatchesPayload,
} from '@/lib/matching/debug'
import type { ScoredAgent } from '@/lib/matching/debug'
import { calculateFitScore } from '@/lib/matching/scoring'
import type {
	AgentProfile,
	BuyerProfile,
	ClientRole,
} from '@/lib/profile/types'
import { DebugMatchesPage } from '@/routes/admin/-components/debug-matches-page'

const FIXED_DATE = new Date('2026-01-01T00:00:00Z')

const buyer: BuyerProfile = makeBuyerProfile({
	id: 'buyer-fixture-1',
	userId: 'user-buyer-fixture-1',
	status: 'active',
	city: {
		id: 'city-fixture-baltimore-md',
		name: 'Baltimore',
		state: 'MD',
		center: { lat: 39.2904, lng: -76.6122 },
	},
	geography: geoOf({
		'21201': { lat: 39.2946, lng: -76.6239 },
		'21205': { lat: 39.3229, lng: -76.5597 },
	}),
	priceMin: 400_000,
	priceMax: 600_000,
	involvementLevel: 'veryInvolved',
	commissionComfort: 'dontUnderstand',
	idealAgentRelationship: 'thinkingPartner',
	decisionMakingNeed: 'numbersData',
	biddingWarResponse: 'factsOptions',
	matchPriorities: ['priceRange'],
	createdAt: FIXED_DATE,
	updatedAt: FIXED_DATE,
})

const clientOptions: DebugClientOption[] = [
	{
		id: buyer.id,
		side: 'buyer',
		name: 'Test Buyer',
		email: 'buyer@example.com',
		cityName: buyer.city.name,
		state: buyer.city.state,
		priceRange: { min: buyer.priceMin, max: buyer.priceMax },
	},
]

function scoredAgent(
	agent: AgentProfile,
	fitScore: number,
	disqualified: boolean,
): ScoredAgent {
	const score = calculateFitScore(agent, buyer)
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
			city: {
				id: 'city-fixture-annapolis-md',
				name: 'Annapolis',
				state: 'MD',
				center: { lat: 38.9784, lng: -76.4922 },
			},
			geography: geoOf({ '21401': { lat: 38.9784, lng: -76.4922 } }),
			typicalPriceRange: '750kTo1_5m',
			bestClientTypes: ['luxury', 'investor'],
		}),
		makeAgent({
			id: 'agent-3',
			firstName: 'Taylor',
			lastName: 'Reed',
			city: {
				id: 'city-fixture-richmond-va',
				name: 'Richmond',
				state: 'VA',
				center: { lat: 37.5407, lng: -77.436 },
			},
			geography: geoOf({ '23220': { lat: 37.56, lng: -77.47 } }),
			bestClientTypes: ['investor', 'luxury'],
		}),
	]

	const scored = agents.map((agent, index) =>
		scoredAgent(agent, 90 - index * 2, index === 2),
	)

	const qualified = scored.filter((item) => !item.score.disqualified)
	const disqualified = scored.filter((item) => item.score.disqualified)

	return buildDebugPayload(buyer, 'buyer', {
		qualified,
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
				side: ClientRole
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
				side="buyer"
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

		await expect.element(page).toHaveTextContent('admin/matches')
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
	}, 300000)

	test('ranking rail shows tie bands, toolbar, and collapsed disqualified section', async () => {
		const page = await renderPage(makePayload())

		await expect.element(page).toHaveTextContent('Avery Stone')
		await expect.element(page).toHaveTextContent('Jordan Vale')
		await expect.element(page).toHaveTextContent('2 agents')
		await expect.element(page).toHaveTextContent('Disqualified (1)')
		await expect.element(page).toHaveTextContent('3 of 3 agents')
		await expectScreenshot(page, { name: 'debug-ranking-rail' })
	}, 300000)

	test('filter narrows the ranking list', async () => {
		const root = await renderPage(makePayload())
		await expect.element(root).toHaveTextContent('Avery Stone')

		await page.getByLabelText('Filter agents').fill('Jordan')

		await expect.element(root).toHaveTextContent('1 of 3 agents')
		await expect.element(root).toHaveTextContent('Jordan Vale')
		await expect
			.element(root)
			.toHaveTextContent('band view disabled while sorted/filtered')
	}, 300000)

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
	}, 300000)

	test('disqualified agent shows failed gate card', async () => {
		const payload = makePayload()
		const selected = payload.disqualified[0]?.agentId
		const page = await renderPage(payload, { selectedAgentId: selected })

		await expect.element(page).toHaveTextContent('Taylor Reed')
		await expect.element(page).toHaveTextContent('Disqualified — failed gates')
		await expect.element(page).toHaveTextContent('Score before gate')
		await expect.element(page).toHaveTextContent(/would be \d+%/)
		await expectScreenshot(page, { name: 'debug-disqualified' })
	}, 300000)

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
	}, 300000)

	test('failed matches load shows error state with retry', async () => {
		const page = await renderPage(makePayload(), {
			loadDebugMatches: () =>
				Promise.reject(new Error('Client profile not found')),
		})

		await expect.element(page).toHaveTextContent('Failed to load matches')
		await expect.element(page).toHaveTextContent('Client profile not found')
		await expect.element(page).toHaveTextContent('Retry')
	}, 300000)
})
