export type PriceRange = {
	min: number
	max: number
}

export type PriceRangeValue = PriceRange

export const PRICE_MIN = 0
export const PRICE_MAX = 2_000_000
export const PRICE_STEP = 50_000
export const DEFAULT_PRICE_RANGE: PriceRange = { min: 400_000, max: 600_000 }

export const AGENT_PRICE_RANGES: Record<string, PriceRange> = {
	under400k: { min: 0, max: 400_000 },
	'400kTo750k': { min: 400_000, max: 750_000 },
	'750kTo1_5m': { min: 750_000, max: 1_500_000 },
	'1_5mPlus': { min: 1_500_000, max: PRICE_MAX },
}

export const BUCKET_ORDER = [
	'under400k',
	'400kTo750k',
	'750kTo1_5m',
	'1_5mPlus',
] as const

export type AgentPriceBucket = (typeof BUCKET_ORDER)[number]

export function parseMinMaxRange(
	value: string | undefined | null,
): PriceRange | undefined {
	const [, minRaw, maxRaw] = value?.trim().match(/^(\d+)-(\d+)$/) ?? []
	if (!minRaw || !maxRaw) return undefined
	const min = Number.parseInt(minRaw, 10)
	const max = Number.parseInt(maxRaw, 10)
	return {
		min: Math.min(min, max),
		max: Math.max(min, max),
	}
}

export function parsePriceRange(value: string | undefined | null): PriceRange {
	const sanitized = value?.replace(/[^\d-]/g, '').replace(/-{2,}/g, '-')
	const parsed = parseMinMaxRange(sanitized)
	if (!parsed) return { ...DEFAULT_PRICE_RANGE }
	return {
		min: Math.max(PRICE_MIN, Math.min(parsed.min, parsed.max)),
		max: Math.min(PRICE_MAX, Math.max(parsed.min, parsed.max)),
	}
}

export function serializePriceRange(range: PriceRange): string {
	return `${range.min}-${range.max}`
}

export function formatPriceRange(range: PriceRange): string {
	return `${formatPriceCompact(range.min)} - ${formatPriceCompact(range.max)}`
}

export function formatPrice(value: number): string {
	return `$${value.toLocaleString()}`
}

export function formatPriceCompact(value: number): string {
	if (value >= 1_000_000) {
		const millions = value / 1_000_000
		return `$${millions % 1 === 0 ? millions : millions.toFixed(1)}M`
	}
	return `$${value / 1000}k`
}

export function parseRawPrice(value: string): number | undefined {
	const digits = value.replace(/\D/g, '')
	const parsed = Number.parseInt(digits, 10)
	return Number.isNaN(parsed) ? undefined : parsed
}

export function clampPrice(value: number): number {
	return Math.max(PRICE_MIN, Math.min(value, PRICE_MAX))
}

/**
 * Parses the stored price range formats used by the app.
 * Accepts the serialized 'min-max' format (e.g. '400000-750000')
 * and the agent bucket slugs from AGENT_PRICE_RANGES (e.g. '400kTo750k').
 * Returns undefined for anything else so callers can trace unparseable data
 * instead of silently substituting defaults.
 */
export function parseSerializedPriceRange(
	value: string | null | undefined,
): PriceRangeValue | undefined {
	const minMax = parseMinMaxRange(value)
	if (minMax) return minMax
	const slug = value?.trim()
	if (!slug) return undefined
	const range = AGENT_PRICE_RANGES[slug]
	if (range) return { ...range }
	return undefined
}
