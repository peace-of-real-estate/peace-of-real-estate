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
	const canContinue = Boolean(state.cityId)

	return (
		<AnimatedStepCard stepKey="location">
			<Card size="sm" className="shadow-sm">
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
							<p className="text-destructive text-xs">Enter a city.</p>
						) : null}
					</div>
					<ContinueButton
						disabled={!canContinue}
						onClick={() => {
							if (!state.cityId) {
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
