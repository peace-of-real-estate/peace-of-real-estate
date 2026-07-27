import type { CityCenter, ZipGeography } from '@/lib/geography/zip'

export function geoOf(centroids: Record<string, CityCenter>): ZipGeography {
	return Object.entries(centroids).map(([zip, center]) => ({ zip, center }))
}
