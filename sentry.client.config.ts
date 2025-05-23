import * as Sentry from '@sentry/nuxt'

// Only initialize Sentry in production mode
if (process.env.NODE_ENV === 'production') {
  Sentry.init({
    // Use the Nuxt runtime config to access the DSN
    dsn: process.env.SENTRY_DSN || 'https://examplePublicKey@o0.ingest.sentry.io/0',

    // Set tracesSampleRate to 1.0 to capture 100% of transactions for performance monitoring
    tracesSampleRate: 1.0,

    // Capture Replay for 10% of all sessions, plus 100% of sessions with an error
    integrations: [Sentry.replayIntegration()],
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,

    // Enable sending of default PII (personally identifiable information)
    sendDefaultPii: true,

    // Set environment explicitly to production
    environment: 'production',
  })
} else {
  // In development mode, use a no-op implementation
  console.log('Sentry disabled in development mode')
}
