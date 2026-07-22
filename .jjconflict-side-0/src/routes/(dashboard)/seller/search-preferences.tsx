import { createFileRoute } from '@tanstack/react-router'

import { Wip } from '@/components/wip'

export const Route = createFileRoute('/(dashboard)/seller/search-preferences')({
	component: SearchPreferences,
})

function SearchPreferences() {
	return <Wip title="Search Preferences" />
}
