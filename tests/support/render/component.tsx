import '@tests/support/mocks/browser'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, type RenderResult } from 'vitest-browser-react'
import type { ReactElement } from 'react'

export interface RenderComponentOptions {
	element: ReactElement
	queryClient?: QueryClient
}

export function createTestQueryClient() {
	return new QueryClient({
		defaultOptions: {
			queries: { retry: false },
			mutations: { retry: false },
		},
	})
}

export async function renderComponent(
	options: RenderComponentOptions,
): Promise<RenderResult> {
	const queryClient = options.queryClient ?? createTestQueryClient()

	localStorage.clear()
	document.body.replaceChildren()

	const container = document.body.appendChild(document.createElement('div'))
	container.style.width = '100vw'
	container.style.minHeight = '100vh'

	return render(
		<QueryClientProvider client={queryClient}>
			{options.element}
		</QueryClientProvider>,
		{ container },
	)
}
