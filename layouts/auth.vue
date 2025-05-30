<template>
  <div class="min-h-screen bg-gray-50 py-4">
    <!-- Top Navigation Bar -->
    <header class="fixed top-0 left-0 right-0 z-50 bg-white shadow-sm">
      <div class="container mx-auto px-4 py-3 flex justify-between items-center">
        <div class="flex items-center">
          <ULink
            :to="routes.ROUTE_PATHS[routes.ROUTE_NAMES.HOME]"
            class="flex items-center space-x-2"
          >
            <UIcon name="i-heroicons-scissors" class="text-primary-600 text-2xl" />
            <span class="text-xl font-bold text-primary-600">QuickMeazure</span>
          </ULink>
        </div>

        <!-- Navigation for guests -->
        <div class="flex items-center space-x-2 sm:space-x-4">
          <UButton
            v-if="showLoginButton"
            :to="routes.ROUTE_PATHS[routes.ROUTE_NAMES.AUTH.LOGIN]"
            color="neutral"
            variant="outline"
          >
            Login
          </UButton>
          <UButton
            v-if="showRegisterButton"
            :to="routes.ROUTE_PATHS[routes.ROUTE_NAMES.AUTH.REGISTER]"
            color="primary"
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
  </div>
</template>

<script setup lang="ts">
// Get current route for conditional rendering
const route = useRoute()
const routes = useAppRoutes()

// Check if current page is subscription confirm page
const isSubscriptionConfirmPage = computed(() => {
  return route.path === routes.ROUTE_PATHS[routes.ROUTE_NAMES.AUTH.CONFIRM]
})

// Check if current page is setup measurements page
const isSetupMeasurementsPage = computed(() => {
  return route.path === routes.ROUTE_PATHS[routes.ROUTE_NAMES.AUTH.SETUP_MEASUREMENTS]
})

// Show login button condition
const showLoginButton = computed(() => {
  return (
    route.path !== routes.ROUTE_PATHS[routes.ROUTE_NAMES.AUTH.LOGIN] &&
    !isSubscriptionConfirmPage.value &&
    !isSetupMeasurementsPage.value
  )
})

// Show register button condition
const showRegisterButton = computed(() => {
  return (
    route.path !== routes.ROUTE_PATHS[routes.ROUTE_NAMES.AUTH.REGISTER] &&
    !isSubscriptionConfirmPage.value &&
    !isSetupMeasurementsPage.value
  )
})
</script>
