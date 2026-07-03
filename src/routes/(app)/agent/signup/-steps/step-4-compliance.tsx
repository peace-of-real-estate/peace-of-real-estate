import { ShieldCheckIcon } from '@phosphor-icons/react'
import { ArrowRight } from 'lucide-react'
import { useState } from 'react'

import { AnimatedStepCard } from '@/components/signup/shared'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { cn } from '@/lib/utils/ui'
import type { AgentDraft } from '@/lib/matching/profile'
import { StepHeader } from '@/components/signup/step-header'

export function AgentCompliance({
	state,
	onUpdate,
	onContinue,
}: {
	state: AgentDraft
	onUpdate: (patch: Partial<AgentDraft>) => void
	onContinue: () => void
}) {
	const [licenseAttested, setLicenseAttested] = useState(
		state.licenseAttested ?? false,
	)
	const [eoInsuranceStatus, setEoInsuranceStatus] = useState(
		state.eoInsuranceStatus ?? '',
	)
	const canContinue = licenseAttested && eoInsuranceStatus.length > 0

	const handleContinue = () => {
		if (!canContinue) return
		onUpdate({ licenseAttested, eoInsuranceStatus })
		onContinue()
	}

	return (
		<AnimatedStepCard stepKey="compliance">
			<Card size="sm" className="shadow-sm">
				<CardContent className="space-y-6">
					<StepHeader
						stepNumber={3}
						totalSteps={5}
						title="Compliance"
						icon={ShieldCheckIcon}
					/>

					<Label className="flex items-start gap-3 border p-5 text-sm leading-relaxed">
						<input
							type="checkbox"
							checked={licenseAttested}
							onChange={(event) => setLicenseAttested(event.target.checked)}
							className="mt-1"
						/>
						<span>
							I confirm that my real estate license is currently active and in
							good standing in all states where I am licensed, that there are no
							pending or active disciplinary actions, complaints, or
							investigations, and that I have not previously had a real estate
							license suspended, revoked, or subject to formal disciplinary
							action.
						</span>
					</Label>

					<div className="space-y-3">
						<p className="text-sm font-semibold">
							Errors and Omissions (E&O) Insurance
						</p>
						<RadioGroup
							value={eoInsuranceStatus}
							onValueChange={setEoInsuranceStatus}
							className="space-y-2"
						>
							{[
								'Yes, I carry my own E&O policy',
								'Yes, I am covered through my brokerage',
								'No',
							].map((option) => (
								<Label
									key={option}
									className="flex items-center gap-3 border p-4 text-sm"
								>
									<RadioGroupItem value={option} />
									{option}
								</Label>
							))}
						</RadioGroup>
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
