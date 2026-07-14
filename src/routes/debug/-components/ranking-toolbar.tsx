import { ArrowDownWideNarrow, Check, Search, X } from 'lucide-react'
import * as React from 'react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
	Command,
	CommandGroup,
	CommandItem,
	CommandList,
} from '@/components/ui/command'
import { Input } from '@/components/ui/input'
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from '@/components/ui/popover'
import { cn } from '@/lib/utils/ui'
import {
	SORT_OPTIONS,
	sortLabel,
	type RankingFilters,
	type SortKey,
} from '@/routes/debug/-components/ranking-model'

interface RankingToolbarProps {
	filters: RankingFilters
	onFiltersChange: (filters: RankingFilters) => void
	sortKey: SortKey
	onSortKeyChange: (sortKey: SortKey) => void
	filterInputRef: React.Ref<HTMLInputElement>
	visibleCount: number
	totalCount: number
}

export function RankingToolbar({
	filters,
	onFiltersChange,
	sortKey,
	onSortKeyChange,
	filterInputRef,
	visibleCount,
	totalCount,
}: RankingToolbarProps) {
	const [sortOpen, setSortOpen] = React.useState(false)

	return (
		<div className="bg-background sticky top-0 z-10 space-y-2 border-b p-3">
			<div className="flex items-center gap-2">
				<div className="relative flex-1">
					<Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2" />
					<Input
						ref={filterInputRef}
						value={filters.text}
						onChange={(event) =>
							onFiltersChange({ ...filters, text: event.target.value })
						}
						onKeyDown={(event) => {
							if (event.key === 'Escape') {
								onFiltersChange({ ...filters, text: '' })
								event.currentTarget.blur()
							}
						}}
						placeholder="Filter agents…"
						aria-label="Filter agents"
						className="h-8 pl-8 text-sm"
					/>
					{!filters.text && (
						<kbd className="bg-muted text-muted-foreground pointer-events-none absolute top-1/2 right-2.5 -translate-y-1/2 rounded border px-1 font-mono text-[10px]">
							/
						</kbd>
					)}
				</div>

				<Popover open={sortOpen} onOpenChange={setSortOpen}>
					<PopoverTrigger asChild>
						<Button
							variant="outline"
							size="sm"
							aria-label="Sort ranking"
							className={cn(sortKey !== 'rank' && 'text-primary')}
						>
							<ArrowDownWideNarrow />
							<span className="max-w-24 truncate text-xs">
								{sortLabel(sortKey)}
							</span>
						</Button>
					</PopoverTrigger>
					<PopoverContent align="end" className="w-56 p-0">
						<Command>
							<CommandList>
								<CommandGroup heading="Sort by">
									{SORT_OPTIONS.map((option) => (
										<CommandItem
											key={option.key}
											onSelect={() => {
												onSortKeyChange(option.key)
												setSortOpen(false)
											}}
										>
											<span className="flex-1">{option.label}</span>
											{option.key === sortKey && <Check className="size-4" />}
										</CommandItem>
									))}
								</CommandGroup>
							</CommandList>
						</Command>
					</PopoverContent>
				</Popover>
			</div>

			<div className="flex items-center gap-2">
				<span className="text-muted-foreground text-xs tabular-nums">
					{visibleCount} of {totalCount} agents
				</span>
				{filters.dqGate && (
					<Badge
						variant="outline"
						className="gap-1 border-red-500/30 text-red-700 dark:text-red-300"
					>
						DQ: {filters.dqGate}
						<button
							type="button"
							aria-label="Clear gate filter"
							onClick={() => onFiltersChange({ ...filters, dqGate: undefined })}
						>
							<X className="size-3" />
						</button>
					</Badge>
				)}
			</div>
		</div>
	)
}
