import { useAuth } from '~/composables/useAuth';

export default defineNuxtRouteMiddleware((to) => {
  if (process.server) return; // Skip middleware on server-side

  console.log('Auth middleware running for route:', to.path);
  const auth = useAuth();
  
  // Skip for home page (index.vue)
  if (to.path === '/') {
    return;
  }

  // Skip for auth-related routes
  if (to.path.startsWith('/auth/') || to.path.includes('login') || to.path.includes('register')) {
    return;
  }

  // Skip for legal pages
  if (to.path.startsWith('/legal/')) {
    return;
  }
  
  // Skip for subscription confirmation page
  if (to.path === '/subscription/confirm') {
    return;
  }
  
  // If the user isn't authenticated, redirect to login
  if (!auth.isLoggedIn.value || !auth.token.value) {
    console.log('No auth token found, redirecting to login');
    return navigateTo('/auth/login');
  }
  
  console.log('User authenticated, proceeding to route');
}); 