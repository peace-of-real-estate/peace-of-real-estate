import { mockAgentMatches } from '@tests/support/fixtures/data/agent-matches'
import { makeBuyerProfile } from '@tests/support/fixtures/data/buyer-profile'
import { makeSellerProfile } from '@tests/support/fixtures/data/seller-profile'
import { austinCity, baltimoreCity } from '@tests/support/fixtures/geography'
import { vi } from 'vite-plus/test'

type MockSession = unknown

const authState = vi.hoisted<{ session: MockSession }>(() => ({
	session: null,
}))

export function setMockSession(session: MockSession) {
	authState.session = session
}

const profileState = vi.hoisted<{ agentProfile: unknown }>(() => ({
	agentProfile: null,
}))

export function setMockAgentProfile(profile: unknown) {
	profileState.agentProfile = profile
}

vi.mock('@/lib/auth/client', () => ({
	authClient: {
		useSession: () => ({ data: authState.session, isPending: false }),
		signIn: {
			email: vi.fn(),
			social: vi.fn(),
		},
		signUp: {
			email: vi.fn(),
		},
		requestPasswordReset: vi.fn(),
		resetPassword: vi.fn(),
		signOut: vi.fn(),
	},
}))

vi.mock('@/lib/auth/functions', () => ({
	getCurrentSession: () => authState.session,
	redirectAuthenticatedUsers: () => undefined,
	redirectUnauthenticatedUsers: () => ({ session: authState.session }),
	authenticateBeta: async () => ({ success: true }),
	hasBetaAccess: () => true,
}))

vi.mock('@/lib/auth/session', () => ({
	getCurrentSession: () => Promise.resolve(authState.session),
	requireUserId: () => Promise.resolve('user-1'),
}))

vi.mock('@/routes/__root', async () => {
	const React = await import('react')
	const { Outlet, createRootRouteWithContext } =
		await import('@tanstack/react-router')

	return {
		Route: createRootRouteWithContext()({
			component: () => React.createElement(Outlet),
		}),
	}
})

const mockCitiesById = new Map([
	[baltimoreCity.id, baltimoreCity],
	[austinCity.id, austinCity],
])

const mockLocationSuggestions = [
	{
		kind: 'community',
		key: 'fells-point',
		name: 'Fells Point',
		label: 'Fells Point — Baltimore, MD',
		city: baltimoreCity,
	},
	{ kind: 'city', city: baltimoreCity, agentCount: 3, enabled: true },
	{ kind: 'city', city: austinCity, agentCount: 0, enabled: false },
]

vi.mock('@/lib/profile/server', async () => {
	const actual = await vi.importActual<typeof import('@/lib/profile/server')>(
		'@/lib/profile/server',
	)
	return {
		...actual,
		buyer: {
			...actual.buyer,
			loadProfile: () => Promise.resolve(makeBuyerProfile()),
			createProfileFromDraft: () => Promise.resolve({ success: true }),
		},
		seller: {
			...actual.seller,
			loadProfile: () => Promise.resolve(makeSellerProfile()),
			createProfileFromDraft: () => Promise.resolve({ success: true }),
		},
		agent: {
			...actual.agent,
			loadProfile: () => Promise.resolve(profileState.agentProfile),
			createProfile: () => Promise.resolve({ success: true }),
		},
		loadExistingProfileRoles: () => Promise.resolve([]),
	}
})

vi.mock('@/lib/matching/server', () => ({
	loadBuyerAgentMatches: () => Promise.resolve(mockAgentMatches),
	loadSellerAgentMatches: () => Promise.resolve(mockAgentMatches),
}))

vi.mock('@/lib/introductions/server', async () => {
	const [{ mockAgentIntroductions }, { mockClientIntroductions }] =
		await Promise.all([
			import('@tests/support/fixtures/data/agent-introductions'),
			import('@tests/support/fixtures/data/client-introductions'),
		])
	return {
		getClientIntroductions: () => Promise.resolve(mockClientIntroductions),
		getAgentIntroductions: () => Promise.resolve(mockAgentIntroductions),
		getPendingIntroCount: () =>
			Promise.resolve(
				mockAgentIntroductions.filter((intro) => intro.status === 'pending')
					.length,
			),
		sendIntroductions: () => Promise.resolve({ ok: true, ids: [] }),
		acceptIntroduction: () => Promise.resolve({ ok: true, status: 'accepted' }),
		declineIntroduction: () => Promise.resolve({ ok: true }),
		withdrawIntroduction: () => Promise.resolve({ ok: true }),
	}
})

vi.mock('@/lib/payments/server', () => ({
	createIntroUnlockCheckout: () =>
		Promise.resolve({
			url: 'https://checkout.stripe.com/c/pay/cs_test_mock',
			sessionId: 'cs_test_mock',
		}),
}))

vi.mock('@/lib/geography/server', () => ({
	searchLocationSuggestions: async () => mockLocationSuggestions,
	loadCityById: async ({ data: cityId }: { data: string }) =>
		mockCitiesById.get(cityId) ?? null,
	loadCityCenter: async ({ data: cityId }: { data: string }) =>
		mockCitiesById.get(cityId)?.center ?? null,
	loadCommunityBoundaries: async () => ({
		type: 'FeatureCollection',
		features: [],
	}),
}))
