import { hasBetaAccess } from '@/lib/auth/beta'
import { getCurrentSession } from '@/lib/auth/functions'
import type { QueryClient } from '@tanstack/react-query'
import {
	HeadContent,
	Outlet,
	Scripts,
	createRootRouteWithContext,
	redirect,
} from '@tanstack/react-router'
import { NotFoundComponent, ServerErrorComponent } from '@/components/errors'
import appCss from '../styles.css?url'
import { PostHogProvider } from 'posthog-js/react'

export const Route = createRootRouteWithContext<{
	queryClient: QueryClient
}>()({
	head: () => ({
		meta: [
			{ charSet: 'utf-8' },
			{ name: 'viewport', content: 'width=device-width, initial-scale=1' },
			{ title: 'Peace of Real Estate' },
		],
		links: [
			{ rel: 'stylesheet', href: appCss },
			{ rel: 'icon', type: 'image/svg+xml', href: '/logomark-theme.svg' },
		],
	}),
	beforeLoad: async ({ location }) => {
		const isBetaUser = await hasBetaAccess()

		if (!isBetaUser && location.pathname !== '/auth/beta') {
			throw redirect({ to: '/auth/beta' })
		}

		if (isBetaUser && location.pathname === '/auth/beta') {
			throw redirect({ to: '/' })
		}

		const session = await getCurrentSession()
		const protectedPrefixes = ['/agent/', '/buyer/', '/seller/']

		if (
			!session &&
			protectedPrefixes.some((prefix) => location.pathname.startsWith(prefix))
		) {
			throw redirect({
				to: '/auth/login',
				search: { redirect: location.pathname },
			})
		}
	},
	component: RootComponent,
	errorComponent: ServerErrorComponent,
	notFoundComponent: NotFoundComponent,
})

function RootComponent() {
	const posthogKey = import.meta.env.VITE_PUBLIC_POSTHOG_KEY
	const analyticsEnabled = import.meta.env.MODE === 'production' && posthogKey
	const content = <Outlet />

	return (
		<html lang="en">
			<head>
				<HeadContent />
			</head>
			<body className="min-h-dvh min-w-80">
				{analyticsEnabled ? (
					<PostHogProvider
						apiKey={posthogKey}
						options={{
							api_host: '/api/ingest',
							ui_host: 'https://us.posthog.com',
							defaults: '2025-11-30',
							person_profiles: 'always',
							capture_exceptions: true,
						}}
					>
						{content}
					</PostHogProvider>
				) : (
					content
				)}
				<Scripts />
			</body>
		</html>
	)
}
