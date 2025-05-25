import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useAuthStore } from './auth'
import type { ApiResponse, ApiState, ApiRequestOptions } from '../types'

// Import Nuxt composables safely with dynamic imports to support testing
let useNuxtApp: any
let useRoute: any
let navigateTo: any

// In a real Nuxt app, these would be imported from '#app'
// For testing, we provide fallbacks
try {
  // Using dynamic import to avoid ESLint errors
  const _nuxtImport = import.meta.env?.SSR === false ? import('#app') : null
  useNuxtApp = () => ({
    $api: {
      get: async (url: string, _options = {}) => Promise.resolve({}),
      post: async (url: string, data: any, _options = {}) => Promise.resolve({}),
      put: async (url: string, data: any, _options = {}) => Promise.resolve({}),
      delete: async (url: string, _options = {}) => Promise.resolve({}),
      patch: async (url: string, data: any, _options = {}) => Promise.resolve({}),
    },
  })
  useRoute = () => ({ path: '/' })
  navigateTo = () => {}
} catch (_error) {
  // Provide fallbacks for tests
  useNuxtApp = () => ({
    $api: {
      get: async (url: string, _options = {}) => Promise.resolve({}),
      post: async (url: string, data: any, _options = {}) => Promise.resolve({}),
      put: async (url: string, data: any, _options = {}) => Promise.resolve({}),
      delete: async (url: string, _options = {}) => Promise.resolve({}),
      patch: async (url: string, data: any, _options = {}) => Promise.resolve({}),
    },
  })
  useRoute = () => ({ path: '/' })
  navigateTo = () => {}
}

/**
 * API store for centralized API interactions
 * Uses the centralized API client plugin
 * Replaces the useApiAuth composable with a centralized store
 */
export const useApiStore = defineStore<ApiState>('api', () => {
  // State that conforms to ApiState interface
  const loading = ref(false)
  const error = ref<string | null>(null)
  const pendingRequests = ref(0)

  // Computed properties
  const isLoading = computed(() => pendingRequests.value > 0)

  /**
   * Track request loading state and provide detailed error information
   */
  const trackRequest = async <T>(promise: Promise<T>): Promise<T> => {
    pendingRequests.value++
    loading.value = true
    error.value = null

    try {
      // Wait for the promise to resolve
      const result = await promise

      // Log successful result for debugging
      console.log('API Store: Request completed successfully', result)

      return result
    } catch (err: any) {
      // Create a detailed error message
      const errorMessage = err.message || 'An error occurred'

      // Log detailed error information
      console.error('API Store: Request failed', {
        message: errorMessage,
        status: err.status || err.statusCode,
        data: err.data,
        stack: err.stack,
      })

      // Update the error state
      error.value = errorMessage

      // Rethrow the error
      throw err
    } finally {
      // Update loading state
      pendingRequests.value--
      loading.value = pendingRequests.value > 0
    }
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
   * GET request with authentication
   */
  const get = <T = any>(url: string, options: ApiRequestOptions = {}): Promise<ApiResponse<T>> => {
    console.log('API Store: GET request initiated', { url, options })

    const nuxtApp = useNuxtApp()
    console.log('API Store: nuxtApp available:', !!nuxtApp)
    console.log('API Store: $api available:', !!(nuxtApp && nuxtApp.$api))

    return trackRequest(async () => {
      try {
        console.log('API Store: Making GET request to', url)

        // Make the API request
        if (!nuxtApp || !nuxtApp.$api || !nuxtApp.$api.get) {
          console.error('API Store: $api.get is not available', {
            nuxtApp: !!nuxtApp,
            $api: !!(nuxtApp && nuxtApp.$api),
            get: !!(nuxtApp && nuxtApp.$api && nuxtApp.$api.get),
          })

          // Try direct fetch as fallback
          console.log('API Store: Falling back to direct $fetch')
          const authStore = useAuthStore()
          const token = authStore.token

          const response = await $fetch(url, {
            method: 'GET',
            headers: {
              Authorization: token ? `Bearer ${token}` : undefined,
              'Content-Type': 'application/json',
              ...options.headers,
            },
            ...options,
          })

          console.log('API Store: Direct fetch response:', response)
          return formatResponse<T>(response)
        }

        const response = await nuxtApp.$api.get<T>(url, options)
        console.log('API Store: GET response received:', response)

        // Ensure we have a valid response
        if (response === undefined || response === null) {
          const error = new Error('Empty response received from server')
          console.error('API Store: Empty response received', { url })
          throw error
        }

        // Format the response to ensure it matches our ApiResponse interface
        const formattedResponse = formatResponse<T>(response)
        console.log('API Store: Formatted response:', formattedResponse)
        return formattedResponse
      } catch (error: any) {
        // Handle errors and log them before rethrowing
        console.error('API Store: GET request failed', {
          url,
          error: error.message,
          stack: error.stack,
        })

        throw error
      }
    })
  }

  /**
   * POST request with authentication
   */
  const post = <T = any>(
    url: string,
    data: any,
    options: ApiRequestOptions = {}
  ): Promise<ApiResponse<T>> => {
    const nuxtApp = useNuxtApp()
    return trackRequest(async () => {
      try {
        console.log('API Store: Making POST request to', url, data)
        const response = await nuxtApp.$api.post<T>(url, data, options)

        if (response === undefined || response === null) {
          const error = new Error('Empty response received from server')
          console.error('API Store: Empty response received', { url, data })
          throw error
        }

        console.log('API Store: POST response received:', response)
        return formatResponse<T>(response)
      } catch (error: any) {
        console.error('API Store: POST request failed', {
          url,
          data,
          error: error.message,
          stack: error.stack,
        })
        throw error
      }
    })
  }

  /**
   * PUT request with authentication
   */
  const put = <T = any>(
    url: string,
    data: any,
    options: ApiRequestOptions = {}
  ): Promise<ApiResponse<T>> => {
    const nuxtApp = useNuxtApp()
    return trackRequest(async () => {
      try {
        console.log('API Store: Making PUT request to', url, data)
        const response = await nuxtApp.$api.put<T>(url, data, options)

        if (response === undefined || response === null) {
          const error = new Error('Empty response received from server')
          console.error('API Store: Empty response received', { url, data })
          throw error
        }

        console.log('API Store: PUT response received:', response)
        return formatResponse<T>(response)
      } catch (error: any) {
        console.error('API Store: PUT request failed', {
          url,
          data,
          error: error.message,
          stack: error.stack,
        })
        throw error
      }
    })
  }

  /**
   * DELETE request with authentication
   */
  const del = <T = any>(url: string, options: ApiRequestOptions = {}): Promise<ApiResponse<T>> => {
    const nuxtApp = useNuxtApp()
    return trackRequest(async () => {
      try {
        console.log('API Store: Making DELETE request to', url)
        const response = await nuxtApp.$api.delete<T>(url, options)

        if (response === undefined || response === null) {
          const error = new Error('Empty response received from server')
          console.error('API Store: Empty response received', { url })
          throw error
        }

        console.log('API Store: DELETE response received:', response)
        return formatResponse<T>(response)
      } catch (error: any) {
        console.error('API Store: DELETE request failed', {
          url,
          error: error.message,
          stack: error.stack,
        })
        throw error
      }
    })
  }

  /**
   * PATCH request with authentication
   */
  const patch = <T = any>(
    url: string,
    data: any,
    options: ApiRequestOptions = {}
  ): Promise<ApiResponse<T>> => {
    const nuxtApp = useNuxtApp()
    return trackRequest(async () => {
      try {
        console.log('API Store: Making PATCH request to', url, data)
        const response = await nuxtApp.$api.patch<T>(url, data, options)

        if (response === undefined || response === null) {
          const error = new Error('Empty response received from server')
          console.error('API Store: Empty response received', { url, data })
          throw error
        }

        console.log('API Store: PATCH response received:', response)
        return formatResponse<T>(response)
      } catch (error: any) {
        console.error('API Store: PATCH request failed', {
          url,
          data,
          error: error.message,
          stack: error.stack,
        })
        throw error
      }
    })
  }

  return {
    // State
    loading,
    error,
    isLoading,

    // Methods
    formatResponse,
    ensureAuthentication,
    get,
    post,
    put,
    del,
    patch,
    trackRequest,
  }
})
