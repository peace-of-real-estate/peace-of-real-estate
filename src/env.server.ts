import { createEnv } from '@t3-oss/env-core'
import { z } from 'zod'

import { getRuntimeEnv } from '@/lib/utils/env'

const requiredEnv = z.object({
	DATABASE_URL: z.string().url(),
	BETTER_AUTH_URL: z.string().url(),
	BETTER_AUTH_SECRET: z.string(),
	BETA_PASSWORD: z.string(),
})

const deployedEnv = z.object({
	GOOGLE_CLIENT_ID: z.string(),
	GOOGLE_CLIENT_SECRET: z.string(),
	AVATAR_BUCKET: z.string(),
	AWS_REGION: z.string(),
	AWS_ENDPOINT_URL: z.string().url(),
	AWS_ACCESS_KEY_ID: z.string(),
	AWS_SECRET_ACCESS_KEY: z.string(),
	RESEND_API_KEY: z.string(),
	FROM_EMAIL: z.string().email(),
})

const optionalEnv = z.object({
	AI_BASE_URL: z.string().url().optional(),
	AI_MODEL: z.string().optional(),
	AI_API_KEY: z.string().optional(),
})

const serverShape = {
	APP_ENV: z.enum(['development', 'test', 'staging', 'production']),
	RAILWAY_ENVIRONMENT_NAME: z.string().optional(),
	...requiredEnv.shape,
	...deployedEnv.partial().shape,
	...optionalEnv.shape,
}

const baseEnv = z.object(serverShape)
const developmentEnv = baseEnv.extend({
	APP_ENV: z.literal('development'),
})
const testEnv = baseEnv.extend({
	APP_ENV: z.literal('test'),
})
const stagingEnv = baseEnv.extend({
	APP_ENV: z.literal('staging'),
	...deployedEnv.shape,
})
const productionEnv = baseEnv.extend({
	APP_ENV: z.literal('production'),
	...deployedEnv.shape,
})

type FinalEnv =
	| ((z.output<typeof developmentEnv> | z.output<typeof testEnv>) & {
			IS_DEVELOPMENT: true
	  })
	| ((z.output<typeof stagingEnv> | z.output<typeof productionEnv>) & {
			IS_DEVELOPMENT: false
	  })

const finalEnvSchema = z
	.discriminatedUnion('APP_ENV', [
		developmentEnv,
		testEnv,
		stagingEnv,
		productionEnv,
	])
	.transform<FinalEnv>((env) =>
		env.APP_ENV === 'development' || env.APP_ENV === 'test'
			? { ...env, IS_DEVELOPMENT: true as const }
			: { ...env, IS_DEVELOPMENT: false as const },
	)

export const serverEnv: z.output<typeof finalEnvSchema> = createEnv({
	server: serverShape,
	runtimeEnv: getRuntimeEnv(),
	emptyStringAsUndefined: true,
	createFinalSchema: () => finalEnvSchema,
})
