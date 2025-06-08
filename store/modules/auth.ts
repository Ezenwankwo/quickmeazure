// Types
import type { User } from '../../types/auth'

// Stores
import { useUserStore } from './user'

// Constants
import { STORAGE_KEYS } from '../../constants/storage'

// Utils
import { getFromStorage, setToStorage, removeFromStorage } from '../../utils/storage'

// Composables
import { useAuthApi } from '../../composables/useAuthApi'

/**
 * Auth store for managing authentication state
 * Consolidates JWT and Nuxt Auth approaches with proper session management
 */
export const useAuthStore = defineStore(
  'auth',
  () => {
    // Get runtime config for auth settings (used throughout the store)
    const _config = useRuntimeConfig()

    // State
    const user = ref<User | null>(null)
    const token = ref<string | null>(null)
    const refreshToken = ref<string | null>(null)
    const sessionExpiry = ref<number | null>(null)
    const isRefreshing = ref(false)
    const sessionTimeoutId = ref<NodeJS.Timeout | null>(null)

    // Constants for session management
    const SESSION_DURATION = 8 * 60 * 60 * 1000 // 8 hours
    const EXTENDED_SESSION_DURATION = 30 * 24 * 60 * 60 * 1000 // 30 days
    const TOKEN_REFRESH_THRESHOLD = 5 * 60 * 1000 // 5 minutes before expiry

    // Computed properties
    const isLoggedIn = computed(() => {
      return !!token.value && !!sessionExpiry.value && Date.now() < sessionExpiry.value
    })

    const isSubscriptionActive = computed(() => {
      if (!user.value) return false

      // Free plan is always active
      if (user.value.subscription?.plan === 'free') return true

      // Check if paid subscription is expired
      if (user.value.subscription?.expiryDate) {
        return Date.now() < new Date(user.value.subscription.expiryDate).getTime()
      }

      return false
    })

    const status = computed(() => {
      return isLoggedIn.value ? 'authenticated' : 'unauthenticated'
    })

    // Watch for auth state changes to set up session timeout
    watch(
      () => isLoggedIn.value,
      isLoggedIn => {
        if (isLoggedIn) {
          setupSessionTimeout()
        } else {
          clearSessionTimeout()
        }
      }
    )

    // We don't need activity tracking since we removed inactivity detection

    /**
     * Set up session timeout to handle token expiry and refreshing
     */
    function setupSessionTimeout() {
      if (typeof window === 'undefined') return

      // Clear any existing timeout
      clearSessionTimeout()

      // Set up a new timeout that checks token expiry
      sessionTimeoutId.value = setInterval(() => {
        const now = Date.now()

        // Check if token is expired
        if (sessionExpiry.value && now >= sessionExpiry.value) {
          console.log('Session expired, logging out')
          handleSessionExpiry()
          return
        }

        // Check if token needs refreshing (within 5 minutes of expiry)
        if (sessionExpiry.value && sessionExpiry.value - now < TOKEN_REFRESH_THRESHOLD) {
          console.log('Token expiring soon, refreshing')
          refreshSession()
        }
      }, 60000) // Check every minute
    }

    /**
     * Clear session timeout
     */
    function clearSessionTimeout() {
      if (sessionTimeoutId.value) {
        clearInterval(sessionTimeoutId.value)
        sessionTimeoutId.value = null
      }
    }

    /**
     * Parse JWT token to extract user information
     */
    function parseJwtToken(token: string): User | null {
      try {
        const base64Payload = token.split('.')[1]
        const payload = JSON.parse(atob(base64Payload))
        return {
          id: payload.id || payload.sub,
          name: payload.name,
          email: payload.email,
          subscription: payload.subscription || {
            plan: 'free',
            status: 'active',
            expiryDate: null,
          },
        }
      } catch (e) {
        console.error('Failed to decode JWT token', e)
        return null
      }
    }

    /**
     * Persist auth state to localStorage using standardized storage utilities
     */
    function persistAuthState() {
      if (typeof window === 'undefined') return

      if (token.value && sessionExpiry.value) {
        // Use the standardized storage utility for consistent error handling
        setToStorage(STORAGE_KEYS.USER, user.value)
        setToStorage(STORAGE_KEYS.AUTH_TOKEN, token.value)
        setToStorage(STORAGE_KEYS.REFRESH_TOKEN, refreshToken.value)
        setToStorage('lastLoginTime', Date.now())
      } else {
        // Use the standardized storage utility for consistent error handling
        removeFromStorage(STORAGE_KEYS.USER)
        removeFromStorage(STORAGE_KEYS.AUTH_TOKEN)
        removeFromStorage(STORAGE_KEYS.REFRESH_TOKEN)
        removeFromStorage('lastLoginTime')
      }
    }

    // Actions
    /**
     * Initialize the auth store
     * Restores session from localStorage if available
     * Safe to call during SSR
     */
    function init() {
      // Skip initialization during SSR
      if (import.meta.server) return

      // Only run on client
      if (typeof window !== 'undefined') {
        console.log('Initializing auth store on client')

        // Get user store instance
        const userStore = useUserStore()

        // Use standardized storage utility to load auth data
        const storedUser = getFromStorage(STORAGE_KEYS.USER)
        const storedToken = getFromStorage(STORAGE_KEYS.AUTH_TOKEN)
        const storedRefreshToken = getFromStorage(STORAGE_KEYS.REFRESH_TOKEN)
        const authData = storedToken
          ? {
              token: storedToken,
              refreshToken: storedRefreshToken,
              sessionExpiry: Date.now() + SESSION_DURATION,
            }
          : null

        if (authData) {
          // Check if token exists and is not expired
          if (authData.token && authData.sessionExpiry && Date.now() < authData.sessionExpiry) {
            console.log('Found valid auth data in localStorage')

            // Set token and expiry
            token.value = authData.token
            refreshToken.value = authData.refreshToken || null
            sessionExpiry.value = authData.sessionExpiry

            // Extract user info from JWT payload
            const userData = parseJwtToken(authData.token)
            if (userData) {
              // Store user data in auth store for backward compatibility
              user.value = userData

              // Initialize user store with user data
              userStore.init(userData)

              // Set up session timeout
              setupSessionTimeout()

              console.log('Auth state restored successfully')
            } else {
              console.error('Failed to parse user data from token')
              clearAuthState()
              userStore.reset()
            }
          } else {
            console.log('Found expired auth data in localStorage')
            clearAuthState()
            userStore.reset()
          }
        } else {
          console.log('No auth data found in localStorage')
        }
      }
    }

    /**
     * Clear all auth state
     */
    function clearAuthState() {
      user.value = null
      token.value = null
      refreshToken.value = null
      sessionExpiry.value = null

      if (typeof window !== 'undefined') {
        // Use standardized storage utilities for consistent error handling
        removeFromStorage(STORAGE_KEYS.USER)
        removeFromStorage(STORAGE_KEYS.AUTH_TOKEN)
        removeFromStorage(STORAGE_KEYS.REFRESH_TOKEN)
        removeFromStorage('lastLoginTime')
        removeFromStorage('isHandlingAuthError')
        removeFromStorage('isHandlingTokenRefresh')
      }

      clearSessionTimeout()
    }

    /**
     * Set user authentication state after successful login
     */
    function setAuthState({
      user: userData,
      token: authToken,
      refreshToken: authRefreshToken,
      remember = false,
    }: {
      user: User
      token: string
      refreshToken?: string
      remember?: boolean
    }) {
      if (!authToken) {
        throw new Error('No token provided')
      }

      // Store user and token in auth store
      user.value = userData
      token.value = authToken
      refreshToken.value = authRefreshToken || null

      // Initialize user store with user data
      const userStore = useUserStore()
      userStore.init(userData)

      // Calculate session expiry based on remember setting
      const now = Date.now()
      sessionExpiry.value = remember
        ? now + EXTENDED_SESSION_DURATION // 30 days if remember me is checked
        : now + SESSION_DURATION // 8 hours for normal session

      // Set up session timeout
      setupSessionTimeout()

      // Save to localStorage
      persistAuthState()

      return { success: true, user: userData }
    }

    /**
     * Set user data after successful registration
     */
    function setUser(userData: User) {
      user.value = userData
      return { success: true, user: userData }
    }

    /**
     * Logout the current user (client-side only)
     */
    function logout() {
      console.log('Starting client-side logout process')

      // Mark this as an intentional logout if not already set
      if (typeof window !== 'undefined' && !getFromStorage('intentionalLogout')) {
        setToStorage('intentionalLogout', 'true')
      }

      // Clear session timeout
      clearSessionTimeout()

      // Clear all auth state
      clearAuthState()

      // Reset user store state
      const userStore = useUserStore()
      userStore.reset()
      console.log('Client-side logout completed')

      // Clear the intentional logout flag after successful logout
      if (typeof window !== 'undefined') {
        setTimeout(() => {
          removeFromStorage('intentionalLogout')
        }, 1000) // Small delay to ensure other operations complete
      }

      return { success: true }
    }

    /**
     * Set a new token and optionally update the refresh token
     */
    function setToken(newToken: string, newRefreshToken?: string) {
      if (!newToken) {
        console.error('Cannot set empty token')
        return { success: false, error: 'Cannot set empty token' }
      }

      console.log('Updating auth token')
      token.value = newToken

      // Update refresh token if provided
      if (newRefreshToken) {
        refreshToken.value = newRefreshToken
      }

      return { success: true }
    }

    /**
     * Update the user profile in the auth store
     */
    function updateUserProfile(userData: User) {
      if (!userData) {
        console.error('Cannot update user profile with empty data')
        return { success: false, error: 'Invalid user data' }
      }

      console.log('Updating user profile in auth store')
      user.value = userData

      // Update user store if needed
      const userStore = useUserStore()
      userStore.updateProfile(userData)

      return { success: true }
    }

    /**
     * Handle session expiry or forced logout
     * @param showNotification Whether to show a notification to the user
     * @param reason Optional reason for the session expiry (for logging)
     */
    async function handleSessionExpiry(showNotification = true, reason = 'Session expired') {
      // Check if this is an intentional logout
      const isIntentionalLogout =
        typeof window !== 'undefined' && getFromStorage('intentionalLogout') === 'true'

      console.log(`Handling session expiry: ${reason}`, { isIntentionalLogout })

      // Clear session timeout immediately
      clearSessionTimeout()

      // Call logout to clear state and notify server
      await logout()

      // Show notification only if not an intentional logout
      if (showNotification && typeof window !== 'undefined' && !isIntentionalLogout) {
        console.error('Session Expired: Your session has expired. Please log in again.')
      }

      // Redirect to login page with return URL if possible
      if (typeof window !== 'undefined') {
        const currentPath = window.location.pathname
        const isAuthPage = currentPath.startsWith('/auth/')

        // Only include return URL if not already on an auth page
        if (!isAuthPage && currentPath !== '/') {
          navigateTo(`/auth/login?returnTo=${encodeURIComponent(currentPath)}`)
        } else {
          navigateTo('/auth/login')
        }
      } else {
        // Server-side redirect
        navigateTo('/auth/login')
      }
    }

    /**
     * Get client limit based on subscription plan
     */
    function getClientLimit() {
      if (!user.value) return 0

      switch (user.value.subscription?.plan) {
        case 'free':
          return 100
        case 'standard':
          return 500
        case 'premium':
          return Infinity // Unlimited
        default:
          return 0
      }
    }

    /**
     * Get authorization headers for API calls
     */
    function getAuthHeaders(): AuthHeaders {
      // Ensure we have a token
      const currentToken = token.value
      if (!currentToken) {
        console.warn('No authentication token available')
        return {}
      }

      return {
        Authorization: `Bearer ${currentToken}`,
        'Content-Type': 'application/json',
      }
    }

    /**
     * Update the token with a new one, typically after subscription changes
     * @param newToken The new token to use
     */
    function updateToken(newToken: string) {
      if (!newToken) {
        console.error('Cannot update token: No token provided')
        return
      }

      try {
        // Parse the new token
        const userData = parseJwtToken(newToken)
        if (!userData) {
          console.error('Failed to parse user data from new token')
          return
        }

        // Update token and user data
        token.value = newToken
        user.value = userData

        // Update user store
        const userStore = useUserStore()
        userStore.init(userData)

        // Recalculate session expiry if needed (maintain the same expiry time)
        if (!sessionExpiry.value || sessionExpiry.value < Date.now()) {
          sessionExpiry.value = Date.now() + SESSION_DURATION
        }

        // Update session timeout
        setupSessionTimeout()

        // Save to localStorage
        persistAuthState()

        console.log('Token updated successfully with new subscription data')
      } catch (error) {
        console.error('Error updating token:', error)
      }
    }

    /**
     * Refresh the authentication session by getting a new access token
     */
    async function refreshSession() {
      // Skip if already refreshing
      if (isRefreshing.value) {
        console.log('Refresh already in progress, skipping...')
        return { success: false, error: 'Refresh already in progress' }
      }

      // Set refreshing flag
      isRefreshing.value = true

      try {
        // Use the auth API composable to refresh the token
        const authApi = useAuthApi()
        const result = await authApi.refreshToken()

        if (result.success) {
          console.log('Session refreshed successfully')
          return { success: true }
        } else {
          console.error('Failed to refresh session:', result.error)
          return { success: false, error: result.error || 'Failed to refresh session' }
        }
      } catch (error) {
        console.error('Error refreshing session:', error)
        return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
      } finally {
        // Always clear the refreshing flag
        isRefreshing.value = false
      }
    }

    // Return public store interface
    return {
      // State
      user,
      token,
      refreshToken,
      sessionExpiry,
      isRefreshing,
      sessionTimeoutId,

      // Getters
      isLoggedIn,
      isSubscriptionActive,
      status,

      // Actions
      init,
      clearAuthState,
      setAuthState,
      setUser,
      setToken,
      updateUserProfile,
      logout,
      refreshSession,
      handleSessionExpiry,
      getClientLimit,
      getAuthHeaders,
      updateToken,
    }
  },
  {
    persist: {
      storage: typeof window !== 'undefined' ? window.localStorage : null,
      paths: ['user', 'token', 'sessionExpiry'],
    },
  }
)
