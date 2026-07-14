import { z } from 'zod'

export const clientEnv = z
	.object({
		VITE_PUBLIC_POSTHOG_KEY: z.string().optional(),
	})
	.parse(import.meta.env)
