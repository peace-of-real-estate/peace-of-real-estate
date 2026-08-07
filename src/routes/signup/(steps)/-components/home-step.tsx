import {
	BuildingApartmentIcon,
	BuildingsIcon,
	CalendarBlankIcon,
	ClockIcon,
	FarmIcon,
	HouseIcon,
} from '@phosphor-icons/react'
import { useState } from 'react'

import { Card, CardContent } from '@/components/ui/card'
import { ChipSelect } from '@/components/ui/chip-select'
import { SegmentedControl } from '@/components/ui/segmented-control'
import { Slider } from '@/components/ui/slider'
import { PRICE_MAX, PRICE_MIN, type PriceRange } from '@/lib/price-range'
import {
	propertyType,
	timeline,
	type BuyerDraft,
	type PropertyTypeSlug,
	type SellerDraft,
} from '@/lib/profile'
import { cn } from '@/lib/utils/ui'

import { PriceInput } from './price-selector'
import {
	AnimatedStepCard,
	StepHeader,
	useSignupWizardContext,
} from './signup-shell'
import { ContinueButton } from './ui/continue-button'
import { FieldSection } from './ui/field-section'

const propertyTypeIcons = {
	singleFamily: HouseIcon,
	condoTownhome: BuildingApartmentIcon,
	multiFamily: BuildingsIcon,
	land: FarmIcon,
} satisfies Record<PropertyTypeSlug, typeof HouseIcon>

const initialPriceRange: PriceRange = { min: 400_000, max: 600_000 }

export function HomeStep<TStep extends string>({
	priceTitle,
	preferencesStep,
}: {
	priceTitle: string
	preferencesStep: TStep
}) {
	const { state, updateState, goToStep } = useSignupWizardContext<
		BuyerDraft | SellerDraft,
		TStep
	>()

	const [priceRange, setPriceRange] = useState<PriceRange>(
		state.priceMin !== undefined && state.priceMax !== undefined
			? { min: state.priceMin, max: state.priceMax }
			: initialPriceRange,
	)
	const [propertyTypes, setPropertyTypes] = useState<PropertyTypeSlug[]>(
		state.propertyTypes ?? [],
	)
	const [hasDeadline, setHasDeadline] = useState(
		state.timeline ? state.timeline !== 'exploring' : false,
	)
	const deadlineOptions = timeline.slugs
		.filter((slug) => slug !== 'exploring')
		.map((slug) => ({ slug, label: timeline.labels[slug] }))
	const [deadlineIndex, setDeadlineIndex] = useState(() =>
		Math.max(
			deadlineOptions.findIndex((option) => option.slug === state.timeline),
			0,
		),
	)
	const [hasTriedContinue, setHasTriedContinue] = useState(false)
	const priceComplete =
		priceRange.min >= PRICE_MIN &&
		priceRange.max <= PRICE_MAX &&
		priceRange.min <= priceRange.max
	const propertyComplete = propertyTypes.length > 0
	const canContinue = priceComplete && propertyComplete
	const showPropertyError = hasTriedContinue && !propertyComplete
	const [firstDeadline] = deadlineOptions
	const lastDeadline = deadlineOptions.at(-1)
	const selectedDeadline = deadlineOptions[deadlineIndex]
	const selectedTimeline =
		hasDeadline && selectedDeadline ? selectedDeadline.slug : 'exploring'

	return (
		<AnimatedStepCard stepKey="home">
			<Card size="sm">
				<CardContent className="space-y-8">
					<StepHeader stepNumber={2} totalSteps={3} title="Home" />
					<div className="space-y-8">
						<FieldSection
							title={
								<span
									className={showPropertyError ? 'text-destructive' : undefined}
								>
									Home type
								</span>
							}
							description="Select all that apply."
							action={
								propertyComplete ? (
									<span className="text-muted-foreground text-xs font-medium whitespace-nowrap">
										{propertyTypes.length} selected
									</span>
								) : null
							}
						>
							<ChipSelect
								options={propertyType.slugs.map((slug) => ({
									value: slug,
									label: propertyType.labels[slug],
									icon: propertyTypeIcons[slug],
								}))}
								selected={propertyTypes}
								onChange={setPropertyTypes}
							/>
							{showPropertyError ? (
								<p role="alert" className="text-destructive text-xs">
									Select at least one home type.
								</p>
							) : null}
						</FieldSection>
						<FieldSection
							title={priceTitle}
							description="Set your minimum and maximum."
						>
							<div className="grid grid-cols-2 gap-3">
								<PriceInput
									id="price-min"
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
									id="price-max"
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
						</FieldSection>
						<FieldSection
							title="Timeline"
							description="Let agents know how urgent your plans are."
						>
							<SegmentedControl
								options={[
									{
										value: 'exploring',
										label: 'Just exploring',
										icon: <ClockIcon className="h-4 w-4" />,
									},
									{
										value: 'deadline',
										label: 'I have a deadline',
										icon: <CalendarBlankIcon className="h-4 w-4" />,
									},
								]}
								value={hasDeadline ? 'deadline' : 'exploring'}
								onChange={(value) => setHasDeadline(value === 'deadline')}
							/>
							<div
								className={cn(
									'space-y-3 overflow-hidden transition-all duration-300',
									hasDeadline
										? 'max-h-40 pt-1 opacity-100'
										: 'max-h-0 opacity-0',
								)}
							>
								<div className="flex items-center justify-between">
									<span className="text-sm font-semibold">
										When do you need to move?
									</span>
									<span className="bg-sky-tint text-primary rounded-full px-3 py-1 text-sm font-semibold">
										{selectedDeadline?.label}
									</span>
								</div>
								<Slider
									value={[deadlineIndex]}
									min={0}
									max={deadlineOptions.length - 1}
									step={1}
									onValueChange={([index]) => setDeadlineIndex(index ?? 0)}
									disabled={!hasDeadline}
								/>
								<div className="text-muted-foreground flex justify-between text-xs font-medium">
									<span>{firstDeadline?.label}</span>
									<span>{lastDeadline?.label}</span>
								</div>
							</div>
						</FieldSection>
					</div>
					<ContinueButton
						onClick={() => {
							if (!canContinue) {
								setHasTriedContinue(true)
								return
							}
							updateState({
								priceMin: priceRange.min,
								priceMax: priceRange.max,
								propertyTypes,
								timeline: selectedTimeline,
							})
							goToStep(preferencesStep)
						}}
					/>
				</CardContent>
			</Card>
		</AnimatedStepCard>
	)
}
