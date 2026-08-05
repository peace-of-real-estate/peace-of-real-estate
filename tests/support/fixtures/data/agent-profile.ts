import type { AgentProfile } from '@/lib/profile/types'

import { geoOf } from '../geography'

const FIXED_DATE = new Date('2026-01-01T00:00:00Z')

export function makeAgent(overrides: Partial<AgentProfile> = {}): AgentProfile {
	return {
		id: 'agent-fixture-1',
		userId: 'user-agent-fixture-1',
		representationSide: 'buyer',
		city: {
			id: '01936f00-0000-7000-8000-000000000ba1',
			name: 'Baltimore',
			state: 'MD',
			center: { lat: 39.2904, lng: -76.6122 },
		},
		typicalPriceRange: '400kTo750k',
		bestClientType: 'firstTime',
		notFitFor: [] satisfies string[],
		brokerageName: 'Harborline Realty',
		licenseNumberState: 'LIC-123456-MD',
		geography: geoOf({
			'21201': { lat: 39.2946, lng: -76.6239 },
			'21202': { lat: 39.3051, lng: -76.6056 },
		}),
		yearsLicensed: '6-10',
		clientDescription: 'strategicDataDriven',
		communicationFrequency: 'scheduled',
		quickCommunicationChannel: 'text',
		updateDeliveryMethod: 'email',
		difficultDealInstinct: 'factsFast',
		responseTime: 'within30Min',
		commissionApproach: 'proactiveOpen',
		unrepresentedBuyerApproach: 'referSeparateBrokerage',
		createdAt: FIXED_DATE,
		updatedAt: FIXED_DATE,
		...overrides,
	}
}
