import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import type { User, LoginCredentials, RegistrationData, AuthHeaders, ApiResponse } from '../types'
import { useRuntimeConfig, navigateTo } from '#app'
import { useUserStore } from './user'
import { getFromStorage, setToStorage, removeFromStorage, STORAGE_KEYS } from '~/utils/storage'

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
      if (user.value.subscriptionPlan === 'free') return true

      // Check if paid subscription is expired
      if (user.value.subscriptionExpiry) {
        return Date.now() < user.value.subscriptionExpiry
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
      if (!import.meta.client) return

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
          subscriptionPlan: payload.subscriptionPlan || 'free',
          subscriptionExpiry: payload.subscriptionExpiry,
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
      if (!import.meta.client) return

      if (token.value && sessionExpiry.value) {
        // Use the standardized storage utility for consistent error handling
        setToStorage(STORAGE_KEYS.AUTH, {
          token: token.value,
          refreshToken: refreshToken.value,
          sessionExpiry: sessionExpiry.value,
        })
        setToStorage('lastLoginTime', Date.now())
      } else {
        // Use the standardized storage utility for consistent error handling
        removeFromStorage(STORAGE_KEYS.AUTH)
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
      if (import.meta.client) {
        console.log('Initializing auth store on client')

        // Get user store instance
        const userStore = useUserStore()

        // Use standardized storage utility to load auth data
        const authData = getFromStorage(STORAGE_KEYS.AUTH)

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

      if (import.meta.client) {
        // Use standardized storage utilities for consistent error handling
        removeFromStorage(STORAGE_KEYS.AUTH)
        removeFromStorage('lastLoginTime')
        removeFromStorage('isHandlingAuthError')
        removeFromStorage('isHandlingTokenRefresh')
      }

      clearSessionTimeout()
    }

    /**
     * Login user with email and password
     */
    async function login(credentials: LoginCredentials) {
      const { email, password, remember = false } = credentials
      try {
        console.log('Auth store: Attempting login...')

        // Call the login API endpoint
        const response = await $fetch<
          ApiResponse<{ user: User; token: string; refreshToken?: string }>
        >('/api/auth/login', {
          method: 'POST',
          body: { email, password, remember },
        })

        console.log('Auth store: Login response received:', {
          success: response?.success,
          hasData: !!response?.data,
        })

        // Check if the response is valid - be more flexible with the response format
        if (!response) {
          throw new Error('No response received from server')
        }

        // Handle case where response is not in expected format but still contains data
        if (!response.data && response.success === undefined) {
          // Try to interpret the response as the data itself
          response.data = response as any
          response.success = true
        } else if (!response.success || !response.data) {
          throw new Error(response?.error || 'Authentication failed')
        }

        // Extract response data
        const { token: authToken, user: userData, refreshToken: authRefreshToken } = response.data

        if (!authToken) {
          throw new Error('No token received from server')
        }

        // Store user and token in auth store (for backward compatibility)
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

        // Reset last activity time

        // Set up session timeout
        setupSessionTimeout()

        // Save to localStorage
        persistAuthState()

        // Check if user has a subscription
        if (userData.subscriptionPlan === 'free' || !userData.subscriptionPlan) {
          navigateTo('/subscription/confirm')
          return { success: true, redirected: true }
        }

        return { success: true }
      } catch (error: any) {
        console.error('Login failed:', error)
        // Clear any partial auth state
        clearAuthState()

        // Show error toast (safely handled without direct import)
        if (import.meta.client) {
          console.error(
            'Login failed:',
            error.data?.message || error.message || 'An error occurred during login'
          )
        }

        return {
          success: false,
          error: error.data?.message || error.data?.statusMessage || error.message,
        }
      }
    }

    /**
     * Register a new user
     */
    async function register(userData: RegistrationData) {
      const { name, email, password, plan = 'free' } = userData
      try {
        // Call the register API endpoint
        const response = await $fetch<ApiResponse<{ user: User; token: string }>>(
          '/api/auth/register',
          {
            method: 'POST',
            body: { name, email, password, subscriptionPlan: plan },
          }
        )

        // Store user and token
        user.value = response.user
        token.value = response.token

        // Calculate session expiry (default to 8 hours)
        const now = Date.now()
        sessionExpiry.value = now + 8 * 60 * 60 * 1000

        // Save to localStorage
        if (import.meta.client) {
          localStorage.setItem(
            'auth',
            JSON.stringify({
              token: response.token,
              sessionExpiry: sessionExpiry.value,
            })
          )
          localStorage.setItem('lastLoginTime', now.toString())
        }

        return { success: true }
      } catch (error: any) {
        console.error('Registration failed:', error)

        // Extract error message from the response
        let errorMessage = 'Registration failed'
        const statusCode = error.statusCode || error.status || 500

        if (error.data) {
          // Handle structured error responses
          if (error.data.message) {
            errorMessage = error.data.message
          } else if (error.data.statusMessage) {
            errorMessage = error.data.statusMessage
          }
        }

        // Add appropriate context based on status code
        if (statusCode === 409) {
          errorMessage =
            'Email is already registered. Please use a different email or login instead.'
        }

        return {
          success: false,
          error: errorMessage,
          statusCode,
        }
      }
    }

    /**
     * Logout the current user
     */
    async function logout() {
      try {
        console.log('Starting logout process')

        // Mark this as an intentional logout if not already set
        if (import.meta.client && !localStorage.getItem('intentionalLogout')) {
          localStorage.setItem('intentionalLogout', 'true')
        }

        // Clear session timeout
        clearSessionTimeout()

        // Call server logout endpoint first, while we still have the token
        if (token.value) {
          try {
            console.log('Calling server logout API endpoint')
            await $fetch('/api/auth/logout', {
              method: 'POST',
              headers: {
                Authorization: `Bearer ${token.value}`,
                'X-Refresh-Token': refreshToken.value || '',
              },
            })
            console.log('Server logout completed')
          } catch (apiError) {
            console.error('API logout error (non-critical):', apiError)
          }
        }

        // Clear all auth state
        clearAuthState()

        // Reset user store state
        const userStore = useUserStore()
        userStore.reset()
        console.log('Logout completed successfully')

        // Clear the intentional logout flag after successful logout
        if (import.meta.client) {
          setTimeout(() => {
            localStorage.removeItem('intentionalLogout')
          }, 1000) // Small delay to ensure other operations complete
        }

        return { success: true }
      } catch (error) {
        console.error('Logout error:', error)

        // Ensure all state is cleared even on error
        clearAuthState()

        return { success: true, error }
      }
    }

    /**
     * Refresh the user's session
     */
    async function refreshSession() {
      // Prevent multiple simultaneous refresh attempts
      if (isRefreshing.value) {
        console.log('Token refresh already in progress, skipping')
        return { success: false, error: 'Refresh already in progress' }
      }

      try {
        // Set refreshing flag
        isRefreshing.value = true

        // Set flag in localStorage to prevent multiple tabs from refreshing simultaneously
        if (import.meta.client) {
          localStorage.setItem('isHandlingTokenRefresh', 'true')
        }

        console.log('Refreshing session token')

        // Call the refresh token API endpoint
        const response = await $fetch<
          ApiResponse<{ token: string; refreshToken?: string; user?: User }>
        >('/api/auth/refresh', {
          method: 'POST',
          headers: {
            Authorization: token.value ? `Bearer ${token.value}` : '',
            'X-Refresh-Token': refreshToken.value || '',
          },
        })

        // Check if the response is valid
        if (!response || !response.success || !response.data || !response.data.token) {
          throw new Error(response?.error || 'Invalid response from token refresh')
        }

        console.log('Token refresh successful')

        // Update token
        token.value = response.data.token

        // Update refresh token if provided
        if (response.data.refreshToken) {
          refreshToken.value = response.data.refreshToken
        }

        // Get user store instance
        const userStore = useUserStore()

        // Update user data if provided
        if (response.data.user) {
          // Update auth store user (for backward compatibility)
          user.value = response.data.user

          // Update user store
          userStore.updateProfile(response.data.user)
        } else if (token.value) {
          // Extract user from token if not explicitly provided
          const userData = parseJwtToken(token.value)
          if (userData) {
            // Update auth store user (for backward compatibility)
            user.value = userData

            // Update user store
            userStore.updateProfile(userData)
          }
        }

        // Update expiry (default to standard session duration)
        const now = Date.now()
        sessionExpiry.value = now + SESSION_DURATION
        // Persist updated auth state
        persistAuthState()

        // Clear refresh handling flag
        if (import.meta.client) {
          localStorage.removeItem('isHandlingTokenRefresh')
        }

        return { success: true }
      } catch (error: any) {
        console.error('Error refreshing session:', error)

        // Clear refresh handling flag
        if (import.meta.client) {
          localStorage.removeItem('isHandlingTokenRefresh')
        }

        // If refresh fails with 401/403, the session is likely invalid
        if (error.status === 401 || error.status === 403) {
          console.log('Session invalid during refresh, logging out')
          handleSessionExpiry()
        }

        return { success: false, error: error.message || 'Failed to refresh session' }
      } finally {
        isRefreshing.value = false
      }
    }

    /**
     * Handle session expiry or forced logout
     * @param showNotification Whether to show a notification to the user
     * @param reason Optional reason for the session expiry (for logging)
     */
    async function handleSessionExpiry(showNotification = true, reason = 'Session expired') {
      // Check if this is an intentional logout
      const isIntentionalLogout =
        import.meta.client && localStorage.getItem('intentionalLogout') === 'true'

      console.log(`Handling session expiry: ${reason}`, { isIntentionalLogout })

      // Clear session timeout immediately
      clearSessionTimeout()

      // Call logout to clear state and notify server
      await logout()

      // Show notification only if not an intentional logout
      if (showNotification && import.meta.client && !isIntentionalLogout) {
        console.error('Session Expired: Your session has expired. Please log in again.')
      }

      // Redirect to login page with return URL if possible
      if (import.meta.client) {
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

      switch (user.value.subscriptionPlan) {
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
      if (!token.value) return {}

      return {
        Authorization: `Bearer ${token.value}`,
      }
    }

    // We don't need the updateLastActivity method anymore since we removed inactivity detection

    // Return public store interface
    return {
      // State
      user,
      token,
      refreshToken,
      sessionExpiry,

      // Computed
      isLoggedIn,
      isSubscriptionActive,
      status,

      // Actions
      init,
      login,
      register,
      logout,
      refreshSession,
      handleSessionExpiry,
      getClientLimit,
      getAuthHeaders,
    }
  },
  {
    persist: {
      storage: import.meta.client ? localStorage : null,
      paths: ['user', 'token', 'sessionExpiry'],
    },
  }
)
