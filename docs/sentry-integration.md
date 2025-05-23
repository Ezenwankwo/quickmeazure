# Sentry Integration

This document describes how Sentry error tracking is integrated into the QuickMeazure application.

## Overview

Sentry is used for error tracking and performance monitoring in both client-side and server-side code. It helps identify and fix issues in production by providing detailed error reports and context.

## Configuration

### Environment Variables

The following environment variables need to be set in your `.env` file:

```
SENTRY_DSN=https://your-public-key@o0.ingest.sentry.io/your-project-id
SENTRY_ORG=your-organization-slug
SENTRY_PROJECT=your-project-slug
```

### Files

The Sentry integration consists of the following files:

1. `sentry.client.config.ts` - Client-side Sentry configuration
2. `sentry.server.config.ts` - Server-side Sentry configuration
3. `nuxt.config.ts` - Includes Sentry module configuration

## Usage

### Capturing Errors

Sentry automatically captures unhandled exceptions, but you can also manually capture errors:

```javascript
import { captureException, captureMessage } from '@sentry/nuxt'

try {
  // Your code that might throw an error
} catch (error) {
  captureException(error)
}

// Or capture a message
captureMessage('Something went wrong')
```

### Adding Context

You can add additional context to your errors:

```javascript
import { setUser, setTag, setExtra } from '@sentry/nuxt'

// Set user information
setUser({
  id: 'user-123',
  email: 'user@example.com',
})

// Add tags for filtering in the Sentry dashboard
setTag('subscription_tier', 'premium')

// Add extra data
setExtra('cart_items', ['item1', 'item2'])
```

### Performance Monitoring

Sentry also provides performance monitoring capabilities:

```javascript
import { startTransaction } from '@sentry/nuxt'

const transaction = startTransaction({
  name: 'Process Order',
  op: 'order.process',
})

// Your code here

transaction.finish()
```

## Testing

A `SentryErrorButton` component is available to test error reporting. You can place it in any page to test. Click the button to trigger a test error that will be sent to Sentry.

## Source Maps

Source maps are configured to be uploaded to Sentry during the build process, which helps with debugging by showing the original source code in error reports instead of minified code.

## Resources

- [Sentry Documentation](https://docs.sentry.io/platforms/javascript/guides/nuxt/)
- [Sentry Nuxt Module](https://nuxt.com/modules/sentry)
