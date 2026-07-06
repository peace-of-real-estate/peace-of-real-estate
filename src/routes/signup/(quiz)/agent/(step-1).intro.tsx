import { createFileRoute } from '@tanstack/react-router'
import { ArrowRight } from 'lucide-react'

import {
	AnimatedStepCard,
	useSignupWizardContext,
} from '../-components/signup-wizard-shell'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { getAgentFlowSteps, type AgentFlowStep } from './route'
import type { AgentDraft } from '@/lib/matching/profile'

export const Route = createFileRoute('/signup/(quiz)/agent/(step-1)/intro')({
	component: AgentIntroRoute,
})

function AgentIntroRoute() {
	const { goToStep } = useSignupWizardContext<AgentDraft, AgentFlowStep>()

	return <AgentIntro onContinue={() => goToStep('identity')} />
}

function AgentIntro({ onContinue }: { onContinue: () => void }) {
	return (
		<AnimatedStepCard stepKey="intro">
			<Card size="sm" className="shadow-sm">
				<CardContent className="space-y-8">
					<div className="space-y-2 text-center">
						<h2 className="font-heading text-2xl font-semibold tracking-tight sm:text-3xl">
							Let's build your agent profile
						</h2>
						<p className="text-muted-foreground text-sm leading-relaxed">
							A few essentials first, then the deeper stuff that helps clients
							choose you.
						</p>
					</div>

					<div className="space-y-3">
						{getAgentFlowSteps()
							.slice(1)
							.map((step) => (
								<div
									key={step.id}
									className="flex items-center gap-3 rounded-xl border p-4"
								>
									<step.icon
										className="text-primary h-5 w-5"
										weight="duotone"
									/>
									<div>
										<p className="text-sm font-semibold">{step.label}</p>
									</div>
								</div>
							))}
					</div>

					<Button
						onClick={onContinue}
						size="lg"
						className="w-full gap-2 rounded-4xl px-8"
					>
						Start
						<ArrowRight className="h-4 w-4" />
					</Button>
				</CardContent>
			</Card>
		</AnimatedStepCard>
	)
}
