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
            <UDrawer v-model="isNotificationsOpen" direction="right">
              <template #default>
                <UChip :text="notifications.length" size="3xl">
                  <UButton
                    icon="i-heroicons-bell"
                    color="neutral"
                    variant="subtle"
                    aria-label="Notifications"
                  />
                </UChip>
              </template>

              <template #content>
                <div class="p-4 min-w-96">
                  <div class="flex items-center justify-between mb-4">
                    <h2 class="text-xl font-semibold">Notifications</h2>
                    <UButton
                      icon="i-heroicons-x-mark"
                      color="gray"
                      variant="ghost"
                      @click="isNotificationsOpen = false"
                    />
                  </div>

                  <div class="space-y-3">
                    <div
                      v-for="(notification, index) in notifications"
                      :key="index"
                      class="p-3 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                    >
                      <div class="flex items-start gap-3">
                        <UIcon :name="notification.icon" class="text-primary-600 mt-0.5 size-5" />
                        <div class="flex-1">
                          <div class="font-medium">
                            {{ notification.title }}
                          </div>
                          <p class="text-sm text-gray-600">
                            {{ notification.message }}
                          </p>
                          <div class="text-xs text-gray-500 mt-1">
                            {{ notification.time }}
                          </div>
                        </div>
                        <UBadge
                          v-if="!notification.read"
                          color="primary"
                          variant="solid"
                          size="xs"
                          class="ml-2"
                        >
                          New
                        </UBadge>
                      </div>
                    </div>

                    <div v-if="notifications.length === 0" class="text-center py-8 text-gray-500">
                      <UIcon name="i-heroicons-inbox" class="mx-auto mb-2 size-8" />
                      <p>No notifications</p>
                    </div>
                  </div>
                </div>
              </template>
            </UDrawer>
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

              <div
                v-if="isDropdownOpen"
                class="absolute right-0 mt-1 w-48 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-gray-300 ring-opacity-5 focus:outline-none z-10"
              >
                <div class="py-1">
                  <ULink
                    to="/settings"
                    class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    <UIcon name="i-heroicons-cog-6-tooth" class="mr-2" />Settings
                  </ULink>
                  <ULink
                    to="/activity"
                    class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    <UIcon name="i-heroicons-clock" class="mr-2" />Activity Log
                  </ULink>
                  <div class="border-t border-gray-200 my-1" />
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
      <div class="flex flex-nowrap">
        <ClientOnly>
          <!-- Desktop sidebar -->
          <aside
            class="hidden md:block w-64 flex-shrink-0 pr-6 sticky top-20 self-start h-[calc(100vh-80px)] overflow-y-auto pb-8"
          >
            <nav class="space-y-1">
              <NuxtLink
                to="/dashboard"
                class="rounded-lg px-2.5 py-1.5 text-sm flex items-center gap-1.5 font-medium justify-start hover:bg-gray-100 transition-colors"
                :class="
                  route.path === '/dashboard'
                    ? 'bg-primary-50 font-semibold text-primary-700 border-l-3 border-primary-600 pl-2'
                    : 'text-gray-500'
                "
              >
                <UIcon name="i-heroicons-home" class="size-5 shrink-0" />
                <span class="truncate">Dashboard</span>
              </NuxtLink>

              <NuxtLink
                to="/clients"
                class="rounded-lg px-2.5 py-1.5 text-sm flex items-center gap-1.5 font-medium justify-start hover:bg-gray-100 transition-colors"
                :class="
                  route.path.startsWith('/clients') && route.path !== '/clients/new'
                    ? 'bg-primary-50 font-semibold text-primary-700 border-l-3 border-primary-600 pl-2'
                    : 'text-gray-500'
                "
              >
                <UIcon name="i-heroicons-users" class="size-5 shrink-0" />
                <span class="truncate">Clients</span>
              </NuxtLink>

              <NuxtLink
                to="/clients/new"
                class="rounded-lg px-2.5 py-1.5 text-sm flex items-center gap-1.5 font-medium justify-start hover:bg-gray-100 transition-colors"
                :class="
                  route.path === '/clients/new'
                    ? 'bg-primary-50 font-semibold text-primary-700 border-l-3 border-primary-600 pl-2'
                    : 'text-gray-500'
                "
              >
                <UIcon name="i-heroicons-variable" class="size-5 shrink-0" />
                <span class="truncate">Measure</span>
              </NuxtLink>

              <NuxtLink
                to="/styles"
                class="rounded-lg px-2.5 py-1.5 text-sm flex items-center gap-1.5 font-medium justify-start hover:bg-gray-100 transition-colors"
                :class="
                  route.path.startsWith('/styles')
                    ? 'bg-primary-50 font-semibold text-primary-700 border-l-3 border-primary-600 pl-2'
                    : 'text-gray-500'
                "
              >
                <UIcon name="i-heroicons-swatch" class="size-5 shrink-0" />
                <span class="truncate">Styles</span>
              </NuxtLink>

              <NuxtLink
                to="/orders"
                class="rounded-lg px-2.5 py-1.5 text-sm flex items-center gap-1.5 font-medium justify-start hover:bg-gray-100 transition-colors"
                :class="
                  route.path.startsWith('/orders')
                    ? 'bg-primary-50 font-semibold text-primary-700 border-l-3 border-primary-600 pl-2'
                    : 'text-gray-500'
                "
              >
                <UIcon name="i-heroicons-shopping-bag" class="size-5 shrink-0" />
                <span class="truncate">Orders</span>
              </NuxtLink>
            </nav>
          </aside>
        </ClientOnly>

        <!-- Main Content -->
        <main class="flex-1 min-w-0 overflow-hidden">
          <slot />
        </main>
      </div>
    </div>

    <!-- Mobile Footer Navigation -->
    <footer class="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 md:hidden">
      <nav class="grid grid-cols-5 gap-1 p-2">
        <NuxtLink
          to="/dashboard"
          class="flex-col h-auto py-2 rounded-lg flex items-center gap-1.5 font-medium text-sm transition-colors"
          :class="
            route.path === '/dashboard'
              ? 'bg-primary-50 font-semibold text-primary-700 border-t-2 border-primary-600'
              : 'text-gray-500'
          "
        >
          <UIcon name="i-heroicons-home" class="size-5 shrink-0" />
          <span class="text-xs mt-1">Dashboard</span>
        </NuxtLink>

        <NuxtLink
          to="/clients"
          class="flex-col h-auto py-2 rounded-lg flex items-center gap-1.5 font-medium text-sm transition-colors"
          :class="
            route.path.startsWith('/clients') && route.path !== '/clients/new'
              ? 'bg-primary-50 font-semibold text-primary-700 border-t-2 border-primary-600'
              : 'text-gray-500'
          "
        >
          <UIcon name="i-heroicons-users" class="size-5 shrink-0" />
          <span class="text-xs mt-1">Clients</span>
        </NuxtLink>

        <NuxtLink
          to="/clients/new"
          class="flex-col h-auto py-2 rounded-lg flex items-center gap-1.5 font-medium text-sm transition-colors"
          :class="
            route.path === '/clients/new'
              ? 'bg-primary-50 font-semibold text-primary-700 border-t-2 border-primary-600'
              : 'text-gray-500'
          "
        >
          <UIcon name="i-heroicons-variable" class="size-5 shrink-0" />
          <span class="text-xs mt-1">Measure</span>
        </NuxtLink>

        <NuxtLink
          to="/styles"
          class="flex-col h-auto py-2 rounded-lg flex items-center gap-1.5 font-medium text-sm transition-colors"
          :class="
            route.path.startsWith('/styles')
              ? 'bg-primary-50 font-semibold text-primary-700 border-t-2 border-primary-600'
              : 'text-gray-500'
          "
        >
          <UIcon name="i-heroicons-swatch" class="size-5 shrink-0" />
          <span class="text-xs mt-1">Styles</span>
        </NuxtLink>

        <NuxtLink
          to="/orders"
          class="flex-col h-auto py-2 rounded-lg flex items-center gap-1.5 font-medium text-sm transition-colors"
          :class="
            route.path.startsWith('/orders')
              ? 'bg-primary-50 font-semibold text-primary-700 border-t-2 border-primary-600'
              : 'text-gray-500'
          "
        >
          <UIcon name="i-heroicons-shopping-bag" class="size-5 shrink-0" />
          <span class="text-xs mt-1">Orders</span>
        </NuxtLink>
      </nav>
    </footer>
  </div>
</template>

<script setup>
import { ref, watch, onMounted, computed } from 'vue'
import { useAuthStore } from '~/store/modules/auth'
import { useSubscriptionStore } from '~/store/modules/subscription'

const authStore = useAuthStore()
const user = computed(() => authStore.user)
const route = useRoute()

// State for dropdowns and drawers
const isDropdownOpen = ref(false)
const isNotificationsOpen = ref(false)

// Dummy notifications data
const notifications = ref([
  {
    id: 1,
    title: 'New Order',
    message: 'You have received a new order from John Doe',
    time: '10 minutes ago',
    icon: 'i-heroicons-shopping-bag',
    read: false,
  },
  {
    id: 2,
    title: 'Measurement Updated',
    message: 'Client Sarah Johnson updated her measurements',
    time: '2 hours ago',
    icon: 'i-heroicons-variable',
    read: false,
  },
  {
    id: 3,
    title: 'Payment Received',
    message: 'Payment of $150 received for order #1234',
    time: 'Yesterday',
    icon: 'i-heroicons-banknotes',
    read: true,
  },
  {
    id: 4,
    title: 'Style Added',
    message: 'New style "Summer Collection" has been added',
    time: '3 days ago',
    icon: 'i-heroicons-swatch',
    read: true,
  },
])

// Close dropdown when clicking outside or on route change
onMounted(() => {
  document.addEventListener('click', e => {
    const dropdown = document.querySelector('.dropdown-container')
    if (isDropdownOpen.value && dropdown && !dropdown.contains(e.target)) {
      isDropdownOpen.value = false
    }
  })
})

// Close dropdown on route change
watch(route, () => {
  isDropdownOpen.value = false
})

// Handle user logout with improved error handling
const handleLogout = async () => {
  try {
    // Set a flag in localStorage to indicate this is an intentional logout
    // This will be used to prevent showing any toasts during logout
    if (import.meta.client) {
      localStorage.setItem('intentionalLogout', 'true')
    }

    // Use the subscription store to clear cached data
    const subscriptionStore = useSubscriptionStore()
    subscriptionStore.clearCache()

    // Logout using the auth store
    await authStore.logout()

    // Use navigateTo with onFinish callback to clean up the flag after navigation completes
    navigateTo('/auth/login', {
      onFinish: () => {
        // Clean up the flag after navigation is complete
        if (import.meta.client) {
          setTimeout(() => {
            localStorage.removeItem('intentionalLogout')
          }, 500) // Small delay to ensure all components have finished processing
        }
      },
    })
  } catch (error) {
    console.error('Error logging out:', error)
    // Clean up the flag in case of error
    if (import.meta.client) {
      localStorage.removeItem('intentionalLogout')
    }
  }
}
</script>

<style scoped>
.active-nav-item {
  position: relative;
  font-weight: 500;
  color: rgb(var(--color-primary-600));
}

.active-nav-item::before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  height: 60%;
  width: 3px;
  background-color: rgb(var(--color-primary-600));
  border-radius: 0 4px 4px 0;
}
</style>
