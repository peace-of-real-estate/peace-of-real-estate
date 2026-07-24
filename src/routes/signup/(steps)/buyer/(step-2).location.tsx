import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'

import { Card, CardContent } from '@/components/ui/card'
import type { BuyerDraft } from '@/lib/profile'

import {
	AnimatedStepCard,
	StepHeader,
	useSignupWizardContext,
} from '../-components/signup-shell'
import { ContinueButton } from '../-components/ui/continue-button'
import { CityZipSelector } from '../-components/zip-selector'
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

	const [selectedCityId, setSelectedCityId] = useState(state.cityId)
	const [selectedZipCodes, setSelectedZipCodes] = useState<string[]>(
		state.zipCodes ?? [],
	)
	const [hasTriedContinue, setHasTriedContinue] = useState(false)
	const canContinue = Boolean(selectedCityId)

	return (
		<AnimatedStepCard stepKey="location">
			<Card size="sm" className="shadow-sm">
				<CardContent className="space-y-8">
					<StepHeader stepNumber={1} totalSteps={3} title="Location" />
					<div className="space-y-4">
						<CityZipSelector
							id="client-location"
							value={state.cityId}
							onChange={(cityId, zipCodes) => {
								setSelectedCityId(cityId)
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
							if (!selectedCityId) {
								setHasTriedContinue(true)
								return
							}
							updateState({
								cityId: selectedCityId,
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
