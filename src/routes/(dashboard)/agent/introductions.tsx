import { createFileRoute, redirect } from '@tanstack/react-router'

import { loadAgentProfile } from '@/lib/profile'
import { AgentIntroductions } from '@/routes/(dashboard)/-components/agent-introductions'

export const Route = createFileRoute('/(dashboard)/agent/introductions')({
	beforeLoad: async () => {
		const agentProfile = await loadAgentProfile()

		if (!agentProfile) {
			throw redirect({ to: '/signup/agent/identity' })
		}
	},
	component: AgentIntroductionsRoute,
})

function AgentIntroductionsRoute() {
	return <AgentIntroductions />
}
