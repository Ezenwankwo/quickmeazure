import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useAuthStore } from './auth'
import type { MeasurementTemplate } from '~/types'

// Define types for pending operations
interface PendingOperation {
  type: 'create' | 'update' | 'archive' | 'delete'
  templateId?: number
  timestamp: number
}

export const useMeasurementTemplatesStore = defineStore('measurementTemplates', () => {
  // State
  const templates = ref<MeasurementTemplate[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const lastFetched = ref<number>(0)
  const pendingOperations = ref<Record<string, PendingOperation>>({})
  const optimisticUpdates = ref<Record<number, MeasurementTemplate>>({})

  // Get Nuxt composables
  const { $fetch } = useNuxtApp()
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

      const { data } = await useAsyncData<MeasurementTemplate[]>(
        `measurement-templates-${includeArchived ? 'all' : 'active'}`,
        () => {
          return $fetch(`/measurement-templates${includeArchived ? '?includeArchived=true' : ''}`, {
            baseURL,
            headers: {
              'Content-Type': 'application/json',
              ...(authStore.token ? { Authorization: `Bearer ${authStore.token}` } : {}),
            },
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
      const optimisticTemplate = {
        ...templateData,
        id: tempId,
        archived: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      templates.value = [optimisticTemplate, ...templates.value]
      pendingOperations.value[operationId] = {
        type: 'create',
        templateId: tempId,
        timestamp: Date.now(),
      }
    }

    try {
      const response = await $fetch('/measurement-templates', {
        method: 'POST',
        body: templateData,
        baseURL,
        headers: {
          'Content-Type': 'application/json',
          ...(authStore.token ? { Authorization: `Bearer ${authStore.token}` } : {}),
        },
      })

      if (optimistic) {
        templates.value = templates.value.filter(t => t.id !== tempId)
        delete pendingOperations.value[operationId]
      }

      templates.value = [response, ...templates.value]
      return response
    } catch (err: any) {
      if (optimistic) {
        templates.value = templates.value.filter(t => t.id !== tempId)
        delete pendingOperations.value[operationId]
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
      }
      pendingOperations.value[operationId] = { type: 'update', templateId, timestamp: Date.now() }
    }

    try {
      const response = await $fetch(`/measurement-templates/${templateId}`, {
        method: 'PUT',
        body: updates,
        baseURL,
        headers: {
          'Content-Type': 'application/json',
          ...(authStore.token ? { Authorization: `Bearer ${authStore.token}` } : {}),
        },
      })

      if (optimistic) {
        delete pendingOperations.value[operationId]
      }

      templates.value[templateIndex] = response
      return response
    } catch (err: any) {
      if (optimistic) {
        templates.value[templateIndex] = originalTemplate
        delete pendingOperations.value[operationId]
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

    if (optimistic) {
      templates.value = templates.value.filter(t => t.id !== templateId)
      pendingOperations.value[operationId] = { type: 'delete', templateId, timestamp: Date.now() }
    }

    try {
      await $fetch(`/measurement-templates/${templateId}`, {
        method: 'DELETE',
        baseURL,
        headers: {
          'Content-Type': 'application/json',
          ...(authStore.token ? { Authorization: `Bearer ${authStore.token}` } : {}),
        },
      })

      if (optimistic) {
        delete pendingOperations.value[operationId]
      }

      return true
    } catch (err: any) {
      if (optimistic) {
        templates.value = [...templates.value, originalTemplate]
        delete pendingOperations.value[operationId]
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
    Object.entries(optimisticUpdates.value).forEach(([id, template]) => {
      const templateId = parseInt(id)
      const index = templates.value.findIndex(t => t.id === templateId)
      if (index !== -1) {
        templates.value[index] = { ...templates.value[index], ...template }
      }
    })
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
