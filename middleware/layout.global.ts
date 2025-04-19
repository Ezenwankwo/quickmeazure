import { useSessionAuth } from '~/composables/useSessionAuth';

export default defineNuxtRouteMiddleware((to) => {
  // Skip middleware on server side
  if (process.server) return;

  const { isLoggedIn } = useSessionAuth();
  const nuxtApp = useNuxtApp();
  
  // Define which paths should use which layouts
  // By default, auth routes use auth layout
  if (to.path.startsWith('/auth/')) {
    setPageLayout('auth');
    return;
  }
  
  // Public pages can use default layout
  if (to.path === '/' || to.path.startsWith('/legal/')) {
    setPageLayout('default');
    return;
  }
  
  // Dashboard and authenticated routes
  if (isLoggedIn.value) {
    // All authenticated routes use dashboard layout
    // Only set if not already specified in the page meta
    if (!to.meta.layout) {
      setPageLayout('dashboard');
    }
    return;
  }
  
  // For any other routes, if user is not logged in, use default layout
  setPageLayout('default');
}); 