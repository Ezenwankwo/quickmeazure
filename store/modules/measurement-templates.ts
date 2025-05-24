import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { MeasurementTemplate, MeasurementField } from '~/server/database/measurement-templates'
import { useApiStore } from './api'
import { useAuthStore } from './auth'

/**
 * Measurement Templates store
 * Replaces the useMeasurementTemplates composable with a centralized store
 */
export const useMeasurementTemplatesStore = defineStore('measurementTemplates', () => {
  // State
  const loading = ref(false)
  const error = ref<string | null>(null)
  const templates = ref<MeasurementTemplate[]>([])

  // Get API store for making requests
  const apiStore = useApiStore()

  // Fetch all measurement templates
  const fetchTemplates = async (includeArchived = false) => {
    loading.value = true
    error.value = null

    try {
      console.log('Fetching templates from API...', { includeArchived })

      // Make API call with authentication headers
      const response = await apiStore.get('/api/measurement-templates', {
        params: { includeArchived },
        // Add cache busting to ensure fresh data
        key: `templates-${Date.now()}`,
        // Force refresh to avoid caching issues
        server: false,
        cache: 'no-cache',
      })

      console.log('API response for templates:', response.data)

      if (response.success) {
        templates.value = response.data || []
        console.log('Templates loaded successfully:', templates.value.length, 'templates')
        if (templates.value.length > 0) {
          console.log('First template:', templates.value[0])
        } else {
          console.log('No templates returned from API')
        }
      } else {
        console.error('Invalid API response format:', response)
        templates.value = []
      }

      return templates.value
    } catch (err: any) {
      console.error('Error fetching measurement templates:', err)
      error.value = err.message || 'Failed to fetch measurement templates'
      templates.value = []
      throw err
    } finally {
      loading.value = false
    }
  }

  // Create a new measurement template
  const createTemplate = async (templateData: {
    name: string
    gender: 'male' | 'female' | 'unisex'
    fields: Omit<MeasurementField, 'id' | 'templateId' | 'createdAt'>[]
  }) => {
    loading.value = true
    error.value = null

    try {
      const response = await apiStore.post('/api/measurement-templates', templateData)

      if (response.success) {
        // Refresh the templates list
        await fetchTemplates()
        return response.data
      } else {
        throw new Error(response.error || 'Failed to create template')
      }
    } catch (err: any) {
      console.error('Error creating measurement template:', err)
      error.value = err.message || 'Failed to create measurement template'
      throw err
    } finally {
      loading.value = false
    }
  }

  // Update an existing measurement template
  const updateTemplate = async (
    templateId: number,
    updates: {
      name: string
      gender: 'male' | 'female' | 'unisex'
      fields: Array<Omit<MeasurementField, 'id' | 'templateId' | 'createdAt'>>
    }
  ) => {
    loading.value = true
    error.value = null

    try {
      const response = await apiStore.put(`/api/measurement-templates/${templateId}`, updates)

      if (response.success) {
        // Refresh the templates list
        await fetchTemplates()
        return response.data
      } else {
        throw new Error(response.error || 'Failed to update template')
      }
    } catch (err: any) {
      console.error('Error updating measurement template:', err)
      error.value = err.message || 'Failed to update measurement template'
      throw err
    } finally {
      loading.value = false
    }
  }

  // Archive a measurement template
  const archiveTemplate = async (templateId: number) => {
    loading.value = true
    error.value = null

    try {
      const response = await apiStore.post(`/api/measurement-templates/${templateId}/archive`, {})

      if (response.success) {
        // Refresh the templates list
        await fetchTemplates()
        return response.data
      } else {
        throw new Error(response.error || 'Failed to archive template')
      }
    } catch (err: any) {
      console.error('Error archiving measurement template:', err)
      error.value = err.message || 'Failed to archive measurement template'
      throw err
    } finally {
      loading.value = false
    }
  }

  // Unarchive a measurement template
  const unarchiveTemplate = async (templateId: number) => {
    loading.value = true
    error.value = null

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

  // Delete a measurement template
  const deleteTemplate = async (templateId: number) => {
    loading.value = true
    error.value = null

    try {
      const response = await apiStore.del(`/api/measurement-templates/${templateId}`)

      if (response.success) {
        // Remove the template from the local list
        templates.value = templates.value.filter(t => t.id !== templateId)
        return true
      } else {
        throw new Error(response.error || 'Failed to delete template')
      }
    } catch (err: any) {
      console.error('Error deleting measurement template:', err)
      error.value = err.message || 'Failed to delete measurement template'
      throw err
    } finally {
      loading.value = false
    }
  }

  // Get a template by ID
  const getTemplateById = (templateId: number) => {
    return templates.value.find(t => t.id === templateId)
  }

  // Fetch a single template with its fields
  const fetchTemplateWithFields = async (templateId: number) => {
    loading.value = true
    error.value = null

    try {
      console.log('Fetching template with fields for ID:', templateId)

      const response = await apiStore.get(`/api/measurement-templates/${templateId}`)

      console.log('API response for template with fields:', response)

      if (response.success) {
        const template = response.data
        console.log('Template with fields loaded successfully:', template)

        // Update the template in the templates array
        const index = templates.value.findIndex(t => t.id === templateId)
        if (index !== -1) {
          templates.value[index] = template
        }

        return template
      } else {
        console.error('API response indicates failure:', response)
        throw new Error('Failed to fetch template: Invalid response format')
      }
    } catch (err: any) {
      console.error('Error fetching template with fields:', err)
      error.value = err.message || 'Failed to fetch template'
      throw err
    } finally {
      loading.value = false
    }
  }

  // Reset templates to default
  const resetTemplates = async () => {
    loading.value = true
    error.value = null

    try {
      const response = await apiStore.post('/api/measurement-templates/reset', {})

      if (response.success) {
        // Refresh the templates list
        await fetchTemplates()
        return response.data
      } else {
        throw new Error(response.error || 'Failed to reset templates')
      }
    } catch (err: any) {
      console.error('Error resetting measurement templates:', err)
      error.value = err.message || 'Failed to reset measurement templates'
      throw err
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
