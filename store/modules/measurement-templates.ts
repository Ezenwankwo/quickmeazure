import { defineStore, storeToRefs } from 'pinia'
import { ref } from 'vue'
import { useApiStore } from './api'
import { useAuthStore } from './auth'
import type { MeasurementTemplate } from '~/types'

// Define types for pending operations
interface PendingOperation {
  type: 'create' | 'update' | 'archive' | 'delete'
  templateId?: number
  timestamp: number
}

/**
 * Measurement Templates store
 * Replaces the useMeasurementTemplates composable with a centralized store
 */
export const useMeasurementTemplatesStore = defineStore('measurementTemplates', () => {
  // State
  const templates = ref<MeasurementTemplate[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const lastFetched = ref<number>(0)
  const pendingOperations = ref<Record<string, PendingOperation>>({}) // Track pending operations
  const optimisticUpdates = ref<Record<number, MeasurementTemplate>>({}) // Track optimistic updates

  // Get stores for making requests and auth
  const apiStore = useApiStore()
  const _authStore = useAuthStore() // Prefixed with _ to avoid lint warning

  /**
   * Fetch measurement templates from the API
   * @param includeArchived Whether to include archived templates
   * @param forceRefresh Force a refresh from the API even if we have cached data
   */
  const fetchTemplates = async (includeArchived = false, forceRefresh = false) => {
    try {
      // Check if we have cached data and it's not a forced refresh
      if (!forceRefresh && templates.value.length > 0) {
        const now = Date.now()
        const cacheAge = now - lastFetched.value
        // If cache is less than 5 minutes old, use it
        if (cacheAge < 5 * 60 * 1000) {
          console.log('Using cached templates, age:', Math.round(cacheAge / 1000), 'seconds')
          return templates.value
        }
      }

      // Set loading state
      loading.value = true
      error.value = null

      console.log('Fetching templates from API...', { includeArchived, forceRefresh })

      // Get auth token for authenticated requests
      const authStore = useAuthStore()
      const token = authStore.token

      // Build URL with query parameters
      const url = `/api/measurement-templates${includeArchived ? '?includeArchived=true' : ''}`

      console.log('Fetching templates with direct fetch:', url)

      // Make the fetch request directly
      const fetchResponse = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: token ? `Bearer ${token}` : '',
        },
        cache: 'no-store', // Ensure we don't use cached data
      })

      if (!fetchResponse.ok) {
        throw new Error(`API error: ${fetchResponse.status} ${fetchResponse.statusText}`)
      }

      // Parse the JSON response
      const data = await fetchResponse.json()
      console.log('Templates API response:', data)

      // Update templates in store - ensure we have an array
      const templatesData = Array.isArray(data) ? data : data.data || []
      templates.value = templatesData
      lastFetched.value = Date.now()

      // Reset error state
      error.value = null

      // Apply any pending optimistic updates that haven't been confirmed yet
      applyPendingOptimisticUpdates()

      console.log('Templates loaded successfully:', templates.value.length, 'templates')
      return templates.value
    } catch (err) {
      // Handle network or unexpected errors
      const errorMessage = err.message || 'Failed to fetch measurement templates'
      console.error('Error fetching measurement templates:', errorMessage)
      error.value = errorMessage

      // Keep existing data on error if available
      if (templates.value.length === 0) {
        templates.value = []
      }

      // Rethrow for component-level handling if needed
      throw new Error(errorMessage)
    } finally {
      loading.value = false
    }
  }

  /**
   * Helper function to remove a key from an object without using delete operator
   */
  const removeKeyFromObject = <T extends Record<string, any>>(
    obj: T,
    keyToRemove: string | number
  ): Omit<T, string> => {
    return Object.keys(obj).reduce(
      (result, key) => {
        if (key !== String(keyToRemove)) {
          result[key] = obj[key]
        }
        return result
      },
      {} as Omit<T, string>
    )
  }

  /**
   * Apply any pending optimistic updates to the templates list
   * This ensures optimistic updates persist even after a refresh
   */
  const applyPendingOptimisticUpdates = () => {
    // Apply any optimistic updates that are still pending
    Object.entries(optimisticUpdates.value).forEach(([id, template]) => {
      const templateId = parseInt(id)
      const index = templates.value.findIndex(t => t.id === templateId)

      if (index !== -1) {
        templates.value[index] = { ...templates.value[index], ...template }
      }
    })
  }

  /**
   * Create a new measurement template with optimistic updates
   * @param templateData Template data to create
   * @param optimistic Whether to use optimistic updates
   */
  const createTemplate = async (
    templateData: {
      name: string
      gender: 'male' | 'female' | 'unisex'
      fields: Omit<MeasurementField, 'id' | 'templateId' | 'createdAt'>[]
    },
    optimistic = true
  ) => {
    loading.value = true
    error.value = null

    // Generate a temporary ID for optimistic updates
    const tempId = -Date.now()
    const operationId = `create-${tempId}`

    // Create optimistic template with temporary ID
    const optimisticTemplate = {
      id: tempId,
      name: templateData.name,
      gender: templateData.gender,
      fields: templateData.fields.map((field, index) => ({
        ...field,
        id: -(Date.now() + index),
        templateId: tempId,
        createdAt: new Date().toISOString(),
      })),
      archived: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    } as MeasurementTemplate

    // Apply optimistic update if enabled
    if (optimistic) {
      // Add to templates list optimistically
      templates.value = [optimisticTemplate, ...templates.value]

      // Track pending operation
      pendingOperations.value[operationId] = true
    }

    try {
      const response = await apiStore.post('/api/measurement-templates', templateData)

      if (response.success) {
        // Remove optimistic entry and add real one
        if (optimistic) {
          templates.value = templates.value.filter(t => t.id !== tempId)
        }

        // Add the real template to the list
        const newTemplate = response.data
        templates.value = [newTemplate, ...templates.value]

        // Clear pending operation
        const updatedPendingOps = { ...pendingOperations.value }
        delete updatedPendingOps[operationId]
        pendingOperations.value = updatedPendingOps

        return newTemplate
      } else {
        // Revert optimistic update on error
        if (optimistic) {
          templates.value = templates.value.filter(t => t.id !== tempId)
          const updatedPendingOps = { ...pendingOperations.value }
          delete updatedPendingOps[operationId]
          pendingOperations.value = updatedPendingOps
        }

        throw new Error(response.error || 'Failed to create template')
      }
    } catch (err: any) {
      // Revert optimistic update on error
      if (optimistic) {
        templates.value = templates.value.filter(t => t.id !== tempId)
        const updatedPendingOps = { ...pendingOperations.value }
        delete updatedPendingOps[operationId]
        pendingOperations.value = updatedPendingOps
      }

      const errorMessage = err.message || 'Failed to create measurement template'
      console.error('Error creating measurement template:', errorMessage)
      error.value = errorMessage
      throw new Error(errorMessage)
    } finally {
      loading.value = false
    }
  }

  /**
   * Update an existing measurement template with optimistic updates
   * @param templateId ID of the template to update
   * @param updates Template updates to apply
   * @param optimistic Whether to use optimistic updates
   */
  const updateTemplate = async (
    templateId: number,
    updates: {
      name: string
      gender: 'male' | 'female' | 'unisex'
      fields: Array<Omit<MeasurementField, 'id' | 'templateId' | 'createdAt'>>
    },
    optimistic = true
  ) => {
    loading.value = true
    error.value = null

    // Find existing template
    const existingTemplate = templates.value.find(t => t.id === templateId)
    if (!existingTemplate && !optimistic) {
      // If template doesn't exist locally and we're not using optimistic updates,
      // fetch it first
      try {
        await fetchTemplateWithFields(templateId)
      } catch (_err) {
        console.error(`Template with ID ${templateId} not found, cannot update`)
        throw new Error(`Template with ID ${templateId} not found`)
      }
    }

    const operationId = `update-${templateId}-${Date.now()}`

    // Create optimistic update
    if (optimistic) {
      // Store original template for rollback if needed
      optimisticUpdates.value[templateId] = { ...updates } as any

      // Apply optimistic update
      const index = templates.value.findIndex(t => t.id === templateId)
      if (index !== -1) {
        templates.value[index] = {
          ...templates.value[index],
          ...updates,
          updatedAt: new Date().toISOString(),
        }
      }

      // Track pending operation
      const updatedPendingOps = { ...pendingOperations.value }
      updatedPendingOps[operationId] = true
      pendingOperations.value = updatedPendingOps
    }

    try {
      const response = await apiStore.put(`/api/measurement-templates/${templateId}`, updates)

      if (response.success) {
        // Update was successful, update the template with actual server data
        const updatedTemplate = response.data

        // Find and update the template in the list
        const index = templates.value.findIndex(t => t.id === templateId)
        if (index !== -1) {
          templates.value[index] = updatedTemplate
        }

        // Remove optimistic update
        if (optimistic) {
          const updatedOptimisticUpdates = { ...optimisticUpdates.value }
          delete updatedOptimisticUpdates[templateId]
          optimisticUpdates.value = updatedOptimisticUpdates

          // Clear pending operation
          const updatedPendingOps = { ...pendingOperations.value }
          delete updatedPendingOps[operationId]
          pendingOperations.value = updatedPendingOps
        }

        return updatedTemplate
      } else {
        // Revert optimistic update on error
        if (optimistic) {
          // Refresh to get original state
          await fetchTemplates(true)

          // Clear pending operation
          const updatedPendingOps = { ...pendingOperations.value }
          delete updatedPendingOps[operationId]
          pendingOperations.value = updatedPendingOps

          // Clear optimistic update
          const updatedOptimisticUpdates = { ...optimisticUpdates.value }
          delete updatedOptimisticUpdates[templateId]
          optimisticUpdates.value = updatedOptimisticUpdates
        }

        throw new Error(response.error || 'Failed to update template')
      }
    } catch (err: any) {
      // Revert optimistic update on error
      if (optimistic) {
        // Refresh to get original state
        await fetchTemplates(true)

        // Clear pending operation
        const updatedPendingOps = { ...pendingOperations.value }
        delete updatedPendingOps[operationId]
        pendingOperations.value = updatedPendingOps

        // Clear optimistic update
        const updatedOptimisticUpdates = { ...optimisticUpdates.value }
        delete updatedOptimisticUpdates[templateId]
        optimisticUpdates.value = updatedOptimisticUpdates
      }

      const errorMessage = err.message || 'Failed to update measurement template'
      console.error('Error updating measurement template:', errorMessage)
      error.value = errorMessage
      throw new Error(errorMessage)
    } finally {
      loading.value = false
    }
  }

  /**
   * Fetch a single template with its fields
   * @param templateId ID of the template to fetch
   */
  const fetchTemplateWithFields = async (templateId: number) => {
    loading.value = true
    error.value = null

    try {
      const response = await apiStore.get(`/api/measurement-templates/${templateId}`)

      if (response.success) {
        // Add the template to the list if it's not already there
        const exists = templates.value.some(t => t.id === templateId)
        if (!exists) {
          templates.value = [...templates.value, response.data]
        } else {
          // Update the existing template
          const index = templates.value.findIndex(t => t.id === templateId)
          if (index !== -1) {
            templates.value[index] = response.data
          }
        }
        return response.data
      } else {
        throw new Error(response.error || `Failed to fetch template ${templateId}`)
      }
    } catch (err) {
      const errorMessage = err.message || `Failed to fetch template ${templateId}`
      console.error(`Error fetching template ${templateId}:`, errorMessage)
      error.value = errorMessage
      throw new Error(errorMessage)
    } finally {
      loading.value = false
    }
  }

  /**
   * Archive a measurement template with optimistic updates
   * @param templateId ID of the template to archive
   * @param optimistic Whether to use optimistic updates
   */
  const archiveTemplate = async (templateId: number, optimistic = true) => {
    loading.value = true
    error.value = null

    // Find the template to archive
    const templateIndex = templates.value.findIndex(t => t.id === templateId)
    if (templateIndex === -1) {
      console.error(`Template with ID ${templateId} not found, cannot archive`)
      throw new Error(`Template with ID ${templateId} not found`)
    }

    // Store original template for rollback
    const originalTemplate = { ...templates.value[templateIndex] }
    const operationId = `archive-${templateId}-${Date.now()}`

    // Apply optimistic update if enabled
    if (optimistic) {
      // Update template status optimistically
      templates.value[templateIndex] = {
        ...templates.value[templateIndex],
        archived: true,
        updatedAt: new Date().toISOString(),
      }

      // Track pending operation
      const updatedPendingOps = { ...pendingOperations.value }
      updatedPendingOps[operationId] = true
      pendingOperations.value = updatedPendingOps
    }

    try {
      const response = await apiStore.post(`/api/measurement-templates/${templateId}/archive`, {})

      if (response.success) {
        // Update with actual server data
        if (templateIndex !== -1) {
          templates.value[templateIndex] = response.data
        }

        // Clear pending operation
        if (optimistic) {
          const updatedPendingOps = { ...pendingOperations.value }
          delete updatedPendingOps[operationId]
          pendingOperations.value = updatedPendingOps
        }

        return response.data
      } else {
        // Revert optimistic update on error
        if (optimistic) {
          // Restore original template
          templates.value[templateIndex] = originalTemplate

          // Clear pending operation
          const updatedPendingOps = { ...pendingOperations.value }
          delete updatedPendingOps[operationId]
          pendingOperations.value = updatedPendingOps
        }

        throw new Error(response.error || 'Failed to archive template')
      }
    } catch (err: any) {
      // Revert optimistic update on error
      if (optimistic && templateIndex !== -1) {
        // Restore original template
        templates.value[templateIndex] = originalTemplate

        // Clear pending operation
        const updatedPendingOps = { ...pendingOperations.value }
        delete updatedPendingOps[operationId]
        pendingOperations.value = updatedPendingOps
      }

      const errorMessage = err.message || 'Failed to archive measurement template'
      console.error('Error archiving measurement template:', errorMessage)
      error.value = errorMessage
      throw new Error(errorMessage)
    } finally {
      loading.value = false
    }
  }

  /**
   * Unarchive a measurement template with optimistic updates
   * @param templateId ID of the template to unarchive
   * @param optimistic Whether to use optimistic updates
   */
  const unarchiveTemplate = async (templateId: number, optimistic = true) => {
    loading.value = true
    error.value = null

    // Find the template to unarchive
    const templateIndex = templates.value.findIndex(t => t.id === templateId)
    if (templateIndex === -1) {
      console.error(`Template with ID ${templateId} not found, cannot unarchive`)
      throw new Error(`Template with ID ${templateId} not found`)
    }

    // Store original template for rollback
    const originalTemplate = { ...templates.value[templateIndex] }
    const operationId = `unarchive-${templateId}-${Date.now()}`

    // Apply optimistic update if enabled
    if (optimistic) {
      // Update template status optimistically
      templates.value[templateIndex] = {
        ...templates.value[templateIndex],
        archived: false,
        updatedAt: new Date().toISOString(),
      }

      // Track pending operation
      const updatedPendingOps = { ...pendingOperations.value }
      updatedPendingOps[operationId] = true
      pendingOperations.value = updatedPendingOps
    }

    try {
      const response = await apiStore.post(`/api/measurement-templates/${templateId}/unarchive`, {})

      if (response.success) {
        // Refresh the templates list
        await fetchTemplates(true) // Include archived to see the change
        return response.data
      } else {
        throw new Error(response.error || 'Failed to unarchive template')
      }
    } catch (err: any) {
      console.error('Error unarchiving measurement template:', err)
      error.value = err.message || 'Failed to unarchive measurement template'
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Delete a measurement template with optimistic updates
   * @param templateId ID of the template to delete
   * @param optimistic Whether to use optimistic updates
   */
  const deleteTemplate = async (templateId: number, optimistic = true) => {
    loading.value = true
    error.value = null

    // Find the template to delete
    const templateIndex = templates.value.findIndex(t => t.id === templateId)
    if (templateIndex === -1) {
      console.error(`Template with ID ${templateId} not found, cannot delete`)
      throw new Error(`Template with ID ${templateId} not found`)
    }

    // Store original template for rollback
    const originalTemplate = { ...templates.value[templateIndex] }
    const operationId = `delete-${templateId}-${Date.now()}`

    // Apply optimistic update if enabled
    if (optimistic) {
      // Remove template optimistically
      templates.value = templates.value.filter(t => t.id !== templateId)

      // Track pending operation
      const updatedPendingOps = { ...pendingOperations.value }
      updatedPendingOps[operationId] = true
      pendingOperations.value = updatedPendingOps
    }

    try {
      const response = await apiStore.delete(`/api/measurement-templates/${templateId}`)

      if (response.success) {
        // Clear pending operation
        if (optimistic) {
          const updatedPendingOps = { ...pendingOperations.value }
          delete updatedPendingOps[operationId]
          pendingOperations.value = updatedPendingOps
        }

        return true
      } else {
        // Revert optimistic update on error
        if (optimistic) {
          // Restore the deleted template
          templates.value = [...templates.value, originalTemplate]

          // Clear pending operation
          const updatedPendingOps = { ...pendingOperations.value }
          delete updatedPendingOps[operationId]
          pendingOperations.value = updatedPendingOps
        }

        throw new Error(response.error || 'Failed to delete template')
      }
    } catch (err: any) {
      // Revert optimistic update on error
      if (optimistic) {
        // Restore the deleted template
        templates.value = [...templates.value, originalTemplate]

        // Clear pending operation
        const updatedPendingOps = { ...pendingOperations.value }
        delete updatedPendingOps[operationId]
        pendingOperations.value = updatedPendingOps
      }

      const errorMessage = err.message || 'Failed to delete measurement template'
      console.error('Error deleting measurement template:', errorMessage)
      error.value = errorMessage
      throw new Error(errorMessage)
    } finally {
      loading.value = false
    }
  }

  // Get a template by ID
  const getTemplateById = (templateId: number) => {
    return templates.value.find(t => t.id === templateId)
  }

  // Reset templates to default
  const resetTemplates = async () => {
    loading.value = true
    error.value = null

    try {
      const response = await apiStore.post('/api/measurement-templates/reset', {})

      if (response.success) {
        // Refresh the templates list
        await fetchTemplates(true)
        return response.data
      } else {
        throw new Error(response.error || 'Failed to reset templates')
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to reset measurement templates'
      console.error('Error resetting measurement templates:', errorMessage)
      error.value = errorMessage
      throw new Error(errorMessage)
    } finally {
      loading.value = false
    }
  }

  return {
    // State
    loading,
    error,
    templates,

    // Methods
    fetchTemplates,
    createTemplate,
    updateTemplate,
    archiveTemplate,
    unarchiveTemplate,
    deleteTemplate,
    getTemplateById,
    fetchTemplateWithFields,
    resetTemplates,
  }
})
