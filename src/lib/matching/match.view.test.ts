import { makeAgent } from '@tests/support/fixtures/data/agent-profile'
import { expect, test } from 'vite-plus/test'

import { toAgentMatchData } from '@/lib/matching/match.view'
import { calculateFitScore } from '@/lib/matching/scoring'

test('public match data excludes contact and scoring debug internals', () => {
	const agent = makeAgent()
	const result = toAgentMatchData({
		agent,
		user: { name: 'Agent Example', email: 'private@example.com' },
		score: calculateFitScore(agent, undefined, 'buying'),
		avatar: undefined,
	})
	const serialized = JSON.stringify(result)

	expect(result).not.toHaveProperty('contact')
	expect(result).not.toHaveProperty('debug')
	expect(serialized).not.toContain('private@example.com')
	expect(serialized).not.toContain('agentProfile')
	expect(serialized).not.toContain('weight')
	expect(serialized).not.toContain('boosted')
})
