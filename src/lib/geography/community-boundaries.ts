import { union } from '@turf/union'
import type { Feature, FeatureCollection, MultiPolygon, Polygon } from 'geojson'

import type { BetaCityDef } from './communities'
import { communityKeyByZip } from './communities'

type PolygonFeature = Feature<Polygon | MultiPolygon>

// Snap coordinates to a shared grid so adjacent polygons keep coincident
// borders — that is what lets unions dissolve without slivers and keeps
// hairline gaps from showing between neighboring communities.
const QUANTIZE_PRECISION = 1e5

function quantizePoint(point: number[]): number[] {
	return point.map(
		(value) => Math.round(value * QUANTIZE_PRECISION) / QUANTIZE_PRECISION,
	)
}

function quantizeGeometry(
	geometry: Polygon | MultiPolygon,
): Polygon | MultiPolygon {
	if (geometry.type === 'Polygon') {
		return {
			type: 'Polygon',
			coordinates: geometry.coordinates.map((ring) => ring.map(quantizePoint)),
		}
	}
	return {
		type: 'MultiPolygon',
		coordinates: geometry.coordinates.map((polygon) =>
			polygon.map((ring) => ring.map(quantizePoint)),
		),
	}
}

function quantizeFeature(feature: PolygonFeature): PolygonFeature {
	return {
		...feature,
		geometry: quantizeGeometry(feature.geometry),
	}
}

function dissolveGroup(
	group: PolygonFeature[],
	properties: { communityKey: string; name: string },
): PolygonFeature[] {
	if (group.length === 1) {
		return [{ ...group[0]!, properties }]
	}
	try {
		const merged = union(
			{ type: 'FeatureCollection', features: group },
			{ properties },
		)
		if (merged) return [merged]
	} catch {
		// Simplified TIGERweb geometries can carry slivers that break the
		// union — fall back to rendering the zips as separate features.
	}
	return group.map((feature) => ({ ...feature, properties }))
}

export function dissolveToCommunityBoundaries(
	city: BetaCityDef,
	zipBoundaries: FeatureCollection,
): FeatureCollection {
	const communityByZip = communityKeyByZip(city)
	const groups = new Map<string, PolygonFeature[]>()

	for (const feature of zipBoundaries.features) {
		const zip = feature.properties?.ZCTA5
		const communityKey =
			typeof zip === 'string' ? communityByZip.get(zip) : undefined
		if (!communityKey) continue
		if (
			feature.geometry.type !== 'Polygon' &&
			feature.geometry.type !== 'MultiPolygon'
		) {
			continue
		}
		const polygonFeature: PolygonFeature = quantizeFeature({
			...feature,
			geometry: feature.geometry,
		})
		const group = groups.get(communityKey) ?? []
		group.push(polygonFeature)
		groups.set(communityKey, group)
	}

	const features: PolygonFeature[] = []
	for (const community of city.communities) {
		const group = groups.get(community.key)
		if (!group?.length) continue
		features.push(
			...dissolveGroup(group, {
				communityKey: community.key,
				name: community.name,
			}),
		)
	}

	return { type: 'FeatureCollection', features }
}
