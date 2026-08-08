import pg from 'pg'

const email = process.argv[2]
if (!email) {
	console.error('Usage: node scripts/reset-introductions.mjs <email>')
	process.exit(1)
}

const url = process.env.DATABASE_URL
if (!url) {
	console.error(
		'DATABASE_URL is not set. Run via `mise run reset-introductions <email>` so .env.development.local is loaded.',
	)
	process.exit(1)
}

const pool = new pg.Pool({ connectionString: url })
const client = await pool.connect()

async function run() {
	await client.query('begin')

	const userResult = await client.query(
		'select id, name from "user" where email = $1',
		[email],
	)
	if (userResult.rowCount === 0) {
		throw new Error(`No user found with email ${email}`)
	}
	const userId = userResult.rows[0].id

	const profileResult = await client.query(
		`select id, role::text as role from client_profiles where user_id = $1
		 union all
		 select id, 'agent' as role from agent_profiles where user_id = $1`,
		[userId],
	)
	const clientProfileIds = profileResult.rows
		.filter((row) => row.role !== 'agent')
		.map((row) => row.id)
	const agentProfileIds = profileResult.rows
		.filter((row) => row.role === 'agent')
		.map((row) => row.id)

	const deleteResult = await client.query(
		`delete from introductions
		 where client_profile_id = any($1::text[])
		    or agent_profile_id = any($2::text[])`,
		[clientProfileIds, agentProfileIds],
	)

	const windowResult = await client.query(
		`select count(*)::int as count from intro_access_windows
		 where client_profile_id = any($1::text[]) and ends_at > now()`,
		[clientProfileIds],
	)

	await client.query('commit')

	console.log(`User: ${userResult.rows[0].name} <${email}>`)
	console.log(
		`Profiles: ${clientProfileIds.length} client, ${agentProfileIds.length} agent`,
	)
	console.log(
		`Deleted ${deleteResult.rowCount} introductions (notification jobs cascade).`,
	)
	if (windowResult.rows[0].count > 0) {
		console.log(
			`Note: ${windowResult.rows[0].count} paid access window(s) left active — contact unlock stays in effect.`,
		)
	}
}

try {
	await run()
} catch (error) {
	await client.query('rollback').catch(() => {})
	console.error(error instanceof Error ? error.message : error)
	process.exitCode = 1
} finally {
	client.release()
	await pool.end()
}
