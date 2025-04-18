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
        
        <!-- Navigation for authenticated users -->
        <div v-if="isLoggedIn" class="flex items-center space-x-2 sm:space-x-4">
          <UButton
            icon="i-heroicons-bell"
            color="gray"
            variant="ghost"
            aria-label="Notifications"
            class="hidden sm:flex"
          />
          <UDropdownMenu :items="userMenuItems">
            <UButton
              color="gray"
              variant="ghost"
              class="truncate max-w-[100px] sm:max-w-none"
              trailing-icon="i-heroicons-chevron-down"
            >
              <span class="hidden sm:inline">{{ user?.name || 'User' }}</span>
              <UIcon name="i-heroicons-user-circle" class="sm:hidden text-lg" />
            </UButton>
          </UDropdownMenu>
        </div>
        
        <!-- Navigation for guests -->
        <div v-else class="flex items-center space-x-2 sm:space-x-4">
          <UButton
            v-if="route.path !== '/auth/login'"
            to="/auth/login"
            color="gray"
            variant="outline"
            size="sm"
            class="sm:text-base border border-gray-400 hover:border-gray-600"
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
      <div class="flex">
        <!-- Desktop sidebar -->
        <aside
          v-if="isLoggedIn && showSidebar"
          class="hidden md:block w-64 pr-6 sticky top-20 self-start h-[calc(100vh-80px)] overflow-y-auto pb-8"
        >
          <nav class="space-y-1">
            <UButton
              block
              to="/dashboard"
              color="gray"
              :variant="route.path.startsWith('/dashboard') ? 'solid' : 'ghost'"
              class="justify-start"
              :ui="{ rounded: 'rounded-lg' }"
              :trailing="false"
              size="lg"
              icon="i-heroicons-home"
            >
              Dashboard
            </UButton>
            <UButton
              block
              to="/clients"
              color="gray"
              :variant="route.path.startsWith('/clients') ? 'solid' : 'ghost'"
              class="justify-start"
              :ui="{ rounded: 'rounded-lg' }"
              :trailing="false"
              size="lg"
              icon="i-heroicons-users"
            >
              Clients
            </UButton>
            <UButton
              block
              to="/measurements"
              color="gray"
              :variant="route.path.startsWith('/measurements') ? 'solid' : 'ghost'"
              class="justify-start"
              :ui="{ rounded: 'rounded-lg' }"
              :trailing="false"
              size="lg"
              icon="i-heroicons-variable"
            >
              Measurements
            </UButton>
            <UButton
              block
              to="/styles"
              color="gray"
              :variant="route.path.startsWith('/styles') ? 'solid' : 'ghost'"
              class="justify-start"
              :ui="{ rounded: 'rounded-lg' }"
              :trailing="false"
              size="lg"
              icon="i-heroicons-swatch"
            >
              Styles
            </UButton>
            <UButton
              block
              to="/orders"
              color="gray"
              :variant="route.path.startsWith('/orders') ? 'solid' : 'ghost'"
              class="justify-start"
              :ui="{ rounded: 'rounded-lg' }"
              :trailing="false"
              size="lg"
              icon="i-heroicons-shopping-bag"
            >
              Orders
            </UButton>
          </nav>
        </aside>
        
        <!-- Main Content -->
        <main class="flex-1">
          <slot />
        </main>
      </div>
    </div>

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

    <!-- Mobile Footer Navigation -->
    <footer v-if="isLoggedIn" class="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 md:hidden">
      <nav class="grid grid-cols-5 gap-1 p-2">
        <UButton
          to="/dashboard"
          color="gray"
          :variant="route.path.startsWith('/dashboard') ? 'solid' : 'ghost'"
          class="flex-col h-auto py-2"
          size="lg"
          :ui="{ rounded: 'rounded-lg' }"
          icon="i-heroicons-home"
        >
          <span class="text-xs mt-1">Dashboard</span>
        </UButton>
        <UButton
          to="/clients"
          color="gray"
          :variant="route.path.startsWith('/clients') ? 'solid' : 'ghost'"
          class="flex-col h-auto py-2"
          size="lg"
          :ui="{ rounded: 'rounded-lg' }"
          icon="i-heroicons-users"
        >
          <span class="text-xs mt-1">Clients</span>
        </UButton>
        <UButton
          to="/measurements"
          color="gray"
          :variant="route.path.startsWith('/measurements') ? 'solid' : 'ghost'"
          class="flex-col h-auto py-2"
          size="lg"
          :ui="{ rounded: 'rounded-lg' }"
          icon="i-heroicons-variable"
        >
          <span class="text-xs mt-1">Measure</span>
        </UButton>
        <UButton
          to="/styles"
          color="gray"
          :variant="route.path.startsWith('/styles') ? 'solid' : 'ghost'"
          class="flex-col h-auto py-2"
          size="lg"
          :ui="{ rounded: 'rounded-lg' }"
          icon="i-heroicons-swatch"
        >
          <span class="text-xs mt-1">Styles</span>
        </UButton>
        <UButton
          to="/orders"
          color="gray"
          :variant="route.path.startsWith('/orders') ? 'solid' : 'ghost'"
          class="flex-col h-auto py-2"
          size="lg"
          :ui="{ rounded: 'rounded-lg' }"
          icon="i-heroicons-shopping-bag"
        >
          <span class="text-xs mt-1">Orders</span>
        </UButton>
      </nav>
    </footer>
  </div>
</template>

<script setup>
// Get authenticated user with useAuth composable
const { isLoggedIn, user, logout } = useAuth();
const route = useRoute();
const router = useRouter();

// Control sidebar visibility
const showSidebar = computed(() => {
  // Hide sidebar on landing page and auth pages
  return !route.path.startsWith('/auth') && route.path !== '/';
});

// User menu dropdown items
const userMenuItems = computed(() => [
  [
    {
      label: 'Profile',
      icon: 'i-heroicons-user',
      to: '/profile',
    },
    {
      label: 'Settings',
      icon: 'i-heroicons-cog-6-tooth',
      to: '/settings',
    },
  ],
  [
    {
      label: 'Logout',
      icon: 'i-heroicons-arrow-right-on-rectangle',
      click: async () => {
        await logout();
        await router.push('/auth/login');
      },
    },
  ],
]);
</script>