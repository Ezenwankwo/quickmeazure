<template>
  <div class="min-h-screen bg-gray-50 py-4">
    <!-- Top Navigation Bar -->
    <header class="fixed top-0 left-0 right-0 z-50 bg-white shadow-sm">
      <div class="container mx-auto px-4 py-3 flex justify-between items-center">
        <div class="flex items-center">
          <ULink :to="DASHBOARD.INDEX" class="flex items-center space-x-2">
            <UIcon name="i-heroicons-scissors" class="text-primary-600 text-2xl" />
            <span class="text-xl font-bold text-primary-600">QuickMeazure</span>
          </ULink>
        </div>

        <ClientOnly>
          <!-- Navigation for authenticated users -->
          <div class="flex items-center space-x-2 sm:space-x-4">
            <!-- Notification Drawer -->
            <UDrawer v-model="isNotificationsOpen" direction="right">
              <template #default>
                <UChip :text="notificationStore.unreadCount" size="3xl">
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
                      v-for="notification in notificationStore.notifications"
                      :key="notification.id"
                      class="p-3 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                      @click="markNotificationAsRead(notification.id)"
                    >
                      <div class="flex items-start gap-3">
                        <UIcon
                          :name="getNotificationIcon(notification)"
                          class="text-primary-600 mt-0.5 size-5"
                        />
                        <div class="flex-1">
                          <div class="font-medium">
                            {{ notification.title }}
                          </div>
                          <p class="text-sm text-gray-600">
                            {{ notification.message }}
                          </p>
                          <div class="text-xs text-gray-500 mt-1">
                            {{ formatNotificationDate(notification.createdAt) }}
                          </div>
                          <div v-if="notification.actionUrl" class="mt-2">
                            <UButton
                              size="xs"
                              :to="notification.actionUrl"
                              class="text-xs"
                              @click.stop
                            >
                              {{ notification.actionText || 'View' }}
                            </UButton>
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

                    <div
                      v-if="notificationStore.notifications.length === 0"
                      class="text-center py-8 text-gray-500"
                    >
                      <UIcon name="i-heroicons-inbox" class="mx-auto mb-2 size-8" />
                      <p>No notifications</p>
                    </div>

                    <div v-if="notificationStore.notifications.length > 0" class="pt-3 border-t">
                      <UButton
                        block
                        color="gray"
                        variant="soft"
                        size="sm"
                        @click="markAllNotificationsAsRead"
                      >
                        Mark all as read
                      </UButton>
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
                <span class="hidden sm:inline">{{ authStore.user?.name || 'User' }}</span>
                <UIcon name="i-heroicons-user-circle" class="sm:hidden text-lg" />
              </UButton>

              <div
                v-if="isDropdownOpen"
                class="absolute right-0 mt-1 w-48 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-gray-300 ring-opacity-5 focus:outline-none z-10"
              >
                <div class="py-1">
                  <ULink
                    :to="DASHBOARD.SETTINGS"
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
                :to="DASHBOARD.INDEX"
                class="rounded-lg px-2.5 py-1.5 text-sm flex items-center gap-1.5 font-medium justify-start hover:bg-gray-100 transition-colors"
                :class="
                  route.path === DASHBOARD.INDEX
                    ? 'bg-primary-50 font-semibold text-primary-700 border-l-3 border-primary-600 pl-2'
                    : 'text-gray-500'
                "
              >
                <UIcon name="i-heroicons-home" class="size-5 shrink-0" />
                <span class="truncate">Dashboard</span>
              </NuxtLink>

              <NuxtLink
                :to="DASHBOARD.CLIENTS.INDEX"
                class="rounded-lg px-2.5 py-1.5 text-sm flex items-center gap-1.5 font-medium justify-start hover:bg-gray-100 transition-colors"
                :class="
                  route.path.startsWith(DASHBOARD.CLIENTS.INDEX) && route.path !== '/clients/new'
                    ? 'bg-primary-50 font-semibold text-primary-700 border-l-3 border-primary-600 pl-2'
                    : 'text-gray-500'
                "
              >
                <UIcon name="i-heroicons-users" class="size-5 shrink-0" />
                <span class="truncate">Clients</span>
              </NuxtLink>

              <NuxtLink
                :to="DASHBOARD.CLIENTS.NEW"
                class="rounded-lg px-2.5 py-1.5 text-sm flex items-center gap-1.5 font-medium justify-start hover:bg-gray-100 transition-colors"
                :class="
                  route.path === DASHBOARD.CLIENTS.NEW
                    ? 'bg-primary-50 font-semibold text-primary-700 border-l-3 border-primary-600 pl-2'
                    : 'text-gray-500'
                "
              >
                <UIcon name="i-heroicons-variable" class="size-5 shrink-0" />
                <span class="truncate">Measure</span>
              </NuxtLink>

              <NuxtLink
                :to="DASHBOARD.STYLES.INDEX"
                class="rounded-lg px-2.5 py-1.5 text-sm flex items-center gap-1.5 font-medium justify-start hover:bg-gray-100 transition-colors"
                :class="
                  route.path.startsWith(DASHBOARD.STYLES.INDEX)
                    ? 'bg-primary-50 font-semibold text-primary-700 border-l-3 border-primary-600 pl-2'
                    : 'text-gray-500'
                "
              >
                <UIcon name="i-heroicons-swatch" class="size-5 shrink-0" />
                <span class="truncate">Styles</span>
              </NuxtLink>

              <NuxtLink
                :to="DASHBOARD.ORDERS.INDEX"
                class="rounded-lg px-2.5 py-1.5 text-sm flex items-center gap-1.5 font-medium justify-start hover:bg-gray-100 transition-colors"
                :class="
                  route.path.startsWith(DASHBOARD.ORDERS.INDEX)
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
          <slot></slot>
        </main>
      </div>
    </div>

    <!-- Mobile Footer Navigation -->
    <footer class="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 md:hidden">
      <nav class="grid grid-cols-5 gap-1 p-2">
        <NuxtLink
          :to="DASHBOARD.INDEX"
          class="flex-col h-auto py-2 rounded-lg flex items-center gap-1.5 font-medium text-sm transition-colors"
          :class="
            route.path === DASHBOARD.INDEX
              ? 'bg-primary-50 font-semibold text-primary-700 border-t-2 border-primary-600'
              : 'text-gray-500'
          "
        >
          <UIcon name="i-heroicons-home" class="size-5 shrink-0" />
          <span class="text-xs mt-1">Dashboard</span>
        </NuxtLink>

        <NuxtLink
          :to="DASHBOARD.CLIENTS.INDEX"
          class="flex-col h-auto py-2 rounded-lg flex items-center gap-1.5 font-medium text-sm transition-colors"
          :class="
            route.path.startsWith(DASHBOARD.CLIENTS.INDEX) && route.path !== DASHBOARD.CLIENTS.NEW
              ? 'bg-primary-50 font-semibold text-primary-700 border-t-2 border-primary-600'
              : 'text-gray-500'
          "
        >
          <UIcon name="i-heroicons-users" class="size-5 shrink-0" />
          <span class="text-xs mt-1">Clients</span>
        </NuxtLink>

        <NuxtLink
          :to="DASHBOARD.CLIENTS.NEW"
          class="flex-col h-auto py-2 rounded-lg flex items-center gap-1.5 font-medium text-sm transition-colors"
          :class="
            route.path === DASHBOARD.CLIENTS.NEW
              ? 'bg-primary-50 font-semibold text-primary-700 border-t-2 border-primary-600'
              : 'text-gray-500'
          "
        >
          <UIcon name="i-heroicons-variable" class="size-5 shrink-0" />
          <span class="text-xs mt-1">Measure</span>
        </NuxtLink>

        <NuxtLink
          :to="DASHBOARD.STYLES.INDEX"
          class="flex-col h-auto py-2 rounded-lg flex items-center gap-1.5 font-medium text-sm transition-colors"
          :class="
            route.path.startsWith(DASHBOARD.STYLES.INDEX)
              ? 'bg-primary-50 font-semibold text-primary-700 border-t-2 border-primary-600'
              : 'text-gray-500'
          "
        >
          <UIcon name="i-heroicons-swatch" class="size-5 shrink-0" />
          <span class="text-xs mt-1">Styles</span>
        </NuxtLink>

        <NuxtLink
          :to="DASHBOARD.ORDERS.INDEX"
          class="flex-col h-auto py-2 rounded-lg flex items-center gap-1.5 font-medium text-sm transition-colors"
          :class="
            route.path.startsWith(DASHBOARD.ORDERS.INDEX)
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

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { formatDistanceToNow } from 'date-fns'
import { ROUTE_NAMES } from '~/constants/routes'
import { useSubscriptionStore } from '~/store/modules/subscription'
import { useAuthStore } from '~/store/modules/auth'
import { useAuthApi } from '~/composables/useAuthApi'
import { useNotificationStore } from '~/store/modules/notification'
import { useNotificationApi } from '~/composables/useNotificationApi'
import { useRouter, useRoute } from 'vue-router'
import { useToast } from '#imports' // Nuxt UI toast

// Get current route and router
const route = useRoute()
const router = useRouter()

// Get stores and composables
const authStore = useAuthStore()
const authApi = useAuthApi()
const notificationStore = useNotificationStore()
const notificationApi = useNotificationApi()
const toast = useToast()

// Destructure route names for easy access
const { DASHBOARD } = ROUTE_NAMES

// State for dropdowns and drawers
const isDropdownOpen = ref(false)
const isNotificationsOpen = ref(false)

// Format notification date to relative time (e.g., "2 hours ago")
const formatNotificationDate = date => {
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date
    return formatDistanceToNow(dateObj, { addSuffix: true })
  } catch (_error) {
    return 'Unknown date'
  }
}

// Fetch notifications
const fetchNotifications = async () => {
  try {
    notificationStore.setLoading(true)
    const response = await notificationApi.getNotifications()

    if (response.success && response.notifications) {
      notificationStore.setNotifications(response.notifications)
    } else {
      throw new Error(response.error || 'Failed to fetch notifications')
    }
  } catch (error: any) {
    notificationStore.setError(error.message || 'Failed to fetch notifications')
    console.error('Error fetching notifications:', error)
  } finally {
    notificationStore.setLoading(false)
  }
}

// Get icon based on notification type and severity
const getNotificationIcon = notification => {
  if (notification.type === 'payment') {
    return notification.severity === 'critical'
      ? 'i-heroicons-credit-card-solid'
      : 'i-heroicons-credit-card'
  } else if (notification.type === 'subscription') {
    return notification.severity === 'critical'
      ? 'i-heroicons-calendar-solid'
      : 'i-heroicons-calendar'
  } else if (notification.type === 'usage') {
    return notification.severity === 'critical'
      ? 'i-heroicons-chart-bar-solid'
      : 'i-heroicons-chart-bar'
  } else {
    return notification.severity === 'critical'
      ? 'i-heroicons-exclamation-circle-solid'
      : 'i-heroicons-information-circle'
  }
}

// Mark notification as read
const markNotificationAsRead = async id => {
  try {
    await notificationStore.markAsRead(id)
  } catch (_error) {
    console.error('Failed to mark notification as read:', _error)
  }
}

/**
 * Mark all notifications as read
 */
const markAllNotificationsAsRead = async () => {
  try {
    notificationStore.setLoading(true)
    const response = await notificationApi.markAllAsRead()

    if (response.success) {
      // Update local state optimistically
      notificationStore.markAllRead()

      // Show success message
      toast.add({
        title: 'Success',
        description: 'All notifications marked as read',
        color: 'green',
      })
    } else {
      throw new Error(response.error || 'Failed to mark all notifications as read')
    }
  } catch (error: any) {
    console.error('Error marking all notifications as read:', error)
    notificationStore.setError(error.message || 'Failed to mark all notifications as read')

    // Show error toast
    toast.add({
      title: 'Error',
      description: 'Failed to mark all notifications as read',
      color: 'red',
    })
  } finally {
    notificationStore.setLoading(false)
  }
}

// Fetch notifications when component mounts
onMounted(() => {
  if (authStore.isLoggedIn) {
    fetchNotifications()

    // Set up polling for new notifications every 5 minutes
    const pollInterval = setInterval(
      () => {
        if (authStore.isLoggedIn) {
          fetchNotifications()
        }
      },
      5 * 60 * 1000
    ) // 5 minutes

    // Clean up interval on component unmount
    return () => clearInterval(pollInterval)
  }
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

    // Clear cached data from stores
    const subscriptionStore = useSubscriptionStore()
    subscriptionStore.clearCache()

    // Logout using the auth API
    await authApi.logout()

    // Redirect to login page
    router.push('/auth/login')
  } catch (error) {
    console.error('Error logging out:', error)
  } finally {
    // Clean up the flag in all cases
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
