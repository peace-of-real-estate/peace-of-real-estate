import { createFileRoute } from '@tanstack/react-router'
import { UserIcon } from '@phosphor-icons/react'
import { ArrowRight } from 'lucide-react'
import { useState } from 'react'

import {
	AnimatedStepCard,
	StepHeader,
	useSignupWizardContext,
} from '../-components/signup-wizard-shell'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils/ui'
import type { AgentDraft } from '@/lib/matching/profile'
import {
	averageTransactionsOptions,
	yearsLicensedOptions,
	type AgentFlowStep,
} from './route'

export const Route = createFileRoute('/signup/(quiz)/agent/(step-1)/identity')({
	component: AgentIdentityRoute,
})

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

function AgentIdentity({
	state,
	onUpdate,
	onContinue,
}: {
	state: AgentDraft
	onUpdate: (patch: Partial<AgentDraft>) => void
	onContinue: () => void
}) {
	const [firstName, setFirstName] = useState(state.firstName ?? '')
	const [lastName, setLastName] = useState(state.lastName ?? '')
	const [brokerageName, setBrokerageName] = useState(state.brokerageName ?? '')
	const [email, setEmail] = useState(state.email ?? '')
	const [phone, setPhone] = useState(state.phone ?? '')
	const [businessAddress, setBusinessAddress] = useState(
		state.businessAddress ?? '',
	)
	const [licenseNumberState, setLicenseNumberState] = useState(
		state.licenseNumberState ?? '',
	)
	const [licenseProof, setLicenseProof] = useState(state.licenseProof ?? '')
	const [yearsLicensed, setYearsLicensed] = useState(state.yearsLicensed ?? '')
	const [averageTransactions, setAverageTransactions] = useState(
		state.averageTransactions ?? '',
	)
	const [employmentStatus, setEmploymentStatus] = useState(
		state.employmentStatus ?? '',
	)

	const canContinue =
		firstName.trim().length > 0 &&
		lastName.trim().length > 0 &&
		brokerageName.trim().length > 0 &&
		licenseNumberState.trim().length > 0

	const handleContinue = () => {
		if (!canContinue) return
		onUpdate({
			firstName,
			lastName,
			brokerageName,
			email,
			phone,
			businessAddress,
			licenseNumberState,
			licenseProof,
			yearsLicensed,
			averageTransactions,
			employmentStatus,
		})
		onContinue()
	}

	const fillDebugData = () => {
		setFirstName('Alex')
		setLastName('Morgan')
		setBrokerageName('PRE Realty Group')
		setEmail('alex.morgan@example.com')
		setPhone('555-123-4567')
		setBusinessAddress('123 Main St, Austin, TX 78701')
		setLicenseNumberState('TX-12345678')
		setLicenseProof('https://license.example.com/alex-morgan')
		setYearsLicensed('6-10')
		setAverageTransactions('16-30')
		setEmploymentStatus('Full time')
	}

	return (
		<AnimatedStepCard stepKey="identity">
			<Card size="sm" className="shadow-sm">
				<CardContent className="space-y-6">
					<div className="flex items-start justify-between gap-4">
						<StepHeader
							stepNumber={1}
							totalSteps={5}
							title="Identity"
							icon={UserIcon}
						/>
						{import.meta.env.DEV ? (
							<Button
								variant="outline"
								size="sm"
								onClick={fillDebugData}
								className="shrink-0"
							>
								Fill test data
							</Button>
						) : null}
					</div>

					<div className="grid gap-4 sm:grid-cols-2">
						<Label className="flex-col items-start gap-2 text-xs font-semibold tracking-wide uppercase">
							First name
							<Input
								value={firstName}
								onChange={(event) => setFirstName(event.target.value)}
								placeholder="Jane"
							/>
						</Label>
						<Label className="flex-col items-start gap-2 text-xs font-semibold tracking-wide uppercase">
							Last name
							<Input
								value={lastName}
								onChange={(event) => setLastName(event.target.value)}
								placeholder="Doe"
							/>
						</Label>
						<Label className="flex-col items-start gap-2 text-xs font-semibold tracking-wide uppercase">
							Brokerage name
							<Input
								value={brokerageName}
								onChange={(event) => setBrokerageName(event.target.value)}
							/>
						</Label>
						<Label className="flex-col items-start gap-2 text-xs font-semibold tracking-wide uppercase">
							Email
							<Input
								type="email"
								value={email}
								onChange={(event) => setEmail(event.target.value)}
							/>
						</Label>
						<Label className="flex-col items-start gap-2 text-xs font-semibold tracking-wide uppercase">
							Phone
							<Input
								type="tel"
								value={phone}
								onChange={(event) => setPhone(event.target.value)}
							/>
						</Label>
						<Label className="flex-col items-start gap-2 text-xs font-semibold tracking-wide uppercase">
							License number & state
							<Input
								value={licenseNumberState}
								onChange={(event) => setLicenseNumberState(event.target.value)}
								placeholder="CA-DRE-01234567"
							/>
						</Label>
						<Label className="flex-col items-start gap-2 text-xs font-semibold tracking-wide uppercase sm:col-span-2">
							Business address
							<Input
								value={businessAddress}
								onChange={(event) => setBusinessAddress(event.target.value)}
							/>
						</Label>
						<Label className="flex-col items-start gap-2 text-xs font-semibold tracking-wide uppercase">
							Years licensed
							<select
								value={yearsLicensed}
								onChange={(event) => setYearsLicensed(event.target.value)}
								className="h-10 w-full rounded-md border px-3"
							>
								<option value="">Select...</option>
								{yearsLicensedOptions.map((option) => (
									<option key={option.slug} value={option.slug}>
										{option.label}
									</option>
								))}
							</select>
						</Label>
						<Label className="flex-col items-start gap-2 text-xs font-semibold tracking-wide uppercase">
							Avg transactions / year
							<select
								value={averageTransactions}
								onChange={(event) => setAverageTransactions(event.target.value)}
								className="h-10 w-full rounded-md border px-3"
							>
								<option value="">Select...</option>
								{averageTransactionsOptions.map((option) => (
									<option key={option.slug} value={option.slug}>
										{option.label}
									</option>
								))}
							</select>
						</Label>
						<Label className="flex-col items-start gap-2 text-xs font-semibold tracking-wide uppercase">
							Full / part time
							<select
								value={employmentStatus}
								onChange={(event) => setEmploymentStatus(event.target.value)}
								className="h-10 w-full rounded-md border px-3"
							>
								<option value="">Select...</option>
								<option value="Full time">Full time</option>
								<option value="Part time">Part time</option>
							</select>
						</Label>
						<Label className="flex-col items-start gap-2 text-xs font-semibold tracking-wide uppercase">
							License proof URL / note
							<Input
								value={licenseProof}
								onChange={(event) => setLicenseProof(event.target.value)}
							/>
						</Label>
					</div>

					<div>
						<Button
							onClick={handleContinue}
							disabled={!canContinue}
							size="lg"
							className={cn(
								'w-full gap-2 rounded-4xl px-8 transition-all duration-300',
								canContinue
									? 'bg-primary text-primary-foreground shadow-md hover:bg-primary/90 hover:shadow-lg'
									: 'bg-muted text-muted-foreground',
							)}
						>
							Continue
							<ArrowRight className="h-4 w-4" />
						</Button>
					</div>
				</CardContent>
			</Card>
		</AnimatedStepCard>
	)
}
