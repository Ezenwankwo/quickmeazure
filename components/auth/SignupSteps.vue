<template>
  <div class="w-full mb-8">
    <UStepper
      v-model="activeStep"
      :items="stepItems"
      :ui="{
        wrapper: 'w-full',
        container: 'relative',
        step: {
          inactive: 'group',
          active: 'group',
          complete: 'group',
        },
        separator: {
          container: 'flex-1 h-0.5 mx-2',
          inactive: 'bg-gray-200',
          active: 'bg-primary-500',
          complete: 'bg-primary-500',
        },
        icon: {
          container:
            'relative flex h-10 w-10 items-center justify-center rounded-full border-2 bg-white z-10',
          inactive: 'border-gray-300 text-gray-400',
          active: 'border-primary-500 text-primary-600',
          complete: 'border-primary-500 bg-primary-500 text-white',
        },
        label: {
          container: 'mt-2 text-center',
          inactive: 'text-xs font-medium text-gray-500',
          active: 'text-xs font-medium text-primary-600',
          complete: 'text-xs font-medium text-primary-600',
        },
      }"
    >
      <template #complete>
        <UIcon name="i-heroicons-check" class="h-5 w-5" />
      </template>
    </UStepper>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  currentStep: {
    type: Number,
    required: true,
  },
  steps: {
    type: Array,
    default: () => [
      { label: 'Register' },
      { label: 'Confirm Plan' },
      { label: 'Setup Measurements' },
    ],
  },
})

// Convert steps array to format expected by UStepper
const stepItems = computed(() => {
  return props.steps.map((step, index) => ({
    title: step.label,
    description: '',
    complete: props.currentStep > index + 1,
    active: props.currentStep === index + 1,
  }))
})

// Computed property for UStepper v-model
const activeStep = computed(() => {
  return props.currentStep - 1
})
</script>
