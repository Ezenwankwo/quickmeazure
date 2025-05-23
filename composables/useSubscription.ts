import { ref, computed } from 'vue'
import { useSessionAuth } from './useSessionAuth'

// Define subscription plan types
export type SubscriptionPlanType = 'free' | 'standard' | 'premium'

// Define subscription plan interface
export interface SubscriptionPlan {
  value: SubscriptionPlanType
  label: string
  description: string
  price: string
  numericPrice: number
  clientLimit: number | null
  features: string[]
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
export const useSubscription = () => {
  const { _user, isSubscriptionActive } = useSessionAuth()

  const subscription = ref<Subscription | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // Define available subscription plans
  const subscriptionPlans = ref<SubscriptionPlan[]>([
    {
      value: 'free',
      label: 'Growth',
      description: 'Basic plan for small tailoring businesses',
      price: '₦0/month',
      numericPrice: 0,
      clientLimit: 100,
      features: ['Up to 100 clients', 'Basic measurements', 'Payment tracking'],
    },
    {
      value: 'standard',
      label: 'Professional',
      description: 'Standard plan for growing tailoring businesses',
      price: '₦5,000/month',
      numericPrice: 5000,
      clientLimit: 500,
      features: [
        'Up to 500 clients',
        'Advanced measurements',
        'Payment tracking',
        'Style catalog',
        'Email notifications',
      ],
    },
    {
      value: 'premium',
      label: 'Enterprise',
      description: 'Premium plan for established tailoring businesses',
      price: '₦10,000/month',
      numericPrice: 10000,
      clientLimit: null, // Unlimited
      features: [
        'Unlimited clients',
        'Advanced measurements',
        'Payment tracking',
        'Style catalog',
        'Email notifications',
        'Analytics dashboard',
        'Priority support',
      ],
    },
  ])

  // Get current subscription plan
  const currentPlan = computed(() => {
    if (!subscription.value || !subscription.value.plan) {
      return null
    }
    return subscription.value.plan
  })

  // Get client limit based on current plan
  const clientLimit = computed(() => {
    if (!isSubscriptionActive.value) return 0
    if (!currentPlan.value) return 0
    return currentPlan.value.clientLimit
  })

  // Check if user can add more clients
  async function canAddMoreClients(currentClientCount: number): Promise<boolean> {
    if (!isSubscriptionActive.value) return false
    if (!currentPlan.value) return false
    if (currentPlan.value.clientLimit === null) return true // Unlimited
    return currentClientCount < currentPlan.value.clientLimit
  }

  // Calculate remaining clients
  function getRemainingClients(currentClientCount: number): number {
    if (!isSubscriptionActive.value) return 0
    if (!currentPlan.value) return 0
    if (currentPlan.value.clientLimit === null) return Infinity // Unlimited
    return Math.max(0, currentPlan.value.clientLimit - currentClientCount)
  }

  // Format remaining clients for display
  function formatRemainingClients(currentClientCount: number): string {
    if (!isSubscriptionActive.value) return '0'
    if (!currentPlan.value) return '0'
    if (currentPlan.value.clientLimit === null) return 'Unlimited'
    return getRemainingClients(currentClientCount).toString()
  }

  /**
   * Check if user has an active subscription
   */
  const hasActiveSubscription = computed(() => {
    return !!subscription.value && subscription.value.status === 'active'
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
      const response = await $fetch<{
        success: boolean
        data: Subscription | null
      }>('/api/subscriptions/current')

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
      const response = await $fetch<{
        success: boolean
        data: Subscription
      }>('/api/subscriptions/cancel', {
        method: 'POST',
        body: { reason },
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
    formatPrice,
    formatDate,
    subscriptionPlans,
    clientLimit,
    canAddMoreClients,
    getRemainingClients,
    formatRemainingClients,
  }
}
