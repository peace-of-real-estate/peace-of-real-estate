import { createFileRoute } from '@tanstack/react-router'

import {
	clientIntroductionsSearchSchema,
	ClientIntroductionsRoute,
	requireClientIntroductionsProfile,
} from '@/routes/(dashboard)/-components/client-introductions-route'

export const Route = createFileRoute('/(dashboard)/seller/introductions')({
	validateSearch: clientIntroductionsSearchSchema,
	beforeLoad: () => requireClientIntroductionsProfile('seller'),
	component: IntroductionsRoute,
})

function IntroductionsRoute() {
	const { unlock } = Route.useSearch()
	return <ClientIntroductionsRoute clientRole="seller" unlock={unlock} />
}
