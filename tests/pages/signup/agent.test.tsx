import { describe, test } from 'vitest'
import type { z } from 'zod'
import {
	UserIcon,
	MapPinIcon,
	ChartLineIcon,
	ShieldCheckIcon,
	ScrollIcon,
} from '@phosphor-icons/react'

import { renderComponent } from '@tests/support/render/component'
import { expectScreenshot } from '@tests/support/render/screenshot'
import {
	AgentPreview,
	draftToPreviewProfile,
} from '@/routes/signup/preview/agent'
import { AgentIdentity } from '@/routes/signup/(quiz)/agent/(step-1).identity'
import { AgentMarket } from '@/routes/signup/(quiz)/agent/(step-2).market'
import { AgentWorkStyle } from '@/routes/signup/(quiz)/agent/(step-3).work-style'
import { AgentCompliance } from '@/routes/signup/(quiz)/agent/(step-4).compliance'
import { AgentPeacePact } from '@/routes/signup/(quiz)/agent/(step-5).peace-pact'
import { WizardChrome } from '@/routes/signup/(quiz)/-components/signup-wizard-shell'
import {
	agentAnswerSchema,
	bestClientTypesSchema,
} from '@/lib/matching/questions'

type AgentPreviewFixture = z.infer<typeof agentAnswerSchema> & {
	firstName?: string
	lastName?: string
	brokerageName?: string
	city?: string
	state?: string
	zipCodes?: string[]
	typicalPriceRange?: string
	representationSide?: 'buying' | 'selling' | 'both'
	bestClientTypes?: z.infer<typeof bestClientTypesSchema>
	yearsLicensed?: string
	averageTransactions?: string
	eoInsuranceStatus?: string
}

const agentSteps = [
	{ id: 'identity', label: 'Identity', icon: UserIcon },
	{ id: 'market', label: 'Market', icon: MapPinIcon },
	{ id: 'workStyle', label: 'Work Style', icon: ChartLineIcon },
	{ id: 'compliance', label: 'Compliance', icon: ShieldCheckIcon },
	{ id: 'peacePact', label: 'Peace Pact', icon: ScrollIcon },
]

const agentPreviewDraft = {
	firstName: 'Alex',
	lastName: 'Morgan',
	brokerageName: 'PRE Realty Group',
	city: 'Austin',
	state: 'TX',
	zipCodes: ['78701', '78704'],
	typicalPriceRange: '400000-1000000',
	representationSide: 'both' as const,
	bestClientTypes: ['firstTime', 'moveUp'],
	yearsLicensed: '6-10' as const,
	averageTransactions: '16-30' as const,
	eoInsuranceStatus: 'Yes, I carry my own E&O policy',
	clientDescription: 'strategicDataDriven',
	communicationFrequency: 'scheduled',
	quickCommunicationChannel: 'text',
	updateDeliveryMethod: 'email',
	difficultDealInstinct: 'factsFast',
	responseTime: 'within10Min',
	commissionApproach: 'proactiveOpen',
	unrepresentedBuyerApproach: 'representSellerOnly',
} satisfies AgentPreviewFixture

describe('agent signup flow', () => {
	function renderStep(
		stepId: 'identity' | 'market' | 'workStyle' | 'compliance' | 'peacePact',
		children: React.ReactNode,
		completedStepIds: (
			| 'identity'
			| 'market'
			| 'workStyle'
			| 'compliance'
			| 'peacePact'
		)[] = [],
	) {
		return renderComponent({
			element: (
				<WizardChrome
					steps={agentSteps}
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

	test('identity step screenshot', async () => {
		await renderStep(
			'identity',
			<AgentIdentity state={{}} onUpdate={() => {}} onContinue={() => {}} />,
		)
		await expectScreenshot(document.body, { name: 'step-1-identity' })
	})

	test('market step screenshot', async () => {
		await renderStep(
			'market',
			<AgentMarket state={{}} onUpdate={() => {}} onContinue={() => {}} />,
			['identity'],
		)
		await expectScreenshot(document.body, { name: 'step-2-market' })
	})

	test('work style step screenshot', async () => {
		await renderStep(
			'workStyle',
			<AgentWorkStyle state={{}} onUpdate={() => {}} onContinue={() => {}} />,
			['identity', 'market'],
		)
		await expectScreenshot(document.body, { name: 'step-3-work-style' })
	})

	test('compliance step screenshot', async () => {
		await renderStep(
			'compliance',
			<AgentCompliance state={{}} onUpdate={() => {}} onContinue={() => {}} />,
			['identity', 'market', 'workStyle'],
		)
		await expectScreenshot(document.body, { name: 'step-4-compliance' })
	})

	test('peace pact step screenshot', async () => {
		await renderStep(
			'peacePact',
			<AgentPeacePact state={{}} onUpdate={() => {}} onContinue={() => {}} />,
			['identity', 'market', 'workStyle', 'compliance'],
		)
		await expectScreenshot(document.body, { name: 'step-5-peace-pact' })
	})

	test('preview screenshot', async () => {
		await renderComponent({
			element: (
				<AgentPreview profile={draftToPreviewProfile(agentPreviewDraft)} />
			),
		})
		await expectScreenshot(document.body, { name: 'step-6-preview' })
	})
})
