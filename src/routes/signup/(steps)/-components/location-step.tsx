import { useState } from 'react'

import { Card, CardContent } from '@/components/ui/card'
import type { BuyerDraft, SellerDraft } from '@/lib/profile'

import {
	AnimatedStepCard,
	StepHeader,
	useSignupWizardContext,
} from './signup-shell'
import { ContinueButton } from './ui/continue-button'
import { CityZipSelector } from './zip-selector'

export function LocationStep() {
	const { state, updateState, goToStep } = useSignupWizardContext<
		BuyerDraft | SellerDraft,
		'home'
	>()

	const [hasTriedContinue, setHasTriedContinue] = useState(false)
	const canContinue = Boolean(state.cityId && state.zipCodes?.length)

	return (
		<AnimatedStepCard stepKey="location">
			<Card size="sm">
				<CardContent className="space-y-8">
					<StepHeader stepNumber={1} totalSteps={3} title="Location" />
					<div className="space-y-4">
						<CityZipSelector
							id="client-location"
							value={{
								cityId: state.cityId,
								zipCodes: state.zipCodes ?? [],
							}}
							onChange={updateState}
							label={null}
						/>
						{hasTriedContinue && !canContinue ? (
							<p role="alert" className="text-destructive text-xs">
								Pick a city and at least one community.
							</p>
						) : null}
					</div>
					<ContinueButton
						onClick={() => {
							if (!canContinue) {
								setHasTriedContinue(true)
								return
							}
							goToStep('home')
						}}
					/>
				</CardContent>
			</Card>
		</AnimatedStepCard>
	)
}
