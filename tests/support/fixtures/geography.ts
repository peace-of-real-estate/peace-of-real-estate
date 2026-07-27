import type {
	CityCenter,
	ResolvedCity,
	ZipGeography,
} from '@/lib/geography/zip'

export const austinCity: ResolvedCity = {
	id: 'city-fixture-austin-tx',
	name: 'Austin',
	state: 'TX',
	center: { lat: 30.2672, lng: -97.7431 },
}

export function geoOf(centroids: Record<string, CityCenter>): ZipGeography {
	return Object.entries(centroids).map(([zip, center]) => ({ zip, center }))
}
