import { createFileRoute } from '@tanstack/react-router'
import { ScrollIcon } from '@phosphor-icons/react'
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
import type { AgentFlowStep } from './route'

export const Route = createFileRoute(
	'/signup/(quiz)/agent/(step-5)/peace-pact',
)({
	component: AgentPeacePactRoute,
})

function AgentPeacePactRoute() {
	const { state, updateState, goToStep } = useSignupWizardContext<
		AgentDraft,
		AgentFlowStep
	>()

	return (
		<AgentPeacePact
			state={state}
			onUpdate={updateState}
			onContinue={() => goToStep('preview')}
		/>
	)
}

export function AgentPeacePact({
	state,
	onUpdate,
	onContinue,
}: {
	state: AgentDraft
	onUpdate: (patch: Partial<AgentDraft>) => void
	onContinue: () => void
}) {
	const [agreed, setAgreed] = useState(state.peacePactSigned ?? false)
	const [signature, setSignature] = useState(state.peacePactSignature ?? '')
	const canContinue = agreed && signature.trim().length > 2

	const handleContinue = () => {
		if (!canContinue) return
		onUpdate({
			peacePactSigned: true,
			peacePactSignature: signature,
		})
		onContinue()
	}

	return (
		<AnimatedStepCard stepKey="peacePact">
			<Card size="sm" className="shadow-sm">
				<CardContent className="space-y-6">
					<StepHeader
						stepNumber={5}
						totalSteps={5}
						title="Peace Pact"
						icon={ScrollIcon}
					/>

					<Card className="max-h-80 overflow-y-auto rounded-2xl border bg-transparent p-5 text-sm leading-relaxed shadow-none ring-0">
						<h2 className="mb-4 text-xl font-semibold">THE PEACE PACT</h2>
						<p>
							This Commitment reinforces ethical, transparent, and client-first
							real estate practices consistent with the NAR Code of Ethics,
							particularly Article 1.
						</p>
						<p className="mt-4">
							I commit to protecting and promoting my client's interests with
							loyalty, care, and diligence while treating all parties honestly
							and fairly.
						</p>
						<p className="mt-4">
							I affirm that buyers and sellers retain the right to make their
							own decisions, negotiate compensation freely, and decline any term
							or service that does not align with their goals.
						</p>
						<p className="mt-4">
							I will not steer buyers toward or away from properties based on
							compensation, and I will explain representation, services, and
							compensation options clearly before and during any agency
							relationship.
						</p>
					</Card>

					<Label className="flex items-start gap-3 text-sm leading-relaxed">
						<input
							type="checkbox"
							checked={agreed}
							onChange={(event) => setAgreed(event.target.checked)}
							className="mt-1"
						/>
						<span>
							I agree to uphold the Peace Pact in alignment with the NAR Code of
							Ethics and applicable regulations.
						</span>
					</Label>

					<Label className="flex-col items-start gap-2 text-sm font-medium">
						Agent Signature (type full name)
						<Input
							value={signature}
							onChange={(event) => setSignature(event.target.value)}
						/>
					</Label>

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
							Sign & continue
							<ArrowRight className="h-4 w-4" />
						</Button>
					</div>
				</CardContent>
			</Card>
		</AnimatedStepCard>
	)
}
