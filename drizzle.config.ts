import { defineConfig } from 'drizzle-kit'
import { loadEnvFiles } from './src/lib/utils/env'

const databaseUrl = process.env.DATABASE_URL ?? loadEnvFiles().DATABASE_URL

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
