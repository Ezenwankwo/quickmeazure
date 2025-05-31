import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type {
  DashboardStats,
  ActivityItem,
  ClientGrowthData,
  ChartPeriod,
  Order,
} from '~/types/dashboard'
import { API_ENDPOINTS } from '~/constants/api'
import { useAuthStore } from './auth'

export const useDashboardStore = defineStore('dashboard', () => {
  // State
  const stats = ref<DashboardStats | null>(null)
  const recentActivity = ref<ActivityItem[]>([])
  const dueOrders = ref<Order[]>([])
  const clientGrowth = ref<ClientGrowthData>({
    labels: [],
    data: [],
    totalGrowth: 0,
    percentGrowth: 0,
  })
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  const chartPeriod = ref<ChartPeriod>('month')

  // Get auth store for authentication headers
  const authStore = useAuthStore()

  // Getters
  const hasChartData = computed(() => {
    return clientGrowth.value.labels.length > 0 && clientGrowth.value.data.length > 0
  })

  // Actions
  const fetchStats = async () => {
    try {
      isLoading.value = true
      error.value = null

      const { data } = await useAsyncData<DashboardStats>('dashboard-stats', () =>
        $fetch(API_ENDPOINTS.DASHBOARD.STATS, {
          headers: {
            'Content-Type': 'application/json',
            ...authStore.getAuthHeaders(),
          },
        })
      )

      if (data.value) {
        stats.value = data.value
      }

      return stats.value
    } catch (err: any) {
      error.value = err.message || 'Failed to fetch dashboard statistics'
      console.error('Error fetching dashboard stats:', err)
      throw err
    } finally {
      isLoading.value = false
    }
  }

  const fetchRecentActivity = async (limit = 5) => {
    try {
      isLoading.value = true
      error.value = null

      const { data } = await useAsyncData<ActivityItem[]>(`recent-activity-${limit}`, () =>
        $fetch(API_ENDPOINTS.DASHBOARD.RECENT_ACTIVITY, {
          query: { limit },
          headers: {
            'Content-Type': 'application/json',
            ...authStore.getAuthHeaders(),
          },
        })
      )

      if (data.value) {
        recentActivity.value = data.value
      }

      return recentActivity.value
    } catch (err: any) {
      error.value = err.message || 'Failed to fetch recent activity'
      console.error('Error fetching recent activity:', err)
      throw err
    } finally {
      isLoading.value = false
    }
  }

  const fetchDueOrders = async () => {
    try {
      isLoading.value = true
      error.value = null

      const { data } = await useAsyncData<Order[]>('due-orders', () =>
        $fetch(API_ENDPOINTS.DASHBOARD.ORDERS_DUE_SOON, {
          headers: {
            'Content-Type': 'application/json',
            ...authStore.getAuthHeaders(),
          },
        })
      )

      if (data.value) {
        dueOrders.value = data.value
      }

      return dueOrders.value
    } catch (err: any) {
      error.value = err.message || 'Failed to fetch due orders'
      console.error('Error fetching due orders:', err)
      throw err
    } finally {
      isLoading.value = false
    }
  }

  const fetchClientGrowth = async (period: ChartPeriod = 'month') => {
    try {
      isLoading.value = true
      error.value = null
      chartPeriod.value = period

      const { data } = await useAsyncData<ClientGrowthData>(`client-growth-${period}`, () =>
        $fetch(API_ENDPOINTS.DASHBOARD.CLIENT_GROWTH, {
          query: { period },
          headers: {
            'Content-Type': 'application/json',
            ...authStore.getAuthHeaders(),
          },
        })
      )

      if (data.value) {
        clientGrowth.value = data.value
      }

      return clientGrowth.value
    } catch (err: any) {
      error.value = err.message || 'Failed to fetch client growth data'
      console.error('Error fetching client growth data:', err)
      throw err
    } finally {
      isLoading.value = false
    }
  }

  // Reset store state
  const $reset = () => {
    stats.value = null
    recentActivity.value = []
    dueOrders.value = []
    clientGrowth.value = {
      labels: [],
      data: [],
      totalGrowth: 0,
      percentGrowth: 0,
    }
    isLoading.value = false
    error.value = null
  }

  return {
    // State
    stats,
    recentActivity,
    dueOrders,
    clientGrowth,
    isLoading,
    error,
    chartPeriod,

    // Getters
    hasChartData,

    // Actions
    fetchStats,
    fetchRecentActivity,
    fetchDueOrders,
    fetchClientGrowth,
    $reset,
  }
})
