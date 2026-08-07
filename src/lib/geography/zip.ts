import type { UsPostalCode } from './states'

export type City = { id: string; name: string; state: UsPostalCode }

export function formatCityName(city: City): string {
	return `${city.name}, ${city.state}`
}

export function isValidZipCode(zipCode: string) {
	return /^\d{5}$/.test(zipCode)
}

export type CityCenter = { lat: number; lng: number }

// A resolved `cities` row: the canonical identity of a city plus its
// computed center. Profiles carry a `cityId` FK; loaders join and hand this
// object to anything that needs city facts, so logic never compares
// free-text city/state strings.
export type ResolvedCity = City & { center: CityCenter }

export type ZipGeography = { zip: string; center: CityCenter }[]

export function toZipGeography(
	rows: { zip: string; lat: number; lng: number }[],
): ZipGeography {
	return rows.map((row) => ({
		zip: row.zip,
		center: { lat: row.lat, lng: row.lng },
	}))
}
