import { serializePriceRange } from '../../../src/lib/matching/price-range'
import { bestClientTypeLabels } from '../../../src/lib/matching/questions'
import type { WeightedOption } from './stats'

export const FIRST_NAMES = [
	'James',
	'Mary',
	'Robert',
	'Patricia',
	'John',
	'Jennifer',
	'Michael',
	'Linda',
	'David',
	'Elizabeth',
	'William',
	'Barbara',
	'Richard',
	'Susan',
	'Joseph',
	'Jessica',
	'Thomas',
	'Sarah',
	'Christopher',
	'Karen',
	'Charles',
	'Lisa',
	'Daniel',
	'Nancy',
	'Matthew',
	'Betty',
	'Anthony',
	'Margaret',
	'Mark',
	'Sandra',
	'Donald',
	'Ashley',
	'Steven',
	'Kimberly',
	'Paul',
	'Emily',
	'Andrew',
	'Donna',
	'Joshua',
	'Michelle',
	'Kenneth',
	'Carol',
	'Kevin',
	'Amanda',
	'Brian',
	'Dorothy',
	'George',
	'Melissa',
	'Timothy',
	'Deborah',
	'Ronald',
	'Stephanie',
	'Edward',
	'Rebecca',
	'Jason',
	'Sharon',
	'Jeffrey',
	'Laura',
	'Ryan',
	'Cynthia',
	'Jacob',
	'Kathleen',
	'Gary',
	'Amy',
	'Nicholas',
	'Angela',
	'Eric',
	'Shirley',
	'Jonathan',
	'Anna',
	'Stephen',
	'Brenda',
	'Larry',
	'Pamela',
	'Justin',
	'Emma',
	'Scott',
	'Nikole',
	'Brandon',
	'Samantha',
	'Benjamin',
	'Katherine',
	'Samuel',
	'Christine',
	'Raymond',
	'Debra',
	'Gregory',
	'Rachel',
	'Frank',
	'Carolyn',
	'Alexander',
	'Janet',
	'Patrick',
	'Catherine',
	'Jack',
	'Maria',
	'Dennis',
	'Heather',
	'Jerry',
	'Diane',
] as const

export const LAST_NAMES = [
	'Smith',
	'Johnson',
	'Williams',
	'Brown',
	'Jones',
	'Garcia',
	'Miller',
	'Davis',
	'Rodriguez',
	'Martinez',
	'Hernandez',
	'Lopez',
	'Gonzalez',
	'Wilson',
	'Anderson',
	'Thomas',
	'Taylor',
	'Moore',
	'Jackson',
	'Martin',
	'Lee',
	'Perez',
	'Thompson',
	'White',
	'Harris',
	'Sanchez',
	'Clark',
	'Ramirez',
	'Lewis',
	'Robinson',
	'Walker',
	'Young',
	'Allen',
	'King',
	'Wright',
	'Scott',
	'Torres',
	'Nguyen',
	'Hill',
	'Flores',
	'Green',
	'Adams',
	'Nelson',
	'Baker',
	'Hall',
	'Rivera',
	'Campbell',
	'Mitchell',
	'Carter',
	'Roberts',
	'Turner',
	'Phillips',
	'Evans',
	'Collins',
] as const

export const LUXURY_BROKERAGES = [
	"Sotheby's International Realty",
	'Compass',
	'Douglas Elliman',
	'Corcoran',
	'Brown Harris Stevens',
	'The Agency',
	'Christies International Real Estate',
	'Engel & Volkers',
	'Luxury Portfolio International',
] as const

export const MEGA_BROKERAGES = [
	'EXP Realty',
	'Coldwell Banker',
	'Keller Williams',
	'Re/Max',
	'Berkshire Hathaway HomeServices',
	'Century 21',
	'Redfin',
] as const

export const INDEPENDENT_BROKERAGES = [
	'Realty ONE Group',
	'United Real Estate',
	'Real Brokerage',
	'Fathom Realty',
	'Crye-Leike',
	'Long & Foster',
	'Howard Hanna',
] as const

export const CITIES = [
	{
		city: 'Austin',
		state: 'TX',
		zips: ['78701', '78702', '78703', '78704', '78705'],
	},
	{
		city: 'Dallas',
		state: 'TX',
		zips: ['75201', '75202', '75204', '75205', '75206'],
	},
	{
		city: 'Houston',
		state: 'TX',
		zips: ['77001', '77002', '77004', '77005', '77006'],
	},
	{
		city: 'San Antonio',
		state: 'TX',
		zips: ['78201', '78202', '78203', '78204', '78205'],
	},
	{
		city: 'Phoenix',
		state: 'AZ',
		zips: ['85001', '85003', '85004', '85006', '85007'],
	},
	{
		city: 'Scottsdale',
		state: 'AZ',
		zips: ['85250', '85251', '85254', '85255', '85257'],
	},
	{
		city: 'Tucson',
		state: 'AZ',
		zips: ['85701', '85710', '85711', '85712', '85716'],
	},
	{
		city: 'Los Angeles',
		state: 'CA',
		zips: ['90001', '90002', '90003', '90004', '90005'],
	},
	{ city: 'Beverly Hills', state: 'CA', zips: ['90210', '90211', '90212'] },
	{
		city: 'San Diego',
		state: 'CA',
		zips: ['92101', '92102', '92103', '92104', '92105'],
	},
	{
		city: 'San Francisco',
		state: 'CA',
		zips: ['94102', '94103', '94104', '94105', '94107'],
	},
	{
		city: 'Denver',
		state: 'CO',
		zips: ['80201', '80202', '80204', '80205', '80206'],
	},
	{
		city: 'Boulder',
		state: 'CO',
		zips: ['80301', '80302', '80303', '80304', '80305'],
	},
	{
		city: 'Miami',
		state: 'FL',
		zips: ['33101', '33125', '33126', '33127', '33128'],
	},
	{
		city: 'Orlando',
		state: 'FL',
		zips: ['32801', '32803', '32804', '32805', '32806'],
	},
	{
		city: 'Tampa',
		state: 'FL',
		zips: ['33601', '33602', '33603', '33604', '33605'],
	},
	{
		city: 'Atlanta',
		state: 'GA',
		zips: ['30301', '30303', '30305', '30306', '30307'],
	},
	{
		city: 'Chicago',
		state: 'IL',
		zips: ['60601', '60602', '60603', '60604', '60605'],
	},
	{
		city: 'Naperville',
		state: 'IL',
		zips: ['60540', '60563', '60564', '60565'],
	},
	{
		city: 'Indianapolis',
		state: 'IN',
		zips: ['46201', '46202', '46203', '46204', '46205'],
	},
	{
		city: 'Boston',
		state: 'MA',
		zips: ['02101', '02108', '02109', '02110', '02111'],
	},
	{
		city: 'Cambridge',
		state: 'MA',
		zips: ['02138', '02139', '02140', '02141', '02142'],
	},
	{
		city: 'Detroit',
		state: 'MI',
		zips: ['48201', '48202', '48204', '48205', '48206'],
	},
	{
		city: 'Minneapolis',
		state: 'MN',
		zips: ['55401', '55402', '55403', '55404', '55405'],
	},
	{
		city: 'Charlotte',
		state: 'NC',
		zips: ['28201', '28202', '28203', '28204', '28205'],
	},
	{
		city: 'Raleigh',
		state: 'NC',
		zips: ['27601', '27603', '27604', '27605', '27606'],
	},
	{
		city: 'Las Vegas',
		state: 'NV',
		zips: ['89101', '89102', '89103', '89104', '89106'],
	},
	{
		city: 'New York',
		state: 'NY',
		zips: ['10001', '10002', '10003', '10004', '10005'],
	},
	{
		city: 'Brooklyn',
		state: 'NY',
		zips: ['11201', '11203', '11204', '11205', '11206'],
	},
	{
		city: 'Portland',
		state: 'OR',
		zips: ['97201', '97202', '97203', '97204', '97205'],
	},
	{
		city: 'Philadelphia',
		state: 'PA',
		zips: ['19101', '19102', '19103', '19104', '19106'],
	},
	{
		city: 'Nashville',
		state: 'TN',
		zips: ['37201', '37203', '37204', '37205', '37206'],
	},
	{
		city: 'Memphis',
		state: 'TN',
		zips: ['38101', '38103', '38104', '38105', '38106'],
	},
	{
		city: 'Seattle',
		state: 'WA',
		zips: ['98101', '98102', '98103', '98104', '98105'],
	},
	{
		city: 'Washington',
		state: 'DC',
		zips: ['20001', '20002', '20003', '20004', '20005'],
	},
	{
		city: 'Baltimore',
		state: 'MD',
		zips: ['21201', '21202', '21205', '21206', '21207'],
	},
] as const

export const STREETS = [
	'Main St',
	'Oak Ave',
	'Elm St',
	'Maple Dr',
	'Cedar Ln',
	'Pine St',
	'Park Ave',
	'Broadway',
	'Lake Dr',
	'Hill Rd',
	'River Rd',
	'Forest Ave',
	'Highland Blvd',
	'Sunset Blvd',
	'Magnolia Ave',
	'Chestnut St',
	'Walnut St',
	'Cherry Ln',
	'Birch Ct',
	'Ash Blvd',
] as const

// Stored in the app's serialized "min-max" format (see serializePriceRange),
// matching what the agent signup market step writes. Values stay within the
// app's 0–2M price slider bounds.
const PRICE_RANGES_BY_TIER: Record<string, { min: number; max: number }[]> = {
	entry: [
		{ min: 100_000, max: 250_000 },
		{ min: 150_000, max: 350_000 },
		{ min: 200_000, max: 400_000 },
	],
	mid: [
		{ min: 250_000, max: 500_000 },
		{ min: 300_000, max: 600_000 },
		{ min: 400_000, max: 750_000 },
		{ min: 500_000, max: 750_000 },
	],
	premium: [
		{ min: 500_000, max: 1_000_000 },
		{ min: 750_000, max: 1_500_000 },
		{ min: 1_000_000, max: 2_000_000 },
	],
	luxury: [
		{ min: 1_000_000, max: 2_000_000 },
		{ min: 1_500_000, max: 2_000_000 },
	],
	investor: [
		{ min: 200_000, max: 500_000 },
		{ min: 300_000, max: 1_000_000 },
		{ min: 500_000, max: 2_000_000 },
	],
}

export const PRICE_BY_TIER: Record<string, string[]> = Object.fromEntries(
	Object.entries(PRICE_RANGES_BY_TIER).map(([tier, ranges]) => [
		tier,
		ranges.map((range) => serializePriceRange(range)),
	]),
)

export const YEARS_LABELS: Record<number, string> = {
	1: 'Less than 1 year',
	2: '1-2 years',
	3: '3-5 years',
	5: '5-10 years',
	10: '10-15 years',
	15: '15-20 years',
	20: '20+ years',
}

export const TRANSACTION_LABELS: Record<number, string> = {
	5: '3-5 per year',
	10: '5-10 per year',
	15: '10-15 per year',
	20: '15-20 per year',
	30: '20-30 per year',
	40: '30-40 per year',
	50: '40-50 per year',
	60: '50+ per year',
}

export const REPRESENTATION_SIDES: WeightedOption<
	'buying' | 'selling' | 'both'
>[] = [
	{ value: 'both', weight: 50 },
	{ value: 'buying', weight: 30 },
	{ value: 'selling', weight: 20 },
]

export const PRICE_TIERS: WeightedOption<keyof typeof PRICE_BY_TIER>[] = [
	{ value: 'entry', weight: 15 },
	{ value: 'mid', weight: 35 },
	{ value: 'premium', weight: 30 },
	{ value: 'luxury', weight: 12 },
	{ value: 'investor', weight: 8 },
]

// Slugs from bestClientTypeLabels — the format the agent signup market step
// writes to bestClientTypes. 'other' is excluded because it carries no
// matching signal.
export const CLIENT_TYPES = Object.keys(bestClientTypeLabels).filter(
	(slug) => slug !== 'other',
)

export const EMPLOYMENT_STATUSES = [
	'Salesperson',
	'Realtor',
	'Broker Associate',
	'Associate Broker',
	'Broker',
	'Managing Broker',
]

export const EO_INSURANCE_STATUSES = [
	'Active',
	'Pending',
	'Not required',
] as const

export const NOT_FIT_FOR = [
	'I do not work with commercial properties or fix-and-flip investors.',
	'I am not a good fit for clients seeking entry-level properties.',
	'I do not handle luxury properties or estate sales.',
	'I do not work with renters or short-term rentals.',
	'I do not represent clients outside my licensed metro area.',
	'I am not a good fit for clients who want daily updates.',
	'I do not take listings under $200k.',
	'I do not work with unrepresented buyers in dual-agency situations.',
	// Leave some agents without a "not fit for" note to match the nullable column
	null,
	null,
]

export const BROKERAGE_POOLS = [
	...LUXURY_BROKERAGES,
	...MEGA_BROKERAGES,
	...INDEPENDENT_BROKERAGES,
]

export type City = (typeof CITIES)[number]
