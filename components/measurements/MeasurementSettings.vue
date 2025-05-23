<template>
  <div class="max-w-4xl mx-auto">
    <!-- Settings Container -->
    <UCard class="mb-8">
      <template #header>
        <div class="flex items-center">
          <UIcon name="i-heroicons-cog-6-tooth" class="mr-2 text-primary-500 h-5 w-5" />
          <h2 class="text-xl font-semibold text-gray-900">Measurement Settings</h2>
        </div>
        <p class="mt-1 text-sm text-gray-500">
          Configure your preferred unit of measurement for all measurements.
        </p>
      </template>

      <UForm :state="settings" class="space-y-6" @submit="saveSettings">
        <!-- Default Unit -->
        <UFormGroup
          label="Default Unit"
          name="defaultUnit"
          help="This will be used for all new measurements"
        >
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-lg">
            <UCard
              v-for="unit in unitOptions"
              :key="unit.value"
              :ui="{
                body: {
                  padding: 'p-4',
                },
              }"
              :class="[
                'cursor-pointer transition-all hover:shadow-md',
                settings.defaultUnit === unit.value
                  ? 'ring-2 ring-primary-500 border-primary-500 bg-primary-50'
                  : 'hover:border-gray-300',
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

        <!-- Form Actions -->
        <div class="flex justify-end pt-6">
          <UButton
type="submit"
:loading="isSaving"
icon="i-heroicons-check"
color="primary">
            Save Changes
          </UButton>
        </div>
      </UForm>
    </UCard>

    <!-- Danger Zone -->
    <UCard class="border-red-200 bg-red-50">
      <template #header>
        <div class="flex items-center">
          <UIcon name="i-heroicons-exclamation-triangle" class="mr-2 text-red-500 h-5 w-5" />
          <h3 class="text-lg font-medium text-red-600">Danger Zone</h3>
        </div>
        <p class="mt-1 text-sm text-gray-600">
          Actions in this section can result in irreversible changes to your data.
        </p>
      </template>

      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h4 class="font-medium text-gray-900">Reset Templates</h4>
          <p class="text-sm text-gray-600">
            Reset all measurement templates to their default values. This cannot be undone.
          </p>
        </div>
        <UButton
          color="red"
          variant="soft"
          icon="i-heroicons-arrow-path"
          :loading="isResetting"
          @click="confirmReset"
        >
          Reset to Default
        </UButton>
      </div>
    </UCard>
  </div>

  <!-- Reset Confirmation Modal -->
  <UModal v-model="showResetConfirm">
    <UCard :ui="{ ring: 'ring-1 ring-red-100', divide: 'divide-y divide-red-100' }">
      <template #header>
        <div class="flex items-center">
          <UIcon name="i-heroicons-exclamation-triangle" class="mr-2 text-red-500 h-6 w-6" />
          <h3 class="text-lg font-semibold text-red-600">Confirm Reset</h3>
        </div>
      </template>

      <div class="py-4">
        <p class="text-gray-700 mb-3">
          Are you sure you want to reset all measurement templates to their default values?
        </p>
        <UAlert
          icon="i-heroicons-exclamation-triangle"
          color="red"
          variant="soft"
          title="This action cannot be undone"
          class="mt-2"
        >
          This will remove all custom templates and reset the default templates to their original
          state.
        </UAlert>
      </div>

      <template #footer>
        <div class="flex justify-end gap-3">
          <UButton color="gray" variant="ghost" @click="showResetConfirm = false"> Cancel </UButton>
          <UButton
            color="red"
            icon="i-heroicons-arrow-path"
            :loading="isResetting"
            @click="resetToDefault"
          >
            Reset Templates
          </UButton>
        </div>
      </template>
    </UCard>
  </UModal>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useMeasurementSettings } from '~/composables/measurements/useMeasurementSettings'

const emit = defineEmits(['saved'])

const { settings, _loading, _error, fetchSettings, updateSettings } = useMeasurementSettings()

const isSaving = ref(false)
const isResetting = ref(false)
const showResetConfirm = ref(false)

const unitOptions = [
  {
    value: 'in',
    label: 'Inches (in)',
    description: 'Imperial system - standard in the US',
  },
  {
    value: 'cm',
    label: 'Centimeters (cm)',
    description: 'Metric system - used worldwide',
  },
]

// Fetch settings when component mounts
onMounted(async () => {
  await fetchSettings()
})

// Save settings
const saveSettings = async () => {
  isSaving.value = true

  try {
    await updateSettings({
      defaultUnit: settings.value.defaultUnit,
    })

    emit('saved')

    useToast().add({
      title: 'Settings saved',
      description: 'Your measurement preferences have been updated',
      icon: 'i-heroicons-check-circle',
      color: 'green',
    })
  } catch (err) {
    console.error('Error saving settings:', err)
    useToast().add({
      title: 'Error saving settings',
      description: 'Please try again',
      color: 'red',
      icon: 'i-heroicons-exclamation-triangle',
    })
  } finally {
    isSaving.value = false
  }
}

// Confirm reset
const confirmReset = () => {
  showResetConfirm.value = true
}

// Reset to default templates
const resetToDefault = async () => {
  isResetting.value = true

  try {
    // Call API to reset templates
    const {
      _data,
      _pending,
      error: _error,
      _refresh,
    } = await useFetch('/api/measurement-templates/reset', {
      method: 'POST',
    })

    if (_error.value) {
      throw new Error(_error.value.message || 'Failed to reset templates')
    }

    useToast().add({
      title: 'Templates reset successfully',
      description: 'All measurement templates have been restored to defaults',
      icon: 'i-heroicons-check-circle',
      color: 'green',
    })

    emit('saved')
    showResetConfirm.value = false
  } catch (err: any) {
    console.error('Error resetting templates:', err)
    useToast().add({
      title: 'Error resetting templates',
      description: err.message || 'Please try again',
      color: 'red',
      icon: 'i-heroicons-exclamation-triangle',
    })
  } finally {
    isResetting.value = false
  }
}
</script>
