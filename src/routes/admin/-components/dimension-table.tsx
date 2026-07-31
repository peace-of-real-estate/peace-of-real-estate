import * as React from 'react'

import { Accordion } from '@/components/ui/accordion'
import { Card } from '@/components/ui/card'
import type { ScoreTrace } from '@/lib/matching/scoring'
import { cn } from '@/lib/utils/ui'
import { DimensionRow } from '@/routes/admin/-components/dimension-row'
import {
	scoreTone,
	scoreToneClasses,
} from '@/routes/admin/-components/score-tone'
import { SectionLabel } from '@/routes/admin/-components/section-label'

interface DimensionTableProps {
	trace: ScoreTrace
}

type RowOrder = 'lost' | 'pipeline'

export function DimensionTable({ trace }: DimensionTableProps) {
	const [order, setOrder] = React.useState<RowOrder>('lost')

	const dimensions =
		order === 'lost'
			? [...trace.dimensions].sort(
					(a, b) => b.weight - b.contribution - (a.weight - a.contribution),
				)
			: trace.dimensions

	const total = trace.dimensions.reduce(
		(sum, dimension) => sum + dimension.contribution,
		0,
	)

	return (
		<Card className="p-3">
			<div className="mb-1 flex items-center justify-between">
				<SectionLabel>Stage 1 — Dimensions</SectionLabel>
				<div className="flex items-center gap-0.5 font-mono text-[10px]">
					<OrderButton
						active={order === 'lost'}
						onClick={() => setOrder('lost')}
					>
						by points lost
					</OrderButton>
					<OrderButton
						active={order === 'pipeline'}
						onClick={() => setOrder('pipeline')}
					>
						pipeline order
					</OrderButton>
				</div>
			</div>

			<Accordion type="multiple">
				{dimensions.map((dimension) => (
					<DimensionRow key={dimension.id} dimension={dimension} />
				))}
			</Accordion>

			<div className="mt-3 space-y-1.5 border-t pt-3">
				<div className="bg-muted flex h-2 w-full overflow-hidden rounded-full">
					{trace.dimensions.map((dimension) => (
						<div
							key={dimension.id}
							title={`${dimension.label}: ${dimension.contribution.toFixed(2)} pts`}
							className={cn(
								'h-full',
								scoreToneClasses[scoreTone(dimension.score)].solid,
							)}
							style={{ width: `${dimension.contribution}%` }}
						/>
					))}
				</div>
				<div className="flex items-center justify-between text-xs">
					<span className="text-muted-foreground">
						Weighted dimension total (of 100 pts)
					</span>
					<span className="font-mono font-semibold tabular-nums">
						{total.toFixed(2)} pts → Stage 2
					</span>
				</div>
			</div>
		</Card>
	)
}

function OrderButton({
	active,
	onClick,
	children,
}: {
	active: boolean
	onClick: () => void
	children: React.ReactNode
}) {
	return (
		<button
			type="button"
			onClick={onClick}
			className={cn(
				'rounded px-1.5 py-0.5 transition',
				active
					? 'bg-muted text-foreground font-semibold'
					: 'text-muted-foreground hover:text-foreground',
			)}
		>
			{children}
		</button>
	)
}
