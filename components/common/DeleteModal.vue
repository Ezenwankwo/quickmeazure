<template>
  <div v-if="modelValue" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
    <UCard class="w-full max-w-md mx-auto">
      <template #header>
        <div class="flex items-center">
          <UIcon name="i-heroicons-exclamation-triangle" class="text-red-500 mr-2" />
          <h3 class="text-lg font-medium">
            {{ title }}
          </h3>
        </div>
      </template>

      <!-- eslint-disable-next-line vue/no-v-html -->
      <p v-html="message" />

      <template #footer>
        <div class="flex justify-end space-x-4">
          <UButton color="neutral" variant="outline" @click="$emit('update:modelValue', false)">
            {{ cancelText }}
          </UButton>
          <UButton color="error" :loading="loading" @click="$emit('confirm')">
            {{ confirmText }}
          </UButton>
        </div>
      </template>
    </UCard>
  </div>
</template>

<script setup>
defineProps({
  modelValue: {
    type: Boolean,
    required: true,
  },
  title: {
    type: String,
    default: 'Confirm Delete',
  },
  message: {
    type: String,
    default: '',
  },
  cancelText: {
    type: String,
    default: 'Cancel',
  },
  confirmText: {
    type: String,
    default: 'Delete',
  },
  loading: {
    type: Boolean,
    default: false,
  },
})

defineEmits(['update:modelValue', 'confirm'])
</script>
