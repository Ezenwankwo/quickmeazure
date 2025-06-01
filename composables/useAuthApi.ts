import { useAuthStore } from '~/store'

export function useAuthApi() {
  const authStore = useAuthStore()
  const toast = useToast()
  const router = useRouter()

  /**
   * Log in a user
   */
  async function login(credentials: { email: string; password: string; remember?: boolean }) {
    try {
      const response = await $fetch('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: credentials.email,
          password: credentials.password,
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response) {
        throw new Error('No response received from server')
      }

      // Handle case where response is not in expected format but still contains data
      let responseData = response
      if (response.success === undefined) {
        responseData = { success: true, data: response }
      }

      if (!responseData.success || !responseData.data) {
        throw new Error(responseData.error || 'Login failed')
      }

      const { token, user } = responseData.data

      // Update auth state
      await authStore.setAuthState({
        user,
        token,
        remember: !!credentials.remember,
      })

      return { success: true, user }
    } catch (error: any) {
      console.error('Login error:', error)
      const errorMessage = error.data?.message || error.message || 'Login failed'
      toast.add({
        title: 'Login Error',
        description: errorMessage,
        color: 'error',
        icon: 'i-heroicons-exclamation-triangle',
      })
      return { success: false, error: errorMessage }
    }
  }

  /**
   * Register a new user
   */
  async function register(userData: {
    name: string
    email: string
    password: string
    subscriptionPlan?: string
  }) {
    try {
      const response = await $fetch('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          name: userData.name,
          email: userData.email,
          password: userData.password,
          subscriptionPlan: userData.subscriptionPlan || 'free',
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response) {
        throw new Error('No response received from server')
      }

      // Handle case where response is not in expected format but still contains data
      let responseData = response
      if (response.success === undefined) {
        responseData = { success: true, data: response }
      }

      if (!responseData.success || !responseData.data) {
        throw new Error(responseData.error || 'Registration failed')
      }

      const { token, user } = responseData.data

      // Update auth state
      await authStore.setAuthState({
        user,
        token,
        remember: false,
      })

      // Show success message
      toast.add({
        title: 'Registration Successful',
        description: 'Your account has been created!',
        color: 'primary',
        icon: 'i-heroicons-check-circle',
      })

      return { success: true, user }
    } catch (error: any) {
      console.error('Registration error:', error)
      const errorMessage = error.data?.message || error.message || 'Registration failed'

      // Show error toast
      toast.add({
        title: 'Registration Error',
        description: errorMessage,
        color: 'error',
        icon: 'i-heroicons-exclamation-triangle',
      })

      return { success: false, error: errorMessage }
    }
  }

  /**
   * Log out the current user
   */
  async function logout() {
    try {
      // Call server logout endpoint if we have a token
      if (authStore.token) {
        try {
          await $fetch('/api/auth/logout', {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${authStore.token}`,
              'X-Refresh-Token': authStore.refreshToken || '',
              'Content-Type': 'application/json',
            },
          })
        } catch (apiError) {
          console.error('API logout error (non-critical):', apiError)
          // Continue with client-side logout even if API call fails
        }
      }

      // Clear auth state
      authStore.logout()

      // Redirect to login page
      await router.push('/auth/login')

      return { success: true }
    } catch (error) {
      console.error('Logout error:', error)
      return { success: false, error: 'Failed to log out' }
    }
  }

  /**
   * Refresh the authentication token
   */
  async function refreshToken() {
    try {
      const response = await $fetch<{
        success: boolean
        data?: { token: string; refreshToken?: string; user?: any }
        error?: string
      }>('/api/auth/refresh', {
        method: 'POST',
        headers: {
          Authorization: authStore.token ? `Bearer ${authStore.token}` : '',
          'X-Refresh-Token': authStore.refreshToken || '',
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      })

      if (!response || !response.success || !response.data || !response.data.token) {
        throw new Error(response?.error || 'Invalid response from token refresh')
      }

      // Update token in auth store
      authStore.setToken(response.data.token, response.data.refreshToken)

      // Update user data if provided
      if (response.data.user) {
        authStore.updateUserProfile(response.data.user)
      }

      return { success: true, token: response.data.token }
    } catch (error: any) {
      console.error('Token refresh failed:', error)

      // If refresh fails with 401/403, the session is likely invalid
      if (error.status === 401 || error.status === 403) {
        console.log('Session invalid during refresh, logging out')
        await authStore.logout()
        await router.push('/auth/login')
      }

      return {
        success: false,
        error: error.message || 'Failed to refresh token',
        requiresLogin: true,
      }
    }
  }

  return {
    login,
    register,
    logout,
    refreshToken,
  }
}

export default useAuthApi
