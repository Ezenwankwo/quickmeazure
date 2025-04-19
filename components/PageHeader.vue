<template>
  <div class="border-b pb-4 mb-6 sm:mb-8">
    <div class="flex flex-col sm:flex-row justify-between gap-4 sm:items-center">
      <div>
        <h1 class="text-xl sm:text-2xl font-bold text-gray-800 group">
          {{ title }}
          <span class="block h-1 w-20 sm:w-24 bg-primary-500 mt-1 group-hover:w-28 sm:group-hover:w-32 transition-all duration-300"></span>
        </h1>
        <p v-if="subtitle" class="text-sm sm:text-base text-gray-500 mt-1">{{ subtitle }}</p>
      </div>
      <slot name="actions">
        <UButton
          v-if="primaryAction"
          :to="primaryAction.to"
          :icon="primaryAction.icon"
          color="primary" 
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
    required: true
  },
  
  /**
   * Optional subtitle to display below the title
   */
  subtitle: {
    type: String,
    default: ''
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
    //   icon: 'i-heroicons-plus',
    //   to: '/some/route',  // optional, for router-link
    //   onClick: () => {}   // optional, for click handler
    // }
  }
});
</script> 