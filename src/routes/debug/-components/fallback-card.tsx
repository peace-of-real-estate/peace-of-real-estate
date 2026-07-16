import { CheckIcon as Check, XIcon as X } from '@phosphor-icons/react'

import { Card } from '@/components/ui/card'
import type { ScoreTrace } from '@/lib/matching/scoring'
import { SectionLabel } from '@/routes/debug/-components/section-label'

interface FallbackCardProps {
	trace: ScoreTrace
}

export function FallbackCard({ trace }: FallbackCardProps) {
	if (trace.mode !== 'fallback' || !trace.fallback) return null

	return (
		<Card className="p-3">
			<SectionLabel className="mb-2">
				Fallback mode — no client profile
			</SectionLabel>
			<div className="grid gap-3 sm:grid-cols-2">
				<CompletenessList
					label="Complete"
					tone="pass"
					items={trace.fallback.present}
				/>
				<CompletenessList
					label="Missing"
					tone="fail"
					items={trace.fallback.missing}
				/>
			</div>
		</Card>
	)
}

function CompletenessList({
	label,
	tone,
	items,
}: {
	label: string
	tone: 'pass' | 'fail'
	items: string[]
}) {
	return (
		<div className="bg-background rounded-lg border p-2.5">
			<p
				className={`text-[11px] font-semibold tracking-wide uppercase ${
					tone === 'pass'
						? 'text-emerald-600 dark:text-emerald-400'
						: 'text-red-600 dark:text-red-400'
				}`}
			>
				{label} ({items.length})
			</p>
			{items.length > 0 ? (
				<ul className="mt-1.5 space-y-1">
					{items.map((item) => (
						<li key={item} className="flex items-center gap-1.5 text-xs">
							{tone === 'pass' ? (
								<Check className="h-3.5 w-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
							) : (
								<X className="h-3.5 w-3.5 shrink-0 text-red-600 dark:text-red-400" />
							)}
							{item}
						</li>
					))}
				</ul>
			) : (
				<p className="text-muted-foreground mt-1.5 text-xs">(none)</p>
			)}
		</div>
	)
}
