import { enjoyedClientType, representationSide } from '../../../src/lib/profile'
import type { SlugOf } from '../../../src/lib/profile'
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

const LUXURY_BROKERAGES = [
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

const MEGA_BROKERAGES = [
	'EXP Realty',
	'Coldwell Banker',
	'Keller Williams',
	'Re/Max',
	'Berkshire Hathaway HomeServices',
	'Century 21',
	'Redfin',
] as const

const INDEPENDENT_BROKERAGES = [
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
	},
	{
		city: 'Dallas',
		state: 'TX',
	},
	{
		city: 'Houston',
		state: 'TX',
	},
	{
		city: 'San Antonio',
		state: 'TX',
	},
	{
		city: 'Fort Worth',
		state: 'TX',
	},
	{
		city: 'Phoenix',
		state: 'AZ',
	},
	{
		city: 'Mesa',
		state: 'AZ',
	},
	{
		city: 'Scottsdale',
		state: 'AZ',
	},
	{
		city: 'Tucson',
		state: 'AZ',
	},
	{
		city: 'Los Angeles',
		state: 'CA',
	},
	{ city: 'Beverly Hills', state: 'CA' },
	{
		city: 'Long Beach',
		state: 'CA',
	},
	{
		city: 'San Diego',
		state: 'CA',
	},
	{
		city: 'San Francisco',
		state: 'CA',
	},
	{
		city: 'San Jose',
		state: 'CA',
	},
	{
		city: 'Sacramento',
		state: 'CA',
	},
	{
		city: 'Oakland',
		state: 'CA',
	},
	{
		city: 'Denver',
		state: 'CO',
	},
	{
		city: 'Colorado Springs',
		state: 'CO',
	},
	{
		city: 'Boulder',
		state: 'CO',
	},
	{
		city: 'Miami',
		state: 'FL',
	},
	{
		city: 'Jacksonville',
		state: 'FL',
	},
	{
		city: 'Orlando',
		state: 'FL',
	},
	{
		city: 'Tampa',
		state: 'FL',
	},
	{
		city: 'Atlanta',
		state: 'GA',
	},
	{
		city: 'Chicago',
		state: 'IL',
	},
	{
		city: 'Naperville',
		state: 'IL',
	},
	{
		city: 'Indianapolis',
		state: 'IN',
	},
	{
		city: 'Boston',
		state: 'MA',
	},
	{
		city: 'Cambridge',
		state: 'MA',
	},
	{
		city: 'Detroit',
		state: 'MI',
	},
	{
		city: 'Minneapolis',
		state: 'MN',
	},
	{
		city: 'Kansas City',
		state: 'MO',
	},
	{
		city: 'Milwaukee',
		state: 'WI',
	},
	{
		city: 'Charlotte',
		state: 'NC',
	},
	{
		city: 'Raleigh',
		state: 'NC',
	},
	{
		city: 'Albuquerque',
		state: 'NM',
	},
	{
		city: 'Las Vegas',
		state: 'NV',
	},
	{
		city: 'New York',
		state: 'NY',
	},
	{
		city: 'Columbus',
		state: 'OH',
	},
	{
		city: 'Cleveland',
		state: 'OH',
	},
	{
		city: 'Portland',
		state: 'OR',
	},
	{
		city: 'Philadelphia',
		state: 'PA',
	},
	{
		city: 'Pittsburgh',
		state: 'PA',
	},
	{
		city: 'Nashville',
		state: 'TN',
	},
	{
		city: 'Memphis',
		state: 'TN',
	},
	{
		city: 'Seattle',
		state: 'WA',
	},
	{
		city: 'Washington',
		state: 'DC',
	},
	{
		city: 'Baltimore',
		state: 'MD',
	},
	{
		city: 'New Orleans',
		state: 'LA',
	},
] as const

export const REPRESENTATION_SIDES: WeightedOption<
	SlugOf<typeof representationSide>
>[] = [
	{ value: 'buyer', weight: 60 },
	{ value: 'seller', weight: 40 },
]

export const CLIENT_TYPES = enjoyedClientType.slugs

export const BROKERAGE_POOLS = [
	...LUXURY_BROKERAGES,
	...MEGA_BROKERAGES,
	...INDEPENDENT_BROKERAGES,
]

export type City = (typeof CITIES)[number]
