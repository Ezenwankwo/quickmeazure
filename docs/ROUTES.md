# Route Management System

This document outlines the centralized route management system used in the QuickMeazure application.

## Overview

The route management system provides a single source of truth for all application routes, ensuring type safety and maintainability. It consists of:

1. **Route Constants**: Centralized definitions for all route names and paths
2. **Type Safety**: Full TypeScript support for route parameters and navigation
3. **Helper Functions**: Utilities for type-safe navigation

## File Structure

- `constants/routes.ts`: Core route definitions and types
- `composables/useRoutes.ts`: Composable for using routes in components

## Usage

### Importing the Routes

```typescript
import { useAppRoutes } from '~/composables/useRoutes'

// In your component setup
const routes = useAppRoutes()
```

### Using in Templates

```vue
<template>
  <!-- Using route paths -->
  <NuxtLink :to="routes.ROUTE_PATHS[routes.ROUTE_NAMES.AUTH.LOGIN]"> Login </NuxtLink>

  <!-- With parameters -->
  <NuxtLink :to="routes.ROUTE_PATHS[routes.ROUTE_NAMES.USER.PROFILE]({ id: '123' })">
    Profile
  </NuxtLink>
</template>
```

### Programmatic Navigation

```typescript
// Basic navigation
routes.navigate({
  name: routes.ROUTE_NAMES.DASHBOARD.INDEX,
})

// With query parameters
routes.navigate({
  name: routes.ROUTE_NAMES.SEARCH,
  query: { q: 'search term' },
})

// With route parameters
routes.navigate({
  name: routes.ROUTE_NAMES.USER.PROFILE,
  params: { id: '123' },
})
```

### Getting Route Paths

```typescript
// Get path for a route
const loginPath = routes.getPath(routes.ROUTE_NAMES.AUTH.LOGIN)

// Get path with parameters
const profilePath = routes.getPath(routes.ROUTE_NAMES.USER.PROFILE, { id: '123' })
```

## Adding New Routes

1. Add the route name to `ROUTE_NAMES` in `constants/routes.ts`
2. Add the corresponding path to `ROUTE_PATHS`
3. If the route has parameters, add the parameter types to the `RouteParams` type

## Best Practices

1. Always use the route names and paths from the constants
2. Use the `navigate` method for programmatic navigation
3. Add new route parameters to the `RouteParams` type for type safety
4. Keep route names consistent with their paths
5. Group related routes together in the `ROUTE_NAMES` object

## Type Safety

The route system provides full TypeScript support, including:

- Type checking for route names
- Type checking for route parameters
- Autocompletion for route names and parameters
- Compile-time error for invalid routes or parameters
