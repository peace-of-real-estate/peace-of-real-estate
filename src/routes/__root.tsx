import type { QueryClient } from '@tanstack/react-query'
import {
	HeadContent,
	Outlet,
	Scripts,
	createRootRouteWithContext,
	redirect,
} from '@tanstack/react-router'
import { PostHogProvider } from 'posthog-js/react'

import { NotFoundComponent, ServerErrorComponent } from '@/components/errors'
import { hasBetaAccess } from '@/lib/auth/functions'
import { getCurrentSession } from '@/lib/auth/session'
import { ImpersonationBanner } from '@/routes/(dashboard)/-components/impersonation-banner'

import appCss from '../styles.css?url'

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
	const gtmId = import.meta.env.VITE_PUBLIC_GTM_ID
	const gtmEnabled = import.meta.env.MODE === 'production' && gtmId
	const content = (
		<>
			<ImpersonationBanner />
			<Outlet />
		</>
	)

	return (
		<html lang="en">
			<head>
				{gtmEnabled ? (
					<script
						dangerouslySetInnerHTML={{
							__html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${gtmId}');`,
						}}
					/>
				) : null}
				<HeadContent />
			</head>
			<body className="min-h-dvh min-w-80">
				{gtmEnabled ? (
					<noscript>
						<iframe
							src={`https://www.googletagmanager.com/ns.html?id=${gtmId}`}
							title="Google Tag Manager"
							height="0"
							width="0"
							style={{ display: 'none', visibility: 'hidden' }}
						/>
					</noscript>
				) : null}
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
