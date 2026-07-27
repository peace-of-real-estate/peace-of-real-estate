import { existsSync } from 'node:fs'
import { dirname, resolve } from 'node:path'

import type { NodePgDatabase } from 'drizzle-orm/node-postgres'
import type { Pool } from 'pg'

import type * as schema from '@/db/tables'

import { test as baseTest } from './server'

const DEFAULT_SCHEMA_PATH = 'src/db/tables.ts'
const DEFAULT_IMAGE = 'postgres:17'
const DEFAULT_EXTENSIONS = ['pg_trgm']
const ROOT_MARKERS = [
	'vite.config.ts',
	'vite.config.mts',
	'vite.config.js',
	'vite.config.mjs',
	'vitest.config.ts',
	'vitest.config.mts',
	'vitest.config.js',
	'vitest.config.mjs',
]

export interface DbConfig {
	root?: string
	schemaPath?: string
	postgresImage?: string
}

export type Database = NodePgDatabase<typeof schema> & {
	$client: Pool
}

export interface DbFixture {
	db: Database
	seedFunction: (db: Database) => Promise<void> | void
}

let dbConfig: DbConfig = {}
let seedFunction: (db: Database) => Promise<void> | void = async () => {}

function findProjectRoot(start = process.cwd()) {
	let directory = start

	while (true) {
		if (ROOT_MARKERS.some((marker) => existsSync(resolve(directory, marker)))) {
			return directory
		}

		const parent = dirname(directory)
		if (parent === directory) return start
		directory = parent
	}
}

export const test = baseTest.extend<DbFixture>({
	seedFunction: [
		async ({}, use) => {
			await use(seedFunction)
		},
		{ scope: 'file' },
	],
	db: [
		async ({ seedFunction }, use) => {
			const { PostgreSqlContainer } = await import('@testcontainers/postgresql')
			const { drizzle } = await import('drizzle-orm/node-postgres')
			const { Wait } = await import('testcontainers')
			const { Pool } = await import('pg')
			const root = dbConfig.root ?? findProjectRoot()
			const schemaPath = resolve(
				root,
				dbConfig.schemaPath ?? DEFAULT_SCHEMA_PATH,
			)
			const container = await new PostgreSqlContainer(
				dbConfig.postgresImage ?? DEFAULT_IMAGE,
			)
				.withWaitStrategy(Wait.forHealthCheck())
				.start()
			const client = new Pool({
				connectionString: container.getConnectionUri(),
			})
			const schema = await import('@/db/tables')
			const db = Object.assign(
				drizzle({ client, casing: 'snake_case', schema }),
				{
					$client: client,
				},
			)

			try {
				await seedDatabase(db, { schemaPath, seedFunction })
				await use(db)
			} finally {
				await db.$client.end()
				await container.stop()
			}
		},
		{ scope: 'file' },
	],
})

export { afterEach, beforeEach, describe, expect, vi } from 'vite-plus/test'

export function initDb(
	seed: (db: Database) => Promise<void> | void,
	config: DbConfig = {},
) {
	dbConfig = config
	seedFunction = seed
}

export interface SeedDatabaseOptions {
	schemaPath: string
	seedFunction?: (db: Database) => Promise<void> | void
	extensions?: string[]
}

export async function seedDatabase(
	db: Database,
	{
		schemaPath,
		seedFunction,
		extensions = DEFAULT_EXTENSIONS,
	}: SeedDatabaseOptions,
) {
	const { migrate } = await import('drizzle-orm/node-postgres/migrator')
	const { reset } = await import('drizzle-seed')
	const schema = await import(/* @vite-ignore */ schemaPath)

	for (const ext of extensions) {
		await db.execute(`CREATE EXTENSION IF NOT EXISTS "${ext}"`)
	}
	await migrate(db, {
		migrationsFolder: resolve(dirname(schemaPath), 'migrations'),
	})
	await reset(db, schema)
	if (seedFunction) await seedFunction(db)
}
