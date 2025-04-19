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
          <!-- Navigation for authenticated users -->
          <div class="flex items-center space-x-2 sm:space-x-4">
            <UButton
              icon="i-heroicons-bell"
              color="gray"
              variant="ghost"
              aria-label="Notifications"
              class="hidden sm:flex"
            />
            <div class="relative dropdown-container">
              <UButton
                color="gray"
                variant="ghost"
                class="truncate max-w-[100px] sm:max-w-none"
                trailing-icon="i-heroicons-chevron-down"
                @click="isDropdownOpen = !isDropdownOpen"
              >
                <span class="hidden sm:inline">{{ user?.name || 'User' }}</span>
                <UIcon name="i-heroicons-user-circle" class="sm:hidden text-lg" />
              </UButton>
              
              <div v-if="isDropdownOpen" class="absolute right-0 mt-1 w-48 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-gray-300 ring-opacity-5 focus:outline-none z-10">
                <div class="py-1">
                  <ULink to="/profile" class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                    <UIcon name="i-heroicons-user" class="mr-2" />Profile
                  </ULink>
                  <ULink to="/settings" class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                    <UIcon name="i-heroicons-cog-6-tooth" class="mr-2" />Settings
                  </ULink>
                  <div class="border-t border-gray-200 my-1"></div>
                  <button
                    class="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    @click="handleLogout"
                  >
                    <UIcon name="i-heroicons-arrow-right-on-rectangle" class="mr-2" />Logout
                  </button>
                </div>
              </div>
            </div>
          </div>
        </ClientOnly>
      </div>
    </header>
    
    <!-- Main content wrapper -->
    <div class="container mx-auto px-4 pt-16 pb-20 sm:pb-6">
      <div class="flex">
        <ClientOnly>
          <!-- Desktop sidebar -->
          <aside
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
        </ClientOnly>
        
        <!-- Main Content -->
        <main class="flex-1">
          <slot />
        </main>
      </div>
    </div>

    <!-- Mobile Footer Navigation -->
    <ClientOnly>
      <footer class="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 md:hidden">
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
    </ClientOnly>
  </div>
</template>

<script setup>
import { ref, watch, onMounted, computed } from 'vue';
import { useSessionAuth } from '~/composables/useSessionAuth';

const auth = useSessionAuth();
const user = computed(() => auth.user.value);
const route = useRoute();
const router = useRouter();
const toast = useToast();

// Dropdown state
const isDropdownOpen = ref(false);

// Close dropdown when clicking outside or on route change
onMounted(() => {
  document.addEventListener('click', (e) => {
    const dropdown = document.querySelector('.dropdown-container');
    if (isDropdownOpen.value && dropdown && !dropdown.contains(e.target)) {
      isDropdownOpen.value = false;
    }
  });
});

// Close dropdown on route change
watch(route, () => {
  isDropdownOpen.value = false;
});

// Update the logout function
const handleLogout = async () => {
  try {
    await auth.logout();
    navigateTo('/auth/login');
  } catch (error) {
    console.error('Error logging out:', error);
  }
};
</script> 