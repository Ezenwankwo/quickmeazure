# State Management Architecture

## Overview

QuickMeazure uses a hybrid state management approach centered around Pinia stores. This document outlines the architecture, patterns, and best practices for state management in the application.

## Core Principles

1. **Single Source of Truth**: Global state is managed through Pinia stores
2. **Type Safety**: All stores and state interfaces are strongly typed with TypeScript
3. **Persistence**: Critical state is persisted across sessions using standardized localStorage utilities
4. **Modularity**: State is divided into logical domains (auth, subscription, ui, etc.)
5. **Reactivity**: State changes trigger reactive updates in components

## Store Structure

### Store Modules

The application's state is divided into the following store modules:

| Store          | Purpose                            | Persistence  |
| -------------- | ---------------------------------- | ------------ |
| `auth`         | Authentication state, user session | Yes          |
| `subscription` | Subscription plans and status      | Yes (cached) |
| `ui`           | UI state, theme preferences        | Yes          |
| `clients`      | Client data and management         | No           |
| `measurements` | Measurement data and calculations  | No           |

### Directory Structure

```
store/
├── index.ts                # Main store export
├── types.ts                # Shared TypeScript interfaces
├── modules/
│   ├── auth.ts             # Authentication store
│   ├── subscription.ts     # Subscription management
│   ├── ui.ts               # UI state management
│   ├── clients.ts          # Client data management
│   └── measurements.ts     # Measurement data management
└── composables/            # Custom store composables
```

## Authentication Store

The auth store (`useAuthStore`) manages user authentication state, including:

- User session token
- User profile information
- Login/logout functionality
- Session refresh logic
- Persistence of auth state

### Key Features

- Automatic token refresh mechanism
- Secure storage of authentication tokens
- Type-safe user profile interface
- Integration with the API for auth operations

### Example Usage

```typescript
import { useAuthStore } from '~/store/modules/auth'

// In a component
const authStore = useAuthStore()

// Check if user is logged in
if (authStore.isLoggedIn) {
  // Access user information
  console.log(authStore.user.name)

  // Perform authenticated actions
  await authStore.refreshSession()
}

// Log out the user
await authStore.logout()
```

## Subscription Store

The subscription store (`useSubscriptionStore`) manages subscription-related state, including:

- Available subscription plans
- Current subscription status
- Subscription management operations
- Caching of subscription data

### Key Features

- Caching of subscription plans for performance
- Real-time subscription status updates
- Integration with payment providers
- Type-safe subscription interfaces

### Example Usage

```typescript
import { useSubscriptionStore } from '~/store/modules/subscription'

// In a component
const subscriptionStore = useSubscriptionStore()

// Fetch subscription plans (with caching)
await subscriptionStore.fetchPlans()

// Access subscription data
const plans = subscriptionStore.plans
const currentPlan = subscriptionStore.currentPlan

// Manage subscription
await subscriptionStore.updateSubscription(planId)
```

## Persistence Layer

### Storage Utilities

The application uses standardized storage utilities (`utils/storage.ts`) for consistent localStorage operations:

- `getFromStorage<T>(key: string): T | null`
- `setToStorage<T>(key: string, value: T): boolean`
- `removeFromStorage(key: string): boolean`
- `clearStorage(): boolean`

### Storage Keys

Storage keys are centralized in a `STORAGE_KEYS` constant to prevent duplication and typos:

```typescript
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'auth-token',
  USER_DATA: 'user-data',
  SESSION_EXPIRY: 'session-expiry',
  SUBSCRIPTION_PLANS: 'subscription-plans',
  SUBSCRIPTION_STATUS: 'subscription-status',
  USER_PREFERENCES: 'user-preferences',
  MEASUREMENT_SETTINGS: 'measurement-settings',
  RECENT_CLIENTS: 'recent-clients',
}
```

## Best Practices

### Component Integration

1. **Import stores at the component level**:

   ```typescript
   const authStore = useAuthStore()
   ```

2. **Use computed properties for reactive state**:

   ```typescript
   const isAuthenticated = computed(() => authStore.isLoggedIn)
   ```

3. **Dispatch actions for state changes**:
   ```typescript
   await authStore.login(credentials)
   ```

### Error Handling

1. **Centralized error handling in stores**:

   ```typescript
   try {
     // API call
   } catch (error) {
     // Handle and transform error
     this.error = formatError(error)
     throw error
   }
   ```

2. **Graceful degradation with cached data**:
   ```typescript
   // Try to get fresh data, fall back to cached if needed
   const data = await this.fetchFreshData().catch(() => this.cachedData)
   ```

### Performance Considerations

1. **Selective state persistence**: Only persist essential state
2. **Caching strategies**: Cache expensive API responses
3. **Lazy loading**: Load data only when needed
4. **Debouncing/throttling**: Limit frequent state updates

## Migration from Composables

The application is transitioning from Vue composables to Pinia stores for state management. See the [Composable to Store Migration Guide](./composable-to-store-migration.md) for details on this process.

## Testing Stores

### Unit Testing

```typescript
// Example test for auth store
describe('Auth Store', () => {
  let store: ReturnType<typeof useAuthStore>

  beforeEach(() => {
    setActivePinia(createPinia())
    store = useAuthStore()
  })

  it('should update isLoggedIn when token is set', () => {
    store.token = 'test-token'
    store.sessionExpiry = Date.now() + 3600000

    expect(store.isLoggedIn).toBe(true)
  })
})
```

### Mocking in Component Tests

```typescript
// Mock the auth store for component testing
vi.mock('~/store/modules/auth', () => ({
  useAuthStore: () => ({
    isLoggedIn: true,
    user: { id: '1', name: 'Test User' },
    token: 'test-token',
    login: vi.fn().mockResolvedValue(true),
    logout: vi.fn().mockResolvedValue(true),
  }),
}))
```

## Future Enhancements

1. **State hydration improvements** for SSR
2. **Real-time state synchronization** across tabs/windows
3. **Optimistic updates** for improved UX
4. **State machine patterns** for complex state transitions
5. **Middleware layer** for cross-cutting concerns
