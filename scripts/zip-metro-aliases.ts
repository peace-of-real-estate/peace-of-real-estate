import { BETA_CITIES } from '../src/lib/geography/communities'

// Zip -> beta metro city name. init.ts applies this before grouping so
// borough/neighborhood-labeled records (Brooklyn, Flushing, ...) roll up to
// their curated beta city — the curated module is the SSOT for which zips
// belong to the metro universe.
export const METRO_CITY_BY_ZIP: ReadonlyMap<string, string> = new Map(
	BETA_CITIES.flatMap((city) =>
		city.communities.flatMap((community) =>
			community.zips.map((zip) => [zip, city.name] as const),
		),
	),
)
