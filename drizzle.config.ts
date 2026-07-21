import { defineConfig } from 'drizzle-kit'
import { ENV } from 'varlock/env'

export default defineConfig({
	schema: ['./src/db/tables.ts', './src/lib/profile/db.ts'],
	out: './src/db/migrations',
	dialect: 'postgresql',
	casing: 'snake_case',
	dbCredentials: {
		url: ENV.DATABASE_URL,
	},
})
