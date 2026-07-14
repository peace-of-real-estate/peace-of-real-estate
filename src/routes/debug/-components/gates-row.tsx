import { Check, X } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from '@/components/ui/tooltip'
import type { ScoreTrace } from '@/lib/matching/scoring'
import { SectionLabel } from '@/routes/debug/-components/section-label'

interface GatesRowProps {
	trace: ScoreTrace
}

export function GatesRow({ trace }: GatesRowProps) {
	const failed = trace.disqualifiers.filter((gate) => gate.disqualified)

	return (
		<Card className="p-3">
			<SectionLabel className="mb-2">Stage 0 — Hard gates</SectionLabel>
			<div className="flex flex-wrap items-center gap-1.5">
				{trace.disqualifiers.map((gate) => (
					<Tooltip key={gate.id}>
						<TooltipTrigger asChild>
							<Badge
								variant="outline"
								className={
									gate.disqualified
										? 'cursor-help border-red-400/40 font-mono text-red-600 dark:text-red-400'
										: 'cursor-help border-emerald-400/40 font-mono text-emerald-600 dark:text-emerald-400'
								}
							>
								{gate.disqualified ? <X /> : <Check />}
								{gate.label}
							</Badge>
						</TooltipTrigger>
						<TooltipContent>
							<p className="max-w-xs text-xs">{gate.detail}</p>
						</TooltipContent>
					</Tooltip>
				))}
			</div>
			{failed.length > 0 && (
				<div className="mt-2 space-y-1">
					{failed.map((gate) => (
						<p key={gate.id} className="text-xs text-red-700 dark:text-red-300">
							<span className="font-semibold">{gate.label}:</span> {gate.detail}
						</p>
					))}
				</div>
			)}
		</Card>
	)
}
