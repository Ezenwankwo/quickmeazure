import { useAuthStore } from '~/store/modules/auth'
import type { Style, StyleFilterOptions } from '~/types/style'

const API_BASE = '/api'

interface StylesResponse {
  success: boolean
  data: Style[]
  total: number
  error?: string
}

interface StyleResponse {
  success: boolean
  data: Style | null
  error?: string
}

interface BaseResponse {
  success: boolean
  error?: string
}

export const useStyleApi = () => {
  const authStore = useAuthStore()
  const { $toast } = useNuxtApp()

  /**
   * Handle API errors consistently
   */
  const handleError = (error: any, defaultMessage: string) => {
    console.error('API Error:', error)
    const message = error.data?.message || error.message || defaultMessage

    // Show error toast
    $toast.error(message)

    return {
      success: false,
      error: message,
    }
  }

  /**
   * Fetch styles with optional filters
   */
  const getStyles = async (filters: Partial<StyleFilterOptions> = {}): Promise<StylesResponse> => {
    try {
      const queryParams = new URLSearchParams()

      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== '') {
          queryParams.append(key, String(value))
        }
      })

      const { data, error } = await useAsyncData<{ data: Style[]; total: number }>(
        `styles-${queryParams.toString()}`,
        () =>
          $fetch(`${API_BASE}/styles?${queryParams.toString()}`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              ...(authStore.token && { Authorization: `Bearer ${authStore.token}` }),
            },
            credentials: 'include',
          })
      )

      if (error.value) {
        throw error.value
      }

      return {
        success: true,
        data: data.value?.data || [],
        total: data.value?.total || 0,
      }
    } catch (error) {
      return handleError(error, 'Failed to fetch styles')
    }
  }

  /**
   * Fetch a single style by ID
   */
  const getStyleById = async (id: number): Promise<StyleResponse> => {
    try {
      const { data, error } = await useAsyncData<Style>(`style-${id}`, () =>
        $fetch(`${API_BASE}/styles/${id}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            ...(authStore.token && { Authorization: `Bearer ${authStore.token}` }),
          },
          credentials: 'include',
        })
      )

      if (error.value) {
        throw error.value
      }

      return {
        success: true,
        data: data.value,
      }
    } catch (error) {
      return handleError(error, `Failed to fetch style ${id}`)
    }
  }

  /**
   * Create a new style
   */
  const createStyle = async (styleData: Partial<Style>): Promise<StyleResponse> => {
    try {
      const response = await $fetch<Style>(`${API_BASE}/styles`, {
        method: 'POST',
        body: styleData,
        headers: {
          'Content-Type': 'application/json',
          ...(authStore.token && { Authorization: `Bearer ${authStore.token}` }),
        },
        credentials: 'include',
      })

      return {
        success: true,
        data: response,
      }
    } catch (error) {
      return handleError(error, 'Failed to create style')
    }
  }

  /**
   * Update an existing style
   */
  const updateStyle = async (id: number, styleData: Partial<Style>): Promise<StyleResponse> => {
    try {
      const response = await $fetch<Style>(`${API_BASE}/styles/${id}`, {
        method: 'PATCH',
        body: styleData,
        headers: {
          'Content-Type': 'application/json',
          ...(authStore.token && { Authorization: `Bearer ${authStore.token}` }),
        },
        credentials: 'include',
      })

      return {
        success: true,
        data: response,
      }
    } catch (error) {
      return handleError(error, `Failed to update style ${id}`)
    }
  }

  /**
   * Delete a style
   */
  const deleteStyle = async (id: number): Promise<BaseResponse> => {
    try {
      await $fetch(`${API_BASE}/styles/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          ...(authStore.token && { Authorization: `Bearer ${authStore.token}` }),
        },
        credentials: 'include',
      })

      return { success: true }
    } catch (error) {
      return handleError(error, `Failed to delete style ${id}`)
    }
  }

  return {
    getStyles,
    getStyleById,
    createStyle,
    updateStyle,
    deleteStyle,
  }
}

export default useStyleApi
