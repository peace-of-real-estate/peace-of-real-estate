import { QueryClientProvider } from '@tanstack/react-query'
import { createRouter } from '@tanstack/react-router'
import { Toaster } from 'sonner'

import { queryClient } from '@/lib/utils/query'

// Import the generated route tree
import { routeTree } from './routeTree.gen'

export const getRouter = () => {
	return createRouter({
		routeTree,
		scrollRestoration: true,
		defaultPreloadStaleTime: 0,
		context: {
			queryClient,
		},
		Wrap: ({ children }) => {
			return (
				<QueryClientProvider client={queryClient}>
					{children}
					<Toaster position="bottom-right" richColors />
				</QueryClientProvider>
			)
		},
	})
}
