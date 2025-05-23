<template>
  <div class="space-y-6">
    <!-- Page Header -->
    <PageHeader
      title="Dashboard"
      subtitle="View your tailor business at a glance"
      :primary-action="{
        label: 'New Client',
        icon: 'i-heroicons-plus',
        to: '/clients/new',
      }"
    />

    <!-- Stats Overview -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
      <UCard class="bg-white">
        <template #header>
          <div class="flex justify-between items-center">
            <h3 class="text-sm font-medium text-gray-500">Total Clients</h3>
            <UIcon name="i-heroicons-users" class="text-primary-500" />
          </div>
        </template>
        <div class="text-3xl font-bold">
          {{ stats?.totalClients || 0 }}
        </div>
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
        <div class="text-3xl font-bold">
          {{ stats?.activeOrders || 0 }}
        </div>
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
        <div class="text-xl font-bold">
          {{ stats?.subscriptionPlan || 'Free Plan' }}
        </div>
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
color="gray"
variant="ghost"
to="/activity"
size="xs"> View all </UButton>
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
                <!-- eslint-disable-next-line vue/no-v-html -->
                <!-- Using v-html is necessary here as activity messages contain formatted HTML -->
                <p
                  class="text-sm font-medium text-gray-900"
                  v-html="activity.message || 'Activity'"
                />
                <p class="text-xs text-gray-500">
                  {{ activity.time || 'Recently' }}
                </p>
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
color="gray"
variant="ghost"
to="/orders"
size="xs"> View all </UButton>
          </div>
        </template>

        <div v-if="isLoading" class="text-center py-8">
          <UIcon name="i-heroicons-arrow-path" class="animate-spin text-primary-500 mx-auto mb-2" />
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
                  />
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
                <tr v-for="order in safeOrders" :key="order.id">
                  <td class="px-3 py-2 whitespace-nowrap">
                    <div class="font-medium text-gray-900">
                      {{ order.client }}
                    </div>
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
                      :to="`/orders/${order.id}`"
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
            >Total new clients: <span class="font-medium">{{ chartStats.totalGrowth }}</span></span
          >
          <span class="text-gray-600"
            >Growth:
            <span class="font-medium text-green-600">+{{ chartStats.percentGrowth }}%</span></span
          >
        </div>
      </template>
    </UCard>
  </div>
</template>

<script setup>
// Import the API auth composable
import { ref, computed, onMounted, _watch } from 'vue'
import { useApiAuth } from '~/composables/useApiAuth'
import ClientGrowthChart from '~/components/charts/ClientGrowthChart.vue'

// Set page metadata
useHead({
  title: 'Dashboard - QuickMeazure',
})

// Set up auth composable for API calls
const { authFetch } = useApiAuth()

// Data for dashboard
const stats = ref({
  totalClients: 0,
  newClientsThisMonth: 0,
  activeOrders: 0,
  completedOrdersThisMonth: 0,
  totalRevenue: 0,
  revenueGrowth: 0,
  subscriptionPlan: 'Free Plan',
  clientsRemaining: 0,
})

// Recent activity
const recentActivity = ref([])

// Due orders
const dueOrders = ref([])

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

// Chart period options and data
const chartPeriodOptions = [
  { label: 'Last 7 days', value: '7days' },
  { label: 'Last 30 days', value: '30days' },
  { label: 'Last 90 days', value: '90days' },
  { label: 'Last year', value: 'year' },
]
const chartPeriod = ref('30days')
const clientGrowth = ref({
  labels: [],
  data: [],
  totalGrowth: 0,
  percentGrowth: 0,
})

// Helper computed property to check if we have chart data to display
const hasChartData = computed(() => {
  return (
    clientGrowth.value &&
    Array.isArray(clientGrowth.value.data) &&
    clientGrowth.value.data.length > 0 &&
    Array.isArray(clientGrowth.value.labels) &&
    clientGrowth.value.labels.length > 0 &&
    clientGrowth.value.data.some(value => value > 0)
  )
})

// Loading state
const isLoading = ref(false)

// Helper function to update chart data when period changes
const updateChartData = async () => {
  try {
    // Log period change
    console.log(`Changing to period: ${chartPeriod.value}`)

    // Try to fetch real data
    await fetchClientGrowth()
  } catch (error) {
    console.error('Error updating chart data:', error)
  }
}

// Helper functions
const formatNumber = number => {
  if (number === null || number === undefined) return '0'
  return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

const formatDueDate = date => {
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
const getDueDateColor = date => {
  if (!date) return 'gray'

  try {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const dueDate = new Date(date)
    const dueDateNoTime = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate())

    const diffTime = dueDateNoTime - today
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays < 0) {
      return 'red'
    } else if (diffDays === 0) {
      return 'orange'
    } else if (diffDays <= 2) {
      return 'yellow'
    } else {
      return 'green'
    }
  } catch (error) {
    console.error('Error getting due date color:', error)
    return 'gray'
  }
}

// Get color for status badge
const getStatusColor = status => {
  if (!status) return 'gray'

  switch (status.toLowerCase()) {
    case 'completed':
      return 'green'
    case 'in progress':
      return 'blue'
    case 'pending payment':
      return 'yellow'
    case 'overdue':
      return 'red'
    default:
      return 'gray'
  }
}

// Fetch functions
const fetchStats = async () => {
  try {
    const data = await authFetch('/api/dashboard/stats')
    if (data && typeof data === 'object') {
      stats.value = data
    }
  } catch (error) {
    console.error('Error loading dashboard stats:', error)
    useToast().add({
      title: 'Error',
      description: 'Failed to load dashboard statistics',
      color: 'red',
    })
  }
}

const fetchRecentActivity = async () => {
  try {
    const data = await authFetch('/api/dashboard/recent-activity?limit=5')
    if (data && Array.isArray(data)) {
      recentActivity.value = data
    } else {
      recentActivity.value = []
    }
  } catch (error) {
    console.error('Error loading recent activity:', error)
    recentActivity.value = []
  }
}

const fetchDueOrders = async () => {
  try {
    const data = await authFetch('/api/dashboard/orders-due-soon')
    if (data && Array.isArray(data)) {
      dueOrders.value = data
    } else {
      dueOrders.value = []
    }
  } catch (error) {
    console.error('Error loading due orders:', error)
    dueOrders.value = []
  }
}

const fetchClientGrowth = async () => {
  try {
    // Save previous values to restore in case of error
    const prevChartData = { ...clientGrowth.value }

    // Set loading state for chart
    isLoading.value = true

    // Debug: log the request
    console.log('Fetching client growth with period:', chartPeriod.value)

    const data = await authFetch(`/api/dashboard/client-growth?period=${chartPeriod.value}`)

    // Debug: log the response
    console.log('Client growth response:', data)

    if (data && typeof data === 'object') {
      // Ensure we have valid arrays for labels and data
      const labels = Array.isArray(data.labels) ? data.labels : []
      const chartData = Array.isArray(data.data) ? data.data : []

      // Ensure growth values are numbers
      const totalGrowth = typeof data.totalGrowth === 'number' ? data.totalGrowth : 0
      const percentGrowth = typeof data.percentGrowth === 'number' ? data.percentGrowth : 0

      // Debug: log processed data
      console.log('Processed chart data:', { labels, data: chartData })

      // Update the chart data
      clientGrowth.value = {
        labels,
        data: chartData,
        totalGrowth,
        percentGrowth,
      }
    } else {
      console.error('Invalid client growth data format:', data)
      // Restore previous values if data format is invalid
      clientGrowth.value = prevChartData
    }
  } catch (error) {
    console.error('Error loading client growth data:', error)
  } finally {
    // Always clear loading state
    isLoading.value = false
  }
}

// On mount, try to fetch real data but show demo data immediately
onMounted(() => {
  // Show demo data immediately
  console.log('Dashboard mounted, showing initial demo chart data')

  // Then try to fetch real data
  fetchStats().catch(err => console.error('Error fetching stats:', err))
  fetchRecentActivity().catch(err => console.error('Error fetching activity:', err))
  fetchDueOrders().catch(err => console.error('Error fetching orders:', err))
  fetchClientGrowth().catch(err => console.error('Error fetching growth data:', err))
})

// Add layout for dashboard pages
definePageMeta({
  layout: 'dashboard',
})

// Reference to the growth chart component
const growthChart = ref(null)

// Get stats from the chart component
const chartStats = computed(() => {
  if (growthChart.value) {
    return growthChart.value.clientStats
  }

  return {
    totalGrowth: hasChartData.value ? clientGrowth.value.totalGrowth : 0,
    percentGrowth: hasChartData.value ? clientGrowth.value.percentGrowth : 0,
  }
})
</script>
