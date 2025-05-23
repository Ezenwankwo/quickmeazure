/**
 * This middleware handles token refresh
 * Modified to only run on the client side to avoid SSR issues with cookie handling
 */
export default defineNuxtRouteMiddleware(async to => {
  // Skip for auth routes or if we're on the server
  if (to.path.startsWith('/auth/') || import.meta.server) {
    return
  }

  // Get session state from useSessionAuth
  const { isLoggedIn, refreshSession } = useSessionAuth()

  // Only attempt refresh if we're logged in
  if (isLoggedIn.value) {
    try {
      // Use the refreshSession method from useSessionAuth
      await refreshSession()
    } catch (error) {
      console.error('Failed to refresh session:', error)
      // The error will be handled by the auth system
    }
  }
})
