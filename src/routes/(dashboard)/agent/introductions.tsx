import { createFileRoute, redirect } from '@tanstack/react-router'

import { agent } from '@/lib/profile/server'
import { AgentIntroductions } from '@/routes/(dashboard)/-components/agent-introductions'

export const Route = createFileRoute('/(dashboard)/agent/introductions')({
	beforeLoad: async () => {
		const agentProfile = await agent.loadProfile()

		if (!agentProfile) {
			throw redirect({ to: '/signup/agent/identity' })
		}
	},
	component: AgentIntroductionsRoute,
})

function AgentIntroductionsRoute() {
	return <AgentIntroductions />
}
