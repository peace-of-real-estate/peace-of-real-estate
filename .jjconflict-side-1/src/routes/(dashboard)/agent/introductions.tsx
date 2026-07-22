import { createFileRoute } from '@tanstack/react-router'

import { Wip } from '@/components/wip'

export const Route = createFileRoute('/(dashboard)/agent/introductions')({
	component: AgentIntroductions,
})

function AgentIntroductions() {
	return <Wip title="Introductions" />
}
