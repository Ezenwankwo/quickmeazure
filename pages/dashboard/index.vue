<template>
  <div class="space-y-6">
    <!-- Page Header -->
    <PageHeader
      title="Dashboard"
      subtitle="View your tailor business at a glance"
      :primary-action="{
        label: 'New Client',
        icon: 'i-heroicons-plus',
        to: NEW_CLIENT_PATH,
      }"
    />

    <!-- Dashboard Content -->
    <template>
      <!-- Stats Overview -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
        <UCard class="bg-white">
          <template #header>
            <div class="flex justify-between items-center">
              <h3 class="text-sm font-medium text-gray-500">Total Clients</h3>
              <UIcon name="i-heroicons-users" class="text-primary-500" />
            </div>
          </template>
          <div class="text-3xl font-bold">{{ stats?.totalClients || 0 }}</div>
          <template #footer>
            <div class="text-sm text-gray-500">
              <span class="text-green-500 font-medium">+{{ stats?.newClientsThisMonth || 0 }}</span>
              this month
            </div>
          </template>
        </UCard>

        <UCard class="bg-white">
          <template #header>
            <div class="flex justify-between items-center">
              <h3 class="text-sm font-medium text-gray-500">Active Orders</h3>
              <UIcon name="i-heroicons-shopping-bag" class="text-primary-500" />
            </div>
          </template>
          <div class="text-3xl font-bold">{{ stats?.activeOrders || 0 }}</div>
          <template #footer>
            <div class="text-sm text-gray-500">
              <span class="font-medium">{{ stats?.completedOrdersThisMonth || 0 }}</span> completed
              this month
            </div>
          </template>
        </UCard>

        <UCard class="bg-white">
          <template #header>
            <div class="flex justify-between items-center">
              <h3 class="text-sm font-medium text-gray-500">Revenue</h3>
              <UIcon name="i-heroicons-currency-dollar" class="text-primary-500" />
            </div>
          </template>
          <div class="text-3xl font-bold">₦{{ formatNumber(stats?.totalRevenue || 0) }}</div>
          <template #footer>
            <div class="text-sm text-gray-500">
              <span class="text-green-500 font-medium">+{{ stats?.revenueGrowth || 0 }}%</span> vs
              last month
            </div>
          </template>
        </UCard>

        <UCard class="bg-white">
          <template #header>
            <div class="flex justify-between items-center">
              <h3 class="text-sm font-medium text-gray-500">Subscription</h3>
              <UIcon name="i-heroicons-credit-card" class="text-primary-500" />
            </div>
          </template>
          <div class="text-xl py-1 font-bold">{{ stats?.subscriptionPlan || 'Free Plan' }}</div>
          <template #footer>
            <div class="text-sm text-gray-500">
              <template v-if="stats?.clientsRemaining === Infinity"> Unlimited clients </template>
              <template v-else> {{ stats?.clientsRemaining || 0 }} clients remaining </template>
            </div>
          </template>
        </UCard>
      </div>

      <!-- Recent Activity and Due Orders -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Recent Activity -->
        <UCard class="bg-white">
          <template #header>
            <div class="flex justify-between items-center">
              <h3 class="font-medium">Recent Activity</h3>
              <UButton
color="neutral"
variant="subtle"
to="/activity"
size="xs">
                View all
              </UButton>
            </div>
          </template>

          <div class="space-y-4">
            <div v-if="recentActivity.length > 0">
              <div
                v-for="activity in recentActivity"
                :key="activity.id"
                class="flex items-start space-x-3 py-2"
              >
                <div
                  class="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0"
                >
                  <UIcon :name="activity.icon || 'i-heroicons-bell'" class="text-primary-600" />
                </div>
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-medium text-gray-900">
                    {{ activity.message || 'Activity' }}
                  </p>
                  <p class="text-xs text-gray-500">{{ activity.time || 'Recently' }}</p>
                </div>
              </div>
            </div>
            <div v-else-if="!isLoading" class="text-center py-4">
              <p class="text-gray-500">No recent activity</p>
            </div>
            <div v-if="isLoading" class="text-center py-4">
              <UIcon name="i-heroicons-arrow-path" class="animate-spin text-primary-500" />
            </div>
          </div>
        </UCard>

        <!-- Due Orders -->
        <UCard class="bg-white">
          <template #header>
            <div class="flex justify-between items-center">
              <h3 class="font-medium">Orders Due Soon</h3>
              <UButton
color="neutral"
variant="subtle"
to="/orders"
size="xs"> View all </UButton>
            </div>
          </template>

          <div v-if="isLoading" class="text-center py-8">
            <UIcon
              name="i-heroicons-arrow-path"
              class="animate-spin text-primary-500 mx-auto mb-2"
            />
            <p class="text-sm text-gray-500">Loading orders...</p>
          </div>

          <div v-else-if="safeOrders.length === 0" class="text-center py-8">
            <p class="text-gray-500">No orders due soon</p>
          </div>

          <div v-else>
            <div class="overflow-x-auto">
              <table class="min-w-full divide-y divide-gray-200">
                <thead class="bg-gray-50">
                  <tr>
                    <th
                      scope="col"
                      class="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Client
                    </th>
                    <th
                      scope="col"
                      class="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Due Date
                    </th>
                    <th
                      scope="col"
                      class="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Amount
                    </th>
                    <th
                      scope="col"
                      class="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Status
                    </th>
                    <th
                      scope="col"
                      class="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    ></th>
                  </tr>
                </thead>
                <tbody class="bg-white divide-y divide-gray-200">
                  <tr v-for="order in safeOrders" :key="order.id">
                    <td class="px-3 py-2 whitespace-nowrap">
                      <div class="font-medium text-gray-900">{{ order.client }}</div>
                    </td>
                    <td class="px-3 py-2 whitespace-nowrap">
                      <UBadge :color="getDueDateColor(order.dueDate)" variant="subtle" size="sm">
                        {{ formatDueDate(order.dueDate) }}
                      </UBadge>
                    </td>
                    <td class="px-3 py-2 whitespace-nowrap">₦{{ formatNumber(order.amount) }}</td>
                    <td class="px-3 py-2 whitespace-nowrap">
                      <UBadge :color="getStatusColor(order.status)" variant="subtle" size="sm">
                        {{ order.status }}
                      </UBadge>
                    </td>
                    <td class="px-3 py-2 whitespace-nowrap text-right">
                      <UButton
                        icon="i-heroicons-eye"
                        color="gray"
                        variant="ghost"
                        size="xs"
                        :to="`${ORDERS_PATH}/${order.id}`"
                      />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </UCard>
      </div>

      <!-- Client Growth Chart -->
      <UCard class="bg-white">
        <template #header>
          <div class="flex justify-between items-center">
            <h3 class="font-medium">Client Growth</h3>
            <USelect
              v-model="chartPeriod"
              :items="chartPeriodOptions"
              size="sm"
              @update:model-value="updateChartData"
            />
          </div>
        </template>

        <div class="h-64">
          <ClientGrowthChart
            ref="growthChart"
            :period="chartPeriod"
            :real-data="clientGrowth"
            :has-real-data="hasChartData"
          />
        </div>

        <template #footer>
          <div class="flex justify-between text-sm">
            <span class="text-gray-600"
              >Total new clients:
              <span class="font-medium">{{ chartStats.totalGrowth }}</span></span
            >
            <span class="text-gray-600"
              >Growth:
              <span class="font-medium text-green-600">+{{ chartStats.percentGrowth }}%</span></span
            >
          </div>
        </template>
      </UCard>
    </template>
  </div>
</template>

<script setup lang="ts">
// Import composables
import { onMounted, computed, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useDashboardStore } from '~/store/modules/dashboard'
import { useAppRoutes } from '~/composables/useRoutes'
import { useAuthStore } from '~/store/modules/auth'
import { API_ENDPOINTS } from '~/constants/api'
import type { ChartPeriod } from '~/types/dashboard'

type _ChartPeriod = ChartPeriod // Workaround for unused type import

// Initialize stores
const dashboardStore = useDashboardStore()
const authStore = useAuthStore()
const { stats, recentActivity, dueOrders, clientGrowth, isLoading, error, chartPeriod } =
  storeToRefs(dashboardStore)

// Routes
const routes = useAppRoutes()
const NEW_CLIENT_PATH = routes.ROUTE_PATHS[routes.ROUTE_NAMES.DASHBOARD.CLIENTS.NEW] as string
const ORDERS_PATH = routes.ROUTE_PATHS[routes.ROUTE_NAMES.DASHBOARD.ORDERS.INDEX] as string

// Set page metadata
useHead({
  title: 'Dashboard',
})

// Safe version of orders with validation to prevent rendering errors
const safeOrders = computed(() => {
  if (!dueOrders.value || !Array.isArray(dueOrders.value)) {
    return []
  }

  return dueOrders.value.map(order => ({
    id: order?.id || 0,
    client: order?.client || 'Unknown Client',
    dueDate: order?.dueDate || null,
    amount: order?.amount || 0,
    status: order?.status || 'Unknown',
  }))
})

// Chart period options
const chartPeriodOptions = [
  { label: 'Last 7 days', value: '7days' },
  { label: 'Last 30 days', value: '30days' },
  { label: 'Last 90 days', value: '90days' },
  { label: 'Last year', value: 'year' },
]

// Helper computed property to check if we have chart data to display
const hasChartData = computed(() => {
  return (
    clientGrowth.value?.labels?.length > 0 &&
    clientGrowth.value?.data?.length > 0 &&
    clientGrowth.value.data.some(value => value > 0)
  )
})

// Helper function to update chart data when period changes
const updateChartData = async () => {
  try {
    await dashboardStore.fetchClientGrowth(chartPeriod.value)
  } catch (error) {
    console.error('Error updating chart data:', error)
  }
}

// Helper functions
const formatNumber = (number: number) => {
  if (number === null || number === undefined) return '0'
  return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

const formatDueDate = (date: string) => {
  if (!date) return 'No date set'

  try {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const dueDate = new Date(date)
    const dueDateNoTime = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate())

    const diffTime = dueDateNoTime - today
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays < 0) {
      return `${Math.abs(diffDays)} days overdue`
    } else if (diffDays === 0) {
      return 'Due today'
    } else if (diffDays === 1) {
      return 'Due tomorrow'
    } else {
      return `Due in ${diffDays} days`
    }
  } catch (error) {
    console.error('Error formatting due date:', error)
    return 'Invalid date'
  }
}

// Get color for due date badge
const getDueDateColor = (date: string) => {
  if (!date) return 'neutral'

  try {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const dueDate = new Date(date)
    const dueDateNoTime = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate())

    const diffTime = dueDateNoTime - today
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays < 0) {
      return 'error'
    } else if (diffDays === 0) {
      return 'warning'
    } else if (diffDays <= 2) {
      return 'warning'
    } else {
      return 'success'
    }
  } catch (error) {
    console.error('Error getting due date color:', error)
    return 'neutral'
  }
}

// Get color for status badge
const getStatusColor = (status: string) => {
  if (!status) return 'neutral'

  switch (status.toLowerCase()) {
    case 'completed':
      return 'success'
    case 'in progress':
      return 'primary'
    case 'pending payment':
      return 'warning'
    case 'overdue':
      return 'error'
    default:
      return 'neutral'
  }
}

// Toast for notifications
const toast = useToast()

// Client growth data
const fetchClientGrowth = async () => {
  try {
    const token = authStore.token
    if (!token) {
      throw new Error('No authentication token found')
    }

    return await $fetch(API_ENDPOINTS.DASHBOARD.CLIENT_GROWTH, {
      method: 'GET',
      params: { period: chartPeriod.value },
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    })
  } catch (error) {
    console.error('Error fetching client growth data:', error)
    throw error
  }
}

const {
  data: clientGrowthData,
  status: clientGrowthStatus,
  refresh: refreshClientGrowth,
} = useAsyncData('client-growth', fetchClientGrowth, {
  default: () => ({
    labels: [],
    data: [],
    totalGrowth: 0,
    percentGrowth: 0,
  }),
  watch: [chartPeriod],
  immediate: true,
})

// Watch for changes in chart period and refresh data
watch(
  chartPeriod,
  () => {
    console.log('Chart period changed, refreshing client growth data...')
    refreshClientGrowth()
  },
  { immediate: true }
)

// Watch for changes in client growth data
watchEffect(() => {
  const status = clientGrowthStatus.value
  const data = clientGrowthData.value

  console.log('Client growth status changed:', { status, hasData: !!data })

  if (status === 'success' && data) {
    console.log('Setting client growth data:', data)
    dashboardStore.setClientGrowth(data)
    dashboardStore.setLoading(false)
  } else if (status === 'error') {
    console.error('Error fetching client growth data')
    const errorMessage = 'Failed to fetch client growth data'
    dashboardStore.setError(errorMessage)
    dashboardStore.setLoading(false)
    toast.add({
      title: 'Error',
      description: errorMessage,
      color: 'error',
      timeout: 5000,
    })
  } else if (status === 'pending') {
    dashboardStore.setLoading(true)
  }
})

// Function to fetch dashboard data with proper error handling
const fetchDashboardData = async () => {
  console.log('Fetching dashboard data...')
  const token = authStore.token

  if (!token) {
    console.error('No authentication token found')
    // Instead of throwing, return default values to prevent infinite loading
    return {
      stats: { totalClients: 0, activeOrders: 0, revenue: 0, newClients: 0 },
      activities: [],
      dueOrders: [],
    }
  }

  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  }

  try {
    console.log('Starting dashboard API calls...')
    const [stats, activities, dueOrders] = await Promise.allSettled([
      $fetch(API_ENDPOINTS.DASHBOARD.STATS, {
        method: 'GET',
        headers,
        retry: 1,
        retryDelay: 1000,
      }).catch(err => {
        console.error('Error fetching stats:', err)
        return null
      }),
      $fetch(API_ENDPOINTS.DASHBOARD.RECENT_ACTIVITY, {
        method: 'GET',
        params: { limit: 5 },
        headers,
        retry: 1,
        retryDelay: 1000,
      }).catch(err => {
        console.error('Error fetching recent activity:', err)
        return []
      }),
      $fetch(API_ENDPOINTS.DASHBOARD.ORDERS_DUE_SOON, {
        method: 'GET',
        params: { limit: 5 },
        headers,
        retry: 1,
        retryDelay: 1000,
      }).catch(err => {
        console.error('Error fetching due orders:', err)
        return []
      }),
    ])

    // Process the results with fallback values
    const result = {
      stats:
        stats.status === 'fulfilled' && stats.value
          ? stats.value
          : { totalClients: 0, activeOrders: 0, revenue: 0, newClients: 0 },
      activities: activities.status === 'fulfilled' && activities.value ? activities.value : [],
      dueOrders: dueOrders.status === 'fulfilled' && dueOrders.value ? dueOrders.value : [],
    }

    console.log('Dashboard data fetched successfully:', result)
    return result
  } catch (error) {
    console.error('Error in fetchDashboardData:', error)
    // Return default values on error
    return {
      stats: { totalClients: 0, activeOrders: 0, revenue: 0, newClients: 0 },
      activities: [],
      dueOrders: [],
    }
  }
}

// Fetch all dashboard data in a single request
const { data: dashboardData, status } = useAsyncData('dashboard-data', fetchDashboardData, {
  default: () => ({
    stats: { totalClients: 0, activeOrders: 0, revenue: 0, newClients: 0 },
    activities: [],
    dueOrders: [],
  }),
  immediate: true,
})

// Watch for changes in the async data
watch(
  [dashboardData, status],
  ([data, newStatus]) => {
    console.log('Dashboard data status changed:', { status: newStatus, hasData: !!data?.value })

    if (newStatus === 'success' && data?.value) {
      console.log('Updating dashboard store with new data')
      dashboardStore.setStats(data.value.stats)
      dashboardStore.setRecentActivity(data.value.activities)
      dashboardStore.setDueOrders(data.value.dueOrders)
      dashboardStore.setLoading(false)
    } else if (newStatus === 'error') {
      console.error('Error fetching dashboard data')
      const errorMessage = 'Failed to fetch dashboard data. Using cached data if available.'
      dashboardStore.setError(errorMessage)
      dashboardStore.setLoading(false)
      toast.add({
        title: 'Warning',
        description: errorMessage,
        color: 'warning',
        timeout: 5000,
      })
    } else if (newStatus === 'pending') {
      dashboardStore.setLoading(true)
    }
  },
  { immediate: true }
)

// Add layout for dashboard pages
definePageMeta({
  layout: 'dashboard',
})

// Chart stats computed property
const chartStats = computed(() => ({
  totalGrowth: hasChartData.value ? (clientGrowth.value?.totalGrowth ?? 0) : 0,
  percentGrowth: hasChartData.value ? (clientGrowth.value?.percentGrowth ?? 0) : 0,
}))
</script>
