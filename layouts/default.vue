<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Top Navigation Bar -->
    <header class="bg-white shadow-sm">
      <div class="container mx-auto px-4 py-3 flex justify-between items-center">
        <NuxtLink to="/" class="flex items-center space-x-2">
          <UIcon name="i-heroicons-scissors" class="text-primary-600 text-2xl" />
          <span class="text-xl font-bold text-primary-600">QuickMeazure</span>
        </NuxtLink>
        
        <!-- Navigation for authenticated users -->
        <div v-if="isLoggedIn" class="flex items-center space-x-4">
          <UButton
            icon="i-heroicons-bell"
            color="gray"
            variant="ghost"
            aria-label="Notifications"
          />
          <UDropdown :items="userMenuItems">
            <UButton
              color="gray"
              variant="ghost"
              trailing-icon="i-heroicons-chevron-down"
            >
              <span>{{ user?.name || 'User' }}</span>
            </UButton>
          </UDropdown>
        </div>
        
        <!-- Navigation for guests -->
        <div v-else class="flex items-center space-x-4">
          <UButton
            to="/auth/login"
            color="gray"
            variant="ghost"
          >
            Login
          </UButton>
          <UButton
            to="/auth/register"
            color="primary"
          >
            Register
          </UButton>
        </div>
      </div>
    </header>
    
    <div class="container mx-auto px-4 py-6 flex">
      <!-- Sidebar (only for authenticated users) -->
      <aside v-if="isLoggedIn && showSidebar" class="w-64 pr-6">
        <nav class="space-y-1">
          <UButton
            block
            to="/dashboard"
            color="gray"
            variant="ghost"
            class="justify-start"
            :ui="{ rounded: 'rounded-lg' }"
            :trailing="false"
            icon="i-heroicons-home"
          >
            Dashboard
          </UButton>
          <UButton
            block
            to="/clients"
            color="gray"
            variant="ghost"
            class="justify-start"
            :ui="{ rounded: 'rounded-lg' }"
            :trailing="false"
            icon="i-heroicons-users"
          >
            Clients
          </UButton>
          <UButton
            block
            to="/measurements"
            color="gray"
            variant="ghost"
            class="justify-start"
            :ui="{ rounded: 'rounded-lg' }"
            :trailing="false"
            icon="i-heroicons-variable"
          >
            Measurements
          </UButton>
          <UButton
            block
            to="/styles"
            color="gray"
            variant="ghost"
            class="justify-start"
            :ui="{ rounded: 'rounded-lg' }"
            :trailing="false"
            icon="i-heroicons-swatch"
          >
            Styles
          </UButton>
          <UButton
            block
            to="/orders"
            color="gray"
            variant="ghost"
            class="justify-start"
            :ui="{ rounded: 'rounded-lg' }"
            :trailing="false"
            icon="i-heroicons-shopping-bag"
          >
            Orders
          </UButton>
          <UButton
            block
            to="/payments"
            color="gray"
            variant="ghost"
            class="justify-start"
            :ui="{ rounded: 'rounded-lg' }"
            :trailing="false"
            icon="i-heroicons-currency-dollar"
          >
            Payments
          </UButton>
          <UButton
            block
            to="/subscription"
            color="gray"
            variant="ghost"
            class="justify-start"
            :ui="{ rounded: 'rounded-lg' }"
            :trailing="false"
            icon="i-heroicons-credit-card"
          >
            Subscription
          </UButton>
          <UButton
            block
            to="/settings"
            color="gray"
            variant="ghost"
            class="justify-start"
            :ui="{ rounded: 'rounded-lg' }"
            :trailing="false"
            icon="i-heroicons-cog-6-tooth"
          >
            Settings
          </UButton>
        </nav>
      </aside>
      
      <!-- Main Content -->
      <main class="flex-1">
        <slot />
      </main>
    </div>
  </div>
</template>

<script setup>
// Import auth composable
const { user, isLoggedIn, logout } = useAuth();

// Determine if sidebar should be shown (based on route)
const route = useRoute();
const showSidebar = computed(() => {
  // Don't show sidebar on auth pages
  return !route.path.startsWith('/auth/');
});

// User dropdown menu items
const userMenuItems = [
  [
    {
      label: 'Profile',
      icon: 'i-heroicons-user-circle',
      to: '/profile'
    },
    {
      label: 'Settings',
      icon: 'i-heroicons-cog-6-tooth',
      to: '/settings'
    }
  ],
  [
    {
      label: 'Logout',
      icon: 'i-heroicons-arrow-right-on-rectangle',
      click: () => {
        logout();
        navigateTo('/');
      }
    }
  ]
];
</script>