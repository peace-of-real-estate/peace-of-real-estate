const STATE_ABBREVIATIONS = new Set([
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
])

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
