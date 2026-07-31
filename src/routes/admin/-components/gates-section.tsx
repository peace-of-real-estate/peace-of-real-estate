import { XIcon as X } from '@phosphor-icons/react'

import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from '@/components/ui/tooltip'
import type { DisqualifierTrace, ScoreTrace } from '@/lib/matching/scoring'
import { cn } from '@/lib/utils/ui'
import {
	PassFailIcon,
	passFailTextClass,
} from '@/routes/admin/-components/pass-fail-icon'
import { SectionLabel } from '@/routes/admin/-components/section-label'

interface GatesSectionProps {
	trace: ScoreTrace
}

export function GatesSection({ trace }: GatesSectionProps) {
	if (trace.disqualifiers.length === 0) return null

	const failed = trace.disqualifiers.filter((gate) => gate.disqualified)
	const passed = trace.disqualifiers.filter((gate) => !gate.disqualified)

	if (failed.length === 0) {
		return (
			<Card className="p-3">
				<div className="flex flex-wrap items-center gap-1.5">
					<SectionLabel className="mr-1">Hard gates</SectionLabel>
					{passed.map((gate) => (
						<GateBadge key={gate.id} gate={gate} />
					))}
				</div>
			</Card>
		)
	}

	return (
		<Card className="border-red-500/20 bg-red-500/5 p-3">
			<SectionLabel className="mb-2">Disqualified — failed gates</SectionLabel>
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
			<div className="mt-2 flex flex-wrap items-center gap-1.5">
				{passed.map((gate) => (
					<GateBadge key={gate.id} gate={gate} />
				))}
			</div>
			<p className="text-muted-foreground mt-3 text-xs">
				Score before gate:{' '}
				<strong className="font-mono tabular-nums">
					{trace.computedScore}%
				</strong>
			</p>
		</Card>
	)
}

function GateBadge({ gate }: { gate: DisqualifierTrace }) {
	return (
		<Tooltip>
			<TooltipTrigger asChild>
				<Badge
					variant="outline"
					className={cn(
						'cursor-help font-mono',
						gate.disqualified ? 'border-destructive/40' : 'border-success/40',
						passFailTextClass(!gate.disqualified),
					)}
				>
					<PassFailIcon pass={!gate.disqualified} />
					{gate.label}
				</Badge>
			</TooltipTrigger>
			<TooltipContent>
				<p className="max-w-xs text-xs">{gate.detail}</p>
			</TooltipContent>
		</Tooltip>
	)
}
