import * as Sentry from '@sentry/tanstackstart-react'

const dsn: string | undefined = import.meta.env.VITE_PUBLIC_SENTRY_DSN

// DSN is only configured outside development; without it, init would report
// to nothing and the replay bundle fetch fails noisily on every HMR reload.
if (dsn) {
	Sentry.init({
		dsn,
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
}
