import { dirname, resolve } from 'node:path'

import type { TestProject } from 'vitest/node'

import { REQUIRED_EXTENSIONS } from '@/db/extensions'

declare module 'vitest' {
	interface ProvidedContext {
		dbUri: string
	}
}

export default async function setup(project: TestProject) {
	const { PostgreSqlContainer } = await import('@testcontainers/postgresql')
	const { Wait } = await import('testcontainers')
	const { drizzle } = await import('drizzle-orm/node-postgres')
	const { migrate } = await import('drizzle-orm/node-postgres/migrator')
	const { Pool } = await import('pg')

	const container = await new PostgreSqlContainer(
		process.env.TEST_DB_IMAGE ?? 'postgres:17',
	)
		.withWaitStrategy(Wait.forHealthCheck())
		.start()

	try {
		const client = new Pool({ connectionString: container.getConnectionUri() })
		try {
			const db = drizzle({ client })
			const schemaPath = resolve(process.cwd(), 'src/db/tables.ts')
			for (const ext of REQUIRED_EXTENSIONS) {
				await db.execute(`CREATE EXTENSION IF NOT EXISTS "${ext}"`)
			}
			await migrate(db, {
				migrationsFolder: resolve(dirname(schemaPath), 'migrations'),
			})
		} finally {
			await client.end()
		}
	} catch (error) {
		await container.stop()
		throw error
	}

	project.provide('dbUri', container.getConnectionUri())

	return async () => {
		await container.stop()
	}
}
