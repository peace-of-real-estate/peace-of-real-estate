import { serverEnv as env } from '../src/env.server'
import { seedAgents } from './seeds/agents'

// =============================================================================
// Config
// =============================================================================

const AGENT_COUNT = 1000

// =============================================================================
// Entry point
// =============================================================================

async function main() {
	try {
		if (env.APP_ENV === 'production') {
			console.error('Refusing to run seed in production.')
			process.exit(1)
		}

		await seedAgents(AGENT_COUNT)
	} catch (error) {
		console.error('Seed failed:', error)
		process.exit(1)
	}
}

void main()
