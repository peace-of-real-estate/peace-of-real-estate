/* oxlint-disable typescript/consistent-type-assertions */
import {
	baseDimensionWeights,
	DIMENSION_LABELS,
	type DimensionId,
} from '@/lib/matching/affinities'
import type { DebugMatch } from '@/lib/matching/debug'

export type SortKey = 'rank' | 'preShuffle' | 'agentFit' | DimensionId

export const SORT_OPTIONS: { key: SortKey; label: string }[] = [
	{ key: 'rank', label: 'Display rank' },
	{ key: 'preShuffle', label: 'Score (pre-shuffle)' },
	{ key: 'agentFit', label: 'Agent fit' },
	...(Object.keys(baseDimensionWeights) as DimensionId[]).map((id) => ({
		key: id,
		label: `${DIMENSION_LABELS[id]} score`,
	})),
]

export function sortLabel(sortKey: SortKey): string {
	return SORT_OPTIONS.find((option) => option.key === sortKey)?.label ?? ''
}

export interface RankingFilters {
	text: string
	/** When set, the disqualified section only shows agents killed by this gate. */
	dqGate: string | undefined
}

export const EMPTY_FILTERS: RankingFilters = { text: '', dqGate: undefined }

function dimensionScore(
	match: DebugMatch,
	id: DimensionId,
): number | undefined {
	return match.trace.dimensions.find((dimension) => dimension.id === id)?.score
}

export function failedGateLabels(match: DebugMatch): string[] {
	return match.trace.disqualifiers
		.filter((gate) => gate.disqualified)
		.map((gate) => gate.label)
}

function matchesText(match: DebugMatch, text: string): boolean {
	const query = text.trim().toLowerCase()
	if (!query) return true
	return [match.name, match.brokerage, match.location].some((field) =>
		field?.toLowerCase().includes(query),
	)
}

export function filterQualified(
	qualified: DebugMatch[],
	filters: RankingFilters,
): DebugMatch[] {
	return qualified.filter((match) => matchesText(match, filters.text))
}

export function filterDisqualified(
	disqualified: DebugMatch[],
	filters: RankingFilters,
): DebugMatch[] {
	return disqualified.filter(
		(match) =>
			matchesText(match, filters.text) &&
			(!filters.dqGate || failedGateLabels(match).includes(filters.dqGate)),
	)
}

export function sortQualified(
	qualified: DebugMatch[],
	sortKey: SortKey,
): DebugMatch[] {
	if (sortKey === 'rank') return qualified
	const sorted = [...qualified]
	if (sortKey === 'preShuffle') {
		sorted.sort((a, b) => a.preShuffleRank - b.preShuffleRank)
	} else if (sortKey === 'agentFit') {
		sorted.sort((a, b) => (b.trace.agentFit ?? -1) - (a.trace.agentFit ?? -1))
	} else {
		sorted.sort(
			(a, b) =>
				(dimensionScore(b, sortKey) ?? -1) - (dimensionScore(a, sortKey) ?? -1),
		)
	}
	return sorted
}

/** Band grouping only makes sense in shuffled display order with nothing hidden. */
export function isBandView(sortKey: SortKey, filters: RankingFilters): boolean {
	return sortKey === 'rank' && !filters.text.trim() && !filters.dqGate
}

export function groupByBand(qualified: DebugMatch[]): DebugMatch[][] {
	const bands = new Map<number, DebugMatch[]>()
	for (const match of qualified) {
		const existing = bands.get(match.bandIndex) ?? []
		existing.push(match)
		bands.set(match.bandIndex, existing)
	}
	return Array.from(bands.values())
}
