import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'

import { serverEnv as env } from '@/env.server'

import * as schema from './tables'

const pool = new Pool({ connectionString: env.DATABASE_URL })
export const db = drizzle({ client: pool, casing: 'snake_case', schema })

export async function closeDb() {
	await pool.end()
}
