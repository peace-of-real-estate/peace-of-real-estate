import { createEnv } from '@/lib/utils/env'
import { z } from 'zod'

export const serverEnv = createEnv(
	z.object({
		APP_ENV: z
			.enum(['development', 'staging', 'production', 'test'])
			.optional(),
		RAILWAY_ENVIRONMENT_NAME: z.string().optional(),
		BETTER_AUTH_URL: z.string().url(),
		BETA_PASSWORD: z.string(),
		BETTER_AUTH_SECRET: z.string(),
		DATABASE_URL: z.string().url(),
		GOOGLE_CLIENT_ID: z.string(),
		GOOGLE_CLIENT_SECRET: z.string(),
		AVATAR_BUCKET: z.string(),
		AWS_REGION: z.string(),
		AWS_ENDPOINT_URL: z.string().url(),
		AWS_ACCESS_KEY_ID: z.string(),
		AWS_SECRET_ACCESS_KEY: z.string(),
		AI_BASE_URL: z.string().url().optional(),
		AI_MODEL: z.string().optional(),
		AI_API_KEY: z.string().optional(),
		RESEND_API_KEY: z.string().optional(),
		FROM_EMAIL: z.string().email().optional(),
	}),
)
