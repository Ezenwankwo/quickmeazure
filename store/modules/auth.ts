import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

// Interface for our user
interface User {
  id: string
  name: string
  email: string
  subscriptionPlan?: string
  subscriptionExpiry?: number | null
  hasCompletedSetup?: boolean
}

/**
 * Auth store for managing authentication state
 * Replaces the useSessionAuth composable with a centralized store
 */
export const useAuthStore = defineStore('auth', () => {
  // State
  const user = ref<User | null>(null)
  const token = ref<string | null>(null)
  const sessionExpiry = ref<number | null>(null)
  const isRefreshing = ref(false)

  // Computed
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

  // Actions
  /**
   * Initialize the auth store
   * Restores session from localStorage if available
   */
  function init() {
    if (import.meta.client) {
      // Try to load token from localStorage
      const authData = localStorage.getItem('auth')
      if (authData) {
        try {
          const parsed = JSON.parse(authData)
          if (parsed.token && parsed.sessionExpiry && Date.now() < parsed.sessionExpiry) {
            token.value = parsed.token
            sessionExpiry.value = parsed.sessionExpiry

            // Extract user info from JWT payload
            try {
              const base64Payload = parsed.token.split('.')[1]
              const payload = JSON.parse(atob(base64Payload))
              user.value = {
                id: payload.id,
                name: payload.name,
                email: payload.email,
                subscriptionPlan: payload.subscriptionPlan,
                subscriptionExpiry: payload.subscriptionExpiry,
              }
            } catch (e) {
              console.error('Failed to decode JWT token', e)
            }
          } else {
            // Clear expired token
            localStorage.removeItem('auth')
          }
        } catch (e) {
          console.error('Failed to parse auth data from localStorage', e)
          localStorage.removeItem('auth')
        }
      }
    }
  }

  /**
   * Login user with email and password
   */
  async function login(email: string, password: string, remember: boolean = false) {
    try {
      // Call the login API endpoint
      const response = await $fetch<{ user: User; token: string }>('/api/auth/login', {
        method: 'POST',
        body: { email, password, remember },
      })

      // Store user and token
      user.value = response.user
      token.value = response.token

      // Calculate session expiry based on remember setting
      const now = Date.now()
      sessionExpiry.value = remember
        ? now + 30 * 24 * 60 * 60 * 1000 // 30 days if remember me is checked
        : now + 8 * 60 * 60 * 1000 // 8 hours for normal session

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

      // Check if user has a subscription
      if (response.user.subscriptionPlan === 'free' || !response.user.subscriptionPlan) {
        navigateTo('/subscription/confirm')
        return { success: true, redirected: true }
      }

      return { success: true }
    } catch (error: any) {
      console.error('Login failed:', error)
      return {
        success: false,
        error: error.data?.message || error.data?.statusMessage,
      }
    }
  }

  /**
   * Register a new user
   */
  async function register(name: string, email: string, password: string, plan: string = 'free') {
    try {
      // Call the register API endpoint
      const response = await $fetch<{ user: User; token: string }>('/api/auth/register', {
        method: 'POST',
        body: { name, email, password, subscriptionPlan: plan },
      })

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
        errorMessage = 'Email is already registered. Please use a different email or login instead.'
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

      // Clear local state
      user.value = null
      token.value = null
      sessionExpiry.value = null

      // Remove from localStorage
      if (import.meta.client) {
        // Keep the intentionalLogout flag until the end of the logout process
        const intentionalLogout = localStorage.getItem('intentionalLogout')

        localStorage.removeItem('auth')
        localStorage.removeItem('isHandlingAuthError')
        localStorage.removeItem('lastLoginTime')
        localStorage.removeItem('isHandlingTokenRefresh')
        console.log('Local storage cleared')

        // If this was an intentional logout, restore the flag
        if (intentionalLogout === 'true') {
          localStorage.setItem('intentionalLogout', 'true')
        }
      }

      // Call server logout endpoint
      try {
        console.log('Calling server logout API endpoint')
        await $fetch('/api/auth/logout', { method: 'POST' })
        console.log('Server logout completed')
      } catch (apiError) {
        console.error('API logout error (non-critical):', apiError)
      }

      console.log('Logout completed successfully')
      return { success: true }
    } catch (error) {
      console.error('Logout error:', error)

      // Ensure local state is cleared even on error
      user.value = null
      token.value = null
      sessionExpiry.value = null

      if (import.meta.client) {
        localStorage.removeItem('auth')
        localStorage.removeItem('isHandlingAuthError')
        localStorage.removeItem('lastLoginTime')
        localStorage.removeItem('isHandlingTokenRefresh')
      }

      return { success: true, error }
    }
  }

  /**
   * Refresh the user's session
   */
  async function refreshSession() {
    if (isRefreshing.value) {
      console.log('Token refresh already in progress, skipping')
      return { success: false, error: 'Refresh already in progress' }
    }

    try {
      isRefreshing.value = true

      if (import.meta.client) {
        localStorage.setItem('isHandlingTokenRefresh', 'true')
      }

      // Call the refresh endpoint
      const response = await $fetch<{ token: string; user: User }>('/api/auth/refresh', {
        method: 'POST',
        headers: token.value
          ? {
              Authorization: `Bearer ${token.value}`,
            }
          : undefined,
      })

      // Update token and user
      token.value = response.token
      user.value = response.user

      // Update expiry (default to 8 hours)
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
        localStorage.removeItem('isHandlingTokenRefresh')
      }

      return { success: true }
    } catch (error) {
      console.error('Error refreshing session:', error)

      if (import.meta.client) {
        localStorage.removeItem('isHandlingTokenRefresh')
      }

      return { success: false, error }
    } finally {
      isRefreshing.value = false
    }
  }

  /**
   * Handle session expiry
   */
  async function handleSessionExpiry(showNotification = true) {
    // Check if this is an intentional logout
    const isIntentionalLogout =
      import.meta.client && localStorage.getItem('intentionalLogout') === 'true'

    // Call logout
    await logout()

    // Show notification only if not an intentional logout
    if (showNotification && import.meta.client && !isIntentionalLogout) {
      const toast = useToast()
      toast.add({
        title: 'Session Expired',
        description: 'Your session has expired. Please log in again.',
        color: 'error',
      })
    }

    // Redirect to login page
    navigateTo('/auth/login')
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
  function getAuthHeaders(): HeadersInit {
    if (!token.value) return {}

    return {
      Authorization: `Bearer ${token.value}`,
    }
  }

  return {
    // State
    user,
    token,
    sessionExpiry,
    isRefreshing,

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
})
