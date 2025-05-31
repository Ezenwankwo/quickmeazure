import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { MeasurementTemplate } from '~/types/measurement'
import { API_ENDPOINTS } from '~/constants/api'
import { useAuthStore } from '~/store/modules/auth'

export const useMeasurementTemplateStore = defineStore('measurementTemplate', () => {
  // State
  const templates = ref<MeasurementTemplate[]>([])
  const currentTemplate = ref<MeasurementTemplate | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // Get auth store for authentication headers
  const authStore = useAuthStore()

  // Getters
  const defaultTemplate = computed<MeasurementTemplate | undefined>(() =>
    templates.value.find(t => t.isDefault)
  )

  const templateNames = computed<string[]>(() => templates.value.map(t => t.name))

  // Actions
  const fetchTemplates = async () => {
    try {
      isLoading.value = true
      error.value = null

      const { data } = await useAsyncData<MeasurementTemplate[]>('measurement-templates', () =>
        $fetch(API_ENDPOINTS.MEASUREMENTS.TEMPLATES, {
          headers: {
            'Content-Type': 'application/json',
            ...authStore.getAuthHeaders(),
          },
        })
      )

      if (data.value) {
        templates.value = data.value
      }

      return templates.value
    } catch (err: any) {
      error.value = err.message || 'Failed to fetch measurement templates'
      console.error('Error fetching measurement templates:', err)
      throw err
    } finally {
      isLoading.value = false
    }
  }

  const fetchTemplateById = async (id: number) => {
    try {
      isLoading.value = true
      error.value = null

      const { data } = await useAsyncData<MeasurementTemplate>(`measurement-template-${id}`, () =>
        $fetch(API_ENDPOINTS.MEASUREMENTS.TEMPLATE_BY_ID(id.toString()), {
          headers: {
            'Content-Type': 'application/json',
            ...authStore.getAuthHeaders(),
          },
        })
      )

      if (data.value) {
        currentTemplate.value = data.value
        return data.value
      }
      return null
    } catch (err: any) {
      error.value = err.message || `Failed to fetch measurement template with ID ${id}`
      console.error(`Error fetching measurement template ${id}:`, err)
      throw err
    } finally {
      isLoading.value = false
    }
  }

  const createTemplate = async (
    templateData: Omit<
      MeasurementTemplate,
      'id' | 'userId' | 'createdAt' | 'updatedAt' | 'isDefault'
    >
  ) => {
    try {
      isLoading.value = true
      error.value = null

      const data = await $fetch<MeasurementTemplate>(API_ENDPOINTS.MEASUREMENTS.TEMPLATES, {
        method: 'POST',
        body: JSON.stringify(templateData),
        headers: {
          'Content-Type': 'application/json',
          ...authStore.getAuthHeaders(),
        },
      })

      // Add the new template to the list
      templates.value.push(data)
      return data
    } catch (err: any) {
      error.value = err.message || 'Failed to create measurement template'
      console.error('Error creating measurement template:', err)
      throw err
    } finally {
      isLoading.value = false
    }
  }

  const updateTemplate = async (id: number, templateData: Partial<MeasurementTemplate>) => {
    try {
      isLoading.value = true
      error.value = null

      const data = await $fetch<MeasurementTemplate>(
        API_ENDPOINTS.MEASUREMENTS.TEMPLATE_BY_ID(id.toString()),
        {
          method: 'PATCH',
          body: JSON.stringify(templateData),
          headers: {
            'Content-Type': 'application/json',
            ...authStore.getAuthHeaders(),
          },
        }
      )

      // Update the template in the list
      const index = templates.value.findIndex(t => t.id === id)
      if (index !== -1) {
        templates.value[index] = { ...templates.value[index], ...data }
      }

      // Update current template if it's the one being edited
      if (currentTemplate.value?.id === id) {
        currentTemplate.value = { ...currentTemplate.value, ...data }
      }

      return data
    } catch (err: any) {
      error.value = err.message || `Failed to update measurement template with ID ${id}`
      console.error(`Error updating measurement template ${id}:`, err)
      throw err
    } finally {
      isLoading.value = false
    }
  }

  const deleteTemplate = async (id: number) => {
    try {
      isLoading.value = true
      error.value = null

      await $fetch(API_ENDPOINTS.MEASUREMENTS.TEMPLATE_BY_ID(id.toString()), {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          ...authStore.getAuthHeaders(),
        },
      })

      // Remove the template from the list
      templates.value = templates.value.filter(t => t.id !== id)

      // Clear current template if it's the one being deleted
      if (currentTemplate.value?.id === id) {
        currentTemplate.value = null
      }

      return true
    } catch (err: any) {
      error.value = err.message || `Failed to delete measurement template with ID ${id}`
      console.error(`Error deleting measurement template ${id}:`, err)
      throw err
    } finally {
      isLoading.value = false
    }
  }

  const setDefaultTemplate = async (id: number) => {
    try {
      const template = templates.value.find(t => t.id === id)
      if (!template) {
        throw new Error(`Template with ID ${id} not found`)
      }

      // Update all templates to set isDefault to false
      templates.value = templates.value.map(t => ({
        ...t,
        isDefault: t.id === id,
      }))

      // Update the template on the server
      return await updateTemplate(id, { isDefault: true })
    } catch (err: any) {
      error.value = err.message || `Failed to set default template with ID ${id}`
      console.error(`Error setting default template ${id}:`, err)
      throw err
    }
  }

  // Reset store state
  const $reset = () => {
    templates.value = []
    currentTemplate.value = null
    isLoading.value = false
    error.value = null
  }

  return {
    // State
    templates,
    currentTemplate,
    isLoading,
    error,

    // Getters
    defaultTemplate,
    templateNames,

    // Actions
    fetchTemplates,
    fetchTemplateById,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    setDefaultTemplate,
    $reset,
  }
})
