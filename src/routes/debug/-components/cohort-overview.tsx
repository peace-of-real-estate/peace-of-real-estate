import { CursorClickIcon as MousePointerClick } from '@phosphor-icons/react'

import type { DebugMatch, DebugMatchesPayload } from '@/lib/matching/debug'
import {
	CohortGeoMap,
	type CohortAgentPoint,
} from '@/routes/debug/-components/cohort-geo-map'
import { DimensionCohortStats } from '@/routes/debug/-components/dimension-cohort-stats'
import { GateKillCounts } from '@/routes/debug/-components/gate-kill-counts'
import { MapPlaceholder } from '@/routes/debug/-components/map-support'
import { ScoreHistogram } from '@/routes/debug/-components/score-histogram'
import { SectionLabel } from '@/routes/debug/-components/section-label'
import { WeightsPanel } from '@/routes/debug/-components/weights-panel'

interface CohortOverviewProps {
	matches: DebugMatchesPayload
	onFilterByGate: (gate: string) => void
	onSelectAgent: (agentId: string) => void
	mapsEnabled: boolean
}

function toAgentPoint(match: DebugMatch): CohortAgentPoint | undefined {
	const center = match.trace.geo?.agent
	if (!center) return undefined
	return {
		agentId: match.agentId,
		name: match.name,
		lat: center.lat,
		lng: center.lng,
		fitScore: match.fitScore,
		computedScore: match.trace.computedScore,
		disqualified: match.disqualified,
	}
}

export function CohortOverview({
	matches,
	onFilterByGate,
	onSelectAgent,
	mapsEnabled,
}: CohortOverviewProps) {
	const allMatches = [...matches.qualified, ...matches.disqualified]
	const clientCenter = allMatches.find((match) => match.trace.geo?.client)
		?.trace.geo?.client
	const agentPoints = allMatches
		.map(toAgentPoint)
		.filter((point) => point !== undefined)
	const showMap = clientCenter && agentPoints.length > 0

	return (
		<div className="min-h-0 space-y-3 overflow-y-auto p-4">
			<div className="flex items-center justify-between">
				<SectionLabel>Cohort overview</SectionLabel>
				<p className="text-muted-foreground flex items-center gap-1.5 text-xs">
					<MousePointerClick className="size-3.5" />
					Select an agent to inspect its trace — j/k to navigate
				</p>
			</div>
			<div className="grid gap-3 xl:grid-cols-2">
				{showMap &&
					(mapsEnabled ? (
						<CohortGeoMap
							client={clientCenter}
							clientLabel={`${matches.clientProfile.city}, ${matches.clientProfile.state}`}
							agents={agentPoints}
							onSelectAgent={onSelectAgent}
						/>
					) : (
						<MapPlaceholder label="Agent geography" className="xl:col-span-2" />
					))}
				<ScoreHistogram matches={matches} />
				<WeightsPanel matches={matches} />
				<GateKillCounts matches={matches} onSelectGate={onFilterByGate} />
				<DimensionCohortStats matches={matches} />
			</div>
		</div>
	)
}
