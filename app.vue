<template>
  <UApp :toaster="{ position: 'top-center' }">
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

    <!-- PWA Install Prompt - Only show in production -->
    <ClientOnly>
      <InstallPrompt v-if="!isDev" />
    </ClientOnly>
  </UApp>
</template>

<script setup>
import { useLayout } from '~/composables/useLayout'
import InstallPrompt from '~/components/InstallPrompt.vue'

// Get the current layout
const { layout } = useLayout()

// Check if we're in development mode
const isDev = import.meta.dev
</script>
