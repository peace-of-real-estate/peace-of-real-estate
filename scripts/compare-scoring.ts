import { db } from '../src/db/connection'
import { agentProfiles, buyerProfiles, sellerProfiles } from '../src/db/tables'
import {
	AGENT_PRICE_RANGES,
	BUCKET_ORDER,
	parseSerializedPriceRange,
} from '../src/lib/price-range'
import {
	calculateFitScore,
	type ScoringVariant,
} from '../src/lib/matching/scoring'
import type {
	AgentProfile,
	BuyerProfile,
	ClientProfileRow,
} from '../src/lib/profile/types'

// =============================================================================
// Read-only measurement: how much would simplified scoring variants change
// rankings? No DB writes, no production behavior change.
// =============================================================================

const VARIANTS: Record<string, ScoringVariant> = {
	'B linear-only blend': { blend: 'linearOnly' },
	'C multiplier reciprocity': { reciprocity: 'multiplier' },
	'D no weight modulations': { modulations: false },
	'E linear-only + multiplier': {
		blend: 'linearOnly',
		reciprocity: 'multiplier',
	},
}

const TOP_N = 10
const TIE_BAND_POINTS = 3
const SYNTHETIC_CLIENT_COUNT = 20

type Client = { profile: ClientProfileRow; side: 'buying' | 'selling' }

/**
 * KNOWN DATA BUG (2026-07): agent signup serializes typicalPriceRange as raw
 * "min-max" while scorePriceFit expects an AGENT_PRICE_RANGES bucket slug, so
 * every such agent fails the price gate. Until that is fixed, map raw ranges
 * to the closest bucket in-memory (applied identically to base and variants)
 * so ranking comparisons measure blend effects rather than the bug.
 */
function normalizeAgentBucket(agent: AgentProfile): AgentProfile {
	if (AGENT_PRICE_RANGES[agent.typicalPriceRange]) return agent
	const range = parseSerializedPriceRange(agent.typicalPriceRange)
	if (!range) return agent

	let best: string | undefined
	let bestOverlap = 0
	for (const slug of BUCKET_ORDER) {
		const bucket = AGENT_PRICE_RANGES[slug]
		if (!bucket) continue
		const overlap =
			Math.min(range.max, bucket.max) - Math.max(range.min, bucket.min)
		if (overlap > bestOverlap) {
			bestOverlap = overlap
			best = slug
		}
	}
	return best ? { ...agent, typicalPriceRange: best } : agent
}

type Ranked = { agentId: string; score: number }

function rankAgents(
	agents: { agent: AgentProfile }[],
	client: Client,
	variant?: ScoringVariant,
): Ranked[] {
	return agents
		.map(({ agent }) => ({
			agentId: agent.id,
			result: calculateFitScore(agent, client.profile, client.side, variant),
		}))
		.filter(({ result }) => !result.disqualified)
		.map(({ agentId, result }) => ({
			agentId,
			score: result.trace.computedScore,
		}))
		.sort((a, b) => b.score - a.score || a.agentId.localeCompare(b.agentId))
}

/** Goodman–Kruskal gamma: concordance over pairs not tied in either ranking. */
function gamma(base: Ranked[], variant: Ranked[]): number {
	const variantScore = new Map(variant.map((r) => [r.agentId, r.score]))
	const items = base.map((r) => ({
		a: r.score,
		b: variantScore.get(r.agentId) ?? 0,
	}))
	let concordant = 0
	let discordant = 0
	for (let i = 0; i < items.length; i++) {
		for (let j = i + 1; j < items.length; j++) {
			const left = items[i]
			const right = items[j]
			if (!left || !right) continue
			const da = Math.sign(left.a - right.a)
			const db = Math.sign(left.b - right.b)
			if (da === 0 || db === 0) continue
			if (da === db) concordant++
			else discordant++
		}
	}
	const total = concordant + discordant
	return total === 0 ? 1 : (concordant - discordant) / total
}

function topOverlap(base: Ranked[], variant: Ranked[], n: number): number {
	const size = Math.min(n, base.length)
	if (size === 0) return 1
	const baseTop = new Set(base.slice(0, size).map((r) => r.agentId))
	const hits = variant
		.slice(0, size)
		.filter((r) => baseTop.has(r.agentId)).length
	return hits / size
}

/** Fraction of agents whose tie-band index (threshold 3 pts) changed. */
function bandChurn(base: Ranked[], variant: Ranked[]): number {
	if (base.length === 0) return 0
	const baseBands = bandIndexByAgent(base)
	const variantBands = bandIndexByAgent(variant)
	let moved = 0
	for (const [agentId, band] of baseBands) {
		if (variantBands.get(agentId) !== band) moved++
	}
	return moved / base.length
}

function bandIndexByAgent(ranked: Ranked[]): Map<string, number> {
	const bands = new Map<string, number>()
	let bandIndex = -1
	let bandStartScore = Infinity
	for (const item of ranked) {
		if (bandStartScore - item.score > TIE_BAND_POINTS) {
			bandIndex++
			bandStartScore = item.score
		} else if (bandIndex === -1) {
			bandIndex = 0
			bandStartScore = item.score
		}
		bands.set(item.agentId, bandIndex)
	}
	return bands
}

function meanAbsDelta(base: Ranked[], variant: Ranked[]): number {
	const variantScore = new Map(variant.map((r) => [r.agentId, r.score]))
	if (base.length === 0) return 0
	const total = base.reduce(
		(sum, r) => sum + Math.abs(r.score - (variantScore.get(r.agentId) ?? 0)),
		0,
	)
	return total / base.length
}

// =============================================================================
// Synthetic clients (in-memory only) when the dev DB has no real profiles
// =============================================================================

function syntheticBuyers(
	agents: { agent: AgentProfile }[],
	count: number,
): Client[] {
	const priceRanges = [
		'200000-400000',
		'400000-600000',
		'500000-750000',
		'750000-1200000',
		'1200000-2500000',
	]
	const priorities = [
		['priceRange'],
		['city', 'quickCommunicationChannel'],
		['idealAgentRelationship'],
		['propertyTypes', 'priceRange'],
		[],
	]
	const experienceLevels = [
		'firstTime',
		'experienced',
		'veryExperienced',
	] as const
	const now = new Date()

	const clients: Client[] = []
	for (let i = 0; i < count; i++) {
		const anchor = agents[(i * 37) % agents.length]?.agent
		if (!anchor) break
		const profile: BuyerProfile = {
			id: `synthetic-${i}`,
			userId: `synthetic-user-${i}`,
			status: 'active',
			state: anchor.state,
			city: anchor.city,
			zipCodes: anchor.zipCodes,
			cityCenterLatitude: anchor.cityCenterLatitude,
			cityCenterLongitude: anchor.cityCenterLongitude,
			timeline: 'exploring',
			priceRange: priceRanges[i % priceRanges.length] ?? '400000-600000',
			propertyTypes: ['singleFamily'],
			experienceLevel:
				experienceLevels[i % experienceLevels.length] ?? 'firstTime',
			quickCommunicationChannel: i % 2 === 0 ? 'text' : 'phone',
			updateDeliveryMethod: 'email',
			involvementLevel: 'veryInvolved',
			commissionComfort: 'dontUnderstand',
			responseTimeExpectation: 'within30Min',
			idealAgentRelationship:
				i % 2 === 0 ? 'thinkingPartner' : 'skilledExecutor',
			decisionMakingNeed: 'numbersData',
			biddingWarResponse: 'factsOptions',
			matchPriorities: priorities[i % priorities.length] ?? [],
			matchDetails: null,
			createdAt: now,
			updatedAt: now,
		}
		clients.push({ profile, side: 'buying' })
	}
	return clients
}

// =============================================================================
// Entry point
// =============================================================================

function formatPct(value: number): string {
	return `${(value * 100).toFixed(1)}%`
}

function median(values: number[]): number {
	if (values.length === 0) return 0
	const sorted = [...values].sort((a, b) => a - b)
	const mid = Math.floor(sorted.length / 2)
	const low = sorted[mid - 1]
	const high = sorted[mid]
	if (sorted.length % 2 === 1) return high ?? 0
	return ((low ?? 0) + (high ?? 0)) / 2
}

type VariantStats = {
	gamma: number[]
	top: number[]
	churn: number[]
	delta: number[]
}

function compareClients(
	agents: { agent: AgentProfile }[],
	clients: Client[],
): { stats: Map<string, VariantStats>; compared: number } {
	const stats = new Map<string, VariantStats>()
	for (const name of Object.keys(VARIANTS)) {
		stats.set(name, { gamma: [], top: [], churn: [], delta: [] })
	}

	let compared = 0
	for (const client of clients) {
		const base = rankAgents(agents, client)
		if (base.length < 2) {
			console.log(
				`  skipping ${client.profile.id} (${client.profile.city}, ${client.profile.state}): ${base.length} qualified agents`,
			)
			continue
		}
		compared++

		for (const [name, variant] of Object.entries(VARIANTS)) {
			const ranked = rankAgents(agents, client, variant)
			const bucket = stats.get(name)
			if (!bucket) continue
			bucket.gamma.push(gamma(base, ranked))
			bucket.top.push(topOverlap(base, ranked, TOP_N))
			bucket.churn.push(bandChurn(base, ranked))
			bucket.delta.push(meanAbsDelta(base, ranked))
		}
	}

	return { stats, compared }
}

async function main() {
	const agentRows = await db.select().from(agentProfiles)
	const agents = agentRows.map((agent) => ({
		agent: normalizeAgentBucket(agent),
	}))
	const normalized = agents.filter(
		({ agent }, index) => agent !== agentRows[index],
	).length
	if (normalized > 0) {
		console.log(
			`normalized ${normalized} agents with raw "min-max" typicalPriceRange to bucket slugs (see script comment — this is masking a data bug)`,
		)
	}
	const buyers = await db.select().from(buyerProfiles)
	const sellers = await db.select().from(sellerProfiles)

	let clients: Client[] = [
		...buyers.map((profile) => ({ profile, side: 'buying' as const })),
		...sellers.map((profile) => ({ profile, side: 'selling' as const })),
	]

	console.log(
		`agents=${agents.length} buyers=${buyers.length} sellers=${sellers.length}`,
	)

	if (agents.length === 0) {
		console.error('No agents in DB — run `vp db:seed` first.')
		process.exit(1)
	}

	if (clients.length === 0) {
		console.log(
			`No client profiles found — using ${SYNTHETIC_CLIENT_COUNT} in-memory synthetic buyers.`,
		)
		clients = syntheticBuyers(agents, SYNTHETIC_CLIENT_COUNT)
	}

	// Sanity: an all-default variant must reproduce the base pipeline exactly.
	const probeClient = clients[0]
	if (probeClient) {
		for (const { agent } of agents.slice(0, 50)) {
			const base = calculateFitScore(
				agent,
				probeClient.profile,
				probeClient.side,
			)
			const echoed = calculateFitScore(
				agent,
				probeClient.profile,
				probeClient.side,
				{},
			)
			if (base.trace.computedScore !== echoed.trace.computedScore) {
				throw new Error(
					`variant plumbing broke default behavior for agent ${agent.id}`,
				)
			}
		}
	}

	let { stats, compared } = compareClients(agents, clients)

	if (
		compared === 0 &&
		clients.some((c) => !c.profile.id.startsWith('synthetic'))
	) {
		console.log(
			`Real client profiles produced no comparable rankings (fewer than 2 qualified agents each) — falling back to ${SYNTHETIC_CLIENT_COUNT} synthetic buyers.`,
		)
		clients = syntheticBuyers(agents, SYNTHETIC_CLIENT_COUNT)
		;({ stats, compared } = compareClients(agents, clients))
	}

	console.log(`\nclients compared: ${compared} of ${clients.length}`)
	console.log(
		'variant'.padEnd(30) +
			'gamma(med)'.padEnd(12) +
			`top${TOP_N}(med)`.padEnd(12) +
			'bandChurn(med)'.padEnd(16) +
			'meanΔpts(med)',
	)
	for (const [name, bucket] of stats) {
		console.log(
			name.padEnd(30) +
				median(bucket.gamma).toFixed(4).padEnd(12) +
				formatPct(median(bucket.top)).padEnd(12) +
				formatPct(median(bucket.churn)).padEnd(16) +
				median(bucket.delta).toFixed(2),
		)
	}
	console.log(
		'\nInterpretation: gamma > 0.98 and top10 ≥ 90% and low band churn ⇒ the',
	)
	console.log(
		'variant is rank-equivalent in practice and a safe simplification candidate.',
	)
	process.exit(0)
}

void main().catch((error: unknown) => {
	console.error('compare-scoring failed:', error)
	process.exit(1)
})
