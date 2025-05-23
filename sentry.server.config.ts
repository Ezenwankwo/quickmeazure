import * as Sentry from "@sentry/nuxt";

Sentry.init({
  // Use environment variable for the DSN
  dsn: process.env.SENTRY_DSN || "https://examplePublicKey@o0.ingest.sentry.io/0",
  
  // Set tracesSampleRate to 1.0 to capture 100% of transactions for performance monitoring
  // We recommend adjusting this value in production
  tracesSampleRate: 1.0,
  
  // We recommend adjusting this value in production
  environment: process.env.NODE_ENV || 'development',
});