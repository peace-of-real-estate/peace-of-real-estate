import type { QueryClient } from '@tanstack/react-query'
import {
	ClientOnly,
	HeadContent,
	Outlet,
	Scripts,
	createRootRouteWithContext,
	redirect,
} from '@tanstack/react-router'
import { Suspense, lazy } from 'react'

import { NotFoundComponent, ServerErrorComponent } from '@/components/errors'
import { hasBetaAccess } from '@/lib/auth/functions'
import { getCurrentSession } from '@/lib/auth/session'

import appCss from '../styles.css?url'

const PostHogInit = lazy(() =>
	import('@/lib/analytics/posthog').then((m) => ({ default: m.PostHogInit })),
)

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
	const content = <Outlet />

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
				<div
					hidden
					aria-hidden
					dangerouslySetInnerHTML={{
						__html: `<!--
THESIS: Category-standard real-estate marketing played straight at Opendoor/Compass craft level; the matching mechanism itself (fit-ranked agents with visible rationale) is the hero, refusing the stock house-photo hero.
OWN-WORLD: Warm off-white #FAF7F2, deep ink #17202B, one deep teal #0E5E5A action color; Archivo grotesque; soft ink-cast elevation; rounded cards, pill fit-chips; warm Baltimore rowhouse photography.
STORY: Visitor sees a match list with fit scores and why-this-match rationale, believes ranking is by fit never payment, and starts the free 2-minute quiz (clients) or joins the Baltimore beta (agents).
FIRST VIEWPORT: Slim white nav; off-white hero, headline left with teal CTA, agent text link, trust row; elevated white match card over a soft rowhouse photo backdrop right.
FORM: canon standing exit, chosen by the user over roll seed 7b30ee47 (assigned Match Sheet; challengers dossier/darkroom/quilt declined). Approved comp: .impeccable/mocks/comp-c-product.webp.
FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, and DESIGN.md
-->`,
					}}
				/>
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
					<ClientOnly fallback={null}>
						<Suspense fallback={null}>
							<PostHogInit />
						</Suspense>
					</ClientOnly>
				) : null}
				{content}
				<Scripts />
			</body>
		</html>
	)
}
