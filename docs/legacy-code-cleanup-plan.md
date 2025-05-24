# Legacy Code Cleanup Plan

## Overview

This document outlines a comprehensive plan for cleaning up legacy code in the QuickMeazure application. The primary goals are:

1. Replace deprecated composables with Pinia stores
2. Standardize localStorage usage
3. Update component references
4. Remove unused code

## Progress Summary

### Completed

- Created standardized storage utilities in `utils/storage.ts`
- Updated auth store to use standardized storage utilities
- Updated subscription store to use standardized storage utilities and implement caching
- Migrated the following components to use Pinia stores:
  - Dashboard layout
  - Styles page
  - Default layout
  - Auth middleware

### In Progress

- Continuing to replace deprecated composables in remaining components
- Standardizing error handling across the application
- Improving type safety with TypeScript interfaces

## Next Steps

### Short Term (1-2 weeks)

1. **Complete Component Migration**

   - Identify and update remaining components using deprecated composables
   - Focus on high-traffic pages and critical functionality first
   - Update unit tests to reflect the new store-based architecture

2. **Standardize API Calls**

   - Create a centralized API utility for making authenticated requests
   - Replace direct fetch/axios calls with the standardized utility
   - Implement consistent error handling for API responses

3. **Improve Error Handling**
   - Standardize error messages and toast notifications
   - Implement proper error boundaries for critical components
   - Add error logging for better debugging

### Medium Term (2-4 weeks)

1. **Code Quality Improvements**

   - Resolve remaining lint warnings
   - Add comprehensive TypeScript interfaces for all data structures
   - Improve code documentation with JSDoc comments

2. **Performance Optimization**

   - Implement proper caching strategies for API responses
   - Optimize component rendering with memoization
   - Reduce bundle size through code splitting

3. **Testing Enhancements**
   - Increase unit test coverage for stores and utilities
   - Add integration tests for critical user flows
   - Implement E2E tests for core functionality

## 1. Replace Deprecated Composables with Pinia Stores

### Auth System Migration

| Deprecated       | Replacement    | Files to Update                                           |
| ---------------- | -------------- | --------------------------------------------------------- |
| `useSessionAuth` | `useAuthStore` | Multiple files across pages, components, layouts, plugins |

#### Migration Steps:

1. **Import Changes**:

   ```diff
   - import { useSessionAuth } from '~/composables/useSessionAuth'
   + import { useAuthStore } from '~/store/modules/auth'
   ```

2. **Instance Creation**:

   ```diff
   - const auth = useSessionAuth()
   + const authStore = useAuthStore()
   ```

3. **Property Access**:

   ```diff
   - auth.isLoggedIn
   + authStore.isLoggedIn

   - auth.token
   + authStore.token

   - auth.user
   + authStore.user
   ```

4. **Method Calls**:

   ```diff
   - auth.logout()
   + authStore.logout()

   - auth.refreshSession()
   + authStore.refreshSession()
   ```

### Subscription System Migration

| Deprecated                  | Replacement            | Files to Update                |
| --------------------------- | ---------------------- | ------------------------------ |
| `useSubscription`           | `useSubscriptionStore` | Billing components, auth pages |
| `useSubscriptionManagement` | `useSubscriptionStore` | PaystackButton, auth pages     |

#### Migration Steps:

1. **Import Changes**:

   ```diff
   - import { useSubscription } from '~/composables/useSubscription'
   - import { useSubscriptionManagement } from '~/composables/useSubscriptionManagement'
   + import { useSubscriptionStore } from '~/store/modules/subscription'
   ```

2. **Instance Creation**:

   ```diff
   - const subscription = useSubscription()
   - const subscriptionManagement = useSubscriptionManagement()
   + const subscriptionStore = useSubscriptionStore()
   ```

3. **Property Access**:

   ```diff
   - subscription.subscriptionPlans
   + subscriptionStore.plans

   - subscription.currentPlan
   + subscriptionStore.currentPlan

   - subscription.isLoading
   + subscriptionStore.loading
   ```

4. **Method Calls**:

   ```diff
   - subscriptionManagement.loadSubscription()
   + subscriptionStore.fetchSubscriptionStatus()

   - subscriptionManagement.createSubscription(planId)
   + subscriptionStore.subscribeToPlan(planId)

   - subscriptionManagement.cancelSubscription()
   + subscriptionStore.cancelSubscription()
   ```

## 2. Standardize localStorage Usage

### Current Issues:

- Inconsistent error handling
- Duplicate code for serialization/deserialization
- Direct localStorage access scattered throughout the codebase

### Standardization Steps:

1. **Centralize localStorage Operations**:

   - Move all localStorage operations to the respective stores
   - Create helper functions for common operations

2. **Implement Consistent Error Handling**:

   ```javascript
   function getFromStorage(key) {
     try {
       const value = localStorage.getItem(key)
       return value ? JSON.parse(value) : null
     } catch (error) {
       console.error(`Error retrieving ${key} from localStorage:`, error)
       return null
     }
   }

   function setToStorage(key, value) {
     try {
       localStorage.setItem(key, JSON.stringify(value))
       return true
     } catch (error) {
       console.error(`Error storing ${key} in localStorage:`, error)
       return false
     }
   }
   ```

3. **Use Consistent Key Names**:
   - `auth` for authentication data
   - `subscription` for subscription data
   - `user-preferences` for user preferences

## 3. Update Component References

### Component Naming Conventions:

- Use PascalCase for component names
- Use kebab-case for file names
- Ensure file names match component imports

### Import Path Standardization:

- Use `~/` prefix for imports from the project root
- Use relative paths for imports within the same directory
- Group imports by type (Vue, third-party, local)

### Remove Unused Imports and Variables:

- Identify and remove unused imports
- Identify and remove unused variables
- Use ESLint to help identify unused code

## 4. Implementation Priority

1. **High Priority**:

   - Auth store migration (critical for application functionality)
   - Subscription store migration (needed for billing features)

2. **Medium Priority**:

   - localStorage standardization
   - Component reference updates in main pages

3. **Low Priority**:
   - Lint warning fixes
   - Code style improvements

## 5. Testing Strategy

After each migration step, test the following:

1. **Authentication Flow**:

   - Login/logout functionality
   - Token refresh
   - Protected route access

2. **Subscription Management**:

   - Viewing subscription plans
   - Subscribing to a plan
   - Canceling a subscription

3. **State Persistence**:
   - State persistence after page refresh
   - State consistency across tabs

## 6. Rollback Plan

In case of issues:

1. Keep backup copies of modified files
2. Document each change made
3. Test thoroughly after each significant change
4. Be prepared to revert to the previous implementation if needed
