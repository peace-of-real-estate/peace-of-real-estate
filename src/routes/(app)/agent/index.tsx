import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/(app)/agent/')({
	beforeLoad: () => {
		throw redirect({ to: '/agent/signup', search: { step: 'intro' } })
	},
})
