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
		buyingExperience: 'firstTime',
		decisionStyle: 'middleGround',
		contactStyle: 'regularCheckins',
		riskComfort: 'lowRisk',
		commissionPlan: 'discussThenDecide',
		situationSpecialties: [],
		createdAt: new Date(),
		updatedAt: new Date(),
		...overrides,
	}
}
