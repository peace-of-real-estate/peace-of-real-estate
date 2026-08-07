import posthog from 'posthog-js'

posthog.init(import.meta.env.VITE_PUBLIC_POSTHOG_KEY, {
	api_host: '/api/ingest',
	ui_host: 'https://us.posthog.com',
	defaults: '2025-11-30',
	person_profiles: 'always',
	capture_exceptions: true,
})

export function PostHogInit() {
	return null
}
