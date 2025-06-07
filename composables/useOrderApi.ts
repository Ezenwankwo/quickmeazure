import { API_ENDPOINTS } from '~/constants/api'
import { useAuthStore } from '~/store/modules/auth'
import type {
  Order,
  OrderFilterOptions,
  OrderStats,
  CreateOrderInput,
  UpdateOrderInput,
  OrderStatus,
} from '~/types/order'

interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
}

interface OrdersResponse extends ApiResponse {
  data?: Order[]
  total?: number
}

interface OrderResponse extends ApiResponse {
  order?: Order
}

export function useOrderApi() {
  const { $api } = useNuxtApp()

  // Check if running on client side
  const isClient = typeof window !== 'undefined'

  // Initialize auth store only on client side to avoid SSR issues
  const authStore = isClient ? useAuthStore() : null

  if (!isClient) {
    // Return mock functions for server-side rendering
    return {
      getOrders: (): Promise<OrdersResponse> =>
        Promise.resolve({ success: true, data: [], total: 0 }),
      getOrderById: (): Promise<OrderResponse> =>
        Promise.resolve({ success: true, order: undefined }),
      createOrder: (): Promise<OrderResponse> => Promise.resolve({ success: true }),
      updateOrder: (): Promise<OrderResponse> => Promise.resolve({ success: true }),
      deleteOrder: (): Promise<ApiResponse> => Promise.resolve({ success: true }),
      updateOrderStatus: (): Promise<OrderResponse> => Promise.resolve({ success: true }),
      getOrderStats: (): Promise<ApiResponse<OrderStats>> =>
        Promise.resolve({ success: true, data: null }),
    }
  }

  /**
   * Helper function to handle API errors
   */
  const handleError = (error: any, defaultMessage: string): ApiResponse => {
    console.error(defaultMessage, error)
    return {
      success: false,
      error: error.data?.message || defaultMessage,
    }
  }

  /**
   * Fetch orders with optional filters
   */
  const getOrders = async (filters: Partial<OrderFilterOptions> = {}): Promise<OrdersResponse> => {
    try {
      const { data, error } = await useAsyncData<{ data: Order[]; total: number }>(
        `orders-${JSON.stringify(filters)}`,
        () =>
          $fetch(API_ENDPOINTS.ORDERS.BASE, {
            method: 'GET',
            params: filters,
            headers: {
              'Content-Type': 'application/json',
              ...(authStore?.token && { Authorization: `Bearer ${authStore.token}` }),
            },
            credentials: 'include',
          })
      )

      if (error.value) {
        throw error.value
      }

      return {
        success: true,
        data: data.value?.data || [],
        total: data.value?.total || 0,
      }
    } catch (error) {
      return handleError(error, 'Failed to fetch orders')
    }
  }

  /**
   * Fetch a single order by ID
   */
  const getOrderById = async (id: string): Promise<OrderResponse> => {
    try {
      const { data, error } = await useAsyncData<Order>(`order-${id}`, () =>
        $fetch(`${API_ENDPOINTS.ORDERS.BASE}/${id}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            ...(authStore?.token && { Authorization: `Bearer ${authStore.token}` }),
          },
          credentials: 'include',
        })
      )

      if (error.value) {
        throw error.value
      }

      return {
        success: true,
        data: data.value,
      }
    } catch (error) {
      return handleError(error, `Failed to fetch order ${id}`)
    }
  }

  /**
   * Create a new order
   */
  const createOrder = async (orderData: CreateOrderInput): Promise<OrderResponse> => {
    try {
      const response = await $fetch<Order>(API_ENDPOINTS.ORDERS.BASE, {
        method: 'POST',
        body: orderData,
        headers: {
          'Content-Type': 'application/json',
          ...(authStore?.token && { Authorization: `Bearer ${authStore.token}` }),
        },
        credentials: 'include',
      })

      return {
        success: true,
        data: response,
      }
    } catch (error) {
      return handleError(error, 'Failed to create order')
    }
  }

  /**
   * Update an existing order
   */
  const updateOrder = async (id: string, orderData: UpdateOrderInput): Promise<OrderResponse> => {
    try {
      const response = await $fetch<Order>(`${API_ENDPOINTS.ORDERS.BASE}/${id}`, {
        method: 'PATCH',
        body: orderData,
        headers: {
          'Content-Type': 'application/json',
          ...(authStore?.token && { Authorization: `Bearer ${authStore.token}` }),
        },
        credentials: 'include',
      })

      return {
        success: true,
        data: response,
      }
    } catch (error) {
      return handleError(error, `Failed to update order ${id}`)
    }
  }

  /**
   * Delete an order
   */
  const deleteOrder = async (id: string): Promise<ApiResponse> => {
    try {
      await $fetch<{ success: boolean }>(`${API_ENDPOINTS.ORDERS.BASE}/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          ...(authStore?.token && { Authorization: `Bearer ${authStore.token}` }),
        },
        credentials: 'include',
      })

      return { success: true }
    } catch (error) {
      return handleError(error, `Failed to delete order ${id}`)
    }
  }

  /**
   * Update order status
   */
  const updateOrderStatus = async (id: string, status: OrderStatus): Promise<OrderResponse> => {
    try {
      const response = await $fetch<Order>(`${API_ENDPOINTS.ORDERS.BASE}/${id}/status`, {
        method: 'PATCH',
        body: { status },
        headers: {
          'Content-Type': 'application/json',
          ...(authStore?.token && { Authorization: `Bearer ${authStore.token}` }),
        },
        credentials: 'include',
      })

      return {
        success: true,
        order: response,
      }
    } catch (error) {
      return handleError(error, `Failed to update order ${id} status`)
    }
  }

  /**
   * Get order statistics
   */
  const getOrderStats = async (): Promise<ApiResponse<OrderStats>> => {
    try {
      const response = await $fetch<OrderStats>(`${API_ENDPOINTS.ORDERS.BASE}/stats`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(authStore?.token && { Authorization: `Bearer ${authStore.token}` }),
        },
        credentials: 'include',
      })

      return {
        success: true,
        data: response,
      }
    } catch (error) {
      return handleError(error, 'Failed to fetch order statistics')
    }
  }

  return {
    getOrders,
    getOrderById,
    createOrder,
    updateOrder,
    deleteOrder,
    updateOrderStatus,
    getOrderStats,
  }
}

export default useOrderApi
