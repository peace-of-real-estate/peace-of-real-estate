import {
	AGENT_PRICE_RANGES,
	BUCKET_ORDER,
	PRICE_MAX,
	PRICE_MIN,
	PRICE_STEP,
	type AgentPriceBucket,
} from '@/lib/price-range'

import type { PriceRangeValue } from './types'

export { parseSerializedPriceRange } from '@/lib/price-range'

export function clamp01(value: number): number {
	return Math.max(0, Math.min(1, value))
}

export function round2(value: number): number {
	return Number(value.toFixed(2))
}

export function toStars(score: number): number {
	return Number((1 + clamp01(score) * 4).toFixed(1))
}

export function formatList(values: string[] | null | undefined): string {
	if (!values || values.length === 0) return '(none)'
	return values.join(', ')
}

export function formatPriceRangeValue(range: PriceRangeValue): string {
	return `$${range.min.toLocaleString()}–$${range.max.toLocaleString()}`
}

/**
 * A point range (min === max) has zero width, so raw interval overlap is 0
 * against everything — even ranges that contain the point. Expand it to one
 * PRICE_STEP span centered on the point so "I typically work at $500k" scores
 * against budgets that include $500k instead of disqualifying the agent.
 */
function withMinimumSpan(range: PriceRangeValue): PriceRangeValue {
	if (range.min !== range.max) return range
	const half = PRICE_STEP / 2
	return {
		min: Math.max(PRICE_MIN, range.min - half),
		max: Math.min(PRICE_MAX, range.max + half),
	}
}

/**
 * The bucket with the greatest overlap with the given range, so agents whose
 * typicalPriceRange is stored as serialized 'min-max' get the same
 * adjacent-bucket treatment as agents stored as a bucket slug. A slug's exact
 * range always snaps back to its own bucket. Undefined only when the range
 * falls entirely outside the bucket span ([PRICE_MIN, PRICE_MAX]).
 */
export function snapToAgentBucket(
	range: PriceRangeValue,
): AgentPriceBucket | undefined {
	const expanded = withMinimumSpan(range)
	let best: AgentPriceBucket | undefined
	let bestOverlap = 0
	for (const slug of BUCKET_ORDER) {
		const bucket = AGENT_PRICE_RANGES[slug]
		if (!bucket) continue
		const overlap =
			Math.min(expanded.max, bucket.max) - Math.max(expanded.min, bucket.min)
		if (overlap > bestOverlap) {
			bestOverlap = overlap
			best = slug
		}
	}
	return best
}

/**
 * Fraction of the client's price range that the agent's typical range
 * covers, in [0, 1]. A point range (min === max) on either side is widened
 * to one PRICE_STEP span first; a client point range scores 1 when the
 * agent covers that price.
 */
export function priceOverlapRatio(
	client: PriceRangeValue,
	agent: PriceRangeValue,
): number {
	const expandedAgent = withMinimumSpan(agent)
	const overlap =
		Math.min(client.max, expandedAgent.max) -
		Math.max(client.min, expandedAgent.min)
	const span = client.max - client.min
	if (span <= 0) return overlap >= 0 ? 1 : 0
	return Math.max(0, Math.min(1, overlap / span))
}
