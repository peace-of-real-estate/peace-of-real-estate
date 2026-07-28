import { ChartLineIcon, UsersIcon } from '@phosphor-icons/react'
import { createFileRoute } from '@tanstack/react-router'
import { useState, type ReactNode } from 'react'

import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { SegmentedControl } from '@/components/ui/segmented-control'
import type { AgentDraft, RepresentationSide } from '@/lib/profile'
import { representationSide, yearsLicensed } from '@/lib/profile'

import {
	AnimatedStepCard,
	StepHeader,
	useSignupWizardContext,
} from '../-components/signup-shell'
import { ContinueButton } from '../-components/ui/continue-button'
import { FieldSection } from '../-components/ui/field-section'
import type { AgentFlowStep } from './route'

export const Route = createFileRoute('/signup/(steps)/agent/(step-1)/identity')(
	{
		component: AgentIdentityRoute,
	},
)

function AgentIdentityRoute() {
	const { state, updateState, goToStep } = useSignupWizardContext<
		AgentDraft,
		AgentFlowStep
	>()

	return (
		<AgentIdentity
			state={state}
			onUpdate={updateState}
			onContinue={() => goToStep('market')}
		/>
	)
}

const yearsLicensedOptions = yearsLicensed.slugs.map((slug) => ({
	value: slug,
	label: yearsLicensed.labels[slug].replace(' years', ''),
}))

const representationSideIcons = {
	buyer: <UsersIcon className="h-4 w-4" weight="duotone" />,
	seller: <ChartLineIcon className="h-4 w-4" weight="duotone" />,
} satisfies Record<RepresentationSide, ReactNode>

const representationSideOptions = representationSide.slugs.map((slug) => ({
	value: slug,
	label: representationSide.labels[slug],
	icon: representationSideIcons[slug],
}))

function AgentIdentity({
	state,
	onUpdate,
	onContinue,
}: {
	state: AgentDraft
	onUpdate: (patch: Partial<AgentDraft>) => void
	onContinue: () => void
}) {
	const [brokerageName, setBrokerageName] = useState(state.brokerageName ?? '')
	const [licenseNumberState, setLicenseNumberState] = useState(
		state.licenseNumberState ?? '',
	)
	const [yearsLicensedValue, setYearsLicensedValue] = useState(
		state.yearsLicensed ?? undefined,
	)
	const [side, setSide] = useState(state.representationSide ?? undefined)
	const [hasTriedContinue, setHasTriedContinue] = useState(false)

	const brokerageComplete = brokerageName.trim().length > 0
	const licenseComplete = licenseNumberState.trim().length > 0
	const canContinue =
		brokerageComplete &&
		licenseComplete &&
		yearsLicensedValue !== undefined &&
		side !== undefined

	const showSideError = hasTriedContinue && !side
	const showBrokerageError = hasTriedContinue && !brokerageComplete
	const showLicenseError = hasTriedContinue && !licenseComplete
	const showYearsError = hasTriedContinue && yearsLicensedValue === undefined

	const handleContinue = () => {
		if (!canContinue || !yearsLicensedValue || !side) {
			setHasTriedContinue(true)
			return
		}
		onUpdate({
			brokerageName: brokerageName.trim(),
			licenseNumberState: licenseNumberState.trim(),
			yearsLicensed: yearsLicensedValue,
			representationSide: side,
		})
		onContinue()
	}

	return (
		<AnimatedStepCard stepKey="identity">
			<Card size="sm" className="shadow-sm">
				<CardContent className="space-y-8">
					<StepHeader stepNumber={1} totalSteps={3} title="Your practice" />

					<div className="space-y-8">
						<FieldSection
							title={
								<span
									className={showSideError ? 'text-destructive' : undefined}
								>
									Who do you represent?
								</span>
							}
						>
							<SegmentedControl
								options={representationSideOptions}
								value={side}
								onChange={setSide}
							/>
							{showSideError ? (
								<p role="alert" className="sr-only">
									Select who you represent.
								</p>
							) : null}
						</FieldSection>

						<FieldSection
							title={
								<span
									className={
										showBrokerageError ? 'text-destructive' : undefined
									}
								>
									Brokerage
								</span>
							}
							description="The brokerage you hang your license with."
						>
							<Input
								value={brokerageName}
								onChange={(event) => setBrokerageName(event.target.value)}
								placeholder="Harborline Realty"
								autoComplete="organization"
								aria-label="Brokerage"
								aria-invalid={showBrokerageError || undefined}
								aria-describedby={
									showBrokerageError ? 'brokerage-error' : undefined
								}
							/>
							{showBrokerageError ? (
								<p id="brokerage-error" className="text-destructive text-xs">
									Enter your brokerage.
								</p>
							) : null}
						</FieldSection>

						<FieldSection
							title={
								<span
									className={showLicenseError ? 'text-destructive' : undefined}
								>
									License number & state
								</span>
							}
							description="We use this to verify your license is active."
						>
							<Input
								value={licenseNumberState}
								onChange={(event) => setLicenseNumberState(event.target.value)}
								placeholder="CA-DRE-01234567"
								aria-label="License number & state"
								aria-invalid={showLicenseError || undefined}
								aria-describedby={
									showLicenseError ? 'license-error' : undefined
								}
							/>
							{showLicenseError ? (
								<p id="license-error" className="text-destructive text-xs">
									Enter your license number & state.
								</p>
							) : null}
						</FieldSection>

						<FieldSection
							title={
								<span
									className={showYearsError ? 'text-destructive' : undefined}
								>
									Years licensed
								</span>
							}
						>
							<SegmentedControl
								options={yearsLicensedOptions}
								value={yearsLicensedValue}
								onChange={setYearsLicensedValue}
							/>
							{showYearsError ? (
								<p role="alert" className="sr-only">
									Select your years licensed.
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
