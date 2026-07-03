import { HouseLineIcon } from '@phosphor-icons/react'
import { ArrowRight, Banknote, House } from 'lucide-react'
import { useState } from 'react'

import { FieldSection } from '@/components/signup/field-section'
import { AnimatedStepCard } from '@/components/signup/shared'
import { SelectionCard } from '@/components/signup/selection-card'
import { StepHeader } from '@/components/signup/step-header'
import { PriceInput } from '@/components/signup/price-range'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils/ui'
import type { ConsumerDraft } from '@/lib/matching/profile'
import {
	formatPriceRange,
	parsePriceRange,
	PRICE_MAX,
	PRICE_MIN,
	serializePriceRange,
} from '@/components/signup/price-range'
import { propertyTypeOptions } from '@/components/signup/questions'
import { consumerConfig, getPropertyIcon } from './shared'

export function ConsumerHome({
	state,
	onUpdate,
	onContinue,
}: {
	state: ConsumerDraft
	onUpdate: (patch: Partial<ConsumerDraft>) => void
	onContinue: () => void
}) {
	const initialRange = parsePriceRange(state.priceRange)
	const [priceRange, setPriceRange] = useState<{
		min: number
		max: number
	}>(initialRange)
	const [propertyTypes, setPropertyTypes] = useState<string[]>(
		state.propertyTypes ?? [],
	)
	const priceComplete =
		priceRange.min >= PRICE_MIN && priceRange.max <= PRICE_MAX
	const propertyComplete = propertyTypes.length > 0
	const canContinue = priceComplete && propertyComplete

	const handleContinue = () => {
		if (!canContinue) return
		onUpdate({
			priceRange: serializePriceRange(priceRange),
			propertyTypes,
		})
		onContinue()
	}

	const priceLabel =
		state.intent === 'selling' ? 'Estimated value' : 'Target price'

	const selectedCountBadge = propertyComplete ? (
		<span className="bg-primary/10 text-primary rounded-full px-2.5 py-1 text-xs font-semibold whitespace-nowrap">
			{propertyTypes.length} selected
		</span>
	) : null

	return (
		<AnimatedStepCard stepKey="home">
			<Card size="sm" className="shadow-sm">
				<CardContent className="space-y-8">
					<StepHeader
						stepNumber={3}
						totalSteps={4}
						title="Home"
						icon={HouseLineIcon}
					/>

					<div className="space-y-8">
						<FieldSection
							title="Home type"
							description="Select all that apply."
							icon={House}
							action={selectedCountBadge}
						>
							<div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
								{consumerConfig.propertyOptions.map((option) => {
									const isSelected = propertyTypes.includes(option)
									const PropertyIcon = getPropertyIcon(option)
									return (
										<SelectionCard
											key={option}
											icon={PropertyIcon}
											title={
												propertyTypeOptions[
													option as keyof typeof propertyTypeOptions
												]
											}
											selected={isSelected}
											variant="solid"
											layout="vertical"
											indicator="none"
											onClick={() => {
												setPropertyTypes((prev) =>
													prev.includes(option)
														? prev.filter((item) => item !== option)
														: [...prev, option],
												)
											}}
										/>
									)
								})}
							</div>
						</FieldSection>

						<div className="bg-muted/30 border-border/60 rounded-2xl border p-5">
							<FieldSection
								title={priceLabel}
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

					<div>
						<Button
							onClick={handleContinue}
							disabled={!canContinue}
							size="lg"
							className={cn(
								'w-full gap-2 rounded-4xl px-8 py-6 text-base transition-all duration-300',
								canContinue
									? 'bg-primary text-primary-foreground shadow-md hover:bg-primary/90 hover:shadow-lg'
									: 'bg-muted text-muted-foreground',
							)}
						>
							Continue
							<ArrowRight className="h-5 w-5" />
						</Button>
					</div>
				</CardContent>
			</Card>
		</AnimatedStepCard>
	)
}
