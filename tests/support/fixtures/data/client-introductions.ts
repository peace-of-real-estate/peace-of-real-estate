import type { ClientIntroductionsPayload } from '@/lib/introductions/views'

export const mockClientIntroductions: ClientIntroductionsPayload = {
	introductions: [
		{
			id: 'intro-1',
			status: 'pending',
			createdAt: new Date('2026-01-08T12:00:00Z'),
			acceptedAt: null,
			withdrawableAt: new Date('2026-01-09T12:00:00Z'),
			agent: {
				profileId: 'agent-1',
				name: 'Sarah Chen',
			},
		},
		{
			id: 'intro-2',
			status: 'accepted',
			createdAt: new Date('2026-01-05T12:00:00Z'),
			acceptedAt: new Date('2026-01-07T09:30:00Z'),
			withdrawableAt: new Date('2026-01-06T12:00:00Z'),
			agent: {
				profileId: 'agent-2',
				name: 'Michael Ruiz',
			},
		},
		{
			id: 'intro-3',
			status: 'connected',
			createdAt: new Date('2025-12-20T12:00:00Z'),
			acceptedAt: new Date('2025-12-22T15:45:00Z'),
			withdrawableAt: new Date('2025-12-21T12:00:00Z'),
			agent: {
				profileId: 'agent-3',
				name: 'Ava Johnson',
				contact: {
					email: 'ava.johnson@example.com',
					brokerageName: 'Hill Country Realty',
					licenseNumberState: 'TX 9012345',
				},
			},
		},
		{
			id: 'intro-4',
			status: 'withdrawn',
			createdAt: new Date('2025-11-15T12:00:00Z'),
			acceptedAt: null,
			withdrawableAt: new Date('2025-11-16T12:00:00Z'),
			agent: {
				profileId: 'agent-4',
				name: 'Daniel Kim',
			},
		},
	],
	slots: { used: 3, max: 3 },
	// intro-3 is connected with unlocked contact info, which is only possible
	// while an access window is active; keep endsAt a fixed future date so
	// screenshots never show an expired window next to unlocked contact info.
	window: { endsAt: new Date('2027-01-08T12:00:00Z') },
	canPurchase: true,
	agentStates: [],
}
