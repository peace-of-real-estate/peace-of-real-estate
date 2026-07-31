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
		enjoyedClients: ['firstTimeBuyers'],
		brokerageName: 'Harborline Realty',
		licenseNumberState: 'LIC-123456-MD',
		yearsLicensed: '6-10',
		energyFocus: ['calm', 'explainSteps'],
		clientDecisionStyle: 'middleGround',
		clientContactStyle: 'regularCheckins',
		riskAdviceComfort: 'lowRisk',
		commissionStyle: 'walkThroughRate',
		specialties: [],
		geography: geoOf({
			'21201': { lat: 39.2946, lng: -76.6239 },
			'21202': { lat: 39.3051, lng: -76.6056 },
		}),
		createdAt: FIXED_DATE,
		updatedAt: FIXED_DATE,
		...overrides,
	}
}
