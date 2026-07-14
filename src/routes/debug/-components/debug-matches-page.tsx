import { skipToken, useQuery } from '@tanstack/react-query'
import { Bug } from 'lucide-react'
import * as React from 'react'

import { Card } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { TooltipProvider } from '@/components/ui/tooltip'
import {
	type DebugClientOption,
	type DebugMatch,
	type DebugMatchesPayload,
} from '@/lib/matching/debug'
import { ClientPicker } from '@/routes/debug/-components/client-picker'
import { Inspector } from '@/routes/debug/-components/inspector'
import {
	EMPTY_FILTERS,
	filterDisqualified,
	filterQualified,
	sortQualified,
	type RankingFilters,
	type SortKey,
} from '@/routes/debug/-components/ranking-model'
import { RankingRail } from '@/routes/debug/-components/ranking-rail'
import {
	ErrorState,
	RailSkeleton,
} from '@/routes/debug/-components/query-states'
import { TopBar } from '@/routes/debug/-components/top-bar'
import { useRankingKeyboard } from '@/routes/debug/-components/use-ranking-keyboard'

export interface DebugMatchesPageProps {
	clientId: string | undefined
	side: 'buying' | 'selling' | undefined
	selectedAgentId: string | undefined
	compareAgentId: string | undefined
	onSelectClient: (clientId: string, side: 'buying' | 'selling') => void
	onSelectAgent: (agentId: string | undefined) => void
	onSetCompare: (agentId: string | undefined) => void
	loadDebugClientOptions: () => Promise<DebugClientOption[]>
	loadDebugMatches: (input: {
		clientId: string
		side: 'buying' | 'selling'
	}) => Promise<DebugMatchesPayload>
}

export function DebugMatchesPage({
	clientId,
	side,
	selectedAgentId,
	compareAgentId,
	onSelectClient,
	onSelectAgent,
	onSetCompare,
	loadDebugClientOptions,
	loadDebugMatches,
}: DebugMatchesPageProps) {
	const [pickerOpen, setPickerOpen] = React.useState(false)
	const [filters, setFilters] = React.useState<RankingFilters>(EMPTY_FILTERS)
	const [sortKey, setSortKey] = React.useState<SortKey>('rank')
	const filterInputRef = React.useRef<HTMLInputElement>(null)

	const optionsQuery = useQuery({
		queryKey: ['debug-client-options'],
		queryFn: loadDebugClientOptions,
	})

	const matchesInput = clientId && side ? { clientId, side } : undefined
	const matchesQuery = useQuery({
		queryKey: ['debug-matches', clientId, side],
		queryFn: matchesInput ? () => loadDebugMatches(matchesInput) : skipToken,
	})
	const matches = matchesQuery.data

	const matchesById = React.useMemo(() => {
		const byId = new Map<string, DebugMatch>()
		if (matches) {
			for (const match of [...matches.qualified, ...matches.disqualified]) {
				byId.set(match.agentId, match)
			}
		}
		return byId
	}, [matches])

	const selectedMatch = selectedAgentId
		? matchesById.get(selectedAgentId)
		: undefined
	const compareMatch = compareAgentId
		? matchesById.get(compareAgentId)
		: undefined

	const visibleQualified = React.useMemo(
		() =>
			matches
				? sortQualified(filterQualified(matches.qualified, filters), sortKey)
				: [],
		[matches, filters, sortKey],
	)
	const visibleDisqualified = React.useMemo(
		() => (matches ? filterDisqualified(matches.disqualified, filters) : []),
		[matches, filters],
	)
	const visibleAgentIds = React.useMemo(
		() =>
			[...visibleQualified, ...visibleDisqualified].map(
				(match) => match.agentId,
			),
		[visibleQualified, visibleDisqualified],
	)

	useRankingKeyboard({
		visibleAgentIds,
		selectedAgentId,
		onSelectAgent,
		onToggleCompare: () => {
			if (!selectedAgentId) return
			onSetCompare(
				compareAgentId === selectedAgentId ? undefined : selectedAgentId,
			)
		},
		onFocusFilter: () => filterInputRef.current?.focus(),
		onOpenClientPicker: () => setPickerOpen(true),
	})

	const selectedClient = optionsQuery.data?.find(
		(option) => option.id === clientId,
	)

	return (
		<TooltipProvider>
			<div className="bg-background flex h-svh flex-col">
				<TopBar
					clientOptions={optionsQuery.data ?? []}
					optionsLoading={optionsQuery.isLoading}
					optionsError={
						optionsQuery.isError ? optionsQuery.error.message : undefined
					}
					selectedClient={selectedClient}
					matches={matches}
					onSelectClient={onSelectClient}
					pickerOpen={pickerOpen}
					onPickerOpenChange={setPickerOpen}
				/>

				{!matchesInput ? (
					<NoClientState
						clientOptions={optionsQuery.data ?? []}
						optionsLoading={optionsQuery.isLoading}
						onSelectClient={onSelectClient}
					/>
				) : matchesQuery.isError ? (
					<ErrorState
						title="Failed to load matches"
						message={matchesQuery.error.message}
						onRetry={() => void matchesQuery.refetch()}
					/>
				) : matchesQuery.isLoading || !matches ? (
					<div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[380px_minmax(0,1fr)]">
						<RailSkeleton />
					</div>
				) : (
					<div className="grid min-h-0 flex-1 grid-cols-1 overflow-hidden lg:grid-cols-[380px_auto_minmax(0,1fr)]">
						<RankingRail
							matches={matches}
							visibleQualified={visibleQualified}
							visibleDisqualified={visibleDisqualified}
							filters={filters}
							onFiltersChange={setFilters}
							sortKey={sortKey}
							onSortKeyChange={setSortKey}
							filterInputRef={filterInputRef}
							selectedAgentId={selectedAgentId}
							compareAgentId={compareAgentId}
							onSelectAgent={onSelectAgent}
						/>
						<Separator orientation="vertical" className="hidden lg:block" />
						<Inspector
							matches={matches}
							selectedAgentId={selectedAgentId}
							selectedMatch={selectedMatch}
							compareAgentId={compareAgentId}
							compareMatch={compareMatch}
							onSelectAgent={onSelectAgent}
							onSetCompare={onSetCompare}
							onFilterByGate={(gate) =>
								setFilters((prev) => ({ ...prev, dqGate: gate }))
							}
						/>
					</div>
				)}
			</div>
		</TooltipProvider>
	)
}

function NoClientState({
	clientOptions,
	optionsLoading,
	onSelectClient,
}: {
	clientOptions: DebugClientOption[]
	optionsLoading: boolean
	onSelectClient: (clientId: string, side: 'buying' | 'selling') => void
}) {
	return (
		<div className="flex flex-1 items-center justify-center p-6">
			<Card className="max-w-md p-6 text-center">
				<Bug className="text-muted-foreground mx-auto mb-4 h-10 w-10" />
				<h2 className="mb-2 text-xl font-semibold">Select a client profile</h2>
				<p className="text-muted-foreground mb-4 text-sm">
					Choose a buyer or seller to inspect the matching pipeline for that
					profile. Press <Kbd>⌘K</Kbd> to open the picker anywhere.
				</p>
				<ClientPicker
					options={clientOptions}
					loading={optionsLoading}
					selected={undefined}
					onSelect={onSelectClient}
					compact
				/>
			</Card>
		</div>
	)
}

function Kbd({ children }: { children: React.ReactNode }) {
	return (
		<kbd className="bg-muted rounded border px-1 py-0.5 font-mono text-[10px]">
			{children}
		</kbd>
	)
}
