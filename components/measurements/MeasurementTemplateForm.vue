<template>
  <UModal v-model="isOpen">
    <UCard :ui="{ ring: '', divide: 'divide-y divide-gray-100 dark:divide-gray-800' }">
      <template #header>
        <div class="flex items-center justify-between">
          <h3 class="text-lg font-semibold">
            {{ editing ? 'Edit Template' : 'New Measurement Template' }}
          </h3>
          <UButton
            color="gray"
            variant="ghost"
            icon="i-heroicons-x-mark"
            @click="close"
          />
        </div>
      </template>

      <UForm :state="form" class="space-y-6" @submit="onSubmit">
        <!-- Template Name -->
        <UFormGroup label="Template Name" name="name" required>
          <UInput v-model="form.name" placeholder="e.g., Standard Measurements, Custom Fit, etc." />
        </UFormGroup>

        <!-- Gender -->
        <UFormGroup label="Gender" name="gender" required>
          <USelect
            v-model="form.gender"
            :options="genderOptions"
            placeholder="Select gender"
          />
        </UFormGroup>

        <!-- Fields -->
        <div class="space-y-4">
          <div class="flex items-center justify-between">
            <UFormGroup label="Measurement Fields" name="fields" />
            <UButton
              type="button"
              size="xs"
              color="gray"
              icon="i-heroicons-plus"
              @click="addField"
            >
              Add Field
            </UButton>
          </div>

          <div v-if="form.fields.length === 0" class="text-center py-6 border-2 border-dashed rounded-lg">
            <UIcon name="i-heroicons-ruler" class="h-8 w-8 text-gray-400 mx-auto mb-2" />
            <p class="text-sm text-gray-500">No fields added yet</p>
          </div>

          <div v-else class="space-y-3">
            <div
              v-for="(field, index) in form.fields"
              :key="field.key"
              class="flex items-start gap-3 p-3 border rounded-lg"
              :class="{ 'border-red-200 bg-red-50': fieldErrors[field.key] }"
            >
              <div class="flex-1 space-y-2">
                <UFormGroup
                  :label="`Field ${index + 1}`"
                  :name="`field-${index}-name`"
                  :error="fieldErrors[field.key]?.name"
                >
                  <UInput
                    v-model="field.name"
                    placeholder="e.g., Chest, Waist, Sleeve Length"
                    :ui="{ icon: { trailing: { pointer: '' } } }"
                  >
                    <template #trailing>
                      <UButton
                        v-if="!field.isDefault"
                        color="red"
                        variant="ghost"
                        icon="i-heroicons-trash"
                        size="2xs"
                        :ui="{ rounded: 'rounded-full' }"
                        @click="removeField(index)"
                      />
                    </template>
                  </UInput>
                </UFormGroup>

                <div class="grid grid-cols-2 gap-3">
                  <UFormGroup
                    label="Unit"
                    :name="`field-${index}-unit`"
                    :error="fieldErrors[field.key]?.unit"
                  >
                    <USelect
                      v-model="field.unit"
                      :options="unitOptions"
                      placeholder="Select unit"
                    />
                  </UFormGroup>

                  <UFormGroup
                    label="Required"
                    :name="`field-${index}-required`"
                    class="pt-6"
                  >
                    <UToggle v-model="field.isRequired" />
                  </UFormGroup>
                </div>
              </div>

              
              <div class="flex flex-col gap-1 pt-6">
                <UButton
                  v-if="index > 0"
                  icon="i-heroicons-arrow-up"
                  size="2xs"
                  color="gray"
                  variant="ghost"
                  :ui="{ rounded: 'rounded-full' }"
                  @click="moveFieldUp(index)"
                />
                <UButton
                  v-if="index < form.fields.length - 1"
                  icon="i-heroicons-arrow-down"
                  size="2xs"
                  color="gray"
                  variant="ghost"
                  :ui="{ rounded: 'rounded-full' }"
                  @click="moveFieldDown(index)"
                />
              </div>
            </div>
          </div>
        </div>

        <!-- Form Actions -->
        <div class="flex justify-end gap-3 pt-4">
          <UButton
            type="button"
            color="gray"
            variant="ghost"
            @click="close"
          >
            Cancel
          </UButton>
          <UButton
            type="submit"
            color="primary"
            :loading="isSubmitting"
            :disabled="form.fields.length === 0"
          >
            {{ editing ? 'Update' : 'Create' }} Template
          </UButton>
        </div>
      </UForm>
    </UCard>
  </UModal>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useMeasurementTemplates } from '~/composables/measurements/useMeasurementTemplates';

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  template: {
    type: Object,
    default: null,
  },
});

const emit = defineEmits(['update:modelValue', 'saved']);

const { createTemplate, updateTemplate } = useMeasurementTemplates();

const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
});

const editing = computed(() => !!props.template);
const isSubmitting = ref(false);

// Form state
const form = ref({
  name: '',
  gender: 'unisex' as 'male' | 'female' | 'unisex',
  fields: [] as Array<{
    key: string;
    id?: number;
    name: string;
    unit: 'in' | 'cm';
    isRequired: boolean;
    isDefault?: boolean;
  }>,
});

// Field errors
const fieldErrors = ref<Record<string, { name?: string; unit?: string }>>({});

// Options
const genderOptions = [
  { label: 'Male', value: 'male' },
  { label: 'Female', value: 'female' },
  { label: 'Unisex', value: 'unisex' },
];

const unitOptions = [
  { label: 'Inches (in)', value: 'in' },
  { label: 'Centimeters (cm)', value: 'cm' },
];

// Generate a unique key for each field
const generateKey = () => Math.random().toString(36).substring(2, 11);

// Add a new field
const addField = (field?: any) => {
  form.value.fields.push({
    key: generateKey(),
    name: field?.name || '',
    unit: field?.unit || 'in',
    isRequired: field?.isRequired ?? true,
    isDefault: field?.isDefault ?? false,
    ...(field?.id && { id: field.id }),
  });
};

// Remove a field
const removeField = (index: number) => {
  form.value.fields.splice(index, 1);
};

// Move field up
const moveFieldUp = (index: number) => {
  if (index === 0) return;
  
  const temp = form.value.fields[index];
  form.value.fields.splice(index, 1);
  form.value.fields.splice(index - 1, 0, temp);
};

// Move field down
const moveFieldDown = (index: number) => {
  if (index === form.value.fields.length - 1) return;
  
  const temp = form.value.fields[index];
  form.value.fields.splice(index, 1);
  form.value.fields.splice(index + 1, 0, temp);
};

// Reset form
const resetForm = () => {
  form.value = {
    name: '',
    gender: 'unisex',
    fields: [],
  };
  fieldErrors.value = {};
};

// Load template data
const loadTemplateData = () => {
  if (!props.template) {
    resetForm();
    return;
  }

  form.value = {
    name: props.template.name,
    gender: props.template.gender,
    fields: (props.template.fields || []).map((field: any) => ({
      key: generateKey(),
      id: field.id,
      name: field.name,
      unit: field.unit,
      isRequired: field.isRequired,
      isDefault: field.isDefault,
    })),
  };
};

// Validate form
const validate = () => {
  let isValid = true;
  const errors: Record<string, { name?: string; unit?: string }> = {};
  const fieldNames = new Set<string>();

  form.value.fields.forEach((field, index) => {
    const fieldKey = field.key;
    const fieldErrors: { name?: string; unit?: string } = {};

    // Validate name
    if (!field.name.trim()) {
      fieldErrors.name = 'Field name is required';
      isValid = false;
    } else if (fieldNames.has(field.name.toLowerCase())) {
      fieldErrors.name = 'Field name must be unique';
      isValid = false;
    } else {
      fieldNames.add(field.name.toLowerCase());
    }

    // Validate unit
    if (!field.unit) {
      fieldErrors.unit = 'Unit is required';
      isValid = false;
    }

    if (Object.keys(fieldErrors).length > 0) {
      errors[fieldKey] = fieldErrors;
    }
  });

  fieldErrors.value = errors;
  return isValid;
};

// Submit form
const onSubmit = async () => {
  if (!validate()) {
    return;
  }

  isSubmitting.value = true;

  try {
    const templateData = {
      name: form.value.name,
      gender: form.value.gender,
      fields: form.value.fields.map((field, index) => ({
        ...(field.id && { id: field.id }),
        name: field.name.trim(),
        unit: field.unit,
        isRequired: field.isRequired,
        displayOrder: index,
      })),
    };

    if (editing.value) {
      await updateTemplate(props.template!.id!, templateData);
    } else {
      await createTemplate(templateData);
    }

    emit('saved');
    close();
  } catch (error) {
    console.error('Error saving template:', error);
  } finally {
    isSubmitting.value = false;
  }
};

// Close modal
const close = () => {
  isOpen.value = false;
};

// Watch for template changes
watch(() => props.template, loadTemplateData, { immediate: true });

// Reset form when modal is closed
watch(isOpen, (newVal) => {
  if (!newVal) {
    resetForm();
  }
});
</script>
