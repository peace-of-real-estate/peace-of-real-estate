import { MousePointerClick } from 'lucide-react'

import type { DebugMatchesPayload } from '@/lib/matching/debug'
import { DimensionCohortStats } from '@/routes/debug/-components/dimension-cohort-stats'
import { GateKillCounts } from '@/routes/debug/-components/gate-kill-counts'
import { ScoreHistogram } from '@/routes/debug/-components/score-histogram'
import { SectionLabel } from '@/routes/debug/-components/section-label'
import { WeightsPanel } from '@/routes/debug/-components/weights-panel'

interface CohortOverviewProps {
	matches: DebugMatchesPayload
	onFilterByGate: (gate: string) => void
}

export function CohortOverview({
	matches,
	onFilterByGate,
}: CohortOverviewProps) {
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
				<ScoreHistogram matches={matches} />
				<WeightsPanel matches={matches} />
				<GateKillCounts matches={matches} onSelectGate={onFilterByGate} />
				<DimensionCohortStats matches={matches} />
			</div>
		</div>
	)
}
