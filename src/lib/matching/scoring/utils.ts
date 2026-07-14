import { parseMinMaxRange } from '@/lib/price-range'

import type { PriceRangeValue } from './types'

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
 * Strict parser for the app's serialized "min-max" price format
 * (see serializePriceRange in price-range.ts). Returns undefined for
 * anything else so callers can trace unparseable data instead of
 * silently substituting defaults.
 */
export function parseSerializedPriceRange(
	value: string | null | undefined,
): PriceRangeValue | undefined {
	return parseMinMaxRange(value)
}

/**
 * Fraction of the client's price range that the agent's typical range
 * covers, in [0, 1]. A point range (min === max) scores 1 when the agent
 * covers that price.
 */
export function priceOverlapRatio(
	client: PriceRangeValue,
	agent: PriceRangeValue,
): number {
	const overlap =
		Math.min(client.max, agent.max) - Math.max(client.min, agent.min)
	const span = client.max - client.min
	if (span <= 0) return overlap >= 0 ? 1 : 0
	return Math.max(0, Math.min(1, overlap / span))
}
