import * as Sentry from '@sentry/tanstackstart-react'

Sentry.init({
	dsn: import.meta.env.VITE_PUBLIC_SENTRY_DSN,
	tracesSampleRate: 1.0,
	replaysSessionSampleRate: 0.1,
	replaysOnErrorSampleRate: 1.0,
	enableLogs: true,
})

void Sentry.lazyLoadIntegration('replayIntegration')
	.then((replayIntegration) => Sentry.addIntegration(replayIntegration()))
	.catch((error: unknown) => {
		console.warn('Failed to load Sentry replay integration', error)
	})
