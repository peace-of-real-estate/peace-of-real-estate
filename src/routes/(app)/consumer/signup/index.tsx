import { createFileRoute, redirect, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { z } from 'zod'

import { WizardShell } from '@/components/signup/wizard-shell'
import { FlowIntakeProgress } from '@/components/signup/shared'
import { LeaveDialog } from '@/components/signup/leave-dialog'
import { getCurrentSession } from '@/lib/auth/functions'
import {
	hasCompletedConsumerIntake,
	type ConsumerDraft,
	loadConsumerProfile,
} from '@/lib/matching/profile'
import { createLocalStorage } from '@/lib/utils/localstorage'
import {
	ConsumerHome,
	ConsumerLocation,
	ConsumerQuiz,
	ConsumerSituation,
} from './-steps'
import { ConsumerPreview, draftToPreviewProfile } from './-steps/step-5-preview'
import {
	consumerFlowSteps,
	stepOrder,
	type ConsumerFlowStep,
} from './-steps/shared'
import { isConsumerQuizComplete } from './-steps/step-4-quiz'

const signupSearchSchema = z.object({
	step: z
		.enum(['intro', 'intent', 'home', 'quiz', 'preview'])
		.default('intro')
		.catch('intro'),
	redirect: z.string().optional().catch(undefined),
})

export const Route = createFileRoute('/(app)/consumer/signup/')({
	validateSearch: signupSearchSchema,
	beforeLoad: async ({ search }) => {
		const validSteps = ['intro', 'intent', 'home', 'quiz', 'preview'] as const
		if (!validSteps.includes(search.step)) {
			throw redirect({ to: '/consumer/signup', search: { step: 'intro' } })
		}

		const session = await getCurrentSession()
		if (session) {
			const profile = await loadConsumerProfile()

			if (hasCompletedConsumerIntake(profile)) {
				throw redirect({ to: '/consumer/dashboard/matches' })
			}
		}
	},
	component: ConsumerSignupRoute,
})

const consumerDraftStorage =
	createLocalStorage<ConsumerDraft>('pre-consumer-draft')

function ConsumerSignupRoute() {
	const { step } = Route.useSearch()
	const navigate = useNavigate()
	const currentIndex = stepOrder.indexOf(step as ConsumerFlowStep)
	const [state, setState] = useState<ConsumerDraft>(() => {
		return consumerDraftStorage.load() ?? { zipCodes: [] }
	})
	const [showLeaveDialog, setShowLeaveDialog] = useState(false)

	const hasDraft =
		state.intent !== undefined ||
		state.city !== undefined ||
		state.preferredContactMethod !== undefined

	const updateState = (patch: Partial<ConsumerDraft>) => {
		setState((current) => {
			const next = { ...current, ...patch }
			consumerDraftStorage.save(next)
			return next
		})
	}

	const handleHomeClick = () => {
		if (hasDraft) {
			setShowLeaveDialog(true)
			return
		}
		void navigate({ to: '/' })
	}

	const goToStep = (nextStep: ConsumerFlowStep) => {
		void navigate({
			to: '/consumer/signup',
			search: { step: nextStep },
		})
	}

	const completedStepIds = consumerFlowSteps
		.filter((stepItem) => {
			switch (stepItem.id) {
				case 'intro':
					return Boolean(state.intent)
				case 'intent':
					return Boolean(state.city && state.state)
				case 'home':
					return (
						Boolean(state.priceRange) &&
						Array.isArray(state.propertyTypes) &&
						state.propertyTypes.length > 0
					)
				case 'quiz':
					return isConsumerQuizComplete(state)
				default:
					return false
			}
		})
		.map((stepItem) => stepItem.id)

	if (step === 'preview') {
		const profile = draftToPreviewProfile(state)
		return (
			<>
				<ConsumerPreview profile={profile} />
				<LeaveDialog
					open={showLeaveDialog}
					onConfirm={() => {
						setShowLeaveDialog(false)
						void navigate({ to: '/' })
					}}
					onOpenChange={setShowLeaveDialog}
				/>
			</>
		)
	}

	const progress = (
		<FlowIntakeProgress steps={consumerFlowSteps} current={step} />
	)

	return (
		<>
			<WizardShell
				steps={consumerFlowSteps}
				currentStepId={step}
				progress={progress}
				onHomeClick={handleHomeClick}
				onStepClick={(nextStep) => goToStep(nextStep as ConsumerFlowStep)}
				completedStepIds={completedStepIds}
			>
				{step === 'intro' ? (
					<ConsumerSituation
						state={state}
						direction={direction}
						onUpdate={updateState}
						onContinue={() => goToStep('intent')}
					/>
				) : step === 'intent' ? (
					<ConsumerLocation
						state={state}
						direction={direction}
						onUpdate={updateState}
						onContinue={() => goToStep('home')}
					/>
				) : step === 'home' ? (
					<ConsumerHome
						state={state}
						direction={direction}
						onUpdate={updateState}
						onContinue={() => goToStep('quiz')}
					/>
				) : (
					<ConsumerQuiz
						state={state}
						direction={direction}
						onUpdate={updateState}
						onComplete={() => goToStep('preview')}
					/>
				)}
			</WizardShell>
			<LeaveDialog
				open={showLeaveDialog}
				onConfirm={() => {
					setShowLeaveDialog(false)
					void navigate({ to: '/' })
				}}
				onOpenChange={setShowLeaveDialog}
			/>
		</>
	)
}
