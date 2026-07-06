import '@tests/support/mocks/browser'

import { QueryClientProvider } from '@tanstack/react-query'
import {
	createMemoryHistory,
	createRouter,
	RouterProvider,
	type AnyRouter,
} from '@tanstack/react-router'
import { renderComponent, createTestQueryClient } from './component'
import { setMockSession } from '@tests/support/mocks/browser'
import { testSession } from '@tests/support/fixtures/data/session'
import type { RenderResult } from 'vitest-browser-react'

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

const protectedPathPrefixes = ['/agent/dashboard', '/consumer/dashboard']

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

	const screen = await renderComponent({
		element: <RouterProvider router={router} />,
		queryClient,
	})

	return { router, screen, queryClient }
}
