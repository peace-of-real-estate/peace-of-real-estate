import type { SellerProfile } from '@/lib/profile/types'

import { geoOf } from '../geography'

export function makeSellerProfile(
	overrides: Partial<SellerProfile> = {},
): SellerProfile {
	return {
		id: 'seller-1',
		userId: 'user-1',
		role: 'seller',
		status: 'draft',
		city: {
			id: 'city-fixture-austin-tx',
			name: 'Austin',
			state: 'TX',
			center: { lat: 30.2672, lng: -97.7431 },
		},
		geography: geoOf({}),
		timeline: '3months',
		priceMin: 400_000,
		priceMax: 750_000,
		propertyTypes: ['singleFamily'],
		quickCommunicationChannel: 'text',
		updateDeliveryMethod: 'email',
		involvementLevel: 'veryInvolved',
		saleMotivation: 'lifestyleChange',
		successfulSaleLooksLike: 'strongPriceSmoothProcess',
		homeConnection: 'goodMemories',
		agentSilencePreference: 'milestones',
		representationPreference: 'exclusiveRepresentationOnly',
		responseTimeExpectation: 'within30Min',
		commissionComfort: 'openOptions',
		matchPriorities: null,
		matchDetails: null,
		createdAt: new Date(),
		updatedAt: new Date(),
		...overrides,
	}
}
