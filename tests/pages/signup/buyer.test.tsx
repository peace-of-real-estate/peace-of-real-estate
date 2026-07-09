import { describe, test } from 'vitest'
import type { z } from 'zod'
import { MapPinIcon, HouseLineIcon, UserIcon } from '@phosphor-icons/react'

import { renderComponent } from '@tests/support/render/component'
import { expectScreenshot } from '@tests/support/render/screenshot'
import { BuyerPreview } from '@/routes/signup/preview/buyer'
import { draftToClientPreviewProfile } from '@/routes/signup/preview/-components/client-preview'
import {
	buyerAnswerSchema,
	propertyTypesSchema,
} from '@/lib/matching/questions'
import {
	ClientLocationFields,
	ClientHomeFields,
	ClientPreferencesFields,
} from '@/routes/signup/(quiz)/-components/client-quiz-fields'
import { WizardChrome } from '@/routes/signup/(quiz)/-components/signup-wizard-shell'

type BuyerPreviewFixture = z.infer<typeof buyerAnswerSchema> & {
	city?: string
	state?: string
	zipCodes?: string[]
	priceRange?: string
	propertyTypes?: z.infer<typeof propertyTypesSchema>
	timeline?: string
}

const buyerSteps = [
	{ id: 'location', label: 'Location', icon: MapPinIcon },
	{ id: 'home', label: 'Home', icon: HouseLineIcon },
	{ id: 'preferences', label: 'Preferences', icon: UserIcon },
]

describe('buyer signup flow', () => {
	function renderStep(
		stepId: 'location' | 'home' | 'preferences',
		children: React.ReactNode,
		completedStepIds: ('location' | 'home' | 'preferences')[] = [],
	) {
		return renderComponent({
			element: (
				<WizardChrome
					steps={buyerSteps}
					currentStepId={stepId}
					onHomeClick={() => {}}
					onStepClick={() => {}}
					completedStepIds={completedStepIds}
				>
					{children}
				</WizardChrome>
			),
		})
	}

	test('location step screenshot', async () => {
		await renderStep(
			'location',
			<ClientLocationFields
				state={{}}
				onUpdate={() => {}}
				onContinue={() => {}}
			/>,
		)
		await expectScreenshot(document.body, { name: 'step-1-location' })
	})

	test('home step screenshot', async () => {
		await renderStep(
			'home',
			<ClientHomeFields
				state={{}}
				priceLabel="Target price"
				onUpdate={() => {}}
				onContinue={() => {}}
			/>,
			['location'],
		)
		await expectScreenshot(document.body, { name: 'step-2-home' })
	})

	test('preferences step screenshot', async () => {
		await renderStep(
			'preferences',
			<ClientPreferencesFields
				state={{}}
				onUpdate={() => {}}
				onComplete={() => {}}
				clientRole="buyer"
			/>,
			['location', 'home'],
		)
		await expectScreenshot(document.body, { name: 'step-3-preferences' })
	})

	test('preview screenshot', async () => {
		const profile = draftToClientPreviewProfile('buyer', {
			city: 'Austin',
			state: 'TX',
			zipCodes: [],
			priceRange: '400000-750000',
			propertyTypes: ['singleFamily'],
			timeline: 'exploring',
			experienceLevel: 'firstTime',
			idealAgentRelationship: 'trustedAdvisor',
			decisionMakingNeed: 'numbersData',
			biddingWarResponse: 'factsOptions',
			quickCommunicationChannel: 'text',
			updateDeliveryMethod: 'email',
			involvementLevel: 'veryInvolved',
			responseTimeExpectation: 'within10Min',
			commissionComfort: 'negotiate',
		} satisfies BuyerPreviewFixture)
		await renderComponent({ element: <BuyerPreview profile={profile} /> })
		await expectScreenshot(document.body, { name: 'step-4-preview' })
	})
})
