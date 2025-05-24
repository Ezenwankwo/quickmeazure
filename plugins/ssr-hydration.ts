import { defineNuxtPlugin } from '#app'

/**
 * Enhanced SSR Hydration Plugin
 *
 * This plugin ensures proper state hydration between server and client,
 * handles cross-tab synchronization, and manages session state consistently.
 *
 * IMPORTANT: This plugin must run AFTER the Pinia plugin is initialized
 */
export default defineNuxtPlugin({
  name: 'ssr-hydration',
  enforce: 'post', // Run after other plugins, especially after Pinia is initialized
  setup(nuxtApp) {
    // Set up hydration when app is mounted
    nuxtApp.hook('app:mounted', () => {
      // Only run on client-side
      if (import.meta.client) {
        console.log('SSR Hydration: App mounted, initializing stores')

        // Import stores dynamically to avoid module-level initialization issues
        import('~/store').then(({ useAuthStore, useUiStore, useApiStore }) => {
          try {
            // Initialize stores safely after Pinia is ready
            const authStore = useAuthStore()
            const uiStore = useUiStore()
            const _apiStore = useApiStore() // Prefixed with _ to indicate intentionally unused

            // Initialize auth state first (most critical)
            authStore.init()

            // Then initialize UI state
            uiStore.init()

            // Set up comprehensive cross-tab synchronization
            window.addEventListener('storage', event => {
              // Handle auth state changes in other tabs
              if (event.key === 'auth') {
                console.log('SSR Hydration: Auth state changed in another tab')
                authStore.init()
              }

              // Handle intentional logout in other tabs
              if (event.key === 'intentionalLogout' && event.newValue === 'true') {
                console.log('SSR Hydration: Intentional logout detected in another tab')
                if (authStore.isLoggedIn) {
                  authStore.logout()
                }
              }

              // Handle theme changes in other tabs
              if (event.key === 'ui-theme') {
                console.log('SSR Hydration: UI theme changed in another tab')
                uiStore.init()
              }
            })

            // Set up visibility change handler for tab focus/unfocus
            document.addEventListener('visibilitychange', () => {
              if (document.visibilityState === 'visible') {
                console.log('SSR Hydration: Tab became visible, refreshing state')
                // Refresh auth state when tab becomes visible
                if (authStore.isLoggedIn) {
                  // Check if token is close to expiry and refresh if needed
                  const tokenExpiryThreshold = 5 * 60 * 1000 // 5 minutes
                  const now = Date.now()

                  if (
                    authStore.sessionExpiry &&
                    authStore.sessionExpiry - now < tokenExpiryThreshold
                  ) {
                    console.log('SSR Hydration: Token close to expiry, refreshing')
                    authStore.refreshSession()
                  }
                }
              }
            })

            console.log('SSR Hydration: Store initialization and event listeners set up')
          } catch (error) {
            console.error('SSR Hydration: Failed to initialize stores:', error)
          }
        })
      }
    })
  },
})
