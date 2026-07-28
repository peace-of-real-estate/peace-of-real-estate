import 'varlock/auto-load'
import { defineConfig } from 'drizzle-kit'

export default defineConfig({
	schema: ['./src/db/tables.ts', './src/lib/profile/db.ts'],
	out: './src/db/migrations',
	dialect: 'postgresql',
	dbCredentials: {
		url: process.env.DATABASE_URL!,
	},
})
