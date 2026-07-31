import { BugIcon as Bug } from '@phosphor-icons/react'

import { Badge } from '@/components/ui/badge'
import type {
	DebugClientOption,
	DebugMatchesPayload,
} from '@/lib/matching/debug'
import { formatPriceRange } from '@/lib/price-range'
import type { ClientRole } from '@/lib/profile/types'
import { ClientPicker } from '@/routes/admin/-components/client-picker'
import { CopyJsonButton } from '@/routes/admin/-components/copy-json-button'

interface TopBarProps {
	clientOptions: DebugClientOption[]
	optionsLoading: boolean
	optionsError: string | undefined
	selectedClient: DebugClientOption | undefined
	matches: DebugMatchesPayload | undefined
	onSelectClient: (clientId: string, side: ClientRole) => void
	pickerOpen: boolean
	onPickerOpenChange: (open: boolean) => void
}

export function TopBar({
	clientOptions,
	optionsLoading,
	optionsError,
	selectedClient,
	matches,
	onSelectClient,
	pickerOpen,
	onPickerOpenChange,
}: TopBarProps) {
	return (
		<header className="flex h-12 shrink-0 items-center gap-3 border-b border-amber-500/30 bg-amber-500/5 px-3">
			<div className="flex shrink-0 items-center gap-1.5">
				<Bug className="size-4 text-amber-600 dark:text-amber-400" />
				<span className="font-mono text-sm font-semibold text-amber-700 dark:text-amber-400">
					admin/matches
				</span>
			</div>

			<div className="w-72 min-w-0">
				<ClientPicker
					options={clientOptions}
					loading={optionsLoading}
					selected={selectedClient}
					onSelect={onSelectClient}
					compact
					open={pickerOpen}
					onOpenChange={onPickerOpenChange}
				/>
			</div>

			{optionsError && (
				<span className="text-destructive truncate text-xs">
					Failed to load clients: {optionsError}
				</span>
			)}

			{selectedClient && (
				<div className="hidden min-w-0 items-center gap-2 md:flex">
					<Badge variant="muted" className="font-mono">
						{selectedClient.side}
					</Badge>
					<span className="text-muted-foreground truncate text-xs">
						{selectedClient.cityName}, {selectedClient.state} ·{' '}
						{formatPriceRange(selectedClient.priceRange)}
					</span>
				</div>
			)}

			<div className="ml-auto flex shrink-0 items-center gap-3">
				{matches && (
					<span className="text-muted-foreground hidden text-xs tabular-nums sm:block">
						{matches.totalAgents} fetched →{' '}
						{matches.totalAgents - matches.disqualified.length} passed gates →{' '}
						{matches.qualifiedCount} qualified
					</span>
				)}
				{matches && <CopyJsonButton value={matches} label="payload" />}
			</div>
		</header>
	)
}
