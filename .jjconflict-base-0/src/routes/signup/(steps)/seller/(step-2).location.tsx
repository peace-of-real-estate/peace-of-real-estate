import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'

import { Card, CardContent } from '@/components/ui/card'
import { parseCityState } from '@/lib/geography/zip'
import type { SellerDraft } from '@/lib/profile'

import {
	AnimatedStepCard,
	StepHeader,
	useSignupWizardContext,
} from '../-components/signup-shell'
import { ContinueButton } from '../-components/ui/continue-button'
import { CityZipSelector } from '../-components/zip-selector'
import type { ClientSignupStep } from './route'

export const Route = createFileRoute(
	'/signup/(steps)/seller/(step-2)/location',
)({
	component: SellerLocationRoute,
})

function SellerLocationRoute() {
	const { state, updateState, goToStep } = useSignupWizardContext<
		SellerDraft,
		ClientSignupStep
	>()

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
	const canContinue = committedLocation.trim().length >= 2
	const cityState = parseCityState(committedLocation)

	return (
		<AnimatedStepCard stepKey="location">
			<Card size="sm" className="shadow-sm">
				<CardContent className="space-y-8">
					<StepHeader stepNumber={1} totalSteps={3} title="Location" />
					<div className="space-y-4">
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
					</div>
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
