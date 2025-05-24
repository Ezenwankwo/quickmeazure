import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useAuthStore } from './auth'

export interface ApiResponse<T = any> {
  data: T | null
  success: boolean
  error?: string
  statusCode?: number
}

/**
 * API store for centralized API interactions
 * Replaces the useApiAuth composable with a centralized store
 */
export const useApiStore = defineStore('api', () => {
  // State
  const loading = ref(false)
  const error = ref<string | null>(null)
  const isMounted = ref(false)

  // Set mounted state when component mounts
  if (import.meta.client) {
    onMounted(() => {
      isMounted.value = true
    })
  }

  /**
   * Format API response into a consistent structure
   */
  const formatResponse = <T>(response: any): ApiResponse<T> => {
    // If response is already in our expected format, return it
    if (response && typeof response === 'object' && 'success' in response) {
      return response as ApiResponse<T>
    }

    // Otherwise, format it into our standard structure
    return {
      data: response,
      success: true,
    }
  }

  /**
   * Handle API errors including 401 unauthorized responses
   */
  const handleApiError = async (error: any): Promise<void> => {
    if (!error) return

    const authStore = useAuthStore()
    const route = useRoute()
    const toast = useToast()

    // Check if this is an intentional logout
    const isIntentionalLogout =
      import.meta.client && localStorage.getItem('intentionalLogout') === 'true'
    if (isIntentionalLogout) return // Skip all error toasts during intentional logout

    // Extract status code
    const statusCode = error.statusCode || error.status || 500

    // Handle 401 errors (unauthorized) - try to refresh token first
    if (statusCode === 401 && !route.path.includes('/auth/')) {
      // Check if we're already handling a refresh to prevent loops
      const isHandlingRefresh =
        import.meta.client && localStorage.getItem('isHandlingTokenRefresh') === 'true'

      if (!isHandlingRefresh) {
        try {
          // Try to refresh the token
          const result = await authStore.refreshSession()

          // If refresh failed, handle session expiry
          if (!result.success) {
            authStore.handleSessionExpiry(true)
          }

          return // Exit early if we've handled the refresh
        } catch (_) {
          // If refresh failed, proceed with session expiry
          authStore.handleSessionExpiry(true)
          return
        }
      } else {
        // We're already handling a refresh, just proceed with session expiry
        authStore.handleSessionExpiry(true)
      }
    }

    // Handle other common API errors with appropriate UI feedback
    else if (statusCode === 403) {
      toast.add({
        title: 'Access Denied',
        description: 'You do not have permission to perform this action',
        color: 'error',
      })
    } else if (statusCode === 404) {
      toast.add({
        title: 'Not Found',
        description: 'The requested resource could not be found',
        color: 'warning',
      })
    } else if (statusCode >= 500) {
      toast.add({
        title: 'Server Error',
        description: 'A server error occurred. Please try again later',
        color: 'error',
      })
    }
  }

  /**
   * Check if authentication is available
   */
  const ensureAuthentication = (redirect = true): boolean => {
    const authStore = useAuthStore()
    const route = useRoute()

    if (!authStore.isLoggedIn || !authStore.token) {
      // If we're not on a login/register page, redirect to login
      if (redirect && !route.path.includes('/auth/')) {
        navigateTo('/auth/login')
      }
      return false
    }
    return true
  }

  /**
   * Wrapped version of fetch with authentication support
   * Detects whether to use $fetch or useFetch based on mounted state
   */
  const authFetch = async <T = any>(url: string, options: any = {}): Promise<ApiResponse<T>> => {
    const authStore = useAuthStore()

    // Make sure headers exist in options
    const headers = {
      ...options.headers,
      ...authStore.getAuthHeaders(),
    }

    // If component is already mounted, use $fetch directly as recommended
    if (import.meta.client && isMounted.value) {
      try {
        const response = await $fetch(url, {
          ...options,
          headers,
        })
        return formatResponse<T>(response)
      } catch (error: any) {
        await handleApiError(error)
        throw error
      }
    }

    // Otherwise use useFetch during SSR or initial render
    options.headers = headers

    // Add onResponse handler
    const onResponseError = options.onResponseError
    options.onResponseError = (context: any) => {
      // Call original handler if it exists
      if (onResponseError) {
        onResponseError(context)
      }

      // Handle API errors
      handleApiError(context.error)
    }

    // Use useFetch during server-side rendering or initial client load
    const { data, error } = await useFetch<T>(url, options)

    if (error.value) {
      await handleApiError(error.value)
      throw error.value
    }

    return formatResponse<T>(data.value)
  }

  /**
   * GET request with authentication
   */
  const get = async <T = any>(url: string, options: any = {}): Promise<ApiResponse<T>> => {
    return authFetch<T>(url, { ...options, method: 'GET' })
  }

  /**
   * POST request with authentication
   */
  const post = async <T = any>(
    url: string,
    data: any,
    options: any = {}
  ): Promise<ApiResponse<T>> => {
    return authFetch<T>(url, { ...options, method: 'POST', body: data })
  }

  /**
   * PUT request with authentication
   */
  const put = async <T = any>(
    url: string,
    data: any,
    options: any = {}
  ): Promise<ApiResponse<T>> => {
    return authFetch<T>(url, { ...options, method: 'PUT', body: data })
  }

  /**
   * DELETE request with authentication
   */
  const del = async <T = any>(url: string, options: any = {}): Promise<ApiResponse<T>> => {
    return authFetch<T>(url, { ...options, method: 'DELETE' })
  }

  return {
    // State
    loading,
    error,

    // Methods
    formatResponse,
    handleApiError,
    ensureAuthentication,
    authFetch,
    get,
    post,
    put,
    del,
  }
})
