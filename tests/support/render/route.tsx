import '@tests/support/mocks/browser'

import { QueryClientProvider } from '@tanstack/react-query'
import {
	createMemoryHistory,
	createRouter,
	RouterProvider,
	type AnyRouter,
} from '@tanstack/react-router'
import { render, type RenderResult } from 'vitest-browser-react'
import { createTestQueryClient } from './component'
import { setMockSession } from '@tests/support/mocks/browser'
import { testSession } from '@tests/support/fixtures/data/session'

type RouteTarget =
	| { path: string; name?: string }
	| { path?: undefined; name: string }

export type RouteTestOptions = RouteTarget & {
	setup?: () => Promise<void> | void
}

type RenderedRoute = {
	router: AnyRouter
	screen: RenderResult
	queryClient: ReturnType<typeof createTestQueryClient>
}

const protectedPathPrefixes = ['/agent/', '/buyer/', '/seller/']

function resolveRoutePath({ path, name }: RouteTestOptions) {
	if (path) return path
	if (name) return `/${name}`
	throw new Error('Expected either path or name for route test')
}

function setRouteSession(path: string) {
	const needsSession = protectedPathPrefixes.some((prefix) =>
		path.startsWith(prefix),
	)
	setMockSession(needsSession ? testSession : null)
}

export async function renderRoute(
	options: RouteTestOptions,
): Promise<RenderedRoute> {
	const path = resolveRoutePath(options)
	const queryClient = createTestQueryClient()

	setRouteSession(path)
	await options.setup?.()

	const { routeTree } = await import('@/routeTree.gen')

	const router: AnyRouter = createRouter({
		routeTree,
		history: createMemoryHistory({ initialEntries: [path] }),
		scrollRestoration: false,
		defaultPreloadStaleTime: 0,
		context: { queryClient },
		Wrap: ({ children }) => (
			<QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
		),
	})

	await router.load()

	localStorage.clear()
	document.body.replaceChildren()

	const container = document.body.appendChild(document.createElement('div'))
	container.style.width = '100vw'
	container.style.minHeight = '100vh'

	const screen = await render(
		<QueryClientProvider client={queryClient}>
			<RouterProvider router={router} />
		</QueryClientProvider>,
		{ container },
	)

	return { router, screen, queryClient }
}
