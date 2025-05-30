import { ref, computed } from 'vue'
import { useUserSession } from '#imports'
import { useAuthStore } from '~/store/modules/auth'

// Interface for our user
interface User {
  id: string
  name: string
  email: string
  subscriptionPlan?: string
  subscriptionExpiry?: number | null
  hasCompletedSetup?: boolean
}

// Create a local JWT token storage (for backward compatibility)
const jwtToken = ref<string | null>(null)

// Get user session expiry time (for JWT expiry calculation)
const sessionExpiry = ref<number | null>(null)

// Initialize on client side
if (import.meta.client) {
  // Try to load token from localStorage for backward compatibility
  const authData = localStorage.getItem('auth')
  if (authData) {
    try {
      const parsed = JSON.parse(authData)
      if (parsed.token && parsed.sessionExpiry && Date.now() < parsed.sessionExpiry) {
        jwtToken.value = parsed.token
        sessionExpiry.value = parsed.sessionExpiry
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

export function useSessionAuth() {
  // Get user session from nuxt-auth-utils
  const {
    loggedIn,
    user: sessionUser,
    clear: clearSession,
    fetch: refreshSession,
  } = useUserSession()

  // Current user (from session or JWT)
  const user = computed<User | null>(() => {
    // First try to get user from nuxt-auth-utils session
    if (sessionUser.value) {
      return sessionUser.value as User
    }

    // If no session user but we have JWT token, try to extract user from JWT
    if (jwtToken.value && sessionExpiry.value && Date.now() < sessionExpiry.value) {
      // Try to extract user info from JWT payload
      try {
        // Decode JWT payload (works with client-side simple validation)
        const base64Payload = jwtToken.value.split('.')[1]
        const payload = JSON.parse(atob(base64Payload))
        return {
          id: payload.id,
          name: payload.name,
          email: payload.email,
          subscriptionPlan: payload.subscriptionPlan,
          subscriptionExpiry: payload.subscriptionExpiry,
        }
      } catch (e) {
        console.error('Failed to decode JWT token', e)
        return null
      }
    }

    return null
  })

  // Computed property to check if user is authenticated
  const isLoggedIn = computed(() => {
    return (
      loggedIn.value ||
      (!!jwtToken.value && !!sessionExpiry.value && Date.now() < sessionExpiry.value)
    )
  })

  // Get the auth token (from session or JWT)
  const token = computed(() => {
    // First check for nuxt-auth-utils session token
    if (loggedIn.value && sessionUser.value) {
      // Check if sessionUser has a token property (using type assertion)
      const userWithToken = sessionUser.value as any
      if (userWithToken && userWithToken.token) {
        return userWithToken.token
      }
    }

    // If no session token but we have JWT token and it's not expired, use it
    if (jwtToken.value && sessionExpiry.value && Date.now() < sessionExpiry.value) {
      return jwtToken.value
    }

    // Return null if no token
    return null
  })

  // Check if user's subscription is active
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

  // Login function - uses the auth store's login function
  async function login(email: string, password: string, remember: boolean = false) {
    const authStore = useAuthStore()
    const result = await authStore.login({ email, password, remember })

    // If login was successful, update local state for backward compatibility
    if (result.success) {
      // Get the token from the auth store
      jwtToken.value = authStore.token

      // Update session expiry from auth store
      sessionExpiry.value = authStore.sessionExpiry

      // Save to localStorage for backward compatibility
      if (import.meta.client) {
        localStorage.setItem(
          'auth',
          JSON.stringify({
            token: authStore.token,
            sessionExpiry: authStore.sessionExpiry,
          })
        )
        localStorage.setItem('lastLoginTime', Date.now().toString())
      }

      // Refresh the nuxt-auth-utils session
      await refreshSession()

      // Return the result which may include redirect info
      return result
    }

    // If login failed, return the error
    return result
  }

  // Register function
  async function register(name: string, email: string, password: string, plan: string = 'free') {
    try {
      // Call the register API endpoint
      const response = await $fetch<{ user: User; token: string }>('/api/auth/register', {
        method: 'POST',
        body: { name, email, password, subscriptionPlan: plan },
      })

      // Store JWT token for backward compatibility
      jwtToken.value = response.token

      // Calculate session expiry (default to 8 hours)
      const now = Date.now()
      sessionExpiry.value = now + 8 * 60 * 60 * 1000

      // Save to localStorage for backward compatibility
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

      // Refresh the nuxt-auth-utils session
      await refreshSession()

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

  // Logout function
  async function logout() {
    try {
      console.log('Starting logout process')

      // Clear local JWT token
      jwtToken.value = null
      sessionExpiry.value = null

      // Remove from localStorage
      if (import.meta.client) {
        // Keep the intentionalLogout flag until the end of the logout process
        // to ensure all components respect it
        const intentionalLogout = localStorage.getItem('intentionalLogout')

        localStorage.removeItem('auth')
        localStorage.removeItem('isHandlingAuthError')
        localStorage.removeItem('lastLoginTime')
        console.log('Local storage cleared')

        // If this was an intentional logout, restore the flag
        // It will be removed after navigation completes
        if (intentionalLogout === 'true') {
          localStorage.setItem('intentionalLogout', 'true')
        }
      }

      // Call server logout endpoint (uses nuxt-auth-utils)
      try {
        console.log('Calling server logout API endpoint')
        await clearSession()
        console.log('Server logout completed')
      } catch (apiError) {
        console.error('API logout error (non-critical):', apiError)
      }

      console.log('Logout completed successfully')
      return { success: true }
    } catch (error) {
      console.error('Logout error:', error)

      // Ensure local state is cleared even on error
      jwtToken.value = null
      sessionExpiry.value = null

      if (import.meta.client) {
        // Keep the intentionalLogout flag until the end of the logout process
        const intentionalLogout = localStorage.getItem('intentionalLogout')

        localStorage.removeItem('auth')
        localStorage.removeItem('isHandlingAuthError')
        localStorage.removeItem('lastLoginTime')

        // If this was an intentional logout, restore the flag
        if (intentionalLogout === 'true') {
          localStorage.setItem('intentionalLogout', 'true')
        }
      }

      return { success: true, error }
    }
  }

  // Get client limit based on subscription plan
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

  // Handle session expiry
  const handleSessionExpiry = async (showNotification = true) => {
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

  // Add status property for compatibility
  const status = computed(() => {
    return isLoggedIn.value ? 'authenticated' : 'unauthenticated'
  })

  return {
    user,
    isLoggedIn,
    token,
    status,
    isSubscriptionActive,
    login,
    register,
    logout,
    handleSessionExpiry,
    getClientLimit,
    refreshSession: async () => {
      // Call the refresh endpoint
      try {
        await $fetch('/api/auth/refresh', {
          method: 'POST',
          headers: token.value
            ? {
                Authorization: `Bearer ${token.value}`,
              }
            : undefined,
        })
        // Refresh the nuxt-auth-utils session
        await refreshSession()
        return { success: true }
      } catch (e) {
        console.error('Error refreshing session:', e)
        return { success: false, error: e }
      }
    },
  }
}
