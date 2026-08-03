import type { BuyerProfile } from '@/lib/profile/types'

import { austinCity, geoOf } from '../geography'

export function makeBuyerProfile(
	overrides: Partial<BuyerProfile> = {},
): BuyerProfile {
	return {
		id: 'consumer-1',
		userId: 'user-1',
		role: 'buyer',
		status: 'draft',
		city: austinCity,
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
		createdAt: new Date(),
		updatedAt: new Date(),
		...overrides,
	}
}
