import { createFileRoute } from '@tanstack/react-router'

import { useRef } from 'react'

import {
	AnimatedStepCard,
	StepHeader,
	useSignupWizardContext,
} from '../-components/signup-shell'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { AgentDraft } from '@/lib/profile'
import type { AgentFlowStep } from './route'
import {
	averageTransactions as averageTransactionsEnum,
	yearsLicensed as yearsLicensedEnum,
} from '@/lib/profile'
import { ArrowRightIcon } from '@phosphor-icons/react'
import { z } from 'zod'

export const Route = createFileRoute('/signup/(steps)/agent/(step-1)/identity')(
	{
		component: AgentIdentityRoute,
	},
)

const optionalText = z
	.string()
	.trim()
	.transform((value) => value || null)

const agentIdentitySchema = z.object({
	firstName: z.string().trim().min(1),
	lastName: z.string().trim().min(1),
	brokerageName: z.string().trim().min(1),
	licenseNumberState: z.string().trim().min(1),
	email: optionalText,
	phone: optionalText,
	businessAddress: optionalText,
	licenseProof: optionalText,
	yearsLicensed: z
		.enum(yearsLicensedEnum.slugs)
		.or(z.literal(''))
		.transform((value) => value || null),
	averageTransactions: z
		.enum(averageTransactionsEnum.slugs)
		.or(z.literal(''))
		.transform((value) => value || null),
	employmentStatus: optionalText,
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
	const formRef = useRef<HTMLFormElement>(null)

	const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault()
		const result = agentIdentitySchema.safeParse(
			Object.fromEntries(new FormData(event.currentTarget)),
		)
		if (!result.success) return
		onUpdate(result.data)
		onContinue()
	}

	const fillDebugData = () => {
		const values = {
			firstName: 'Alex',
			lastName: 'Morgan',
			brokerageName: 'PRE Realty Group',
			email: 'alex.morgan@example.com',
			phone: '555-123-4567',
			businessAddress: '123 Main St, Austin, TX 78701',
			licenseNumberState: 'TX-12345678',
			licenseProof: 'https://license.example.com/alex-morgan',
			yearsLicensed: '6-10',
			averageTransactions: '16-30',
			employmentStatus: 'Full time',
		}

		for (const [name, value] of Object.entries(values)) {
			const control = formRef.current?.elements.namedItem(name)
			if (
				control instanceof HTMLInputElement ||
				control instanceof HTMLSelectElement
			) {
				control.value = value
			}
		}
	}

	return (
		<AnimatedStepCard stepKey="identity">
			<Card size="sm" className="shadow-sm">
				<CardContent>
					<form ref={formRef} onSubmit={handleSubmit} className="space-y-6">
						<div className="flex items-start justify-between gap-4">
							<StepHeader stepNumber={1} totalSteps={5} title="Identity" />
							{import.meta.env.DEV ? (
								<Button
									type="button"
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
									name="firstName"
									defaultValue={state.firstName}
									placeholder="Jane"
									required
								/>
							</Label>
							<Label className="flex-col items-start gap-2 text-xs font-semibold tracking-wide uppercase">
								Last name
								<Input
									name="lastName"
									defaultValue={state.lastName}
									placeholder="Doe"
									required
								/>
							</Label>
							<Label className="flex-col items-start gap-2 text-xs font-semibold tracking-wide uppercase">
								Brokerage name
								<Input
									name="brokerageName"
									defaultValue={state.brokerageName}
									required
								/>
							</Label>
							<Label className="flex-col items-start gap-2 text-xs font-semibold tracking-wide uppercase">
								Email
								<Input
									type="email"
									name="email"
									defaultValue={state.email ?? undefined}
								/>
							</Label>
							<Label className="flex-col items-start gap-2 text-xs font-semibold tracking-wide uppercase">
								Phone
								<Input
									type="tel"
									name="phone"
									defaultValue={state.phone ?? undefined}
								/>
							</Label>
							<Label className="flex-col items-start gap-2 text-xs font-semibold tracking-wide uppercase">
								License number & state
								<Input
									name="licenseNumberState"
									defaultValue={state.licenseNumberState}
									placeholder="CA-DRE-01234567"
									required
								/>
							</Label>
							<Label className="flex-col items-start gap-2 text-xs font-semibold tracking-wide uppercase sm:col-span-2">
								Business address
								<Input
									name="businessAddress"
									defaultValue={state.businessAddress ?? undefined}
								/>
							</Label>
							<Label className="flex-col items-start gap-2 text-xs font-semibold tracking-wide uppercase">
								Years licensed
								<select
									name="yearsLicensed"
									defaultValue={state.yearsLicensed ?? undefined}
									className="h-10 w-full rounded-md border px-3"
								>
									<option value="">Select...</option>
									{yearsLicensedEnum.slugs.map((option) => (
										<option key={option} value={option}>
											{yearsLicensedEnum.labels[option]}
										</option>
									))}
								</select>
							</Label>
							<Label className="flex-col items-start gap-2 text-xs font-semibold tracking-wide uppercase">
								Avg transactions / year
								<select
									name="averageTransactions"
									defaultValue={state.averageTransactions ?? undefined}
									className="h-10 w-full rounded-md border px-3"
								>
									<option value="">Select...</option>
									{averageTransactionsEnum.slugs.map((option) => (
										<option key={option} value={option}>
											{averageTransactionsEnum.labels[option]}
										</option>
									))}
								</select>
							</Label>
							<Label className="flex-col items-start gap-2 text-xs font-semibold tracking-wide uppercase">
								Full / part time
								<select
									name="employmentStatus"
									defaultValue={state.employmentStatus ?? undefined}
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
									name="licenseProof"
									defaultValue={state.licenseProof ?? undefined}
								/>
							</Label>
						</div>

						<div>
							<Button type="submit" size="lg" className="w-full gap-2">
								Continue
								<ArrowRightIcon className="h-4 w-4" />
							</Button>
						</div>
					</form>
				</CardContent>
			</Card>
		</AnimatedStepCard>
	)
}
