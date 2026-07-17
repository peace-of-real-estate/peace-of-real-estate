import {
	CaretDownIcon as ChevronDown,
	CheckIcon as Check,
	EnvelopeIcon as Mail,
	SlidersHorizontalIcon as SlidersHorizontal,
} from '@phosphor-icons/react'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Pill } from '@/routes/docs/-components/doc-ui'

// Low-fidelity, real-component mockups for the /docs/ui page.
// These are not interactive; they show the target layout and state vocabulary.

function MockAvatar({ seed, size = 40 }: { seed: string; size?: number }) {
	return (
		<img
			src={`https://i.pravatar.cc/${size}?u=${seed}`}
			alt=""
			className="shrink-0 rounded-full object-cover"
			style={{ width: size, height: size }}
		/>
	)
}

function DimensionBar({
	label,
	strength,
}: {
	label: string
	strength: number
}) {
	return (
		<div className="flex items-center gap-1.5">
			<span className="text-muted-foreground text-[10px] uppercase">
				{label}
			</span>
			<div className="bg-muted h-1.5 w-12 overflow-hidden rounded-full">
				<div
					className="bg-primary h-full rounded-full"
					style={{ width: `${strength}%` }}
				/>
			</div>
		</div>
	)
}

function MockCheckbox({
	checked,
	disabled,
}: {
	checked?: boolean
	disabled?: boolean
}) {
	return (
		<div
			className={`grid h-5 w-5 place-items-center rounded-md border ${
				checked
					? 'border-primary bg-primary text-primary-foreground'
					: 'border-border bg-background'
			} ${disabled ? 'opacity-40' : ''}`}
		>
			{checked ? <Check className="h-3 w-3" /> : null}
		</div>
	)
}

export function MatchListMockup() {
	return (
		<Card className="bg-card/50 shadow-none">
			<CardContent className="space-y-3">
				<div className="flex flex-wrap items-center gap-2 text-xs">
					<div className="border-border inline-flex h-8 items-center gap-1 rounded-full border px-3">
						<span className="text-muted-foreground">Sort:</span>
						<span className="font-medium">Best fit</span>
						<ChevronDown className="text-muted-foreground h-3 w-3" />
					</div>
					<Button variant="outline" size="xs">
						<SlidersHorizontal className="h-3 w-3" />
						Filter
					</Button>
					<span className="text-muted-foreground ml-auto">
						12 matches · 8 qualified
					</span>
				</div>

				<div className="divide-y rounded-xl border">
					<div className="flex items-center gap-3 p-3">
						<MockAvatar seed="sarah.smith@example.com" />
						<div className="min-w-0 flex-1">
							<div className="flex items-center gap-2">
								<span className="text-sm font-semibold">Sarah Smith</span>
								<Pill tone="green">Top match</Pill>
							</div>
							<div className="text-muted-foreground text-xs">
								Compass · Austin, TX
							</div>
							<div className="mt-1.5 flex flex-wrap gap-3">
								<DimensionBar label="Location" strength={95} />
								<DimensionBar label="Price" strength={88} />
								<DimensionBar label="Client" strength={90} />
							</div>
						</div>
						<div className="flex flex-col items-end gap-1">
							<span className="text-muted-foreground text-[10px]">
								12 yrs · 24/yr
							</span>
							<MockCheckbox checked />
						</div>
					</div>

					<div className="flex items-center gap-3 p-3">
						<MockAvatar seed="michael.chen@example.com" />
						<div className="min-w-0 flex-1">
							<div className="text-sm font-semibold">Michael Chen</div>
							<div className="text-muted-foreground text-xs">
								Keller Williams · Austin, TX
							</div>
							<div className="mt-1.5 flex flex-wrap gap-3">
								<DimensionBar label="Location" strength={80} />
								<DimensionBar label="Price" strength={72} />
								<DimensionBar label="Client" strength={81} />
							</div>
						</div>
						<div className="flex flex-col items-end gap-1">
							<span className="text-muted-foreground text-[10px]">
								8 yrs · 18/yr
							</span>
							<MockCheckbox />
						</div>
					</div>
				</div>

				<div className="bg-background sticky bottom-0 flex items-center justify-between rounded-xl border p-3 shadow-sm">
					<div className="text-sm">
						<span className="font-semibold">1 selected</span>
						<span className="text-muted-foreground"> · 2 slots remaining</span>
					</div>
					<Button size="sm">Send intro</Button>
				</div>
			</CardContent>
		</Card>
	)
}

export function ClientIntroductionsMockup() {
	return (
		<Card className="bg-card/50 shadow-none">
			<CardContent className="space-y-3">
				<div className="flex gap-1 border-b pb-2 text-sm font-medium">
					{['Pending', 'Accepted', 'Connected', 'History'].map((tab, i) => (
						<div
							key={tab}
							className={`rounded-t-md px-3 py-1.5 ${
								i === 1
									? 'border-primary bg-muted/30 border-b-2'
									: 'text-muted-foreground'
							}`}
						>
							{tab}
						</div>
					))}
				</div>

				<div className="rounded-xl border border-amber-200 bg-amber-50 p-3 dark:border-amber-900 dark:bg-amber-950/20">
					<div className="text-sm font-semibold">Unlock contact info</div>
					<div className="text-muted-foreground text-xs">
						1 agent accepted. Pay $20 for 6-month access.
					</div>
					<Button size="xs" className="mt-2">
						Unlock
					</Button>
				</div>

				<div className="space-y-2">
					<div className="flex items-center justify-between rounded-lg border p-3">
						<div>
							<div className="text-sm font-semibold">Sarah Smith</div>
							<div className="text-muted-foreground text-xs">
								Compass · Austin
							</div>
						</div>
						<div className="text-right">
							<Pill tone="gold">Accepted</Pill>
							<div className="text-muted-foreground mt-1 text-[10px]">
								Withdraw in 18:24:00
							</div>
						</div>
					</div>
				</div>
			</CardContent>
		</Card>
	)
}

export function AgentIntroductionsMockup() {
	return (
		<Card className="bg-card/50 shadow-none">
			<CardContent className="space-y-3">
				<div className="rounded-xl border p-4">
					<div className="flex items-start justify-between">
						<div>
							<div className="flex items-center gap-2">
								<span className="text-sm font-semibold">Jane D.</span>
								<Pill tone="green">Top match</Pill>
							</div>
							<div className="text-muted-foreground text-xs">
								Buyer · Austin, TX
							</div>
						</div>
					</div>
					<div className="mt-3 grid grid-cols-2 gap-2 text-xs">
						<div className="bg-muted rounded-md p-2">
							<div className="text-muted-foreground">Timeline</div>
							<div className="font-medium">3–6 months</div>
						</div>
						<div className="bg-muted rounded-md p-2">
							<div className="text-muted-foreground">Price</div>
							<div className="font-medium">$400k – $600k</div>
						</div>
						<div className="bg-muted rounded-md p-2">
							<div className="text-muted-foreground">Type</div>
							<div className="font-medium">Single family</div>
						</div>
						<div className="bg-muted rounded-md p-2">
							<div className="text-muted-foreground">Work style</div>
							<div className="font-medium">Data-driven</div>
						</div>
					</div>
					<div className="mt-3 flex gap-2">
						<Button size="sm">Accept</Button>
						<Button variant="outline" size="sm">
							Decline
						</Button>
					</div>
				</div>

				<div className="rounded-xl border p-4">
					<div className="flex items-center justify-between">
						<div>
							<div className="text-sm font-semibold">Connected</div>
							<div className="text-muted-foreground text-xs">Jane Doe</div>
						</div>
						<Button variant="ghost" size="icon-xs">
							<Mail className="h-3.5 w-3.5" />
						</Button>
					</div>
				</div>
			</CardContent>
		</Card>
	)
}
