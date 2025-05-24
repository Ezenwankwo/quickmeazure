# Composable to Pinia Store Migration Guide

## Overview

This document outlines the process of migrating from Vue composables to Pinia stores in the QuickMeazure application. The goal is to standardize state management, improve code maintainability, and reduce duplication.

## Migration Progress

### Completed

- Created standardized storage utilities in `utils/storage.ts`
- Updated `auth.ts` store to use standardized storage utilities
- Updated `subscription.ts` store to use standardized storage utilities and implement caching
- Migrated dashboard layout to use `useAuthStore` instead of `useSessionAuth`
- Migrated styles page to use `useAuthStore` instead of `useSessionAuth`
- Migrated default layout to use `useAuthStore` instead of `useSessionAuth`
- Updated auth middleware to use `useAuthStore` instead of `useSessionAuth`

### In Progress

- Continuing to replace deprecated composables in remaining components
- Standardizing error handling across the application
- Improving type safety with TypeScript interfaces

## Deprecated Composables

The following composables are now deprecated and should be replaced with their Pinia store counterparts:

| Deprecated Composable       | Replacement Pinia Store | Description                           |
| --------------------------- | ----------------------- | ------------------------------------- |
| `useSessionAuth`            | `useAuthStore`          | Authentication and session management |
| `useSubscription`           | `useSubscriptionStore`  | Subscription plan management          |
| `useSubscriptionManagement` | `useSubscriptionStore`  | Subscription operations               |

## Migration Steps

### 1. Replace `useSessionAuth` with `useAuthStore`

```diff
- import { useSessionAuth } from '~/composables/useSessionAuth'
+ import { useAuthStore } from '~/store/modules/auth'

- const auth = useSessionAuth()
+ const authStore = useAuthStore()

// Replace properties and methods
- auth.isLoggedIn
+ authStore.isLoggedIn

- auth.user
+ authStore.user

- auth.token
+ authStore.token

- auth.logout()
+ authStore.logout()

- auth.refreshSession()
+ authStore.refreshSession()
```

### 2. Replace `useSubscription` and `useSubscriptionManagement` with `useSubscriptionStore`

```diff
- import { useSubscription } from '~/composables/useSubscription'
- import { useSubscriptionManagement } from '~/composables/useSubscriptionManagement'
+ import { useSubscriptionStore } from '~/store/modules/subscription'

- const subscription = useSubscription()
- const subscriptionManagement = useSubscriptionManagement()
+ const subscriptionStore = useSubscriptionStore()

// Replace properties and methods
- subscription.subscriptionPlans
+ subscriptionStore.plans

- subscription.currentPlan
+ subscriptionStore.currentPlan

- subscriptionManagement.createSubscription(planId)
+ subscriptionStore.subscribeToPlan(planId)

- subscriptionManagement.cancelSubscription()
+ subscriptionStore.cancelSubscription()
```

### 3. Replace `useSubscription` with `useSubscriptionStore` (localStorage Standardization)

```diff
- import { useSubscription } from '~/composables/useSubscription'
+ import { useSubscriptionStore } from '~/store/modules/subscription'

- const subscription = useSubscription()
+ const subscriptionStore = useSubscriptionStore()

// Replace properties and methods
- subscription.plans
+ subscriptionStore.plans

- subscription.status
+ subscriptionStore.status

- subscription.fetchPlans()
+ subscriptionStore.fetchPlans()

- subscription.fetchSubscriptionStatus()
+ subscriptionStore.fetchSubscriptionStatus()
```

## localStorage Standardization

All localStorage operations should be moved to the respective stores and follow these guidelines:

1. Use consistent key names (e.g., `auth`, `subscription`, etc.)
2. Implement proper error handling for all localStorage operations
3. Use a consistent pattern for data serialization/deserialization

## Component Reference Updates

When updating components:

1. Ensure consistent naming conventions
2. Fix import paths
3. Remove unused imports and variables
4. Update event handlers to use the new store methods

## Testing

After migration, test the following scenarios:

1. Authentication flow (login, logout, token refresh)
2. Subscription management (viewing plans, subscribing, canceling)
3. Navigation between protected routes
4. Persistence after page refresh
