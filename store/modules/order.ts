import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type {
  Order,
  OrderFilterOptions,
  OrderStats,
  CreateOrderInput,
  UpdateOrderInput,
  OrderStatus,
} from '~/types/order'
import { useAuthStore } from './auth'
import { API_ENDPOINTS } from '~/constants/api'

export const useOrderStore = defineStore('order', () => {
  // State
  const orders = ref<Order[]>([])
  const currentOrder = ref<Order | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  const totalCount = ref(0)
  const stats = ref<OrderStats | null>(null)

  // Default filters
  const filters = ref<OrderFilterOptions>({
    page: 1,
    limit: 20,
    status: '',
    search: '',
    sortBy: 'newest',
  })

  // Get auth store for authentication headers
  const authStore = useAuthStore()

  // Computed
  const hasMore = computed(() => {
    return orders.value.length < totalCount.value
  })

  // Actions
  const fetchOrders = async (customFilters: Partial<OrderFilterOptions> = {}) => {
    try {
      isLoading.value = true
      error.value = null

      // Merge default filters with custom filters
      const queryParams = {
        ...filters.value,
        ...customFilters,
      }

      const { data, error: fetchError } = await useAsyncData<{ data: Order[]; total: number }>(
        `orders-${JSON.stringify(queryParams)}`,
        () =>
          $fetch(API_ENDPOINTS.ORDERS.BASE, {
            query: queryParams,
            headers: {
              'Content-Type': 'application/json',
              ...authStore.getAuthHeaders(),
            },
          })
      )

      if (fetchError.value) {
        throw new Error(fetchError.value.message || 'Failed to fetch orders')
      }

      if (data.value) {
        orders.value = data.value.data
        totalCount.value = data.value.total
      }

      return orders.value
    } catch (err: any) {
      error.value = err.message || 'Failed to fetch orders'
      console.error('Error fetching orders:', err)
      return []
    } finally {
      isLoading.value = false
    }
  }

  const fetchOrderById = async (id: string) => {
    try {
      isLoading.value = true
      error.value = null

      const { data, error: fetchError } = await useAsyncData<Order>(`order-${id}`, () =>
        $fetch(API_ENDPOINTS.ORDERS.BY_ID(id), {
          headers: {
            'Content-Type': 'application/json',
            ...authStore.getAuthHeaders(),
          },
        })
      )

      if (fetchError.value) {
        throw new Error(fetchError.value.message || 'Failed to fetch order')
      }

      if (data.value) {
        currentOrder.value = data.value
        return data.value
      }

      return null
    } catch (err: any) {
      error.value = err.message || 'Failed to fetch order'
      console.error('Error fetching order:', err)
      return null
    } finally {
      isLoading.value = false
    }
  }

  const createOrder = async (orderData: CreateOrderInput) => {
    try {
      isLoading.value = true
      error.value = null

      const data = await $fetch<Order>(API_ENDPOINTS.ORDERS.BASE, {
        method: 'POST',
        body: orderData,
        headers: {
          'Content-Type': 'application/json',
          ...authStore.getAuthHeaders(),
        },
      })

      if (data.value) {
        orders.value.unshift(data.value)
        return data.value
      }

      return null
    } catch (err: any) {
      error.value = err.message || 'Failed to create order'
      console.error('Error creating order:', err)
      throw err
    } finally {
      isLoading.value = false
    }
  }

  const updateOrder = async (id: string, orderData: UpdateOrderInput) => {
    try {
      isLoading.value = true
      error.value = null

      const data = await $fetch<Order>(API_ENDPOINTS.ORDERS.BY_ID(id), {
        method: 'PATCH',
        body: orderData,
        headers: {
          'Content-Type': 'application/json',
          ...authStore.getAuthHeaders(),
        },
      })

      if (data.value) {
        // Update in orders list
        const index = orders.value.findIndex(o => o.id === id)
        if (index !== -1) {
          orders.value[index] = data.value
        }

        // Update current order if it's the one being updated
        if (currentOrder.value?.id === id) {
          currentOrder.value = data.value
        }

        return data.value
      }

      return null
    } catch (err: any) {
      error.value = err.message || 'Failed to update order'
      console.error('Error updating order:', err)
      throw err
    } finally {
      isLoading.value = false
    }
  }

  const deleteOrder = async (id: string) => {
    try {
      isLoading.value = true
      error.value = null

      await $fetch(API_ENDPOINTS.ORDERS.BY_ID(id), {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          ...authStore.getAuthHeaders(),
        },
      })

      // Remove from local state
      orders.value = orders.value.filter(order => order.id !== id)

      // Clear current order if it's the one being deleted
      if (currentOrder.value?.id === id) {
        currentOrder.value = null
      }

      return true
    } catch (err: any) {
      error.value = err.message || 'Failed to delete order'
      console.error('Error deleting order:', err)
      throw err
    } finally {
      isLoading.value = false
    }
  }

  const updateOrderStatus = async (id: string, status: OrderStatus) => {
    try {
      isLoading.value = true
      error.value = null

      const data = await $fetch<Order>(`${API_ENDPOINTS.ORDERS.BY_ID(id)}/status`, {
        method: 'PATCH',
        body: { status },
        headers: {
          'Content-Type': 'application/json',
          ...authStore.getAuthHeaders(),
        },
      })

      if (data.value) {
        // Update in orders list
        const index = orders.value.findIndex(o => o.id === id)
        if (index !== -1) {
          orders.value[index] = data.value
        }

        // Update current order if it's the one being updated
        if (currentOrder.value?.id === id) {
          currentOrder.value = data.value
        }

        return data.value
      }

      return null
    } catch (err: any) {
      error.value = err.message || 'Failed to update order status'
      console.error('Error updating order status:', err)
      throw err
    } finally {
      isLoading.value = false
    }
  }

  const getOrderStats = async () => {
    try {
      isLoading.value = true
      error.value = null

      const { data } = await useAsyncData<OrderStats>('order-stats', () =>
        $fetch(API_ENDPOINTS.ORDERS.SUMMARY, {
          headers: {
            'Content-Type': 'application/json',
            ...authStore.getAuthHeaders(),
          },
        })
      )

      if (data.value) {
        stats.value = data.value
        return stats.value
      }

      return null
    } catch (err: any) {
      error.value = err.message || 'Failed to fetch order stats'
      console.error('Error fetching order stats:', err)
      return null
    } finally {
      isLoading.value = false
    }
  }

  const updateFilters = (newFilters: Partial<OrderFilterOptions>) => {
    filters.value = { ...filters.value, ...newFilters }
  }

  const resetFilters = () => {
    filters.value = {
      page: 1,
      limit: 20,
      status: '',
      search: '',
      sortBy: 'newest',
    }
  }

  // Reset store state
  const $reset = () => {
    orders.value = []
    currentOrder.value = null
    isLoading.value = false
    error.value = null
    totalCount.value = 0
    stats.value = null
    resetFilters()
  }

  return {
    // State
    orders,
    currentOrder,
    isLoading,
    error,
    totalCount,
    stats,
    filters,

    // Getters
    hasMore,

    // Actions
    fetchOrders,
    fetchOrderById,
    createOrder,
    updateOrder,
    deleteOrder,
    updateOrderStatus,
    getOrderStats,
    updateFilters,
    resetFilters,
    $reset,
  }
})
