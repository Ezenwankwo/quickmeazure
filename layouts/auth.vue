<template>
  <div class="min-h-screen bg-gray-50 py-4">
    <!-- Top Navigation Bar -->
    <header class="fixed top-0 left-0 right-0 z-50 bg-white shadow-sm">
      <div class="container mx-auto px-4 py-3 flex justify-between items-center">
        <div class="flex items-center">
          <NuxtLink to="/" class="flex items-center space-x-2">
            <UIcon name="i-heroicons-scissors" class="text-primary-600 text-2xl" />
            <span class="text-xl font-bold text-primary-600">QuickMeazure</span>
          </NuxtLink>
        </div>
        
        <!-- Navigation for guests -->
        <div class="flex items-center space-x-2 sm:space-x-4">
          <UButton
            v-if="route.path !== '/auth/login'"
            to="/auth/login"
            color="gray"
            variant="ghost"
            size="sm"
            class="sm:text-base"
          >
            Login
          </UButton>
          <UButton
            v-if="route.path !== '/auth/register'"
            to="/auth/register"
            color="primary"
            size="sm"
            class="sm:text-base"
          >
            Register
          </UButton>
        </div>
      </div>
    </header>
    
    <!-- Main content wrapper -->
    <div class="container mx-auto px-4 pt-16 pb-20 sm:pb-6">
      <main>
        <slot />
      </main>
    </div>

    <!-- Notifications -->
    <UNotifications :ui="{ position: 'top-0 bottom-[unset]' }" />
  </div>
</template>

<script setup>
// Get current route for conditional rendering
const route = useRoute();
</script> 