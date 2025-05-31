// Types
import type { MeasurementTemplate } from '~/types/measurement'

// Constants
import { API_ENDPOINTS } from '~/constants/api'

// Types for pending operations
interface PendingOperation {
  type: 'create' | 'update' | 'archive' | 'delete'
  templateId?: number
  timestamp: number
}

// Store for managing measurement templates
export const useMeasurementTemplatesStore = defineStore('measurementTemplates', () => {
  // State
  const templates = ref<MeasurementTemplate[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const lastFetched = ref<number>(0)
  const pendingOperations = ref<Map<string, PendingOperation>>(new Map())
  const optimisticUpdates = ref<Map<number, MeasurementTemplate>>(new Map())

  // Get Nuxt composables
  const config = useRuntimeConfig()
  const baseURL = config.public.apiBase || '/api'
  const authStore = useAuthStore()

  /**
   * Fetch measurement templates from the API
   */
  const fetchTemplates = async (includeArchived = false, forceRefresh = false) => {
    try {
      // Check cache if not forcing refresh
      if (!forceRefresh && templates.value.length > 0) {
        const now = Date.now()
        const cacheAge = now - lastFetched.value
        if (cacheAge < 5 * 60 * 1000) {
          return templates.value
        }
      }

      loading.value = true
      error.value = null

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      }

      if (authStore.token) {
        headers['Authorization'] = `Bearer ${authStore.token}`
      }

      const { data } = await useAsyncData<MeasurementTemplate[]>(
        `measurement-templates-${includeArchived ? 'all' : 'active'}`,
        () => {
          const url = includeArchived
            ? `${API_ENDPOINTS.MEASUREMENTS.TEMPLATES}?includeArchived=true`
            : API_ENDPOINTS.MEASUREMENTS.TEMPLATES

          return $fetch(url, {
            baseURL,
            headers,
          })
        },
        {
          server: true,
          lazy: true,
          default: () => [],
          transform: (data: any) => (Array.isArray(data) ? data : data?.data || []),
        }
      )

      templates.value = data.value || []
      lastFetched.value = Date.now()
      error.value = null
      applyPendingOptimisticUpdates()
      return templates.value
    } catch (err: any) {
      error.value = err.message || 'Failed to fetch templates'
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Create a new template
   */
  const createTemplate = async (templateData: any, optimistic = true) => {
    loading.value = true
    error.value = null

    const tempId = -Date.now()
    const operationId = `create-${tempId}`

    if (optimistic) {
      const optimisticTemplate: MeasurementTemplate = {
        ...templateData,
        id: tempId,
        archived: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      } as MeasurementTemplate
      templates.value = [optimisticTemplate, ...templates.value]
      pendingOperations.value.set(operationId, {
        type: 'create',
        templateId: tempId,
        timestamp: Date.now(),
      })
    }

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      }

      if (authStore.token) {
        headers['Authorization'] = `Bearer ${authStore.token}`
      }

      const response = await $fetch(API_ENDPOINTS.MEASUREMENTS.TEMPLATES, {
        method: 'POST',
        body: JSON.stringify(templateData),
        baseURL,
        headers,
      })

      if (optimistic) {
        templates.value = templates.value.filter(t => t.id !== tempId)
        pendingOperations.value.delete(operationId)
      }

      templates.value = [response, ...templates.value]
      return response
    } catch (err: any) {
      if (optimistic) {
        templates.value = templates.value.filter(t => t.id !== tempId)
        pendingOperations.value.delete(operationId)
      }
      error.value = err.message || 'Failed to create template'
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Update an existing template
   */
  const updateTemplate = async (templateId: number, updates: any, optimistic = true) => {
    loading.value = true
    error.value = null

    const operationId = `update-${templateId}-${Date.now()}`
    const templateIndex = templates.value.findIndex(t => t.id === templateId)

    if (templateIndex === -1) {
      throw new Error(`Template with ID ${templateId} not found`)
    }

    const originalTemplate = { ...templates.value[templateIndex] }

    if (optimistic) {
      templates.value[templateIndex] = {
        ...originalTemplate,
        ...updates,
        updatedAt: new Date().toISOString(),
      } as MeasurementTemplate
      pendingOperations.value.set(operationId, {
        type: 'update',
        templateId,
        timestamp: Date.now(),
      })
    }

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      }

      if (authStore.token) {
        headers['Authorization'] = `Bearer ${authStore.token}`
      }

      // Use $fetch directly for non-GET requests
      const response = await $fetch(API_ENDPOINTS.MEASUREMENTS.TEMPLATE_BY_ID(templateId), {
        method: 'PUT',
        body: updates,
        baseURL,
        headers,
        credentials: 'include',
      })

      if (optimistic) {
        pendingOperations.value.delete(operationId)
      }

      if (response) {
        templates.value[templateIndex] = response
        return response
      }

      throw new Error('No response data received')
    } catch (err: any) {
      if (optimistic) {
        templates.value[templateIndex] = originalTemplate
        pendingOperations.value.delete(operationId)
      }
      error.value = err.message || 'Failed to update template'
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Delete a template
   */
  const deleteTemplate = async (templateId: number, optimistic = true) => {
    loading.value = true
    error.value = null

    const operationId = `delete-${templateId}-${Date.now()}`
    const templateIndex = templates.value.findIndex(t => t.id === templateId)

    if (templateIndex === -1) {
      throw new Error(`Template with ID ${templateId} not found`)
    }

    const originalTemplate = { ...templates.value[templateIndex] }

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      }

      if (authStore.token) {
        headers['Authorization'] = `Bearer ${authStore.token}`
      }

      // Use $fetch directly for non-GET requests
      await $fetch(API_ENDPOINTS.MEASUREMENTS.TEMPLATE_BY_ID(templateId), {
        method: 'DELETE',
        baseURL,
        headers,
        credentials: 'include',
      })

      if (optimistic) {
        pendingOperations.value.delete(operationId)
      }

      if (optimistic) {
        templates.value = templates.value.filter(t => t.id !== templateId)
      }

      return true
    } catch (err: any) {
      if (optimistic) {
        templates.value = [...templates.value, originalTemplate]
        pendingOperations.value.delete(operationId)
      }
      error.value = err.message || 'Failed to delete template'
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Apply any pending optimistic updates
   */
  const applyPendingOptimisticUpdates = () => {
    optimisticUpdates.value.forEach((template, id) => {
      const index = templates.value.findIndex(t => t.id === id)
      if (index !== -1) {
        templates.value[index] = template
      }
    })
    optimisticUpdates.value.clear()
  }

  return {
    // State
    templates,
    loading,
    error,
    lastFetched,
    pendingOperations,
    optimisticUpdates,

    // Actions
    fetchTemplates,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    applyPendingOptimisticUpdates,

    // Getters
    getTemplateById: (id: number) => templates.value.find(t => t.id === id),
    getActiveTemplates: () => templates.value.filter(t => !t.archived),
    getArchivedTemplates: () => templates.value.filter(t => t.archived),
  }
})
