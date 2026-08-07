import { describe, expect, test } from 'vitest'
import * as zipcodes from 'zipcodes'

import {
	BETA_CITIES,
	allCityZips,
	betaCityFor,
	communityKeyByZip,
	deriveLooseZips,
	deriveSelectedCommunityKeys,
	findCommunity,
	formatCommunityLabel,
	isBetaCity,
	matchCommunities,
} from './communities'

const baltimore = BETA_CITIES.find((c) => c.name === 'Baltimore')!

// ===== Seed-dataset consistency (the curation gate) =====
// Mirrors scripts/init.ts filtering: US records with finite coordinates.
// Fails loudly when the pinned `zipcodes` package adds/removes a zip that
// would otherwise land in a beta city row uncurated.

// Every NYC-area prefix in the dataset must be curated, even if the package
// introduces a new source-city name not yet listed in `sourceCities`.
const NYC_UNIVERSE = /^(100|101|102|103|104|111|112|113|114|116)\d{2}$/

function seedableRecords(
	predicate: (record: zipcodes.ZipCodeRecord) => boolean,
): zipcodes.ZipCodeRecord[] {
	return Object.values(zipcodes.codes).filter(
		(record) =>
			record.country === 'US' &&
			Number.isFinite(record.latitude) &&
			Number.isFinite(record.longitude) &&
			predicate(record),
	)
}

describe('curated zips match the seed dataset', () => {
	for (const city of BETA_CITIES) {
		test(`${city.name}, ${city.state}: exact coverage of every source city`, () => {
			const curated = allCityZips(city)
			const expected = new Set(
				seedableRecords(
					(record) =>
						record.state === city.state &&
						city.sourceCities.includes(record.city),
				).map((record) => record.zip),
			)
			const missing = [...expected].filter((zip) => !curated.includes(zip))
			expect(
				missing,
				'source-city zips in the dataset but not curated',
			).toEqual([])
		})

		test(`${city.name}, ${city.state}: every curated zip belongs to a declared source city`, () => {
			const extra = allCityZips(city).filter((zip) => {
				const record = zipcodes.codes[zip]
				return (
					!record ||
					record.country !== 'US' ||
					!Number.isFinite(record.latitude) ||
					!Number.isFinite(record.longitude) ||
					record.state !== city.state ||
					!city.sourceCities.includes(record.city)
				)
			})
			expect(extra, 'curated zips outside the declared source cities').toEqual(
				[],
			)
		})
	}

	test('New York: no NYC-area zip escapes curation', () => {
		const curated = allCityZips(BETA_CITIES.find((c) => c.name === 'New York')!)
		const missing = seedableRecords(
			(record) =>
				record.state === 'NY' &&
				(NYC_UNIVERSE.test(record.zip) || record.zip === '11004'),
		)
			.map((record) => record.zip)
			.filter((zip) => !curated.includes(zip))
		expect(missing).toEqual([])
	})
})

describe('BETA_CITIES', () => {
	test('covers the three beta markets', () => {
		expect(BETA_CITIES.map((c) => `${c.name}, ${c.state}`)).toEqual([
			'Baltimore, MD',
			'New Orleans, LA',
			'New York, NY',
		])
	})

	test('every community zip is a 5-digit string', () => {
		for (const city of BETA_CITIES) {
			for (const community of city.communities) {
				for (const zip of community.zips) {
					expect(zip).toMatch(/^\d{5}$/)
				}
			}
		}
	})

	test('zips form a partition within each city (no duplicates)', () => {
		for (const city of BETA_CITIES) {
			const zips = allCityZips(city)
			expect(new Set(zips).size).toBe(zips.length)
		}
	})

	test('community keys are unique across all beta cities', () => {
		const keys = BETA_CITIES.flatMap((c) => c.communities.map((cm) => cm.key))
		expect(new Set(keys).size).toBe(keys.length)
	})
})

describe('isBetaCity / betaCityFor', () => {
	test('matches beta cities case-insensitively on name', () => {
		expect(isBetaCity({ name: 'baltimore', state: 'MD' })).toBe(true)
		expect(isBetaCity({ name: 'New Orleans', state: 'LA' })).toBe(true)
		expect(isBetaCity({ name: 'NEW YORK', state: 'NY' })).toBe(true)
	})

	test('rejects non-beta cities and borough stubs', () => {
		expect(isBetaCity({ name: 'Austin', state: 'TX' })).toBe(false)
		expect(isBetaCity({ name: 'Brooklyn', state: 'NY' })).toBe(false)
	})

	test('betaCityFor returns the def or undefined', () => {
		expect(betaCityFor({ name: 'Baltimore', state: 'MD' })).toBe(baltimore)
		expect(betaCityFor({ name: 'Austin', state: 'TX' })).toBeUndefined()
	})
})

describe('findCommunity / formatCommunityLabel', () => {
	test('finds a community by key with its parent city', () => {
		const found = findCommunity('fells-point')
		expect(found?.city.name).toBe('Baltimore')
		expect(found?.community.name).toBe('Fells Point')
		expect(findCommunity('not-real')).toBeUndefined()
	})

	test('labels include the parent city', () => {
		const fellsPoint = baltimore.communities.find(
			(c) => c.key === 'fells-point',
		)!
		expect(formatCommunityLabel(fellsPoint, baltimore)).toBe(
			'Fells Point — Baltimore, MD',
		)
	})
})

describe('deriveSelectedCommunityKeys / deriveLooseZips', () => {
	test('a community is selected only when all its zips are', () => {
		expect(deriveSelectedCommunityKeys(baltimore, ['21231'])).toEqual([
			'fells-point',
		])
		expect(deriveSelectedCommunityKeys(baltimore, ['21210'])).toEqual([])
		expect(deriveSelectedCommunityKeys(baltimore, ['21210', '21212'])).toEqual([
			'roland-park',
		])
	})

	test('loose zips are leftovers from partially-selected communities', () => {
		expect(deriveLooseZips(baltimore, ['21231', '21210'])).toEqual(['21210'])
		expect(deriveLooseZips(baltimore, ['21231'])).toEqual([])
		expect(deriveLooseZips(baltimore, [])).toEqual([])
	})

	test('full selection absorbs every zip into communities', () => {
		const all = allCityZips(baltimore)
		expect(deriveSelectedCommunityKeys(baltimore, all)).toHaveLength(
			baltimore.communities.length,
		)
		expect(deriveLooseZips(baltimore, all)).toEqual([])
	})
})

describe('communityKeyByZip', () => {
	test('maps every zip to its community', () => {
		const byZip = communityKeyByZip(baltimore)
		expect(byZip.get('21231')).toBe('fells-point')
		expect(byZip.get('21212')).toBe('roland-park')
		expect(byZip.size).toBe(allCityZips(baltimore).length)
	})
})

describe('matchCommunities', () => {
	test('matches case-insensitive substrings on community names', () => {
		const matches = matchCommunities('fells')
		expect(matches).toHaveLength(1)
		expect(matches[0]!.community.key).toBe('fells-point')
		expect(matches[0]!.city.name).toBe('Baltimore')
	})

	test('matches across cities', () => {
		const matches = matchCommunities('heights')
		const keys = matches.map((m) => m.community.key)
		expect(keys).toContain('park-heights')
		expect(keys).toContain('crown-heights')
		expect(keys).toContain('washington-heights')
	})

	test('ignores queries shorter than 2 characters', () => {
		expect(matchCommunities('f')).toEqual([])
		expect(matchCommunities('')).toEqual([])
	})
})
