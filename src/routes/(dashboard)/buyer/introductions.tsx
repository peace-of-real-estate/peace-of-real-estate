import { createFileRoute } from '@tanstack/react-router'

import { ClientIntroductionsRoute } from '@/routes/(dashboard)/-components/client-introductions'
import {
	clientIntroductionsSearchSchema,
	requireClientIntroductionsProfile,
} from '@/routes/(dashboard)/-components/client-introductions-route'

export const Route = createFileRoute('/(dashboard)/buyer/introductions')({
	validateSearch: clientIntroductionsSearchSchema,
	beforeLoad: () => requireClientIntroductionsProfile('buyer'),
	component: IntroductionsRoute,
})

function IntroductionsRoute() {
	const { unlock } = Route.useSearch()
	return <ClientIntroductionsRoute clientRole="buyer" unlock={unlock} />
}
