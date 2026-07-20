import { Card } from '@/components/ui/card'
import type { ScoreTrace } from '@/lib/matching/scoring'
import {
	PassFailIcon,
	passFailTextClass,
} from '@/routes/admin/-components/pass-fail-icon'
import { SectionLabel } from '@/routes/admin/-components/section-label'

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
	const pass = tone === 'pass'

	return (
		<div className="bg-background rounded-lg border p-2.5">
			<p
				className={`text-[11px] font-semibold tracking-wide uppercase ${passFailTextClass(pass)}`}
			>
				{label} ({items.length})
			</p>
			{items.length > 0 ? (
				<ul className="mt-1.5 space-y-1">
					{items.map((item) => (
						<li key={item} className="flex items-center gap-1.5 text-xs">
							<PassFailIcon pass={pass} className="h-3.5 w-3.5 shrink-0" />
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
