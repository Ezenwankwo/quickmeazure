<template>
  <div class="space-y-6">
    <!-- Measurement Settings -->
    <UCard>
      <template #header>
        <h2 class="text-lg font-semibold text-gray-900">Measurement Units</h2>
      </template>

      <div class="space-y-4">
        <p class="text-sm text-gray-600">
          Choose your preferred unit of measurement for all measurements in the app.
        </p>

        <UFormGroup label="Default Unit">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-md">
            <UCard
              v-for="unit in unitOptions"
              :key="unit.value"
              :class="[
                'cursor-pointer transition-all',
                {
                  'ring-2 ring-primary-500 border-primary-500': settings.defaultUnit === unit.value,
                },
              ]"
              @click="settings.defaultUnit = unit.value"
            >
              <div class="flex items-center">
                <div class="flex-shrink-0">
                  <div
                    :class="[
                      'h-5 w-5 rounded-full border-2 flex items-center justify-center',
                      settings.defaultUnit === unit.value
                        ? 'border-primary-500 bg-primary-500'
                        : 'border-gray-300',
                    ]"
                  >
                    <UIcon
                      v-if="settings.defaultUnit === unit.value"
                      name="i-heroicons-check"
                      class="h-3.5 w-3.5 text-white"
                    />
                  </div>
                </div>
                <div class="ml-3">
                  <h3 class="text-sm font-medium text-gray-900">
                    {{ unit.label }}
                  </h3>
                  <p class="text-xs text-gray-500">
                    {{ unit.description }}
                  </p>
                </div>
              </div>
            </UCard>
          </div>
        </UFormGroup>

        <div class="flex justify-end pt-4">
          <UButton color="primary" :loading="isSaving" @click="saveSettings">
            Save Changes
          </UButton>
        </div>
      </div>
    </UCard>

    <!-- Measurement Templates -->
    <UCard>
      <template #header>
        <div class="flex items-center justify-between">
          <h2 class="text-lg font-semibold text-gray-900">Measurement Templates</h2>
          <UButton size="sm" color="primary" @click="isCreateTemplateModalOpen = true">
            New Template
          </UButton>
        </div>
      </template>

      <div class="space-y-4">
        <UTabs v-model="activeTemplateTab" :items="templateTabs">
          <template #default="{ item, selected }">
            <div class="flex items-center gap-x-2">
              <span class="truncate">{{ item.label }}</span>
              <span
                v-if="item.count !== undefined"
                class="inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-medium"
                :class="selected ? 'bg-primary-100 text-primary-800' : 'bg-gray-100 text-gray-800'"
              >
                {{ item.count }}
              </span>
            </div>
          </template>

          <template #_item>
            <div
              v-if="filteredTemplates.length > 0"
              class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4"
            >
              <MeasurementTemplateCard
                v-for="template in filteredTemplates"
                :key="template.id"
                :template="template"
                @edit="openEditTemplate"
                @archive="archiveTemplate"
                @unarchive="unarchiveTemplate"
                @delete="confirmDeleteTemplate"
              />
            </div>

            <div v-else class="text-center py-12">
              <UIcon name="i-heroicons-ruler" class="mx-auto h-12 w-12 text-gray-300" />
              <h3 class="mt-2 text-sm font-medium text-gray-900">No templates</h3>
              <p class="mt-1 text-sm text-gray-500">
                {{
                  activeTemplateTab === 'archived'
                    ? 'No archived templates'
                    : 'Get started by creating a new template'
                }}
              </p>
              <div v-if="activeTemplateTab !== 'archived'" class="mt-6">
                <UButton @click="isCreateTemplateModalOpen = true">
                  <UIcon name="i-heroicons-plus" class="h-5 w-5 mr-2" />
                  New Template
                </UButton>
              </div>
            </div>
          </template>
        </UTabs>
      </div>
    </UCard>

    <!-- Danger Zone -->
    <UCard>
      <template #header>
        <h2 class="text-lg font-semibold text-red-600">Danger Zone</h2>
      </template>

      <div class="space-y-4">
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div class="flex-1">
            <h3 class="text-sm font-medium text-gray-900">Reset to Default Templates</h3>
            <p class="text-sm text-gray-500">
              Reset all measurement templates to their default values. This cannot be undone.
            </p>
          </div>
          <div class="mt-4 sm:mt-0 sm:ml-6">
            <UButton
color="red"
variant="outline"
:loading="isResetting"
@click="confirmReset">
              Reset Templates
            </UButton>
          </div>
        </div>
      </div>
    </UCard>

    <!-- Create/Edit Template Modal -->
    <UModal v-model="isTemplateModalOpen">
      <UCard>
        <template #header>
          <div class="flex items-center justify-between">
            <h3 class="text-lg font-semibold">
              {{ editingTemplate ? 'Edit Template' : 'New Measurement Template' }}
            </h3>
            <UButton
              color="gray"
              variant="ghost"
              icon="i-heroicons-x-mark"
              @click="closeTemplateModal"
            />
          </div>
        </template>

        <MeasurementTemplateForm
          v-if="isTemplateModalOpen"
          :template="editingTemplate"
          @saved="handleTemplateSaved"
          @cancel="closeTemplateModal"
        />
      </UCard>
    </UModal>

    <!-- Delete Confirmation Dialog -->
    <UModal v-model="isDeleteConfirmOpen">
      <UCard>
        <template #header>
          <h3 class="text-lg font-semibold text-red-600">Delete Template</h3>
        </template>

        <p class="text-gray-700">
          Are you sure you want to delete the template "{{ templateToDelete?.name }}"? This action
          cannot be undone.
        </p>

        <template #footer>
          <div class="flex justify-end gap-3">
            <UButton color="gray" variant="ghost" @click="isDeleteConfirmOpen = false">
              Cancel
            </UButton>
            <UButton color="red" :loading="isDeleting" @click="deleteTemplate">
              Delete Template
            </UButton>
          </div>
        </template>
      </UCard>
    </UModal>

    <!-- Reset Confirmation Dialog -->
    <UModal v-model="isResetConfirmOpen">
      <UCard>
        <template #header>
          <h3 class="text-lg font-semibold text-red-600">Reset Templates</h3>
        </template>

        <p class="text-gray-700">
          Are you sure you want to reset all measurement templates to their default values? This
          will remove all custom templates and reset the default templates to their original state.
          This action cannot be undone.
        </p>

        <template #footer>
          <div class="flex justify-end gap-3">
            <UButton color="gray" variant="ghost" @click="isResetConfirmOpen = false">
              Cancel
            </UButton>
            <UButton color="red" :loading="isResetting" @click="resetToDefault">
              Reset Templates
            </UButton>
          </div>
        </template>
      </UCard>
    </UModal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useMeasurementTemplatesStore } from '~/store/modules/measurement-templates'
import { useMeasurementSettings } from '~/composables/measurements/useMeasurementSettings'

// Store
const measurementTemplatesStore = useMeasurementTemplatesStore()
const templates = computed(() => measurementTemplatesStore.templates)
const _templatesLoading = computed(() => measurementTemplatesStore.loading)
const _templatesError = computed(() => measurementTemplatesStore.error)
const fetchTemplates = () => measurementTemplatesStore.fetchTemplates()
const archiveTemplateApi = id => measurementTemplatesStore.archiveTemplate(id)
const unarchiveTemplateApi = id => measurementTemplatesStore.unarchiveTemplate(id)
const deleteTemplateApi = id => measurementTemplatesStore.deleteTemplate(id)
const resetTemplatesApi = () => measurementTemplatesStore.resetTemplates()

const {
  settings,
  loading: _settingsLoading,
  error: _settingsError,
  fetchSettings,
  updateSettings: updateUserSettings,
} = useMeasurementSettings()

// State
const activeTemplateTab = ref('active')
const isTemplateModalOpen = ref(false)
const isCreateTemplateModalOpen = computed({
  get: () => isTemplateModalOpen.value && !editingTemplate.value,
  set: value => {
    isTemplateModalOpen.value = value
    if (!value) editingTemplate.value = null
  },
})
const editingTemplate = ref(null)
const isSaving = ref(false)
const isDeleting = ref(false)
const isResetting = ref(false)
const isDeleteConfirmOpen = ref(false)
const isResetConfirmOpen = ref(false)
const templateToDelete = ref(null)

// Options
const unitOptions = [
  { value: 'in', label: 'Inches (in)', description: 'Use inches for all measurements' },
  { value: 'cm', label: 'Centimeters (cm)', description: 'Use centimeters for all measurements' },
]

const templateTabs = [
  { key: 'active', label: 'Active', count: computed(() => activeTemplates.value.length) },
  { key: 'archived', label: 'Archived', count: computed(() => archivedTemplates.value.length) },
]

// Computed
const activeTemplates = computed(() => templates.value.filter(t => !t.isArchived))

const archivedTemplates = computed(() => templates.value.filter(t => t.isArchived))

const filteredTemplates = computed(() => {
  return activeTemplateTab.value === 'active' ? activeTemplates.value : archivedTemplates.value
})

// Methods
const openEditTemplate = template => {
  editingTemplate.value = { ...template }
  isTemplateModalOpen.value = true
}

const closeTemplateModal = () => {
  isTemplateModalOpen.value = false
  editingTemplate.value = null
}

const handleTemplateSaved = () => {
  closeTemplateModal()
  fetchTemplates()
}

const archiveTemplate = async id => {
  try {
    await archiveTemplateApi(id)
    useToast().add({
      title: 'Template archived',
      icon: 'i-heroicons-check-circle',
    })
    fetchTemplates()
  } catch (error) {
    console.error('Error archiving template:', error)
    useToast().add({
      title: 'Error archiving template',
      description: error.message || 'Please try again',
      color: 'red',
      icon: 'i-heroicons-exclamation-triangle',
    })
  }
}

const unarchiveTemplate = async id => {
  try {
    await unarchiveTemplateApi(id)
    useToast().add({
      title: 'Template restored',
      icon: 'i-heroicons-check-circle',
    })
    fetchTemplates()
  } catch (error) {
    console.error('Error unarchiving template:', error)
    useToast().add({
      title: 'Error restoring template',
      description: error.message || 'Please try again',
      color: 'red',
      icon: 'i-heroicons-exclamation-triangle',
    })
  }
}

const confirmDeleteTemplate = template => {
  templateToDelete.value = template
  isDeleteConfirmOpen.value = true
}

const deleteTemplate = async () => {
  if (!templateToDelete.value) return

  try {
    isDeleting.value = true
    await deleteTemplateApi(templateToDelete.value.id)

    useToast().add({
      title: 'Template deleted',
      icon: 'i-heroicons-check-circle',
    })

    isDeleteConfirmOpen.value = false
    templateToDelete.value = null
    fetchTemplates()
  } catch (error) {
    console.error('Error deleting template:', error)
    useToast().add({
      title: 'Error deleting template',
      description: error.message || 'Please try again',
      color: 'red',
      icon: 'i-heroicons-exclamation-triangle',
    })
  } finally {
    isDeleting.value = false
  }
}

const confirmReset = () => {
  isResetConfirmOpen.value = true
}

const resetToDefault = async () => {
  try {
    isResetting.value = true
    await resetTemplatesApi()

    useToast().add({
      title: 'Templates reset successfully',
      icon: 'i-heroicons-check-circle',
    })

    isResetConfirmOpen.value = false
    fetchTemplates()
  } catch (error) {
    console.error('Error resetting templates:', error)
    useToast().add({
      title: 'Error resetting templates',
      description: error.message || 'Please try again',
      color: 'red',
      icon: 'i-heroicons-exclamation-triangle',
    })
  } finally {
    isResetting.value = false
  }
}

const saveSettings = async () => {
  try {
    isSaving.value = true
    await updateUserSettings({
      defaultUnit: settings.value.defaultUnit,
    })

    useToast().add({
      title: 'Settings saved',
      icon: 'i-heroicons-check-circle',
    })
  } catch (error) {
    console.error('Error saving settings:', error)
    useToast().add({
      title: 'Error saving settings',
      description: error.message || 'Please try again',
      color: 'red',
      icon: 'i-heroicons-exclamation-triangle',
    })
  } finally {
    isSaving.value = false
  }
}

// Lifecycle
onMounted(async () => {
  await Promise.all([fetchTemplates(), fetchSettings()])
})
</script>
