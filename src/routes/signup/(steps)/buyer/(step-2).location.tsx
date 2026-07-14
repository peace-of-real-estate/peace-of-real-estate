import { MapPinIcon } from '@phosphor-icons/react'
import { useState } from 'react'

import { createFileRoute } from '@tanstack/react-router'
import { Card, CardContent } from '@/components/ui/card'
import type { BuyerDraft } from '@/lib/profile'
import { parseCityState } from '@/lib/geography/zip'
import {
	AnimatedStepCard,
	StepHeader,
	useSignupWizardContext,
} from '../-components/signup-shell'
import { CityZipSelector } from '../-components/zip-selector'
import { ContinueButton } from '../-components/ui/continue-button'
import { FieldSection } from '../-components/ui/field-section'
import type { ClientSignupStep } from './route'

export const Route = createFileRoute('/signup/(steps)/buyer/(step-2)/location')(
	{
		component: BuyerLocationRoute,
	},
)

function BuyerLocationRoute() {
	const { state, updateState, goToStep } = useSignupWizardContext<
		BuyerDraft,
		ClientSignupStep
	>()

	const rawInitialLocation = state.city ?? ''
	const [committedLocation, setCommittedLocation] = useState(rawInitialLocation)
	const [selectedZipCodes, setSelectedZipCodes] = useState<string[]>(
		state.zipCodes ?? [],
	)
	const [hasTriedContinue, setHasTriedContinue] = useState(false)
	const canContinue = committedLocation.trim().length >= 2
	const cityState = parseCityState(committedLocation)

	return (
		<AnimatedStepCard stepKey="location">
			<Card size="sm" className="shadow-sm">
				<CardContent className="space-y-8">
					<StepHeader
						stepNumber={1}
						totalSteps={3}
						title="Location"
						icon={MapPinIcon}
					/>
					<FieldSection
						title="City"
						description="Search for the city where you want to buy or sell."
						icon={MapPinIcon}
					>
						<CityZipSelector
							id="client-location"
							value={rawInitialLocation}
							onChange={(location, zipCodes) => {
								setCommittedLocation(location)
								setSelectedZipCodes(zipCodes)
							}}
							zipCodes={selectedZipCodes}
							label={null}
						/>
						{hasTriedContinue && !canContinue ? (
							<p className="text-destructive text-xs">Enter a city.</p>
						) : null}
					</FieldSection>
					<ContinueButton
						disabled={!canContinue}
						onClick={() => {
							if (!canContinue) {
								setHasTriedContinue(true)
								return
							}
							updateState({
								city: cityState?.city ?? committedLocation.trim(),
								...(cityState?.state ? { state: cityState.state } : {}),
								zipCodes: selectedZipCodes,
							})
							goToStep('home')
						}}
					/>
				</CardContent>
			</Card>
		</AnimatedStepCard>
	)
}
