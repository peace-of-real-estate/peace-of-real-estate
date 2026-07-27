import type { AgentProfile } from '@/lib/profile/types'

import { geoOf } from '../geography'

const FIXED_DATE = new Date('2026-01-01T00:00:00Z')

export function makeAgent(overrides: Partial<AgentProfile> = {}): AgentProfile {
	return {
		id: 'agent-fixture-1',
		userId: 'user-agent-fixture-1',
		representationSide: 'buyer',
		city: {
			id: 'city-fixture-baltimore-md',
			name: 'Baltimore',
			state: 'MD',
			center: { lat: 39.2904, lng: -76.6122 },
		},
		typicalPriceRange: '400kTo750k',
		bestClientTypes: ['firstTime', 'moveUp'],
		notFitFor: [] satisfies string[],
		firstName: 'Avery',
		lastName: 'Stone',
		brokerageName: 'Harborline Realty',
		email: 'avery@example.com',
		phone: null,
		businessAddress: null,
		licenseNumberState: 'LIC-123456-MD',
		geography: geoOf({
			'21201': { lat: 39.2946, lng: -76.6239 },
			'21202': { lat: 39.3051, lng: -76.6056 },
		}),
		yearsLicensed: '6-10',
		averageTransactions: '6-15',
		employmentStatus: 'Realtor',
		licenseProof: null,
		usePaxWriter: true,
		licenseAttested: true,
		eoInsuranceStatus: 'Active',
		peacePactSigned: true,
		peacePactSignature: 'Avery Stone',
		peacePactSignedAt: FIXED_DATE,
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
