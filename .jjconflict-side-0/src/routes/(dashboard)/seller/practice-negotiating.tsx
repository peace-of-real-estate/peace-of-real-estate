import { createFileRoute } from '@tanstack/react-router'

import { Wip } from '@/components/wip'

export const Route = createFileRoute(
	'/(dashboard)/seller/practice-negotiating',
)({
	component: PracticeNegotiating,
})

function PracticeNegotiating() {
	return <Wip title="Practice Negotiating" />
}
