import type { DebugMatch } from '@/lib/matching/debug'
import { cn } from '@/lib/utils/ui'
import { RankingRow } from '@/routes/debug/-components/ranking-row'

interface TieBandGroupProps {
	band: DebugMatch[]
	selectedAgentId: string | undefined
	compareAgentId: string | undefined
	onSelectAgent: (agentId: string) => void
}

export function TieBandGroup({
	band,
	selectedAgentId,
	compareAgentId,
	onSelectAgent,
}: TieBandGroupProps) {
	const [first] = band
	if (!first) return null

	const scores = band.map((match) => match.fitScore)
	const min = Math.min(...scores)
	const max = Math.max(...scores)
	const multi = band.length > 1

	return (
		<div
			className={cn(
				'overflow-hidden rounded-md border',
				multi && 'border-primary/30 border-l-2',
			)}
		>
			{multi && (
				<div className="text-muted-foreground bg-muted/40 flex items-center gap-1.5 border-b px-3 py-1 font-mono text-[10px] tabular-nums">
					band {first.bandIndex + 1} · {band.length} agents · {min}–{max} pts
					{first.bandOffset > 0 && (
						<span className="text-primary">rot +{first.bandOffset}</span>
					)}
				</div>
			)}
			<div className="divide-y">
				{band.map((match) => (
					<RankingRow
						key={match.agentId}
						match={match}
						selected={match.agentId === selectedAgentId}
						pinnedForCompare={match.agentId === compareAgentId}
						onSelect={() => onSelectAgent(match.agentId)}
					/>
				))}
			</div>
		</div>
	)
}
