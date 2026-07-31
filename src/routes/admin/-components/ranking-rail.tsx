import { CaretDownIcon as ChevronDown } from '@phosphor-icons/react'
import * as React from 'react'

import type { DebugMatch, DebugMatchesPayload } from '@/lib/matching/debug'
import { cn } from '@/lib/utils/ui'
import { EmptyState } from '@/routes/admin/-components/query-states'
import {
	groupByBand,
	isBandView,
	type RankingFilters,
	type SortKey,
} from '@/routes/admin/-components/ranking-model'
import { RankingRow } from '@/routes/admin/-components/ranking-row'
import { RankingToolbar } from '@/routes/admin/-components/ranking-toolbar'
import { TieBandGroup } from '@/routes/admin/-components/tie-band-group'

interface RankingRailProps {
	matches: DebugMatchesPayload
	visibleQualified: DebugMatch[]
	visibleDisqualified: DebugMatch[]
	filters: RankingFilters
	onFiltersChange: (filters: RankingFilters) => void
	sortKey: SortKey
	onSortKeyChange: (sortKey: SortKey) => void
	filterInputRef: React.Ref<HTMLInputElement>
	selectedAgentId: string | undefined
	compareAgentId: string | undefined
	onSelectAgent: (agentId: string) => void
}

export function RankingRail({
	matches,
	visibleQualified,
	visibleDisqualified,
	filters,
	onFiltersChange,
	sortKey,
	onSortKeyChange,
	filterInputRef,
	selectedAgentId,
	compareAgentId,
	onSelectAgent,
}: RankingRailProps) {
	const bandView = isBandView(sortKey, filters)
	const [dqOverride, setDqOverride] = React.useState<boolean | undefined>(
		undefined,
	)
	const selectedIsDisqualified = visibleDisqualified.some(
		(match) => match.agentId === selectedAgentId,
	)
	const dqForcedOpen = Boolean(filters.dqGate) || selectedIsDisqualified
	const dqVisible = dqOverride ?? dqForcedOpen

	React.useEffect(() => {
		if (!dqForcedOpen) setDqOverride(undefined)
	}, [dqForcedOpen])

	if (matches.totalAgents === 0) {
		return (
			<EmptyState
				title="No agents scored"
				hint="Run `vp run db:seed` to populate agents."
			/>
		)
	}

	return (
		<div className="flex min-h-0 flex-col overflow-y-auto">
			<RankingToolbar
				filters={filters}
				onFiltersChange={onFiltersChange}
				sortKey={sortKey}
				onSortKeyChange={onSortKeyChange}
				filterInputRef={filterInputRef}
				visibleCount={visibleQualified.length + visibleDisqualified.length}
				totalCount={matches.totalAgents}
			/>

			<div className="space-y-3 p-3">
				{!bandView && (
					<p className="text-muted-foreground font-mono text-[10px]">
						band view disabled while sorted/filtered
					</p>
				)}

				{bandView ? (
					groupByBand(visibleQualified).map((band) => (
						<TieBandGroup
							key={band[0]?.bandIndex ?? 0}
							band={band}
							selectedAgentId={selectedAgentId}
							compareAgentId={compareAgentId}
							onSelectAgent={onSelectAgent}
						/>
					))
				) : (
					<div className="divide-y overflow-hidden rounded-md border">
						{visibleQualified.map((match) => (
							<RankingRow
								key={match.agentId}
								match={match}
								selected={match.agentId === selectedAgentId}
								pinnedForCompare={match.agentId === compareAgentId}
								onSelect={() => onSelectAgent(match.agentId)}
							/>
						))}
					</div>
				)}

				{visibleQualified.length === 0 && (
					<p className="text-muted-foreground p-2 text-center text-xs">
						No qualified agents match the current filter.
					</p>
				)}

				{matches.disqualified.length > 0 && (
					<div className="overflow-hidden rounded-md border border-red-500/20">
						<button
							type="button"
							onClick={() => setDqOverride(!dqVisible)}
							aria-expanded={dqVisible}
							className="flex w-full items-center gap-1.5 bg-red-500/5 px-3 py-2 text-xs font-semibold text-red-700 dark:text-red-300"
						>
							<ChevronDown
								className={cn(
									'size-3.5 transition',
									!dqVisible && '-rotate-90',
								)}
							/>
							Disqualified ({visibleDisqualified.length}
							{visibleDisqualified.length !== matches.disqualified.length &&
								` of ${matches.disqualified.length}`}
							)
						</button>
						{dqVisible && (
							<div className="divide-y border-t">
								{visibleDisqualified.length > 0 ? (
									visibleDisqualified.map((match) => (
										<RankingRow
											key={match.agentId}
											match={match}
											selected={match.agentId === selectedAgentId}
											pinnedForCompare={match.agentId === compareAgentId}
											onSelect={() => onSelectAgent(match.agentId)}
											disqualified
										/>
									))
								) : (
									<p className="text-muted-foreground p-2 text-center text-xs">
										No disqualified agents match the current filter.
									</p>
								)}
							</div>
						)}
					</div>
				)}
			</div>
		</div>
	)
}
