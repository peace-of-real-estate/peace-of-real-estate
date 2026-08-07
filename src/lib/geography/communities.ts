import type { UsPostalCode } from './states'
import type { City } from './zip'

export type CommunityDef = {
	/** Slug unique within its city, e.g. 'fells-point'. */
	key: string
	name: string
	/** Every zip belongs to exactly one community per city (partition). */
	zips: readonly string[]
}

export type BetaCityDef = {
	/** Canonical `cities.name` for the seeded row. */
	name: string
	state: UsPostalCode
	/**
	 * Seed-dataset city names whose zips roll up to this metro at seed time
	 * (suburbs stop being their own city rows and become communities).
	 */
	sourceCities: readonly string[]
	communities: readonly CommunityDef[]
}

// PO-box and unique-building zips are anchored to their geographic post
// office (mostly downtown clusters); the partition + coverage invariants are
// enforced against the pinned `zipcodes` dataset in communities.unit.test.ts.

// ===== Baltimore metro (city + Baltimore Co. ring + close-in suburbs) =====

const BALTIMORE: BetaCityDef = {
	name: 'Baltimore',
	state: 'MD',
	sourceCities: [
		'Baltimore',
		'Towson',
		'Pikesville',
		'Gwynn Oak',
		'Windsor Mill',
		'Randallstown',
		'Reisterstown',
		'Glyndon',
		'Finksburg',
		'Owings Mills',
		'Catonsville',
		'Halethorpe',
		'Elkridge',
		'Hanover',
		'Brooklyn',
		'Curtis Bay',
		'Dundalk',
		'Sparrows Point',
		'Essex',
		'Middle River',
		'Rosedale',
		'Parkville',
		'Perry Hall',
		'White Marsh',
		'Nottingham',
		'Kingsville',
		'Fork',
		'Glen Arm',
		'Hydes',
		'Long Green',
		'Upper Falls',
		'Lutherville Timonium',
		'Cockeysville',
		'Hunt Valley',
		'Phoenix',
		'Sparks Glencoe',
		'Monkton',
		'Parkton',
		'White Hall',
		'Freeland',
		'Maryland Line',
		'Riderwood',
		'Stevenson',
		'Brooklandville',
		'Marriottsville',
		'Woodstock',
		'Columbia',
		'Ellicott City',
		'Glen Burnie',
		'Pasadena',
		'Linthicum Heights',
		'Harmans',
		'Severn',
		'Millersville',
		'Severna Park',
		'Odenton',
		'Crofton',
		'Gambrills',
	],
	communities: [
		{
			key: 'downtown-inner-harbor',
			name: 'Downtown & Inner Harbor',
			zips: [
				'21201',
				'21202',
				'21203',
				'21233',
				'21241',
				'21250',
				'21251',
				'21260',
				'21263',
				'21264',
				'21265',
				'21268',
				'21270',
				'21273',
				'21274',
				'21275',
				'21278',
				'21279',
				'21280',
				'21281',
				'21282',
				'21283',
				'21284',
				'21285',
				'21288',
				'21289',
				'21290',
				'21297',
				'21298',
			],
		},
		{
			key: 'fells-point',
			name: 'Fells Point',
			zips: ['21231'],
		},
		{
			key: 'canton-highlandtown',
			name: 'Canton',
			zips: ['21224'],
		},
		{
			key: 'federal-hill',
			name: 'Federal Hill',
			zips: ['21230'],
		},
		{ key: 'hampden', name: 'Hampden', zips: ['21211'] },
		{
			key: 'charles-village',
			name: 'Charles Village',
			zips: ['21218'],
		},
		{
			key: 'roland-park',
			name: 'Roland Park',
			zips: ['21210', '21212'],
		},
		{
			key: 'mount-washington',
			name: 'Mount Washington',
			zips: ['21209'],
		},
		{
			key: 'lauraville-hamilton',
			name: 'Hamilton-Lauraville',
			zips: ['21206', '21214', '21239'],
		},
		{
			key: 'park-heights',
			name: 'Park Heights',
			zips: ['21215', '21235'],
		},
		{
			key: 'reservoir-hill',
			name: 'Reservoir Hill',
			zips: ['21216', '21217'],
		},
		{
			key: 'east-baltimore',
			name: 'East Baltimore',
			zips: ['21205', '21213', '21287'],
		},
		{
			key: 'southwest-baltimore',
			name: 'Pigtown',
			zips: ['21223', '21229', '21240'],
		},
		{
			key: 'towson',
			name: 'Towson',
			zips: ['21204', '21252', '21286'],
		},
		{
			key: 'pikesville',
			name: 'Pikesville',
			zips: ['21207', '21208'],
		},
		{ key: 'windsor-mill', name: 'Windsor Mill', zips: ['21244'] },
		{ key: 'randallstown', name: 'Randallstown', zips: ['21133'] },
		{
			key: 'reisterstown',
			name: 'Reisterstown',
			zips: ['21048', '21071', '21136'],
		},
		{ key: 'owings-mills', name: 'Owings Mills', zips: ['21117'] },
		{ key: 'catonsville', name: 'Catonsville', zips: ['21228'] },
		{ key: 'halethorpe', name: 'Halethorpe', zips: ['21227'] },
		{
			key: 'elkridge-hanover',
			name: 'Elkridge',
			zips: ['21075', '21076', '21098'],
		},
		{
			key: 'brooklyn-curtis-bay',
			name: 'Brooklyn',
			zips: ['21225', '21226'],
		},
		{
			key: 'dundalk',
			name: 'Dundalk',
			zips: ['21219', '21222'],
		},
		{
			key: 'essex-middle-river',
			name: 'Essex',
			zips: ['21220', '21221', '21261'],
		},
		{ key: 'rosedale', name: 'Rosedale', zips: ['21237'] },
		{ key: 'parkville', name: 'Parkville', zips: ['21234'] },
		{
			key: 'perry-hall',
			name: 'Perry Hall',
			zips: ['21128', '21162'],
		},
		{ key: 'nottingham', name: 'Nottingham', zips: ['21236'] },
		{
			key: 'kingsville',
			name: 'Kingsville',
			zips: ['21051', '21057', '21082', '21087', '21092', '21156'],
		},
		{
			key: 'lutherville-timonium',
			name: 'Lutherville-Timonium',
			zips: ['21093', '21094'],
		},
		{
			key: 'cockeysville-hunt-valley',
			name: 'Cockeysville',
			zips: ['21030', '21031', '21065'],
		},
		{
			key: 'north-county',
			name: 'Phoenix & Monkton',
			zips: ['21111', '21131', '21152'],
		},
		{
			key: 'parkton-hereford',
			name: 'Parkton',
			zips: ['21053', '21105', '21120', '21161'],
		},
		{
			key: 'riderwood',
			name: 'Stevenson',
			zips: ['21022', '21139', '21153'],
		},
		{
			key: 'marriottsville',
			name: 'Marriottsville',
			zips: ['21104', '21163'],
		},
		{
			key: 'columbia',
			name: 'Columbia',
			zips: ['21044', '21045', '21046'],
		},
		{
			key: 'ellicott-city',
			name: 'Ellicott City',
			zips: ['21041', '21042', '21043'],
		},
		{
			key: 'glen-burnie',
			name: 'Glen Burnie',
			zips: ['21060', '21061', '21062'],
		},
		{
			key: 'pasadena',
			name: 'Pasadena',
			zips: ['21122', '21123'],
		},
		{
			key: 'linthicum',
			name: 'Linthicum',
			zips: ['21077', '21090'],
		},
		{ key: 'severn', name: 'Severn', zips: ['21144'] },
		{ key: 'millersville', name: 'Millersville', zips: ['21108'] },
		{ key: 'severna-park', name: 'Severna Park', zips: ['21146'] },
		{ key: 'odenton', name: 'Odenton', zips: ['21113'] },
		{
			key: 'crofton',
			name: 'Crofton',
			zips: ['21054', '21114'],
		},
	],
}

// ===== New Orleans metro (Orleans + Jefferson + St. Bernard parishes) =====

const NEW_ORLEANS: BetaCityDef = {
	name: 'New Orleans',
	state: 'LA',
	sourceCities: [
		'New Orleans',
		'Metairie',
		'Kenner',
		'Gretna',
		'Harvey',
		'Marrero',
		'Westwego',
		'Chalmette',
		'Meraux',
		'Violet',
		'Arabi',
		'Saint Bernard',
		'Belle Chasse',
	],
	communities: [
		{ key: 'french-quarter', name: 'French Quarter & Tremé', zips: ['70116'] },
		{ key: 'bywater-marigny', name: 'Bywater & Marigny', zips: ['70117'] },
		{
			key: 'cbd-warehouse',
			name: 'CBD & Warehouse District',
			zips: [
				'70112',
				'70113',
				'70130',
				'70139',
				'70140',
				'70141',
				'70142',
				'70143',
				'70145',
				'70146',
				'70148',
				'70150',
				'70151',
				'70152',
				'70153',
				'70154',
				'70156',
				'70157',
				'70158',
				'70159',
				'70160',
				'70161',
				'70162',
				'70163',
				'70164',
				'70165',
				'70166',
				'70167',
				'70170',
				'70172',
				'70174',
				'70175',
				'70176',
				'70177',
				'70178',
				'70179',
				'70181',
				'70182',
				'70183',
				'70184',
				'70185',
				'70186',
				'70187',
				'70189',
				'70190',
				'70195',
			],
		},
		{
			key: 'garden-district',
			name: 'Garden District',
			zips: ['70115'],
		},
		{
			key: 'uptown-carrollton',
			name: 'Uptown',
			zips: ['70118'],
		},
		{ key: 'mid-city', name: 'Mid-City', zips: ['70119'] },
		{ key: 'broadmoor', name: 'Broadmoor', zips: ['70125'] },
		{
			key: 'lakeview',
			name: 'Lakeview',
			zips: ['70121', '70123', '70124'],
		},
		{
			key: 'gentilly',
			name: 'Gentilly',
			zips: ['70122', '70126'],
		},
		{
			key: 'new-orleans-east',
			name: 'New Orleans East',
			zips: ['70127', '70128', '70129'],
		},
		{
			key: 'algiers',
			name: 'Algiers & English Turn',
			zips: ['70114', '70131'],
		},
		{
			key: 'metairie',
			name: 'Metairie',
			zips: [
				'70001',
				'70002',
				'70003',
				'70004',
				'70005',
				'70006',
				'70009',
				'70010',
				'70011',
				'70033',
				'70055',
				'70060',
			],
		},
		{
			key: 'kenner',
			name: 'Kenner',
			zips: ['70062', '70063', '70064', '70065', '70097'],
		},
		{
			key: 'gretna',
			name: 'Gretna',
			zips: ['70053', '70054', '70056'],
		},
		{ key: 'harvey', name: 'Harvey', zips: ['70058', '70059'] },
		{
			key: 'marrero',
			name: 'Marrero',
			zips: ['70072', '70073', '70094', '70096'],
		},
		{
			key: 'chalmette',
			name: 'Chalmette',
			zips: ['70032', '70043', '70044', '70075', '70085', '70092'],
		},
		{
			key: 'belle-chasse',
			name: 'Belle Chasse',
			zips: ['70037', '70093'],
		},
	],
}

// ===== New York (five boroughs) =====

const NEW_YORK: BetaCityDef = {
	name: 'New York',
	state: 'NY',
	sourceCities: [
		'New York',
		'Manhattan',
		'Contest Mail',
		'Philip Morris',
		'Marden Kane Inc',
		'Muscular Dystrophy',
		'Citicorp Services Inc',
		'Brooklyn',
		'Ny Telephone',
		'Bronx',
		'Staten Island',
		'Jamaica',
		'Flushing',
		'Astoria',
		'Long Island City',
		'Sunnyside',
		'Far Rockaway',
		'Arverne',
		'Rockaway Park',
		'Breezy Point',
		'Bayside',
		'Queens Village',
		'Little Neck',
		'Fresh Meadows',
		'East Elmhurst',
		'Elmhurst',
		'Ridgewood',
		'Ozone Park',
		'College Point',
		'Whitestone',
		'Oakland Gardens',
		'Corona',
		'Jackson Heights',
		'Rego Park',
		'Forest Hills',
		'Woodside',
		'Maspeth',
		'Middle Village',
		'Cambria Heights',
		'Saint Albans',
		'Springfield Gardens',
		'Howard Beach',
		'Kew Gardens',
		'Richmond Hill',
		'South Richmond Hill',
		'South Ozone Park',
		'Woodhaven',
		'Rosedale',
		'Hollis',
		'Bellerose',
		'Glen Oaks',
	],
	communities: [
		{
			key: 'downtown',
			name: 'Downtown',
			zips: [
				'10004',
				'10005',
				'10006',
				'10007',
				'10038',
				'10041',
				'10043',
				'10045',
				'10048',
				'10060',
				'10079',
				'10080',
				'10081',
				'10090',
				'10096',
				'10200',
				'10203',
				'10211',
				'10212',
				'10213',
				'10242',
				'10249',
				'10256',
				'10257',
				'10258',
				'10259',
				'10260',
				'10261',
				'10265',
				'10268',
				'10269',
				'10270',
				'10271',
				'10272',
				'10273',
				'10274',
				'10275',
				'10276',
				'10277',
				'10278',
				'10279',
				'10280',
				'10281',
				'10282',
				'10285',
				'10286',
				'10292',
			],
		},
		{
			key: 'tribeca-chinatown',
			name: 'Tribeca',
			zips: ['10008', '10013', '10047', '10082'],
		},
		{
			key: 'west-village',
			name: 'West Village',
			zips: ['10012', '10014'],
		},
		{
			key: 'east-village',
			name: 'East Village',
			zips: ['10002', '10003', '10009', '10098', '10099'],
		},
		{
			key: 'chelsea',
			name: 'Chelsea',
			zips: [
				'10001',
				'10010',
				'10011',
				'10015',
				'10095',
				'10118',
				'10119',
				'10120',
				'10121',
				'10122',
				'10123',
				'10124',
				'10125',
				'10126',
			],
		},
		{
			key: 'midtown',
			name: 'Midtown',
			zips: [
				'10016',
				'10017',
				'10018',
				'10019',
				'10020',
				'10022',
				'10036',
				'10046',
				'10055',
				'10072',
				'10087',
				'10094',
				'10101',
				'10102',
				'10103',
				'10104',
				'10105',
				'10106',
				'10107',
				'10108',
				'10109',
				'10110',
				'10111',
				'10112',
				'10113',
				'10114',
				'10115',
				'10116',
				'10117',
				'10129',
				'10130',
				'10131',
				'10132',
				'10133',
				'10138',
				'10149',
				'10150',
				'10151',
				'10152',
				'10153',
				'10154',
				'10155',
				'10156',
				'10157',
				'10158',
				'10159',
				'10160',
				'10161',
				'10162',
				'10163',
				'10164',
				'10165',
				'10166',
				'10167',
				'10168',
				'10169',
				'10170',
				'10171',
				'10172',
				'10173',
				'10174',
				'10175',
				'10176',
				'10177',
				'10178',
				'10179',
				'10184',
				'10185',
				'10196',
				'10197',
				'10199',
			],
		},
		{
			key: 'upper-east-side',
			name: 'Upper East Side',
			zips: ['10021', '10028', '10044', '10065', '10075', '10128'],
		},
		{
			key: 'upper-west-side',
			name: 'Upper West Side',
			zips: ['10023', '10024', '10025', '10069'],
		},
		{
			key: 'harlem',
			name: 'Harlem',
			zips: [
				'10026',
				'10027',
				'10029',
				'10030',
				'10031',
				'10035',
				'10037',
				'10039',
			],
		},
		{
			key: 'washington-heights',
			name: 'Washington Heights',
			zips: ['10032', '10033', '10034', '10040'],
		},
		{
			key: 'brooklyn-heights',
			name: 'Brooklyn Heights',
			zips: [
				'11201',
				'11202',
				'11205',
				'11240',
				'11241',
				'11242',
				'11243',
				'11244',
				'11245',
				'11247',
				'11248',
				'11251',
				'11252',
				'11254',
				'11255',
				'11256',
			],
		},
		{
			key: 'williamsburg',
			name: 'Williamsburg',
			zips: ['11211', '11222', '11249'],
		},
		{
			key: 'bushwick-bedstuy',
			name: 'Bushwick & Bed-Stuy',
			zips: ['11206', '11216', '11221', '11233', '11237'],
		},
		{
			key: 'park-slope',
			name: 'Park Slope',
			zips: ['11215', '11217', '11218'],
		},
		{
			key: 'crown-heights',
			name: 'Crown Heights',
			zips: ['11213', '11225', '11238'],
		},
		{
			key: 'carroll-gardens',
			name: 'Carroll Gardens',
			zips: ['11231'],
		},
		{
			key: 'sunset-park',
			name: 'Sunset Park',
			zips: ['11219', '11220', '11232'],
		},
		{
			key: 'bay-ridge',
			name: 'Bay Ridge',
			zips: ['11209', '11228'],
		},
		{
			key: 'bensonhurst',
			name: 'Bensonhurst',
			zips: ['11204', '11214', '11223'],
		},
		{
			key: 'flatbush',
			name: 'Flatbush',
			zips: ['11210', '11226', '11230'],
		},
		{
			key: 'east-flatbush',
			name: 'East Flatbush',
			zips: ['11203', '11212', '11236', '11239'],
		},
		{
			key: 'east-new-york',
			name: 'East New York',
			zips: ['11207', '11208'],
		},
		{
			key: 'coney-island',
			name: 'Coney Island',
			zips: ['11224', '11229', '11235'],
		},
		{
			key: 'marine-park',
			name: 'Marine Park',
			zips: ['11234'],
		},
		{
			key: 'astoria-lic',
			name: 'Astoria & Long Island City',
			zips: [
				'11101',
				'11102',
				'11103',
				'11104',
				'11105',
				'11106',
				'11109',
				'11120',
			],
		},
		{
			key: 'jackson-heights',
			name: 'Jackson Heights',
			zips: ['11368', '11369', '11370', '11372', '11373', '11377'],
		},
		{
			key: 'ridgewood-maspeth',
			name: 'Ridgewood',
			zips: ['11378', '11379', '11380', '11385', '11386'],
		},
		{
			key: 'forest-hills',
			name: 'Forest Hills',
			zips: ['11374', '11375', '11415'],
		},
		{
			key: 'flushing',
			name: 'Flushing',
			zips: [
				'11351',
				'11352',
				'11354',
				'11355',
				'11356',
				'11357',
				'11358',
				'11367',
				'11371',
				'11381',
				'11390',
			],
		},
		{
			key: 'northeast-queens',
			name: 'Bayside',
			zips: [
				'11359',
				'11360',
				'11361',
				'11362',
				'11363',
				'11364',
				'11365',
				'11366',
			],
		},
		{
			key: 'jamaica',
			name: 'Jamaica',
			zips: [
				'11405',
				'11423',
				'11424',
				'11425',
				'11431',
				'11432',
				'11433',
				'11434',
				'11435',
				'11436',
				'11439',
				'11451',
				'11499',
			],
		},
		{
			key: 'southeast-queens',
			name: 'Queens Village',
			zips: [
				'11004',
				'11411',
				'11412',
				'11413',
				'11422',
				'11426',
				'11427',
				'11428',
				'11429',
			],
		},
		{
			key: 'southwest-queens',
			name: 'Richmond Hill',
			zips: [
				'11414',
				'11416',
				'11417',
				'11418',
				'11419',
				'11420',
				'11421',
				'11430',
			],
		},
		{
			key: 'rockaways',
			name: 'The Rockaways',
			zips: ['11690', '11691', '11692', '11693', '11694', '11695', '11697'],
		},
		{
			key: 'riverdale',
			name: 'Riverdale',
			zips: ['10463', '10468', '10471'],
		},
		{
			key: 'fordham',
			name: 'Fordham',
			zips: ['10453', '10457', '10458', '10467'],
		},
		{
			key: 'south-bronx',
			name: 'South Bronx',
			zips: ['10451', '10454', '10455', '10459', '10474', '10499'],
		},
		{
			key: 'highbridge-concourse',
			name: 'Highbridge',
			zips: ['10452', '10456'],
		},
		{
			key: 'east-bronx',
			name: 'Pelham Bay',
			zips: ['10461', '10462', '10464', '10465'],
		},
		{
			key: 'northeast-bronx',
			name: 'Co-op City',
			zips: ['10466', '10469', '10470', '10475'],
		},
		{
			key: 'soundview',
			name: 'Soundview',
			zips: ['10460', '10472', '10473'],
		},
		{
			key: 'staten-island-north',
			name: 'North Shore',
			zips: ['10301', '10302', '10303', '10304', '10305', '10310'],
		},
		{
			key: 'staten-island-mid',
			name: 'Mid-Island',
			zips: ['10306', '10311', '10313', '10314'],
		},
		{
			key: 'staten-island-south',
			name: 'South Shore',
			zips: ['10307', '10308', '10309', '10312'],
		},
	],
}

export const BETA_CITIES: readonly BetaCityDef[] = [
	BALTIMORE,
	NEW_ORLEANS,
	NEW_YORK,
]

function sameCity(city: Pick<City, 'name' | 'state'>, beta: BetaCityDef) {
	return (
		city.name.toLowerCase() === beta.name.toLowerCase() &&
		city.state === beta.state
	)
}

export function isBetaCity(city: Pick<City, 'name' | 'state'>): boolean {
	return BETA_CITIES.some((beta) => sameCity(city, beta))
}

export function betaCityFor(
	city: Pick<City, 'name' | 'state'>,
): BetaCityDef | undefined {
	return BETA_CITIES.find((beta) => sameCity(city, beta))
}

export function findCommunity(
	key: string,
): { city: BetaCityDef; community: CommunityDef } | undefined {
	for (const city of BETA_CITIES) {
		const community = city.communities.find((c) => c.key === key)
		if (community) return { city, community }
	}
	return undefined
}

export function formatCommunityLabel(
	community: CommunityDef,
	city: BetaCityDef,
): string {
	return `${community.name} — ${city.name}, ${city.state}`
}

export function allCityZips(city: BetaCityDef): string[] {
	return city.communities.flatMap((community) => community.zips)
}

export function communityKeyByZip(
	city: BetaCityDef,
): ReadonlyMap<string, string> {
	return new Map(
		city.communities.flatMap((community) =>
			community.zips.map((zip) => [zip, community.key] as const),
		),
	)
}

/** A community chip is on iff ALL of its zips are selected. */
export function deriveSelectedCommunityKeys(
	city: BetaCityDef,
	zipCodes: string[],
): string[] {
	const selected = new Set(zipCodes)
	return city.communities
		.filter((community) => community.zips.every((zip) => selected.has(zip)))
		.map((community) => community.key)
}

/** Selected zips not absorbed into a fully-selected community. */
export function deriveLooseZips(
	city: BetaCityDef,
	zipCodes: string[],
): string[] {
	const selected = new Set(zipCodes)
	const absorbed = new Set(
		deriveSelectedCommunityKeys(city, zipCodes).flatMap(
			(key) => city.communities.find((c) => c.key === key)?.zips ?? [],
		),
	)
	return [...selected].filter((zip) => !absorbed.has(zip))
}

export function matchCommunities(
	query: string,
): { city: BetaCityDef; community: CommunityDef }[] {
	const normalized = query.trim().toLowerCase()
	if (normalized.length < 2) return []
	const matches: { city: BetaCityDef; community: CommunityDef }[] = []
	for (const city of BETA_CITIES) {
		for (const community of city.communities) {
			if (community.name.toLowerCase().includes(normalized)) {
				matches.push({ city, community })
			}
		}
	}
	return matches
}
