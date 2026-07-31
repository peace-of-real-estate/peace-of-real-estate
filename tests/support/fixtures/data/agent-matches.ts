export const mockAgentMatches = [
	{
		id: 'agent-1',
		name: 'Sarah Chen',
		role: 'agent',
		location: 'Austin, TX',
		zipCodes: ['78701'],
		fitScore: 96,
		status: 'new',
		date: '2026-04-21',
		experience: '12 years',
		agency: 'Horizon Realty Group',
		enjoyedClients: 'First-time buyers',
		scores: {
			Location: 4.9,
			'Price Fit': 4.7,
			'Client Fit': 4.8,
		},
	},
]

export const mockHttpAgentMatches = [
	{
		id: '1',
		name: 'Sarah Chen',
		role: 'agent',
		location: 'Austin, TX',
		zipCodes: ['78701', '78702'],
		fitScore: 94,
		status: 'new',
		date: 'Apr 23, 2026',
		experience: '12 years',
		agency: 'Horizon Realty Group',
		specialties: ['First-time buyers', 'Luxury homes'],
		about:
			'Known for patient guidance and transparent communication through complex purchases.',
		scores: {
			Location: 4.9,
			'Price Fit': 4.7,
			'Client Fit': 4.8,
		},
		contact: {
			phone: '(512) 555-0198',
			email: 'sarah@example.com',
		},
		stats: {
			transactions: 146,
			avgDays: 18,
			satisfaction: 4.9,
		},
	},
	{
		id: '2',
		name: 'Marcus Johnson',
		role: 'agent',
		location: 'Austin, TX',
		zipCodes: ['78704', '78745'],
		fitScore: 87,
		status: 'pending',
		date: 'Apr 21, 2026',
		experience: '8 years',
		agency: 'Urban Nest Properties',
		specialties: ['Condos', 'Urban properties'],
		about:
			'Efficient, data-driven agent who keeps timelines clear and decisions practical.',
		scores: {
			Location: 4.6,
			'Price Fit': 4.4,
			'Client Fit': 4.5,
			'Experience & Trust': 4.4,
		},
	},
]
