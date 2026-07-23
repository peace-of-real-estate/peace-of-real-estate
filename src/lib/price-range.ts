import { z } from 'zod'

export type PriceRange = {
	min: number
	max: number
}

export const PRICE_MIN = 0
export const PRICE_MAX = 2_000_000
export const PRICE_STEP = 50_000

export const BUCKET_ORDER = [
	'under400k',
	'400kTo750k',
	'750kTo1_5m',
	'1_5mPlus',
] as const

export type AgentPriceBucket = (typeof BUCKET_ORDER)[number]

export const AGENT_PRICE_RANGES: Record<AgentPriceBucket, PriceRange> = {
	under400k: { min: 0, max: 400_000 },
	'400kTo750k': { min: 400_000, max: 750_000 },
	'750kTo1_5m': { min: 750_000, max: 1_500_000 },
	'1_5mPlus': { min: 1_500_000, max: PRICE_MAX },
}

export const agentPriceBucketSchema = z.enum(BUCKET_ORDER)

export const AGENT_PRICE_BUCKET_LABELS: Record<AgentPriceBucket, string> = {
	under400k: 'Under $400k',
	'400kTo750k': '$400k – $750k',
	'750kTo1_5m': '$750k – $1.5M',
	'1_5mPlus': '$1.5M+',
}

export function toAgentPriceBucket(
	value: string | null | undefined,
): AgentPriceBucket | undefined {
	const parsed = agentPriceBucketSchema.safeParse(value)
	return parsed.success ? parsed.data : undefined
}

export const priceBoundSchema = z.number().int().min(PRICE_MIN).max(PRICE_MAX)

export function formatPriceRange(range: PriceRange): string {
	return `${formatPriceCompact(range.min)} - ${formatPriceCompact(range.max)}`
}

export function formatPriceCompact(value: number): string {
	if (value >= 1_000_000) {
		const millions = value / 1_000_000
		return `$${millions % 1 === 0 ? millions : millions.toFixed(1)}M`
	}
	return `$${value / 1000}k`
}
