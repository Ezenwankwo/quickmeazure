import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type {
  DashboardStats,
  ActivityItem,
  ClientGrowthData,
  ChartPeriod,
  Order,
} from '~/types/dashboard'

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

  // Getters
  const hasChartData = computed(() => {
    return clientGrowth.value.labels.length > 0 && clientGrowth.value.data.length > 0
  })

  // Actions (simple state mutations)
  const setStats = (newStats: DashboardStats | null) => {
    stats.value = newStats
  }

  const setRecentActivity = (activities: ActivityItem[]) => {
    recentActivity.value = activities
  }

  const setDueOrders = (orders: Order[]) => {
    dueOrders.value = orders
  }

  const setClientGrowth = (growthData: ClientGrowthData) => {
    clientGrowth.value = growthData
  }

  const setChartPeriod = (period: ChartPeriod) => {
    chartPeriod.value = period
  }

  const setLoading = (loading: boolean) => {
    isLoading.value = loading
  }

  const setError = (err: string | null) => {
    error.value = err
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

    // Actions (state mutations)
    setStats,
    setRecentActivity,
    setDueOrders,
    setClientGrowth,
    setChartPeriod,
    setLoading,
    setError,
    $reset,
  }
})
