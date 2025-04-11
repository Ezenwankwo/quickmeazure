<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Top Navigation Bar -->
    <header class="bg-white shadow-sm">
      <div class="container mx-auto px-4 py-3 flex justify-between items-center">
        <div class="flex items-center">
          <!-- Mobile Menu Button (only for authenticated users) -->
          <UButton
            v-if="isLoggedIn"
            color="gray"
            variant="ghost"
            icon="i-heroicons-bars-3"
            class="mr-2 md:hidden"
            @click="isMobileMenuOpen = !isMobileMenuOpen"
            aria-label="Toggle menu"
          />
          
          <NuxtLink to="/" class="flex items-center space-x-2">
            <UIcon name="i-heroicons-scissors" class="text-primary-600 text-2xl" />
            <span class="text-xl font-bold text-primary-600">QuickMeazure</span>
          </NuxtLink>
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
          <UDropdown :items="userMenuItems">
            <UButton
              color="gray"
              variant="ghost"
              class="truncate max-w-[100px] sm:max-w-none"
              trailing-icon="i-heroicons-chevron-down"
            >
              <span class="hidden sm:inline">{{ user?.name || 'User' }}</span>
              <UIcon name="i-heroicons-user-circle" class="sm:hidden text-lg" />
            </UButton>
          </UDropdown>
        </div>
        
        <!-- Navigation for guests -->
        <div v-else class="flex items-center space-x-2 sm:space-x-4">
          <UButton
            to="/auth/login"
            color="gray"
            variant="ghost"
            size="sm"
            class="sm:text-base"
          >
            Login
          </UButton>
          <UButton
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
    
    <!-- Mobile sidebar overlay -->
    <div 
      v-if="isMobileMenuOpen && isLoggedIn" 
      class="fixed inset-0 bg-black/30 z-40 md:hidden"
      @click="isMobileMenuOpen = false"
    ></div>
    
    <!-- Mobile sidebar -->
    <aside
      v-if="isLoggedIn"
      :class="[
        'fixed top-0 left-0 h-full bg-white shadow-lg z-50 transform transition-transform duration-300 w-64',
        isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full',
        'md:hidden'
      ]"
    >
      <div class="p-4 border-b flex justify-between items-center">
        <div class="flex items-center space-x-2">
          <UIcon name="i-heroicons-scissors" class="text-primary-600 text-xl" />
          <span class="font-bold text-primary-600">QuickMeazure</span>
        </div>
        <UButton
          color="gray"
          variant="ghost"
          icon="i-heroicons-x-mark"
          @click="isMobileMenuOpen = false"
          aria-label="Close menu"
        />
      </div>
      
      <nav class="p-2 space-y-1">
        <UButton
          block
          to="/dashboard"
          color="gray"
          :variant="route.path.startsWith('/dashboard') ? 'solid' : 'ghost'"
          class="justify-start"
          :ui="{ rounded: 'rounded-lg' }"
          :trailing="false"
          icon="i-heroicons-home"
          @click="isMobileMenuOpen = false"
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
          icon="i-heroicons-users"
          @click="isMobileMenuOpen = false"
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
          icon="i-heroicons-variable"
          @click="isMobileMenuOpen = false"
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
          icon="i-heroicons-swatch"
          @click="isMobileMenuOpen = false"
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
          icon="i-heroicons-shopping-bag"
          @click="isMobileMenuOpen = false"
        >
          Orders
        </UButton>
        <UButton
          block
          to="/subscription"
          color="gray"
          :variant="route.path.startsWith('/subscription') ? 'solid' : 'ghost'"
          class="justify-start"
          :ui="{ rounded: 'rounded-lg' }"
          :trailing="false"
          icon="i-heroicons-credit-card"
          @click="isMobileMenuOpen = false"
        >
          Subscription
        </UButton>
      </nav>
    </aside>
    
    <!-- Main content wrapper -->
    <div class="container mx-auto px-4 py-4 sm:py-6">
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
              icon="i-heroicons-shopping-bag"
            >
              Orders
            </UButton>
            <UButton
              block
              to="/subscription"
              color="gray"
              :variant="route.path.startsWith('/subscription') ? 'solid' : 'ghost'"
              class="justify-start"
              :ui="{ rounded: 'rounded-lg' }"
              :trailing="false"
              icon="i-heroicons-credit-card"
            >
              Subscription
            </UButton>
          </nav>
        </aside>
        
        <!-- Main Content -->
        <main class="flex-1">
          <slot />
        </main>
      </div>
    </div>

    <!-- Notifications -->
    <UNotifications :ui="{ position: 'top-0 bottom-[unset]' }" />
  </div>
</template>

<script setup>
// Import auth composable
const { user, isLoggedIn, logout } = useAuth();

// Mobile menu state
const isMobileMenuOpen = ref(false);

// Close mobile menu when route changes
watch(() => useRoute().fullPath, () => {
  isMobileMenuOpen.value = false;
});

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