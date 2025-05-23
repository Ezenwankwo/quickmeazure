import { ref, computed } from 'vue'
import { useSessionAuth } from './useSessionAuth'

interface SubscriptionPlan {
  id: string
  name: string
  price: number
  interval: string
  features: string[]
  maxClients?: number
  description: string
}

interface Subscription {
  id: number
  userId: number
  planId: number
  status: string
  startDate: string
  endDate: string | null
  billingPeriod: string
  amount: number
  nextBillingDate: string | null
  canceledAt: string | null
  paymentMethod: string
  paymentReference: string | null
  metadata: Record<string, any> | null
  createdAt: string
  updatedAt: string | null
  plan?: SubscriptionPlan
}

/**
 * Composable for subscription management
 */
export const useSubscriptionManagement = () => {
  const subscription = ref<Subscription | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  /**
   * Check if user has an active subscription
   */
  const hasActiveSubscription = computed(() => {
    return !!subscription.value && subscription.value.status === 'active'
  })

  /**
   * Get current subscription plan details
   */
  const currentPlan = computed(() => {
    if (!subscription.value || !subscription.value.plan) {
      return null
    }
    return subscription.value.plan
  })

  /**
   * Get next billing date
   */
  const nextBillingDate = computed(() => {
    if (!subscription.value || !subscription.value.nextBillingDate) {
      return null
    }
    return new Date(subscription.value.nextBillingDate)
  })

  /**
   * Format price with currency
   */
  const formatPrice = (price: number): string => {
    return `₦${Number(price).toLocaleString()}`
  }

  /**
   * Format date in user-friendly format
   */
  const formatDate = (date: string | Date | null): string => {
    if (!date) return ''
    return new Date(date).toLocaleDateString('en-NG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  /**
   * Load user's current subscription
   */
  const loadSubscription = async (): Promise<void> => {
    isLoading.value = true
    error.value = null

    try {
      // Get the auth token
      const { token } = useSessionAuth()

      if (!token.value) {
        subscription.value = null
        return
      }

      const response = await $fetch<{
        success: boolean
        data: Subscription | null
      }>('/api/subscriptions/current', {
        headers: {
          Authorization: `Bearer ${token.value}`,
        },
      })

      if (response.success && response.data) {
        subscription.value = response.data
      } else {
        subscription.value = null
      }
    } catch (err: any) {
      console.error('Error loading subscription:', err)
      error.value = err.message || 'Failed to load subscription'
      subscription.value = null
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Cancel the current subscription
   */
  const cancelSubscription = async (reason?: string): Promise<boolean> => {
    isLoading.value = true
    error.value = null

    try {
      // Get the auth token
      const { token } = useSessionAuth()

      if (!token.value) {
        return false
      }

      const response = await $fetch<{
        success: boolean
        data: Subscription
      }>('/api/subscriptions/cancel', {
        method: 'POST',
        body: { reason },
        headers: {
          Authorization: `Bearer ${token.value}`,
        },
      })

      if (response.success) {
        subscription.value = response.data
        return true
      }
      return false
    } catch (err: any) {
      console.error('Error canceling subscription:', err)
      error.value = err.message || 'Failed to cancel subscription'
      return false
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Create a new subscription (for free/growth plans)
   */
  const createSubscription = async (data: {
    planId: string | number
    planName: string
    billingPeriod: string
  }): Promise<{ success: boolean; error?: string }> => {
    isLoading.value = true
    error.value = null

    try {
      // Get the auth token
      const { token } = useSessionAuth()

      if (!token.value) {
        return {
          success: false,
          error: 'Authentication required',
        }
      }

      const response = await $fetch<{
        success: boolean
        data: Subscription
      }>('/api/subscriptions/create', {
        method: 'POST',
        body: data,
        headers: {
          Authorization: `Bearer ${token.value}`,
        },
      })

      if (response.success) {
        subscription.value = response.data
        return { success: true }
      }

      return { success: false, error: 'Failed to create subscription' }
    } catch (err: any) {
      console.error('Error creating subscription:', err)
      error.value = err.message || 'Failed to create subscription'
      return {
        success: false,
        error: err.message || 'Failed to create subscription',
      }
    } finally {
      isLoading.value = false
    }
  }

  // Initialize by loading subscription
  if (import.meta.client) {
    loadSubscription()
  }

  return {
    subscription,
    hasActiveSubscription,
    currentPlan,
    nextBillingDate,
    isLoading,
    error,
    loadSubscription,
    cancelSubscription,
    createSubscription,
    formatPrice,
    formatDate,
  }
}
