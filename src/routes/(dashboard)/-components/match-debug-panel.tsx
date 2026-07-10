import { Bug, Check, ChevronDown, Minus, X } from 'lucide-react'

import { Card } from '@/components/ui/card'
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@/components/ui/table'
import {
	BASE_WEIGHTS,
	type AgentMatchData,
	type DimensionTrace,
	type MatchDebugInfo,
	type SubCheck,
} from '@/lib/matching/scoring'
import { cn } from '@/lib/utils/ui'

/**
 * TEMP: renders in place of the normal match rows while MATCH_DEBUG is on
 * (see src/lib/matching/scoring.ts). Rows look like the normal match list;
 * the scoring trace only appears once a row is expanded.
 */
export function MatchDebugPanel({ matches }: { matches: AgentMatchData[] }) {
	const shared = matches.find((match) => match.debug)?.debug

	return (
		<div className="space-y-4">
			{shared && <DebugHeader debug={shared} matchCount={matches.length} />}
			<Card className="overflow-hidden p-0">
				<div className="divide-y">
					{matches.map((match) => (
						<MatchDebugRow key={match.id} match={match} />
					))}
				</div>
			</Card>
		</div>
	)
}

function scoreTone(score: number) {
	if (score >= 0.75) return 'bg-emerald-500'
	if (score >= 0.4) return 'bg-amber-500'
	return 'bg-red-500'
}

const DEBUG_PROFILE_FIELDS = new Set([
	'city',
	'state',
	'zipCodes',
	'priceRange',
	'typicalPriceRange',
	'propertyTypes',
	'representationSide',
	'bestClientTypes',
	'matchPriorities',
])

function sanitizeDebugProfile(
	profile: unknown,
): Record<string, unknown> | null {
	if (!profile || typeof profile !== 'object') return null
	return Object.fromEntries(
		Object.entries(profile).filter(([key]) => DEBUG_PROFILE_FIELDS.has(key)),
	)
}

function DebugHeader({
	debug,
	matchCount,
}: {
	debug: MatchDebugInfo
	matchCount: number
}) {
	const maxCount = Math.max(
		1,
		...debug.scoreDistribution.map((bucket) => bucket.count),
	)

	return (
		<Card className="gap-4 border-amber-500/50 bg-amber-500/5 p-4">
			<div>
				<span className="flex items-center gap-2 font-semibold text-amber-600 dark:text-amber-400">
					<Bug className="h-4 w-4" />
					Match debug mode
				</span>
				<p className="text-muted-foreground mt-0.5 text-sm">
					{debug.totalAgents} agents scored ·{' '}
					<strong className="font-semibold">{debug.qualifiedCount}</strong>{' '}
					qualified · showing top {matchCount}
				</p>
			</div>

			<div>
				<p className="text-muted-foreground mb-1.5 text-[10px] font-semibold uppercase">
					fitScore distribution
				</p>
				<div className="space-y-0.5 font-mono text-xs">
					{debug.scoreDistribution.map((bucket) => (
						<div key={bucket.range} className="flex items-center gap-2">
							<span className="text-muted-foreground w-14 shrink-0 text-right">
								{bucket.range}
							</span>
							<div className="bg-border h-2 w-full max-w-56 overflow-hidden rounded-sm">
								<div
									className="bg-primary h-full rounded-sm"
									style={{
										width: `${(bucket.count / maxCount) * 100}%`,
									}}
								/>
							</div>
							<span>{bucket.count}</span>
						</div>
					))}
				</div>
			</div>

			<JsonDetails
				label={`client profile used for scoring (side: ${debug.trace.side})`}
				value={sanitizeDebugProfile(debug.clientProfile)}
			/>
		</Card>
	)
}

function MatchDebugRow({ match }: { match: AgentMatchData }) {
	const debug = match.debug
	if (!debug) return null
	const trace = debug.trace

	return (
		<details className="group/match" data-slot="match-debug-row">
			<summary className="hover:bg-muted/50 grid cursor-pointer list-none gap-3 px-4 py-3 transition sm:grid-cols-[4.25rem_minmax(0,1fr)_auto] sm:items-center [&::-webkit-details-marker]:hidden">
				<div className="bg-background rounded-xl border px-3 py-2 text-center">
					<div className="text-lg leading-none font-semibold">
						{match.fitScore}%
					</div>
					<div className="text-muted-foreground mt-1 text-[10px] tracking-wide uppercase">
						Fit
					</div>
				</div>

				<div className="min-w-0">
					<div className="flex flex-wrap items-center gap-x-2 gap-y-1">
						<span className="text-muted-foreground font-mono text-xs">
							#{debug.rank}
						</span>
						<h3 className="truncate font-semibold">{match.name}</h3>
					</div>
					<p className="text-muted-foreground mt-0.5 truncate text-sm">
						{match.agency} · {match.location}
					</p>
				</div>

				<ChevronDown className="text-muted-foreground h-4 w-4 transition group-open/match:rotate-180" />
			</summary>

			<div className="bg-muted/20 space-y-4 border-t px-4 py-4">
				<div className="space-y-2">
					<p className="text-muted-foreground text-[10px] font-semibold tracking-wide uppercase">
						How this score was computed
					</p>
					<code className="bg-muted/60 block rounded-md px-2.5 py-1.5 font-mono text-xs break-words">
						fitScore = {trace.formula}
					</code>

					{trace.matchPriorities.length > 0 ? (
						<div className="flex flex-wrap items-center gap-1.5 text-xs">
							<span className="text-muted-foreground">
								Boosted priorities (×1.5, renormalized):
							</span>
							{trace.matchPriorities.map((priority) => (
								<span
									key={priority}
									className="border-primary/40 text-primary rounded-full border px-2 py-0.5 font-mono text-[10px]"
								>
									{priority}
								</span>
							))}
						</div>
					) : (
						<p className="text-muted-foreground text-xs">
							No client priorities set — using base weights (
							{BASE_WEIGHTS.location} / {BASE_WEIGHTS.priceFit} /{' '}
							{BASE_WEIGHTS.clientFit}
							).
						</p>
					)}
				</div>

				{trace.mode === 'fallback' && trace.fallback && (
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
				)}

				{trace.dimensions.length > 0 && (
					<div className="grid gap-3">
						{trace.dimensions.map((dimension) => (
							<DimensionRow key={dimension.id} dimension={dimension} />
						))}
					</div>
				)}

				<JsonDetails
					label="agent profile used for scoring"
					value={sanitizeDebugProfile(debug.agentProfile)}
				/>
			</div>
		</details>
	)
}

function DimensionRow({ dimension }: { dimension: DimensionTrace }) {
	return (
		<div className="bg-background rounded-lg border p-3">
			<div className="flex items-start justify-between gap-3">
				<div>
					<div className="text-2xl font-bold tabular-nums">
						{dimension.contribution} pts
					</div>
					<div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-sm">
						<span className="font-semibold">{dimension.label}</span>
						<span className="text-muted-foreground rounded-full border px-1.5 py-0.5 font-mono text-[10px]">
							weight {dimension.weight}
							{dimension.boosted && (
								<span className="text-primary">
									{' '}
									↑ from {dimension.baseWeight}
								</span>
							)}
						</span>
					</div>
				</div>
				<div className="shrink-0 text-right">
					<div className="text-sm font-semibold tabular-nums">
						{dimension.score.toFixed(2)}
					</div>
					<div className="text-muted-foreground text-[10px] tabular-nums">
						score
					</div>
				</div>
			</div>

			<div className="bg-border mt-3 h-1.5 overflow-hidden rounded-full">
				<div
					className={cn('h-full rounded-full', scoreTone(dimension.score))}
					style={{ width: `${dimension.score * 100}%` }}
				/>
			</div>

			<p className="mt-2 text-xs">{dimension.explanation}</p>

			{dimension.checks.length > 0 && (
				<div className="mt-3 overflow-hidden rounded-md border">
					<Table>
						<TableHeader>
							<TableRow className="bg-muted/50 hover:bg-muted/50">
								<TableHead className="h-7 px-2 py-1.5 text-[10px] font-semibold uppercase">
									Check
								</TableHead>
								<TableHead className="h-7 px-2 py-1.5 text-[10px] font-semibold uppercase">
									Client
								</TableHead>
								<TableHead className="h-7 px-2 py-1.5 text-[10px] font-semibold uppercase">
									Agent
								</TableHead>
								<TableHead className="h-7 px-2 py-1.5 text-right text-[10px] font-semibold uppercase">
									Result
								</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{dimension.checks.map((check) => (
								<CheckRow key={check.label} check={check} />
							))}
						</TableBody>
					</Table>
				</div>
			)}
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
				className={cn(
					'text-[10px] font-semibold tracking-wide uppercase',
					tone === 'pass'
						? 'text-emerald-600 dark:text-emerald-400'
						: 'text-red-600 dark:text-red-400',
				)}
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

function JsonDetails({ label, value }: { label: string; value: unknown }) {
	return (
		<details className="group rounded-md border font-mono text-xs">
			<summary className="text-muted-foreground flex cursor-pointer list-none items-center gap-1 px-2 py-1.5 uppercase select-none [&::-webkit-details-marker]:hidden">
				<ChevronDown className="h-3.5 w-3.5 transition group-open:rotate-180" />
				{label}
			</summary>
			<pre className="max-h-80 overflow-auto border-t px-2 py-1.5 whitespace-pre-wrap">
				{JSON.stringify(value, null, 2)}
			</pre>
		</details>
	)
}
