import { defineConfig } from 'drizzle-kit'
import { serverEnv as env } from './src/env.server'

const databaseUrl = env.DATABASE_URL

if (!databaseUrl) {
	throw Error('Missing DATABASE_URL')
}

export default defineConfig({
	schema: './src/db/tables.ts',
	out: './src/db/migrations',
	dialect: 'postgresql',
	casing: 'snake_case',
	dbCredentials: {
		url: databaseUrl,
	},
})
