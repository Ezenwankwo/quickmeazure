<template>
  <div class="min-h-screen bg-gray-50 py-4">
    <!-- Top Navigation Bar -->
    <header class="fixed top-0 left-0 right-0 z-50 bg-white shadow-sm">
      <div class="container mx-auto px-4 py-3 flex justify-between items-center">
        <div class="flex items-center">
          <ULink to="/" class="flex items-center space-x-2">
            <UIcon name="i-heroicons-scissors" class="text-primary-600 text-2xl" />
            <span class="text-xl font-bold text-primary-600">QuickMeazure</span>
          </ULink>
        </div>
        
        <ClientOnly>
          <!-- Navigation for guests -->
          <div v-if="!isLoggedIn" class="flex items-center space-x-2 sm:space-x-4">
            <UButton
              v-if="route.path !== '/auth/login'"
              to="/auth/login"
              color="neutral"
              variant="outline"
            >
              Login
            </UButton>
            <UButton
              v-if="route.path !== '/auth/register'"
              to="/auth/register"
              color="primary"
            >
              Register
            </UButton>
          </div>
        </ClientOnly>
      </div>
    </header>
    
    <!-- Main content wrapper -->
    <div class="container mx-auto px-4 pt-16 pb-20 sm:pb-6">
      <main>
        <slot />
      </main>
    </div>

    <!-- Use ClientOnly component for footer -->
    <ClientOnly>
      <!-- Footer - only show on public pages -->
      <footer v-if="!isLoggedIn" class="bg-white border-t border-gray-200 py-6 mt-8">
        <div class="container mx-auto px-4 text-center text-sm text-gray-600">
          <p>© {{ new Date().getFullYear() }} QuickMeazure. All rights reserved.</p>
          <div class="flex justify-center space-x-4 mt-2">
            <ULink to="/legal/terms" class="hover:text-primary-600">Terms of Service</ULink>
            <ULink to="/legal/privacy" class="hover:text-primary-600">Privacy Policy</ULink>
          </div>
        </div>
      </footer>
    </ClientOnly>
  </div>
</template>

<script setup>
// Get authenticated user with useSessionAuth composable
import { useSessionAuth } from '~/composables/useSessionAuth';
const { isLoggedIn } = useSessionAuth();
const route = useRoute();

// Redirect to dashboard if user is logged in and trying to access public pages
// Exclude auth pages from this redirection
watchEffect(() => {
  if (isLoggedIn.value && !route.path.startsWith('/auth') && route.path !== '/') {
    // Only redirect for protected pages
    navigateTo('/dashboard');
  }
});
</script>