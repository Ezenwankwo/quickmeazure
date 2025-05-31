import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Style, StyleFilterOptions } from '~/types/style'

const API_BASE = '/api'

// Helper function to handle API errors
const handleApiError = (error: any, defaultMessage: string) => {
  console.error('API Error:', error)
  const message = error.data?.message || error.message || defaultMessage
  return { error: message, data: null }
}

export const useStyleStore = defineStore('style', () => {
  // State
  const styles = ref<Style[]>([])
  const currentStyle = ref<Style | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  const totalCount = ref(0)
  const filters = ref<StyleFilterOptions>({
    search: '',
    sortBy: 'updatedAt',
    sortOrder: 'desc',
  })

  // Getters
  const getStyleById = (id: number) => {
    return styles.value.find(style => style.id === id) || null
  }

  // Actions
  const fetchStyles = async (customFilters: Partial<StyleFilterOptions> = {}) => {
    try {
      isLoading.value = true
      error.value = null

      const queryParams = new URLSearchParams()
      const activeFilters = { ...filters.value, ...customFilters }

      Object.entries(activeFilters).forEach(([key, value]) => {
        if (value !== undefined && value !== '') {
          queryParams.append(key, String(value))
        }
      })

      const { data, error: fetchError } = await useAsyncData<{
        data: Style[]
        total: number
      }>(`styles-${queryParams.toString()}`, () =>
        $fetch(`${API_BASE}/styles?${queryParams.toString()}`)
      )

      if (fetchError.value) {
        throw new Error(fetchError.value.message || 'Failed to fetch styles')
      }

      if (data.value) {
        styles.value = data.value.data || []
        totalCount.value = data.value.total || 0
      }

      return styles.value
    } catch (err: any) {
      error.value = err.message || 'Failed to fetch styles'
      console.error('Error fetching styles:', err)
      return []
    } finally {
      isLoading.value = false
    }
  }

  const fetchStyleById = async (id: number) => {
    try {
      isLoading.value = true
      error.value = null

      const { data, error: fetchError } = await useAsyncData<Style>(`style-${id}`, () =>
        $fetch(`${API_BASE}/styles/${id}`)
      )

      if (fetchError.value) {
        throw new Error(fetchError.value.message || 'Failed to fetch style')
      }

      if (data.value) {
        currentStyle.value = data.value
      }

      return currentStyle.value
    } catch (err: any) {
      error.value = err.message || 'Failed to fetch style'
      console.error('Error fetching style:', err)
      return null
    } finally {
      isLoading.value = false
    }
  }

  const createStyle = async (styleData: Partial<Style>) => {
    try {
      isLoading.value = true
      error.value = null

      const data = await $fetch<Style>('/api/styles', {
        method: 'POST',
        body: styleData,
      })

      if (data) {
        styles.value.unshift(data)
        totalCount.value += 1
      }
      return data
    } catch (err: any) {
      const { error: apiError } = handleApiError(err, 'Failed to create style')
      error.value = apiError
      console.error('Error creating style:', err)
      return null
    } finally {
      isLoading.value = false
    }
  }

  const updateStyle = async (id: number, styleData: Partial<Style>) => {
    try {
      isLoading.value = true
      error.value = null

      const data = await $fetch<Style>(`/api/styles/${id}`, {
        method: 'PATCH',
        body: styleData,
      })

      if (data) {
        const index = styles.value.findIndex(s => s.id === id)
        if (index !== -1) {
          styles.value[index] = data
        }
        if (currentStyle.value?.id === id) {
          currentStyle.value = data
        }
      }
      return data
    } catch (err: any) {
      const { error: apiError } = handleApiError(err, 'Failed to update style')
      error.value = apiError
      console.error('Error updating style:', err)
      return null
    } finally {
      isLoading.value = false
    }
  }

  const deleteStyle = async (id: number) => {
    try {
      isLoading.value = true
      error.value = null

      await $fetch(`/api/styles/${id}`, {
        method: 'DELETE',
      })

      styles.value = styles.value.filter(style => style.id !== id)
      totalCount.value = Math.max(0, totalCount.value - 1)

      if (currentStyle.value?.id === id) {
        currentStyle.value = null
      }
      return true
    } catch (err: any) {
      const { error: apiError } = handleApiError(err, 'Failed to delete style')
      error.value = apiError
      console.error('Error deleting style:', err)
      return false
    } finally {
      isLoading.value = false
    }
  }

  const setFilters = (newFilters: Partial<StyleFilterOptions>) => {
    filters.value = { ...filters.value, ...newFilters }
  }

  const resetFilters = () => {
    filters.value = {
      search: '',
      sortBy: 'updatedAt',
      sortOrder: 'desc',
    }
  }

  return {
    // State
    styles,
    currentStyle,
    isLoading,
    error,
    totalCount,
    filters,

    // Getters
    getStyleById,

    // Actions
    fetchStyles,
    fetchStyleById,
    createStyle,
    updateStyle,
    deleteStyle,
    setFilters,
    resetFilters,
  }
})
