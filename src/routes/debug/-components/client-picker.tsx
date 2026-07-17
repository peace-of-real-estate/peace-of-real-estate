import {
	CaretUpDownIcon as ChevronsUpDown,
	CheckIcon as Check,
	UserIcon as User,
} from '@phosphor-icons/react'
import * as React from 'react'

import { Button } from '@/components/ui/button'
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
} from '@/components/ui/command'
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from '@/components/ui/popover'
import type { DebugClientOption } from '@/lib/matching/debug'
import { cn } from '@/lib/utils/ui'

interface ClientPickerProps {
	options: DebugClientOption[]
	loading: boolean
	selected: DebugClientOption | undefined
	onSelect: (clientId: string, side: 'buying' | 'selling') => void
	compact?: boolean | undefined
	/** Optional controlled open state (used for the ⌘K shortcut). */
	open?: boolean | undefined
	onOpenChange?: ((open: boolean) => void) | undefined
}

export function ClientPicker({
	options,
	loading,
	selected,
	onSelect,
	compact = false,
	open: controlledOpen,
	onOpenChange,
}: ClientPickerProps) {
	if ((controlledOpen === undefined) !== (onOpenChange === undefined)) {
		throw new Error(
			'ClientPicker: `open` and `onOpenChange` must be provided together',
		)
	}

	const [uncontrolledOpen, setUncontrolledOpen] = React.useState(false)
	const open = controlledOpen ?? uncontrolledOpen
	const setOpen = onOpenChange ?? setUncontrolledOpen

	const buyers = options.filter((option) => option.side === 'buying')
	const sellers = options.filter((option) => option.side === 'selling')

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger asChild>
				<Button
					variant="outline"
					aria-expanded={open}
					aria-label="Select a client profile"
					className={cn(
						'justify-between',
						compact ? 'w-full' : 'w-full max-w-sm',
					)}
					disabled={loading}
				>
					<span className="truncate">
						{selected
							? `${selected.name ?? selected.email} (${selected.side}) · ${selected.city}, ${selected.state}`
							: loading
								? 'Loading clients...'
								: 'Select a client profile...'}
					</span>
					<ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
				</Button>
			</PopoverTrigger>
			<PopoverContent className="w-full max-w-sm p-0">
				<Command>
					<CommandInput placeholder="Search clients..." />
					<CommandList>
						<CommandEmpty>No client found.</CommandEmpty>
						{buyers.length > 0 && (
							<CommandGroup heading="Buyers">
								{buyers.map((option) => (
									<ClientCommandItem
										key={option.id}
										option={option}
										selected={selected}
										onSelect={() => {
											onSelect(option.id, option.side)
											setOpen(false)
										}}
									/>
								))}
							</CommandGroup>
						)}
						{sellers.length > 0 && (
							<CommandGroup heading="Sellers">
								{sellers.map((option) => (
									<ClientCommandItem
										key={option.id}
										option={option}
										selected={selected}
										onSelect={() => {
											onSelect(option.id, option.side)
											setOpen(false)
										}}
									/>
								))}
							</CommandGroup>
						)}
					</CommandList>
				</Command>
			</PopoverContent>
		</Popover>
	)
}

function ClientCommandItem({
	option,
	selected,
	onSelect,
}: {
	option: DebugClientOption
	selected: DebugClientOption | undefined
	onSelect: () => void
}) {
	const isSelected = selected?.id === option.id
	return (
		<CommandItem
			value={[option.name, option.email].filter(Boolean).join(' ')}
			onSelect={onSelect}
		>
			<User className="mr-2 h-4 w-4" />
			<span className="flex-1 truncate">
				{option.name ?? option.email} · {option.city}, {option.state} ·{' '}
				{option.priceRange}
			</span>
			{isSelected && <Check className="ml-2 h-4 w-4" />}
		</CommandItem>
	)
}
