import { mockAgentMatches } from '@tests/support/fixtures/data/agent-matches'
import { makeBuyerProfile } from '@tests/support/fixtures/data/buyer-profile'
import { makeSellerProfile } from '@tests/support/fixtures/data/seller-profile'
import { austinCity } from '@tests/support/fixtures/geography'
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

vi.mock('@/lib/auth/redirects', async () => {
	const { redirect } = await import('@tanstack/react-router')
	return {
		redirectAuthenticatedUsers: () => undefined,
		redirectUnauthenticatedUsers: ({ redirectTo }: { redirectTo: string }) => {
			if (!authState.session) {
				throw redirect({ to: '/auth/login', search: { redirect: redirectTo } })
			}
			return authState.session
		},
		redirectNonAdminUsers: ({ redirectTo }: { redirectTo: string }) => {
			if (!authState.session) {
				throw redirect({ to: '/auth/login', search: { redirect: redirectTo } })
			}
			if (!adminState.isAdmin) {
				throw redirect({ to: '/' })
			}
			return authState.session
		},
	}
})

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

const mockCitySuggestion = austinCity

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

vi.mock('@/lib/geography/zip', async () => {
	const actual = await vi.importActual<typeof import('@/lib/geography/zip')>(
		'@/lib/geography/zip',
	)
	return {
		...actual,
		loadCitySuggestions: async () => [mockCitySuggestion],
		loadCityById: async () => mockCitySuggestion,
		loadCityCenter: async () => austinCity.center,
		loadZipCodeBoundaries: async () => ({
			type: 'FeatureCollection',
			features: [],
		}),
	}
})
