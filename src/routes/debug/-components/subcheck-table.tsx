import {
	CheckIcon as Check,
	MinusIcon as Minus,
	XIcon as X,
} from '@phosphor-icons/react'

import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@/components/ui/table'
import type { SubCheck } from '@/lib/matching/scoring'

interface SubcheckTableProps {
	checks: SubCheck[]
}

export function SubcheckTable({ checks }: SubcheckTableProps) {
	if (checks.length === 0) return null

	return (
		<div className="mt-3 overflow-hidden rounded-md border">
			<Table>
				<TableHeader>
					<TableRow className="bg-muted/50 hover:bg-muted/50">
						<TableHead className="h-7 px-2 py-1.5 text-[11px] font-semibold uppercase">
							Check
						</TableHead>
						<TableHead className="h-7 px-2 py-1.5 text-[11px] font-semibold uppercase">
							Client
						</TableHead>
						<TableHead className="h-7 px-2 py-1.5 text-[11px] font-semibold uppercase">
							Agent
						</TableHead>
						<TableHead className="h-7 px-2 py-1.5 text-right text-[11px] font-semibold uppercase">
							Result
						</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{checks.map((check) => (
						<CheckRow key={check.label} check={check} />
					))}
				</TableBody>
			</Table>
		</div>
	)
}

function CheckRow({ check }: { check: SubCheck }) {
	const icon =
		check.passed === null ? (
			<Minus className="text-muted-foreground h-3.5 w-3.5 shrink-0" />
		) : check.passed ? (
			<Check className="h-3.5 w-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
		) : (
			<X className="h-3.5 w-3.5 shrink-0 text-red-600 dark:text-red-400" />
		)

	return (
		<TableRow className="hover:bg-transparent">
			<TableCell className="px-2 py-1.5 text-xs font-medium whitespace-nowrap">
				{check.label}
			</TableCell>
			<TableCell className="text-muted-foreground px-2 py-1.5 font-mono text-xs break-words">
				{check.client}
			</TableCell>
			<TableCell className="text-muted-foreground px-2 py-1.5 font-mono text-xs break-words">
				{check.agent}
			</TableCell>
			<TableCell className="px-2 py-1.5 text-right text-xs">
				<span className="inline-flex items-center justify-end gap-1 whitespace-nowrap">
					{icon}
					<span className="text-muted-foreground">{check.effect}</span>
				</span>
			</TableCell>
		</TableRow>
	)
}
