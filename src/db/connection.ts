import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'

import { serverEnv as env } from '@/env.server'

// Railway injects DATABASE_URL at runtime, so the schema can't require it at
// build; assert at prod boot. PROD is false under vitest (testcontainers).
if (import.meta.env.PROD && !env.DATABASE_URL) {
	throw new Error('DATABASE_URL is required')
}

const pool = new Pool({ connectionString: env.DATABASE_URL })
export const db = drizzle({ client: pool })

export async function closeDb() {
	await pool.end()
}
