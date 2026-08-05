import * as Sentry from '@sentry/tanstackstart-react'

Sentry.init({
	dsn: import.meta.env.VITE_PUBLIC_SENTRY_DSN,
	integrations: [Sentry.replayIntegration()],
	tracesSampleRate: 1.0,
	replaysSessionSampleRate: 0.1,
	replaysOnErrorSampleRate: 1.0,
	enableLogs: true,
})
