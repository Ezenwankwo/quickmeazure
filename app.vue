<template>
  <UApp>
    <!-- Removed ClientOnly wrapper to fix navigation double-click issue -->
    <NuxtLayout :name="layout">
      <template #default>
        <!-- Removed :route prop which was causing reactivity issues -->
        <NuxtPage />
      </template>
    </NuxtLayout>
    
    <!-- Loading indicator moved outside the main navigation flow -->
    <ClientOnly>
      <template #fallback>
        <div class="fixed inset-0 flex justify-center items-center bg-white bg-opacity-80 z-50">
          <UIcon name="i-heroicons-arrow-path" class="animate-spin text-5xl text-primary-500" />
        </div>
      </template>
    </ClientOnly>
  </UApp>
</template>

<script setup>
import { useLayout } from '~/composables/useLayout';

// Get the current layout
const { layout } = useLayout();

// Set page metadata
useHead({
  title: 'QuickMeazure - Tailor Business Management',
  meta: [
    { name: 'description', content: 'Easily manage your clients\'s measurements, styles, and payments with QuickMeazure.' }
  ],
  link: [
    { rel: 'icon', type: 'image/svg+xml', href: '/favicon.ico' }
  ]
});
</script>
