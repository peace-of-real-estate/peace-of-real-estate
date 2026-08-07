import type { Feature, FeatureCollection, Polygon } from 'geojson'
import { describe, expect, test } from 'vitest'

import type { BetaCityDef } from './communities'
import { dissolveToCommunityBoundaries } from './community-boundaries'

function square(zip: string, x: number, y: number): Feature<Polygon> {
	return {
		type: 'Feature',
		properties: { ZCTA5: zip },
		geometry: {
			type: 'Polygon',
			coordinates: [
				[
					[x, y],
					[x + 1, y],
					[x + 1, y + 1],
					[x, y + 1],
					[x, y],
				],
			],
		},
	}
}

const city: BetaCityDef = {
	name: 'Testville',
	state: 'MD',
	sourceCities: ['Testville'],
	communities: [
		{ key: 'east', name: 'East Side', zips: ['00001', '00002'] },
		{ key: 'west', name: 'West Side', zips: ['00003'] },
	],
}

describe('dissolveToCommunityBoundaries', () => {
	test('adjacent zips dissolve into one community feature', () => {
		const zips: FeatureCollection = {
			type: 'FeatureCollection',
			features: [square('00001', 0, 0), square('00002', 1, 0)],
		}

		const result = dissolveToCommunityBoundaries(city, zips)

		expect(result.features).toHaveLength(1)
		expect(result.features[0]?.properties).toEqual({
			communityKey: 'east',
			name: 'East Side',
		})
		expect(result.features[0]?.geometry.type).toBe('Polygon')
	})

	test('disjoint zips dissolve into one multi-polygon community feature', () => {
		const zips: FeatureCollection = {
			type: 'FeatureCollection',
			features: [square('00001', 0, 0), square('00002', 10, 10)],
		}

		const result = dissolveToCommunityBoundaries(city, zips)

		expect(result.features).toHaveLength(1)
		expect(result.features[0]?.properties?.communityKey).toBe('east')
		expect(result.features[0]?.geometry.type).toBe('MultiPolygon')
	})

	test('single-zip communities pass through with community properties', () => {
		const zips: FeatureCollection = {
			type: 'FeatureCollection',
			features: [square('00003', 5, 5)],
		}

		const result = dissolveToCommunityBoundaries(city, zips)

		expect(result.features).toHaveLength(1)
		expect(result.features[0]?.properties).toEqual({
			communityKey: 'west',
			name: 'West Side',
		})
	})

	test('zips outside the partition are skipped', () => {
		const zips: FeatureCollection = {
			type: 'FeatureCollection',
			features: [square('99999', 0, 0), square('00003', 5, 5)],
		}

		const result = dissolveToCommunityBoundaries(city, zips)

		expect(result.features).toHaveLength(1)
		expect(result.features[0]?.properties?.communityKey).toBe('west')
	})
})
