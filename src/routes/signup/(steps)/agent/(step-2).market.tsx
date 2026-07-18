import { createFileRoute } from '@tanstack/react-router'

import { useState } from 'react'

import { CityZipSelector } from '../-components/zip-selector'
import {
	AnimatedStepCard,
	StepHeader,
	StepProgressHeader,
	useSignupWizardContext,
} from '../-components/signup-shell'
import { PriceInput } from '../-components/price-selector'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Slider } from '@/components/ui/slider'
import { cn } from '@/lib/utils/ui'
import type { AgentDraft, RepresentationSide } from '@/lib/profile'
import {
	bestClientType,
	representationSide as representationSideEnum,
	type BestClientTypeSlug,
} from '@/lib/profile'
import { parseCityState } from '@/lib/geography/zip'
import {
	DEFAULT_PRICE_RANGE,
	formatPriceCompact,
	formatPriceRange,
	parsePriceRange,
	PRICE_MAX,
	PRICE_MIN,
	PRICE_STEP,
	serializePriceRange,
} from '@/lib/price-range'
import { agentConfig, getRepresentationIcon, type AgentFlowStep } from './route'
import { ArrowRightIcon, CheckIcon } from '@phosphor-icons/react'

export const Route = createFileRoute('/signup/(steps)/agent/(step-2)/market')({
	component: AgentMarketRoute,
})

function AgentMarketRoute() {
	const { state, updateState, goToStep } = useSignupWizardContext<
		AgentDraft,
		AgentFlowStep
	>()

	return (
		<AgentMarket
			state={state}
			onUpdate={updateState}
			onContinue={() => goToStep('preferences')}
		/>
	)
}

export function AgentMarket({
	state,
	onUpdate,
	onContinue,
}: {
	state: AgentDraft
	onUpdate: (patch: Partial<AgentDraft>) => void
	onContinue: () => void
}) {
	const rawInitialLocation = state.city
		? state.state
			? `${state.city}, ${state.state}`
			: state.city
		: ''
	const [committedLocation, setCommittedLocation] = useState(rawInitialLocation)
	const [selectedZipCodes, setSelectedZipCodes] = useState<string[]>(
		state.zipCodes ?? [],
	)
	const [hasTriedContinue, setHasTriedContinue] = useState(false)

	const initialRange = parsePriceRange(state.typicalPriceRange)
	const [priceRange, setPriceRange] = useState(initialRange)
	const [representationSide, setRepresentationSide] = useState<
		RepresentationSide | ''
	>(state.representationSide ? state.representationSide : '')
	const [bestClientTypes, setBestClientTypes] = useState<BestClientTypeSlug[]>(
		state.bestClientTypes ?? [],
	)

	const marketComplete = committedLocation.trim().length >= 2
	const priceComplete =
		priceRange.min >= PRICE_MIN && priceRange.max <= PRICE_MAX
	const sideComplete = representationSide.length > 0
	const clientsComplete = bestClientTypes.length > 0
	const canContinue =
		marketComplete && priceComplete && sideComplete && clientsComplete
	const showMarketError = hasTriedContinue && !marketComplete
	const cityState = parseCityState(committedLocation)

	const handleLocationChange = (location: string, zipCodes: string[]) => {
		setCommittedLocation(location)
		setSelectedZipCodes(zipCodes)
	}

	const toggleClientType = (option: BestClientTypeSlug) => {
		setBestClientTypes((current) =>
			current.includes(option)
				? current.filter((item) => item !== option)
				: [...current, option],
		)
	}

	const handleContinue = () => {
		if (!canContinue) {
			setHasTriedContinue(true)
			return
		}
		if (!representationSide) return

		const locationUpdate = cityState
			? { city: cityState.city, state: cityState.state }
			: { city: committedLocation }
		onUpdate({
			...locationUpdate,
			zipCodes: selectedZipCodes,
			typicalPriceRange: serializePriceRange(priceRange),
			representationSide,
			bestClientTypes,
		})
		onContinue()
	}

	return (
		<AnimatedStepCard stepKey="market">
			<Card size="sm" className="shadow-sm">
				<CardContent className="space-y-6">
					<StepHeader stepNumber={2} totalSteps={5} title="Market" />

					<CityZipSelector
						id="agent-market"
						value={rawInitialLocation}
						onChange={handleLocationChange}
						zipCodes={selectedZipCodes}
						label={
							<span
								className={showMarketError ? 'text-destructive' : undefined}
							>
								Primary market
							</span>
						}
						height="sm"
					/>
					{showMarketError ? (
						<p className="text-destructive text-xs">Enter a city.</p>
					) : null}

					<div className="space-y-5 border-t pt-5">
						<div className="flex items-center justify-between gap-3">
							<p className="text-sm font-semibold">Typical price range</p>
							<span className="bg-primary/10 text-primary rounded-md px-3 py-1 text-sm font-semibold whitespace-nowrap">
								{formatPriceRange(priceRange)}
							</span>
						</div>
						<div className="grid grid-cols-2 gap-3">
							<PriceInput
								id="agent-price-min"
								label="Low"
								value={priceRange.min}
								onChange={(nextMin) =>
									setPriceRange((current) => ({
										...current,
										min: Math.min(nextMin, current.max),
									}))
								}
							/>
							<PriceInput
								id="agent-price-max"
								label="High"
								value={priceRange.max}
								onChange={(nextMax) =>
									setPriceRange((current) => ({
										...current,
										max: Math.max(nextMax, current.min),
									}))
								}
							/>
						</div>
						<Slider
							value={[priceRange.min, priceRange.max]}
							min={PRICE_MIN}
							max={PRICE_MAX}
							step={PRICE_STEP}
							onValueChange={([nextMin, nextMax]) => {
								setPriceRange({
									min: nextMin ?? DEFAULT_PRICE_RANGE.min,
									max: nextMax ?? DEFAULT_PRICE_RANGE.max,
								})
							}}
						/>
						<div className="relative h-4">
							{[0, 500_000, 1_000_000, 1_500_000, 2_000_000].map((value) => {
								const percent = (value / PRICE_MAX) * 100
								return (
									<div
										key={value}
										className="absolute top-0 flex -translate-x-1/2 flex-col items-center gap-0.5"
										style={{ left: `${percent}%` }}
									>
										<span className="bg-muted-foreground/30 h-1 w-px rounded-full" />
										<span className="text-muted-foreground text-xs font-medium">
											{formatPriceCompact(value)}
										</span>
									</div>
								)
							})}
						</div>
					</div>

					<div className="space-y-3">
						<p className="text-sm font-semibold">Representation side</p>
						<div className="grid grid-cols-3 gap-3">
							{agentConfig.intentOptions.map((option) => {
								const isSelected = representationSide === option
								const SideIcon = getRepresentationIcon(option)
								const label = representationSideEnum.labels[option]
								return (
									<button
										key={option}
										type="button"
										onClick={() => setRepresentationSide(option)}
										className={cn(
											'group flex items-center gap-2 rounded-md border px-4 py-3 text-left text-sm font-semibold transition',
											isSelected
												? 'border-primary bg-primary text-primary-foreground shadow-sm'
												: 'border-border bg-card text-foreground hover:border-primary/50 hover:bg-background',
										)}
										aria-pressed={isSelected}
									>
										<SideIcon className="h-4 w-4 shrink-0" weight="duotone" />
										<span className="min-w-0 truncate">{label}</span>
									</button>
								)
							})}
						</div>
					</div>

					<div className="space-y-3">
						<p className="text-sm font-semibold">
							Where do you do your best work?
						</p>
						<div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
							{agentConfig.clientOptions.map((option) => {
								const isSelected = bestClientTypes.includes(option)
								return (
									<button
										key={option}
										type="button"
										onClick={() => toggleClientType(option)}
										className={cn(
											'group flex items-center gap-3 rounded-xl border px-4 py-3 text-left text-sm font-semibold transition',
											isSelected
												? 'border-primary/60 bg-primary/[0.06] text-foreground shadow-sm'
												: 'border-border bg-card text-muted-foreground hover:border-primary/50 hover:shadow-sm',
										)}
										aria-pressed={isSelected}
									>
										<span
											className={cn(
												'flex h-5 w-5 shrink-0 items-center justify-center rounded border transition-colors',
												isSelected
													? 'border-primary bg-transparent'
													: 'border-muted-foreground/30 bg-muted/30 group-hover:border-primary/50',
											)}
										>
											{isSelected ? (
												<CheckIcon className="text-primary h-3 w-3" />
											) : null}
										</span>
										{bestClientType.labels[option]}
									</button>
								)
							})}
						</div>
					</div>

					<StepProgressHeader
						stepNumber={2}
						totalSteps={5}
						title="Market"
						items={[
							marketComplete,
							priceComplete,
							sideComplete,
							clientsComplete,
						]}
						showTitle={false}
					/>

					<div>
						<Button
							onClick={handleContinue}
							disabled={!canContinue}
							size="lg"
							className="w-full gap-2"
						>
							Continue
							<ArrowRightIcon className="h-4 w-4" />
						</Button>
					</div>
				</CardContent>
			</Card>
		</AnimatedStepCard>
	)
}
