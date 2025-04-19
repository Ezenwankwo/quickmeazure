import { useSessionAuth } from '~/composables/useSessionAuth';

/**
 * Middleware to check if user has an active subscription
 * Redirects to subscription page if no active subscription is found
 */
export default defineNuxtRouteMiddleware(async (to, from) => {
  // Skip middleware on public routes, auth routes and subscription pages
  if (
    to.path === '/' || 
    to.path.startsWith('/auth') ||
    to.path.startsWith('/subscription') || 
    to.path.startsWith('/legal') ||
    to.path.startsWith('/reset-password')
  ) {
    return;
  }

  const auth = useSessionAuth();
  const { data: subscription, error } = await useFetch('/api/subscriptions/current');
  
  // Skip middleware if not logged in (auth middleware will handle that)
  if (!auth.isLoggedIn.value) {
    return;
  }
  
  // Redirect to subscription page if user doesn't have an active subscription
  if (error.value || !subscription.value?.data) {
    return navigateTo({
      path: '/subscription',
      query: { redirectTo: to.fullPath }
    });
  }
}); 