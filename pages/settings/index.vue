<template>
  <div class="space-y-6">
    <!-- Page Header -->
    <PageHeader title="Settings" />

    <!-- Settings Navigation Tabs -->
    <div class="border-b border-gray-200">
      <nav class="flex space-x-8">
        <NuxtLink 
          v-for="tab in tabs" 
          :key="tab.key"
          :to="tab.to"
          class="whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium"
          :class="{
            'border-primary-500 text-primary-600': currentTab === tab.key,
            'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700': currentTab !== tab.key
          }"
        >
          {{ tab.label }}
        </NuxtLink>
      </nav>
    </div>

    <!-- Tab Content -->
    <div class="py-4">
      <NuxtPage />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';

definePageMeta({
  middleware: ['auth']
});

const route = useRoute();

const tabs = [
  { key: 'profile', label: 'Profile', to: '/settings/profile' },
  { key: 'notifications', label: 'Notifications', to: '/settings/notifications' },
  { key: 'security', label: 'Security', to: '/settings/security' },
  { key: 'measurements', label: 'Measurements', to: '/settings/measurements' },
  { key: 'billing', label: 'Billing', to: '/settings/billing' },
];

const currentTab = computed(() => {
  const path = route.path.split('/').pop() || 'profile';
  return path === 'settings' ? 'profile' : path;
});
</script>
