import * as Sentry from '@sentry/nuxt'

// Only initialize Sentry in production mode
if (process.env.NODE_ENV === 'production') {
  Sentry.init({
    // Use environment variable for the DSN
    dsn: process.env.SENTRY_DSN || 'https://examplePublicKey@o0.ingest.sentry.io/0',

    // Set tracesSampleRate to 1.0 to capture 100% of transactions for performance monitoring
    tracesSampleRate: 1.0,

    // Set the environment
    environment: 'production',
  })
} else {
  // In development mode, use a no-op implementation
  console.log('Sentry disabled in development mode')
}
