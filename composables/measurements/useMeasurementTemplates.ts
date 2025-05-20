import { ref } from 'vue';
import type { MeasurementTemplate, MeasurementField } from '~/server/database/measurement-templates';

export const useMeasurementTemplates = () => {
  const loading = ref(false);
  const error = ref<string | null>(null);
  const templates = ref<MeasurementTemplate[]>([]);

  // Fetch all measurement templates
  const fetchTemplates = async (includeArchived = false) => {
    loading.value = true;
    error.value = null;
    
    try {
      const { data, error: fetchError } = await useFetch('/api/measurement-templates', {
        params: { includeArchived },
      });

      if (fetchError.value) {
        throw new Error(fetchError.value.message || 'Failed to fetch templates');
      }

      templates.value = data.value?.data || [];
      return templates.value;
    } catch (err: any) {
      console.error('Error fetching measurement templates:', err);
      error.value = err.message || 'Failed to fetch measurement templates';
      throw err;
    } finally {
      loading.value = false;
    }
  };

  // Create a new measurement template
  const createTemplate = async (templateData: {
    name: string;
    gender: 'male' | 'female' | 'unisex';
    fields: Omit<MeasurementField, 'id' | 'templateId' | 'createdAt'>[];
  }) => {
    loading.value = true;
    error.value = null;
    
    try {
      const { data, error: createError } = await useFetch('/api/measurement-templates', {
        method: 'POST',
        body: templateData,
      });

      if (createError.value) {
        throw new Error(createError.value.message || 'Failed to create template');
      }

      // Refresh the templates list
      await fetchTemplates();
      return data.value?.data;
    } catch (err: any) {
      console.error('Error creating measurement template:', err);
      error.value = err.message || 'Failed to create measurement template';
      throw err;
    } finally {
      loading.value = false;
    }
  };

  // Update an existing measurement template
  const updateTemplate = async (
    templateId: number,
    updates: {
      name: string;
      gender: 'male' | 'female' | 'unisex';
      fields: Array<Omit<MeasurementField, 'id' | 'templateId' | 'createdAt'>>;
    }
  ) => {
    loading.value = true;
    error.value = null;
    
    try {
      const { data, error: updateError } = await useFetch(`/api/measurement-templates/${templateId}`, {
        method: 'PUT',
        body: updates,
      });

      if (updateError.value) {
        throw new Error(updateError.value.message || 'Failed to update template');
      }

      // Refresh the templates list
      await fetchTemplates();
      return data.value?.data;
    } catch (err: any) {
      console.error('Error updating measurement template:', err);
      error.value = err.message || 'Failed to update measurement template';
      throw err;
    } finally {
      loading.value = false;
    }
  };

  // Archive a measurement template
  const archiveTemplate = async (templateId: number) => {
    loading.value = true;
    error.value = null;
    
    try {
      const { data, error: archiveError } = await useFetch(`/api/measurement-templates/${templateId}/archive`, {
        method: 'POST',
      });

      if (archiveError.value) {
        throw new Error(archiveError.value.message || 'Failed to archive template');
      }

      // Refresh the templates list
      await fetchTemplates();
      return data.value?.data;
    } catch (err: any) {
      console.error('Error archiving measurement template:', err);
      error.value = err.message || 'Failed to archive measurement template';
      throw err;
    } finally {
      loading.value = false;
    }
  };

  // Unarchive a measurement template
  const unarchiveTemplate = async (templateId: number) => {
    loading.value = true;
    error.value = null;
    
    try {
      const { data, error: unarchiveError } = await useFetch(`/api/measurement-templates/${templateId}/unarchive`, {
        method: 'POST',
      });

      if (unarchiveError.value) {
        throw new Error(unarchiveError.value.message || 'Failed to unarchive template');
      }

      // Refresh the templates list
      await fetchTemplates(true); // Include archived to see the change
      return data.value?.data;
    } catch (err: any) {
      console.error('Error unarchiving measurement template:', err);
      error.value = err.message || 'Failed to unarchive measurement template';
      throw err;
    } finally {
      loading.value = false;
    }
  };

  // Delete a measurement template
  const deleteTemplate = async (templateId: number) => {
    loading.value = true;
    error.value = null;
    
    try {
      const { error: deleteError } = await useFetch(`/api/measurement-templates/${templateId}`, {
        method: 'DELETE',
      });

      if (deleteError.value) {
        throw new Error(deleteError.value.message || 'Failed to delete template');
      }

      // Remove the template from the local list
      templates.value = templates.value.filter(t => t.id !== templateId);
      return true;
    } catch (err: any) {
      console.error('Error deleting measurement template:', err);
      error.value = err.message || 'Failed to delete measurement template';
      throw err;
    } finally {
      loading.value = false;
    }
  };

  // Get a template by ID
  const getTemplateById = (templateId: number) => {
    return templates.value.find(t => t.id === templateId);
  };

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
  };
};

export default useMeasurementTemplates;
