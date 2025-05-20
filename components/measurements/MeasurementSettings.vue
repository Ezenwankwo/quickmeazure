<template>
  <div class="space-y-8">
    <div>
      <h2 class="text-lg font-medium text-gray-900">Measurement Units</h2>
      <p class="mt-1 text-sm text-gray-500">
        Configure your preferred unit of measurement for all measurements.
      </p>
    </div>

    <UForm :state="settings" class="space-y-6" @submit="saveSettings">
      <!-- Default Unit -->
      <UFormGroup label="Default Unit" name="defaultUnit">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-md">
          <UCard
            v-for="unit in unitOptions"
            :key="unit.value"
            :class="[
              'cursor-pointer transition-all',
              { 'ring-2 ring-primary-500 border-primary-500': settings.defaultUnit === unit.value },
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
      <div class="flex justify-end pt-6 border-t border-gray-200">
        <UButton type="submit" :loading="isSaving">
          Save Changes
        </UButton>
      </div>
    </UForm>

    <!-- Danger Zone -->
    <div class="pt-8 border-t border-gray-200">
      <h3 class="text-lg font-medium text-red-600">Danger Zone</h3>
      <p class="mt-1 text-sm text-gray-500">
        Reset all measurement templates to default. This cannot be undone.
      </p>
      
      <div class="mt-4">
        <UButton
          color="red"
          variant="outline"
          :loading="isResetting"
          @click="confirmReset"
        >
          Reset to Default Templates
        </UButton>
      </div>
    </div>
  </div>

  <!-- Reset Confirmation -->
  <UModal v-model="showResetConfirm">
    <UCard>
      <template #header>
        <h3 class="text-lg font-semibold text-red-600">Reset Templates</h3>
      </template>

      <p class="text-gray-700">
        Are you sure you want to reset all measurement templates to their default values?
        This will remove all custom templates and reset the default templates to their original state.
        This action cannot be undone.
      </p>

      <template #footer>
        <div class="flex justify-end gap-3">
          <UButton
            color="gray"
            variant="ghost"
            @click="showResetConfirm = false"
          >
            Cancel
          </UButton>
          <UButton
            color="red"
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
import { ref, onMounted } from 'vue';
import { useMeasurementSettings } from '~/composables/measurements/useMeasurementSettings';

const emit = defineEmits(['saved']);

const { settings, loading, error, fetchSettings, updateSettings } = useMeasurementSettings();

const isSaving = ref(false);
const isResetting = ref(false);
const showResetConfirm = ref(false);

const unitOptions = [
  {
    value: 'in',
    label: 'Inches (in)',
    description: 'Use inches for all measurements',
  },
  {
    value: 'cm',
    label: 'Centimeters (cm)',
    description: 'Use centimeters for all measurements',
  },
];

// Fetch settings when component mounts
onMounted(async () => {
  await fetchSettings();
});

// Save settings
const saveSettings = async () => {
  isSaving.value = true;
  
  try {
    await updateSettings({
      defaultUnit: settings.value.defaultUnit,
    });
    
    emit('saved');
    
    useToast().add({
      title: 'Settings saved',
      icon: 'i-heroicons-check-circle',
    });
  } catch (err) {
    console.error('Error saving settings:', err);
    useToast().add({
      title: 'Error saving settings',
      description: 'Please try again',
      color: 'red',
      icon: 'i-heroicons-exclamation-triangle',
    });
  } finally {
    isSaving.value = false;
  }
};

// Confirm reset
const confirmReset = () => {
  showResetConfirm.value = true;
};

// Reset to default templates
const resetToDefault = async () => {
  isResetting.value = true;
  
  try {
    // Call API to reset templates
    const { error: resetError } = await useFetch('/api/measurement-templates/reset', {
      method: 'POST',
    });
    
    if (resetError.value) {
      throw new Error(resetError.value.message || 'Failed to reset templates');
    }
    
    useToast().add({
      title: 'Templates reset successfully',
      icon: 'i-heroicons-check-circle',
    });
    
    emit('saved');
    showResetConfirm.value = false;
  } catch (err: any) {
    console.error('Error resetting templates:', err);
    useToast().add({
      title: 'Error resetting templates',
      description: err.message || 'Please try again',
      color: 'red',
      icon: 'i-heroicons-exclamation-triangle',
    });
  } finally {
    isResetting.value = false;
  }
};
</script>
