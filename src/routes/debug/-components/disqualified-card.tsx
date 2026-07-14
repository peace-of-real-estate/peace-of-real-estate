import { X } from 'lucide-react'

import { Card } from '@/components/ui/card'
import type { ScoreTrace } from '@/lib/matching/scoring'
import { SectionLabel } from '@/routes/debug/-components/section-label'

interface DisqualifiedCardProps {
	trace: ScoreTrace
}

export function DisqualifiedCard({ trace }: DisqualifiedCardProps) {
	const failed = trace.disqualifiers.filter((gate) => gate.disqualified)

	return (
		<Card className="border-red-500/20 bg-red-500/5 p-3">
			<SectionLabel className="mb-2">Failed gate</SectionLabel>
			<div className="grid gap-2">
				{failed.map((gate) => (
					<div
						key={gate.id}
						className="bg-background rounded-lg border border-red-200 p-3 dark:border-red-900"
					>
						<div className="flex items-center gap-2 text-sm font-semibold text-red-600 dark:text-red-400">
							<X className="size-4" />
							{gate.label}
						</div>
						<p className="text-muted-foreground mt-1 text-xs">{gate.detail}</p>
					</div>
				))}
			</div>
			{trace.mode !== 'fallback' && (
				<p className="text-muted-foreground mt-3 text-xs">
					Hypothetical score before gate:{' '}
					<strong className="font-mono tabular-nums">
						{trace.computedScore}%
					</strong>
				</p>
			)}
		</Card>
	)
}
