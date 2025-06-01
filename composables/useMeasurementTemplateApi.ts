import { API_ENDPOINTS } from '~/constants/api'
import type { MeasurementTemplate } from '~/types/measurement'

export function useMeasurementTemplateApi() {
  const toast = useToast()
  const { $api } = useNuxtApp()

  // Helper function to handle API errors
  const handleError = (error: any, defaultMessage: string) => {
    console.error(defaultMessage, error)
    toast.add({
      title: 'Error',
      description: error.data?.message || defaultMessage,
      color: 'red',
    })
    return { success: false, error: error.data?.message || defaultMessage }
  }

  /**
   * Fetch all measurement templates
   */
  const getTemplates = async () => {
    try {
      const { data, error } = await useAsyncData<MeasurementTemplate[]>(
        'measurement-templates',
        () => $api(API_ENDPOINTS.MEASUREMENTS.TEMPLATES, { method: 'GET' })
      )

      if (error.value) {
        throw new Error(error.value?.message || 'Failed to fetch templates')
      }

      return { success: true, templates: data.value || [] }
    } catch (error) {
      return handleError(error, 'Failed to fetch measurement templates')
    }
  }

  /**
   * Fetch a single template by ID
   * @param id Template ID
   */
  const getTemplateById = async (id: number) => {
    try {
      const { data, error } = await useAsyncData<MeasurementTemplate>(
        `measurement-template-${id}`,
        () => $api(API_ENDPOINTS.MEASUREMENTS.TEMPLATE_BY_ID(id.toString()), { method: 'GET' })
      )

      if (error.value) {
        throw new Error(error.value?.message || `Failed to fetch template with ID ${id}`)
      }

      return { success: true, template: data.value }
    } catch (error) {
      return handleError(error, `Failed to fetch measurement template with ID ${id}`)
    }
  }

  /**
   * Create a new measurement template
   * @param templateData Template data to create
   */
  const createTemplate = async (
    templateData: Omit<
      MeasurementTemplate,
      'id' | 'userId' | 'createdAt' | 'updatedAt' | 'isDefault'
    >
  ) => {
    try {
      const data = await $fetch<MeasurementTemplate>(API_ENDPOINTS.MEASUREMENTS.TEMPLATES, {
        method: 'POST',
        body: templateData,
      })
      return { success: true, template: data }
    } catch (error) {
      return handleError(error, 'Failed to create measurement template')
    }
  }

  /**
   * Update an existing measurement template
   * @param id Template ID
   * @param templateData Template data to update
   */
  const updateTemplate = async (id: number, templateData: Partial<MeasurementTemplate>) => {
    try {
      const data = await $fetch<MeasurementTemplate>(
        API_ENDPOINTS.MEASUREMENTS.TEMPLATE_BY_ID(id.toString()),
        {
          method: 'PATCH',
          body: templateData,
        }
      )
      return { success: true, template: data }
    } catch (error) {
      return handleError(error, `Failed to update measurement template with ID ${id}`)
    }
  }

  /**
   * Delete a measurement template
   * @param id Template ID to delete
   */
  const deleteTemplate = async (id: number) => {
    try {
      await $fetch(API_ENDPOINTS.MEASUREMENTS.TEMPLATE_BY_ID(id.toString()), {
        method: 'DELETE',
      })
      return { success: true }
    } catch (error) {
      return handleError(error, `Failed to delete measurement template with ID ${id}`)
    }
  }

  /**
   * Set a template as the default
   * @param id Template ID to set as default
   */
  const setDefaultTemplate = async (id: number) => {
    try {
      const data = await $fetch<MeasurementTemplate>(
        `${API_ENDPOINTS.MEASUREMENTS.TEMPLATE_BY_ID(id.toString())}/set-default`,
        {
          method: 'PATCH',
        }
      )
      return { success: true, template: data }
    } catch (error) {
      return handleError(error, `Failed to set default template with ID ${id}`)
    }
  }

  return {
    getTemplates,
    getTemplateById,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    setDefaultTemplate,
  }
}

export default useMeasurementTemplateApi
