import { z } from 'zod'

export const clientEnv = z
	.object({
		VITE_PUBLIC_POSTHOG_KEY: z.string().optional(),
		VITE_MATCH_DEBUG: z.string().optional(),
	})
	.parse(import.meta.env)
