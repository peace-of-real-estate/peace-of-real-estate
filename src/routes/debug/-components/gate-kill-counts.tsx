import { Card } from '@/components/ui/card'
import type { DebugMatchesPayload } from '@/lib/matching/debug'
import { SectionLabel } from '@/routes/debug/-components/section-label'

interface GateKillCountsProps {
	matches: DebugMatchesPayload
	onSelectGate: (gate: string) => void
}

export function GateKillCounts({ matches, onSelectGate }: GateKillCountsProps) {
	const kills = new Map<string, number>()
	for (const match of matches.disqualified) {
		for (const gate of match.trace.disqualifiers) {
			if (gate.disqualified) {
				kills.set(gate.label, (kills.get(gate.label) ?? 0) + 1)
			}
		}
	}

	const entries = Array.from(kills.entries())

	return (
		<Card className="p-3">
			<SectionLabel className="mb-2">Gate kill counts</SectionLabel>
			{entries.length === 0 ? (
				<p className="text-muted-foreground text-xs">
					No agents disqualified by hard gates.
				</p>
			) : (
				<div className="grid grid-cols-2 gap-2">
					{entries.map(([label, count]) => (
						<button
							key={label}
							type="button"
							onClick={() => onSelectGate(label)}
							title={`Filter disqualified list by "${label}"`}
							className="rounded-md border border-red-500/20 bg-red-500/5 px-2 py-1.5 text-left transition hover:bg-red-500/10"
						>
							<div className="text-lg font-semibold text-red-700 tabular-nums dark:text-red-300">
								{count}
							</div>
							<div className="text-[10px] text-red-700/70 uppercase dark:text-red-300/70">
								{label}
							</div>
						</button>
					))}
				</div>
			)}
		</Card>
	)
}
