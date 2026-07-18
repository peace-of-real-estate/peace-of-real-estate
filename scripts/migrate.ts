import { migrate } from 'drizzle-orm/node-postgres/migrator'
import { db } from '../src/db/connection'

// Wraps drizzle-orm's migrator instead of `drizzle-kit migrate` because the
// CLI swallows the underlying Postgres error (just exits 1), which makes
// failures invisible in Railway deploy logs. This prints the full error.
async function main() {
	console.log('Running migrations...')
	try {
		await migrate(db, { migrationsFolder: 'src/db/migrations' })
		console.log('Migrations complete.')
		process.exit(0)
	} catch (error) {
		console.error('Migration failed:', error)
		process.exit(1)
	}
}

void main()
