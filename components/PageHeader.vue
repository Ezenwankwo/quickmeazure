<template>
  <div class="pb-4 mb-6 sm:mb-8">
    <div class="flex flex-row justify-between gap-4 sm:items-center">
      <div>
        <h1 class="text-xl sm:text-2xl font-bold text-gray-800 group">
          {{ title }}
        </h1>
      </div>
      <slot name="actions">
        <UButton
          v-if="primaryAction"
          :to="primaryAction.to"
          color="primary"
          size="lg"
          class="self-start sm:self-auto px-3 sm:px-4 py-1.5 sm:py-2 shadow-sm hover:shadow-md transition-shadow"
          @click="primaryAction.onClick && primaryAction.onClick()"
        >
          {{ primaryAction.label }}
        </UButton>
      </slot>
    </div>
  </div>
</template>

<script setup>
defineProps({
  /**
   * The main title of the page
   */
  title: {
    type: String,
    required: true,
  },

  /**
   * Optional primary action button configuration
   */
  primaryAction: {
    type: Object,
    default: null,
    // Expected shape:
    // {
    //   label: 'Button Text',
    //   to: '/some/route',  // optional, for router-link
    //   onClick: () => {}   // optional, for click handler
    // }
  },
})
</script>
