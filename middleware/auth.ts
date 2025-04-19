import { useSessionAuth } from '~/composables/useSessionAuth';

export default defineNuxtRouteMiddleware((to) => {
  if (process.server) return; // Skip middleware on server-side

  console.log('Auth middleware running for route:', to.path);
  const auth = useSessionAuth();
  
  // Skip for public routes
  if (isPublicRoute(to.path)) {
    return;
  }
  
  // If the user isn't authenticated, redirect to login
  if (!auth.isLoggedIn.value) {
    console.log('No auth token found, redirecting to login');
    
    // Preserve the original requested URL for redirection after login
    const redirectTo = encodeURIComponent(to.fullPath);
    return navigateTo(`/auth/login?redirect=${redirectTo}`);
  }
  
  // If we're on a dashboard or other authenticated route, ensure we use the dashboard layout
  if (!to.meta.layout && isAuthenticatedRoute(to.path)) {
    to.meta.layout = 'dashboard';
  }
  
  console.log('User authenticated, proceeding to route');
});

// Helper function to determine if a route is public
function isPublicRoute(path: string): boolean {
  // These routes are accessible without authentication
  const publicRoutes = [
    '/', 
    '/auth/login', 
    '/auth/register', 
    '/auth/forgot-password',
    '/legal/terms',
    '/legal/privacy'
  ];
  
  // Check if the path starts with any of these prefixes
  const publicPrefixes = [
    '/auth/',
    '/legal/'
  ];
  
  // Check exact matches
  if (publicRoutes.includes(path)) {
    return true;
  }
  
  // Check prefixes
  return publicPrefixes.some(prefix => path.startsWith(prefix));
}

// Helper function to determine if a route requires authentication
function isAuthenticatedRoute(path: string): boolean {
  // These routes require authentication
  const authPrefixes = [
    '/dashboard',
    '/clients',
    '/measurements',
    '/orders',
    '/styles',
    '/settings',
    '/profile',
    '/subscription'
  ];
  
  return authPrefixes.some(prefix => path.startsWith(prefix));
} 