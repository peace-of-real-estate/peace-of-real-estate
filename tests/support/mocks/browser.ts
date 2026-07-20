import { mockAgentMatches } from '@tests/support/fixtures/data/agent-matches'
import { mockBuyerProfile } from '@tests/support/fixtures/data/buyer-profile'
import { mockSellerProfile } from '@tests/support/fixtures/data/seller-profile'
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

const adminState = vi.hoisted<{ isAdmin: boolean }>(() => ({
	isAdmin: false,
}))

export function setMockIsAdmin(isAdmin: boolean) {
	adminState.isAdmin = isAdmin
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
	authenticateBeta: async () => ({ success: true }),
	hasBetaAccess: () => true,
}))

vi.mock('@/lib/auth/session', () => ({
	getCurrentSession: () => Promise.resolve(authState.session),
	requireUserId: () => Promise.resolve('user-1'),
}))

vi.mock('@/lib/auth/is-admin', () => ({
	getIsAdmin: () => Promise.resolve(adminState.isAdmin),
}))

vi.mock('@/lib/auth/redirects', () => ({
	redirectAuthenticatedUsers: () => undefined,
	redirectNonAdminUsers: () => Promise.resolve({ session: authState.session }),
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

vi.mock('@/lib/profile', async () => {
	const actual =
		await vi.importActual<typeof import('@/lib/profile')>('@/lib/profile')
	return {
		...actual,
		loadBuyerProfile: () => Promise.resolve(mockBuyerProfile),
		loadSellerProfile: () => Promise.resolve(mockSellerProfile),
		loadAgentProfile: () => Promise.resolve(profileState.agentProfile),
		createBuyerProfileFromDraft: () => Promise.resolve({ success: true }),
		createSellerProfileFromDraft: () => Promise.resolve({ success: true }),
		completeAgentSignup: () => Promise.resolve({ success: true }),
		updateAgentProfile: () => Promise.resolve(),
	}
})

vi.mock('@/lib/matching/server', () => ({
	loadBuyerAgentMatches: () => Promise.resolve(mockAgentMatches),
	loadSellerAgentMatches: () => Promise.resolve(mockAgentMatches),
}))

vi.mock('@/lib/geography/zip', async () => {
	const actual = await vi.importActual<typeof import('@/lib/geography/zip')>(
		'@/lib/geography/zip',
	)
	return {
		...actual,
		loadCitySuggestions: async () => ['Austin, TX'],
		loadCityCenter: async () => ({ latitude: 30.2672, longitude: -97.7431 }),
		loadZipCodeBoundaries: async () => ({
			type: 'FeatureCollection',
			features: [],
		}),
	}
})
