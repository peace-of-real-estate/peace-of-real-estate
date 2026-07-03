import { MapPinIcon } from '@phosphor-icons/react'
import { ArrowRight } from 'lucide-react'
import { useState } from 'react'

import { CityZipSelector } from '@/components/signup/city-zip-selector'
import { FieldSection } from '@/components/signup/field-section'
import { AnimatedStepCard } from '@/components/signup/shared'
import { StepHeader } from '@/components/signup/step-header'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils/ui'
import type { ConsumerDraft } from '@/lib/matching/profile'
import { parseCityState } from '@/lib/geography/zip'

export function ConsumerLocation({
	state,
	onUpdate,
	onContinue,
}: {
	state: ConsumerDraft
	onUpdate: (patch: Partial<ConsumerDraft>) => void
	onContinue: () => void
}) {
	const rawInitialLocation = state.city ?? ''
	const [committedLocation, setCommittedLocation] = useState(rawInitialLocation)
	const [selectedZipCodes, setSelectedZipCodes] = useState<string[]>(
		state.zipCodes ?? [],
	)
	const [hasTriedContinue, setHasTriedContinue] = useState(false)
	const marketComplete = committedLocation.trim().length >= 2
	const canContinue = marketComplete
	const showMarketError = hasTriedContinue && !marketComplete
	const cityState = parseCityState(committedLocation)

	const handleLocationChange = (location: string, zipCodes: string[]) => {
		setCommittedLocation(location)
		setSelectedZipCodes(zipCodes)
	}

	const handleContinue = () => {
		const finalLocation = committedLocation.trim()
		const finalMarketComplete = finalLocation.length >= 2

		if (!finalMarketComplete) {
			setHasTriedContinue(true)
			return
		}

		onUpdate({
			city: cityState?.city ?? finalLocation,
			state: cityState?.state,
			zipCodes: selectedZipCodes,
		})
		onContinue()
	}

	return (
		<AnimatedStepCard stepKey="intent">
			<Card size="sm" className="shadow-sm">
				<CardContent className="space-y-8">
					<StepHeader
						stepNumber={2}
						totalSteps={4}
						title="Location"
						icon={MapPinIcon}
					/>

					<FieldSection
						title="City"
						description="Search for the city where you want to buy or sell."
						icon={MapPinIcon}
					>
						<CityZipSelector
							id="consumer-location"
							value={rawInitialLocation}
							onChange={handleLocationChange}
							zipCodes={selectedZipCodes}
							label={null}
						/>
						{showMarketError ? (
							<p className="text-destructive text-xs">Enter a city.</p>
						) : null}
					</FieldSection>

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
