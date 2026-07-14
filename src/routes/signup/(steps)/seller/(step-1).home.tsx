import {
	CalendarBlankIcon,
	ClockIcon,
	HouseLineIcon,
} from '@phosphor-icons/react'
import { Banknote, Home } from 'lucide-react'
import { useState } from 'react'

import { createFileRoute } from '@tanstack/react-router'
import { Card, CardContent } from '@/components/ui/card'
import { Slider } from '@/components/ui/slider'
import type { SellerDraft } from '@/lib/profile'
import {
	formatPriceRange,
	parsePriceRange,
	PRICE_MAX,
	PRICE_MIN,
	serializePriceRange,
} from '@/lib/price-range'
import { propertyType, timeline, type PropertyTypeSlug } from '@/lib/profile'
import { cn } from '@/lib/utils/ui'
import {
	AnimatedStepCard,
	StepHeader,
	useSignupWizardContext,
} from '../-components/signup-shell'
import { ContinueButton } from '../-components/ui/continue-button'
import { FieldSection } from '../-components/ui/field-section'
import { SelectionCard } from '../-components/ui/selection-card'
import { PriceInput } from '../-components/price-selector'
import type { ClientSignupStep } from './route'

export const Route = createFileRoute('/signup/(steps)/seller/(step-1)/home')({
	component: SellerHomeRoute,
})

function SellerHomeRoute() {
	const { state, updateState, goToStep } = useSignupWizardContext<
		SellerDraft,
		ClientSignupStep
	>()

	const [priceRange, setPriceRange] = useState(
		parsePriceRange(state.priceRange),
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
	const priceComplete =
		priceRange.min >= PRICE_MIN && priceRange.max <= PRICE_MAX
	const propertyComplete = propertyTypes.length > 0
	const canContinue = priceComplete && propertyComplete
	const [firstDeadline] = deadlineOptions
	const lastDeadline = deadlineOptions.at(-1)
	const selectedDeadline = deadlineOptions[deadlineIndex]
	const selectedTimeline =
		hasDeadline && selectedDeadline ? selectedDeadline.slug : 'exploring'

	return (
		<AnimatedStepCard stepKey="home">
			<Card size="sm" className="shadow-sm">
				<CardContent className="space-y-8">
					<StepHeader
						stepNumber={2}
						totalSteps={3}
						title="Home"
						icon={HouseLineIcon}
					/>
					<div className="space-y-8">
						<FieldSection
							title="Timeline"
							description="Let agents know how urgent your search is."
							icon={CalendarBlankIcon}
						>
							<div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
								<SelectionCard
									icon={ClockIcon}
									title="Just exploring"
									description="No firm timeline yet."
									selected={!hasDeadline}
									variant="subtle"
									onClick={() => setHasDeadline(false)}
								/>
								<SelectionCard
									icon={CalendarBlankIcon}
									title="I have a deadline"
									description="Select when you need to move."
									selected={hasDeadline}
									variant="subtle"
									onClick={() => setHasDeadline(true)}
								/>
							</div>
							<div
								className={cn(
									'space-y-3 overflow-hidden transition-all duration-300',
									hasDeadline ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0',
								)}
							>
								<div className="flex items-center justify-between">
									<span className="text-sm font-semibold">
										When do you need to move?
									</span>
									<span className="bg-primary/10 text-primary rounded-full px-3 py-1 text-sm font-semibold">
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
						<FieldSection
							title="Home type"
							description="Select all that apply."
							icon={Home}
							action={
								propertyComplete ? (
									<span className="bg-primary/10 text-primary rounded-full px-2.5 py-1 text-xs font-semibold whitespace-nowrap">
										{propertyTypes.length} selected
									</span>
								) : null
							}
						>
							<div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
								{propertyType.slugs.map((option) => (
									<SelectionCard
										key={option}
										icon={Home}
										title={propertyType.labels[option]}
										selected={propertyTypes.includes(option)}
										variant="solid"
										layout="vertical"
										indicator="none"
										onClick={() =>
											setPropertyTypes((current) =>
												current.includes(option)
													? current.filter((item) => item !== option)
													: [...current, option],
											)
										}
									/>
								))}
							</div>
						</FieldSection>
						<div className="bg-muted/30 border-border/60 rounded-2xl border p-5">
							<FieldSection
								title="Estimated value"
								description="Set your minimum and maximum."
								icon={Banknote}
								action={
									<span className="bg-primary/10 text-primary rounded-full px-3 py-1 text-sm font-semibold whitespace-nowrap">
										{formatPriceRange(priceRange)}
									</span>
								}
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
						</div>
					</div>
					<ContinueButton
						disabled={!canContinue}
						onClick={() => {
							if (!canContinue) return
							updateState({
								priceRange: serializePriceRange(priceRange),
								propertyTypes,
								timeline: selectedTimeline,
							})
							goToStep('preferences')
						}}
					/>
				</CardContent>
			</Card>
		</AnimatedStepCard>
	)
}
