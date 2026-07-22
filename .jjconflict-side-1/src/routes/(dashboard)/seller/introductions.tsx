import { createFileRoute } from '@tanstack/react-router'

import { Wip } from '@/components/wip'

export const Route = createFileRoute('/(dashboard)/seller/introductions')({
	component: Introductions,
})

function Introductions() {
	return <Wip title="Introductions" />
}
