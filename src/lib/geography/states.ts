import { z } from 'zod'

// Every code in the seed dataset (zipcodes package, country === 'US'): the
// 50 states, DC, territories, and military postal codes. The DB enum derives
// from this list, so it is the single source of truth for valid state codes.
export const US_POSTAL_CODES = [
	'AL',
	'AK',
	'AZ',
	'AR',
	'CA',
	'CO',
	'CT',
	'DE',
	'DC',
	'FL',
	'GA',
	'HI',
	'ID',
	'IL',
	'IN',
	'IA',
	'KS',
	'KY',
	'LA',
	'ME',
	'MD',
	'MA',
	'MI',
	'MN',
	'MS',
	'MO',
	'MT',
	'NE',
	'NV',
	'NH',
	'NJ',
	'NM',
	'NY',
	'NC',
	'ND',
	'OH',
	'OK',
	'OR',
	'PA',
	'RI',
	'SC',
	'SD',
	'TN',
	'TX',
	'UT',
	'VT',
	'VA',
	'WA',
	'WV',
	'WI',
	'WY',
	'AS',
	'FM',
	'GU',
	'MH',
	'MP',
	'PR',
	'PW',
	'VI',
	'AA',
	'AE',
	'AP',
] as const

export const usPostalCodeSchema = z.enum(US_POSTAL_CODES)

export type UsPostalCode = z.infer<typeof usPostalCodeSchema>

const STATE_ABBREVIATIONS: ReadonlySet<string> = new Set(US_POSTAL_CODES)

export function resolveStateCode(...values: Array<string | undefined>) {
	for (const value of values) {
		if (!value) continue
		const normalized = value.trim().toUpperCase()
		if (STATE_ABBREVIATIONS.has(normalized)) return normalized

		const stateMatch = normalized.match(/\b[A-Z]{2}\b(?=\s*$|\s*,|\s+\d{5})/)
		if (stateMatch && STATE_ABBREVIATIONS.has(stateMatch[0])) {
			return stateMatch[0]
		}
	}

	return undefined
}
