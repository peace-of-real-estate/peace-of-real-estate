import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'

import { Card, CardContent } from '@/components/ui/card'
import { SegmentedControl } from '@/components/ui/segmented-control'
import {
	AGENT_PRICE_BUCKET_LABELS,
	BUCKET_ORDER,
	toAgentPriceBucket,
} from '@/lib/price-range'
import type { AgentDraft } from '@/lib/profile'

import {
	AnimatedStepCard,
	StepHeader,
	useSignupWizardContext,
} from '../-components/signup-shell'
import { ContinueButton } from '../-components/ui/continue-button'
import { FieldSection } from '../-components/ui/field-section'
import { CityZipSelector } from '../-components/zip-selector'
import type { AgentFlowStep } from './route'

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

function AgentMarket({
	state,
	onUpdate,
	onContinue,
}: {
	state: AgentDraft
	onUpdate: (patch: Partial<AgentDraft>) => void
	onContinue: () => void
}) {
	const [hasTriedContinue, setHasTriedContinue] = useState(false)

	const [priceBucket, setPriceBucket] = useState(
		toAgentPriceBucket(state.typicalPriceRange),
	)

	const marketComplete = Boolean(state.cityId && state.zipCodes?.length)
	const priceComplete = priceBucket !== undefined
	const canContinue = marketComplete && priceComplete
	const showMarketError = hasTriedContinue && !marketComplete
	const showPriceError = hasTriedContinue && !priceComplete

	const handleContinue = () => {
		if (!canContinue || priceBucket === undefined) {
			setHasTriedContinue(true)
			return
		}

		onUpdate({ typicalPriceRange: priceBucket })
		onContinue()
	}

	return (
		<AnimatedStepCard stepKey="market">
			<Card size="sm">
				<CardContent className="space-y-8">
					<StepHeader stepNumber={2} totalSteps={3} title="Market" />

					<div className="space-y-8">
						<FieldSection
							title={
								<span
									className={showMarketError ? 'text-destructive' : undefined}
								>
									Primary market
								</span>
							}
							description="The city and zip codes you actively work."
						>
							<CityZipSelector
								id="agent-market"
								value={{
									cityId: state.cityId,
									zipCodes: state.zipCodes ?? [],
								}}
								onChange={onUpdate}
								label={null}
								height="sm"
							/>
							{showMarketError ? (
								<p role="alert" className="text-destructive text-xs">
									Pick a city and at least one community.
								</p>
							) : null}
						</FieldSection>

						<FieldSection
							title={
								<span
									className={showPriceError ? 'text-destructive' : undefined}
								>
									Typical price range
								</span>
							}
						>
							<SegmentedControl
								options={BUCKET_ORDER.map((bucket) => ({
									value: bucket,
									label: AGENT_PRICE_BUCKET_LABELS[bucket],
								}))}
								value={priceBucket}
								onChange={setPriceBucket}
							/>
							{showPriceError ? (
								<p role="alert" className="text-destructive text-xs">
									Select a typical price range.
								</p>
							) : null}
						</FieldSection>
					</div>

					<ContinueButton onClick={handleContinue} />
				</CardContent>
			</Card>
		</AnimatedStepCard>
	)
}
