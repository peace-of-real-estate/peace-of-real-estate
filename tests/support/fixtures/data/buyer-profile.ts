import type { BuyerProfile } from '@/lib/profile/types'

import { geoOf } from '../geography'

export function makeBuyerProfile(
	overrides: Partial<BuyerProfile> = {},
): BuyerProfile {
	return {
		id: 'consumer-1',
		userId: 'user-1',
		role: 'buyer',
		status: 'draft',
		city: {
			id: 'city-fixture-austin-tx',
			name: 'Austin',
			state: 'TX',
			center: { lat: 30.2672, lng: -97.7431 },
		},
		geography: geoOf({}),
		timeline: 'exploring',
		priceMin: 400_000,
		priceMax: 750_000,
		propertyTypes: ['singleFamily'],
		experienceLevel: 'firstTime',
		quickCommunicationChannel: 'text',
		updateDeliveryMethod: 'email',
		involvementLevel: 'veryInvolved',
		idealAgentRelationship: 'trustedAdvisor',
		decisionMakingNeed: 'numbersData',
		biddingWarResponse: 'factsOptions',
		responseTimeExpectation: 'within30Min',
		commissionComfort: 'openOptions',
		matchPriorities: null,
		matchDetails: null,
		createdAt: new Date(),
		updatedAt: new Date(),
		...overrides,
	}
}
