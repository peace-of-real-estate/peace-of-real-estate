import type { SellerProfile } from '@/lib/profile/types'

import { austinCity, geoOf } from '../geography'

export function makeSellerProfile(
	overrides: Partial<SellerProfile> = {},
): SellerProfile {
	return {
		id: 'seller-1',
		userId: 'user-1',
		role: 'seller',
		status: 'draft',
		city: austinCity,
		geography: geoOf({}),
		timeline: '3months',
		priceMin: 400_000,
		priceMax: 750_000,
		propertyTypes: ['singleFamily'],
		sellingMotivation: 'rightTime',
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
