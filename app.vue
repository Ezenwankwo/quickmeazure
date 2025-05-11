<template>
  <UApp>
    <ClientOnly>
      <NuxtLayout :name="layout">
        <template #default>
          <NuxtPage :route="$route" />
        </template>
      </NuxtLayout>
      
      <template #fallback>
        <div class="flex justify-center items-center h-screen">
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
