import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useApiStore } from './api'
import { useAuthStore } from './auth'
import { getFromStorage, setToStorage, removeFromStorage, STORAGE_KEYS } from '~/utils/storage'

// Define subscription plan types
export interface SubscriptionPlan {
  id: string
  name: string
  description: string
  price: number
  interval: 'monthly' | 'yearly'
  features: PlanFeature[]
  limits: PlanLimits
}

// Define feature structure
export interface PlanFeature {
  id: string
  name: string
  description: string
  included: boolean
}

// Define limits structure
export interface PlanLimits {
  clients: number
  templates: number
  users: number
  storage: number // in MB
}

// Define subscription status
export interface SubscriptionStatus {
  active: boolean
  planId: string | null
  trialEndsAt: string | null
  currentPeriodEndsAt: string | null
  canceledAt: string | null
  pastDue: boolean
}

/**
 * Subscription store for managing subscription plans, features, and status
 */
export const useSubscriptionStore = defineStore('subscription', () => {
  // State
  const plans = ref<SubscriptionPlan[]>([])
  const currentPlan = ref<SubscriptionPlan | null>(null)
  const status = ref<SubscriptionStatus>({
    active: false,
    planId: null,
    trialEndsAt: null,
    currentPeriodEndsAt: null,
    canceledAt: null,
    pastDue: false,
  })
  const loading = ref(false)
  const error = ref<string | null>(null)
  const lastFetched = ref<number>(0)

  // Get stores for making requests and auth
  const _apiStore = useApiStore() // Prefixed with _ to avoid lint warning
  const authStore = useAuthStore()

  // Computed properties
  const isSubscribed = computed(() => status.value.active && !isTrialing.value)
  const isTrialing = computed(
    () => !!status.value.trialEndsAt && new Date(status.value.trialEndsAt) > new Date()
  )
  const isCanceled = computed(() => !!status.value.canceledAt)
  const isPastDue = computed(() => status.value.pastDue)
  const trialDaysLeft = computed(() => {
    if (!status.value.trialEndsAt) return 0
    const trialEnd = new Date(status.value.trialEndsAt)
    const today = new Date()
    const diffTime = trialEnd.getTime() - today.getTime()
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  })

  /**
   * Fetch available subscription plans
   */
  const fetchPlans = async () => {
    try {
      loading.value = true
      error.value = null

      // Make direct fetch request
      const url = '/api/subscription/plans'
      console.log('Fetching subscription plans...')

      const fetchResponse = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: authStore.token ? `Bearer ${authStore.token}` : '',
        },
        cache: 'no-store',
      })

      if (!fetchResponse.ok) {
        throw new Error(`API error: ${fetchResponse.status} ${fetchResponse.statusText}`)
      }

      const data = await fetchResponse.json()
      console.log('Subscription plans response:', data)

      // Update plans in store
      plans.value = Array.isArray(data) ? data : data.data || []
      lastFetched.value = Date.now()

      // Cache plans in localStorage for offline access
      setToStorage(STORAGE_KEYS.SUBSCRIPTION + '.plans', plans.value)

      return plans.value
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to fetch subscription plans'
      console.error('Error fetching subscription plans:', errorMessage)
      error.value = errorMessage
      return []
    } finally {
      loading.value = false
    }
  }

  /**
   * Fetch current subscription status
   */
  const fetchSubscriptionStatus = async () => {
    try {
      loading.value = true
      error.value = null

      // Make direct fetch request
      const url = '/api/subscription/status'
      console.log('Fetching subscription status...')

      const fetchResponse = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: authStore.token ? `Bearer ${authStore.token}` : '',
        },
        cache: 'no-store',
      })

      if (!fetchResponse.ok) {
        throw new Error(`API error: ${fetchResponse.status} ${fetchResponse.statusText}`)
      }

      const data = await fetchResponse.json()
      console.log('Subscription status response:', data)

      // Update status in store
      status.value = {
        active: data.active || false,
        planId: data.planId || null,
        trialEndsAt: data.trialEndsAt || null,
        currentPeriodEndsAt: data.currentPeriodEndsAt || null,
        canceledAt: data.canceledAt || null,
        pastDue: data.pastDue || false,
      }

      // Cache subscription status in localStorage
      setToStorage(STORAGE_KEYS.SUBSCRIPTION + '.status', status.value)

      // Update current plan if we have plans loaded
      if (plans.value.length > 0 && status.value.planId) {
        currentPlan.value = plans.value.find(p => p.id === status.value.planId) || null
      } else {
        // Fetch plans if we don't have them yet
        await fetchPlans()
        currentPlan.value = plans.value.find(p => p.id === status.value.planId) || null
      }

      return status.value
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to fetch subscription status'
      console.error('Error fetching subscription status:', errorMessage)
      error.value = errorMessage
      return status.value
    } finally {
      loading.value = false
    }
  }

  /**
   * Subscribe to a plan
   * @param planId ID of the plan to subscribe to
   */
  const subscribeToPlan = async (planId: string) => {
    try {
      loading.value = true
      error.value = null

      // Make direct fetch request
      const url = '/api/subscription/subscribe'
      console.log('Subscribing to plan:', planId)

      const fetchResponse = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: authStore.token ? `Bearer ${authStore.token}` : '',
        },
        body: JSON.stringify({ planId }),
      })

      if (!fetchResponse.ok) {
        throw new Error(`API error: ${fetchResponse.status} ${fetchResponse.statusText}`)
      }

      const data = await fetchResponse.json()
      console.log('Subscription response:', data)

      // Refresh subscription status
      await fetchSubscriptionStatus()

      return data
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to subscribe to plan'
      console.error('Error subscribing to plan:', errorMessage)
      error.value = errorMessage
      throw new Error(errorMessage)
    } finally {
      loading.value = false
    }
  }

  /**
   * Cancel current subscription
   * @param immediate Whether to cancel immediately or at the end of the billing period
   */
  const cancelSubscription = async (immediate = false) => {
    try {
      loading.value = true
      error.value = null

      // Make direct fetch request
      const url = '/api/subscription/cancel'
      console.log('Canceling subscription, immediate:', immediate)

      const fetchResponse = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: authStore.token ? `Bearer ${authStore.token}` : '',
        },
        body: JSON.stringify({ immediate }),
      })

      if (!fetchResponse.ok) {
        throw new Error(`API error: ${fetchResponse.status} ${fetchResponse.statusText}`)
      }

      const data = await fetchResponse.json()
      console.log('Cancellation response:', data)

      // Refresh subscription status
      await fetchSubscriptionStatus()

      return data
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to cancel subscription'
      console.error('Error canceling subscription:', errorMessage)
      error.value = errorMessage
      throw new Error(errorMessage)
    } finally {
      loading.value = false
    }
  }

  /**
   * Check if the current subscription allows a specific feature
   * @param featureId ID of the feature to check
   */
  const hasFeature = (featureId: string): boolean => {
    if (!currentPlan.value) return false
    const feature = currentPlan.value.features.find(f => f.id === featureId)
    return feature ? feature.included : false
  }

  /**
   * Check if the current subscription is within limits
   * @param limitType Type of limit to check
   * @param currentValue Current value to check against the limit
   */
  const isWithinLimits = (limitType: keyof PlanLimits, currentValue: number): boolean => {
    if (!currentPlan.value) return false
    const limit = currentPlan.value.limits[limitType]
    return currentValue < limit
  }

  /**
   * Get the current limit for a specific resource
   * @param limitType Type of limit to get
   */
  const getLimit = (limitType: keyof PlanLimits): number => {
    if (!currentPlan.value) return 0
    return currentPlan.value.limits[limitType]
  }

  /**
   * Initialize the subscription store
   * Loads cached data from localStorage and fetches fresh data from API
   */
  const initialize = async () => {
    // Try to load cached data first for immediate display
    const cachedPlans = getFromStorage<SubscriptionPlan[]>(STORAGE_KEYS.SUBSCRIPTION + '.plans')
    const cachedStatus = getFromStorage<SubscriptionStatus>(STORAGE_KEYS.SUBSCRIPTION + '.status')

    if (cachedPlans && cachedPlans.length > 0) {
      plans.value = cachedPlans
    }

    if (cachedStatus) {
      status.value = cachedStatus

      // Find the current plan based on cached status
      if (cachedStatus.planId && cachedPlans) {
        currentPlan.value = cachedPlans.find(plan => plan.id === cachedStatus.planId) || null
      }
    }

    // If authenticated, fetch fresh data from API
    if (authStore.isAuthenticated) {
      try {
        await Promise.all([fetchPlans(), fetchSubscriptionStatus()])
      } catch (error) {
        console.error('Failed to initialize subscription data:', error)
        // We'll continue with cached data if available
      }
    }
  }

  /**
   * Reactivate a canceled subscription
   */
  const reactivateSubscription = async () => {
    try {
      loading.value = true
      error.value = null

      // Make direct fetch request
      const url = '/api/subscription/reactivate'
      console.log('Reactivating subscription')

      const fetchResponse = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: authStore.token ? `Bearer ${authStore.token}` : '',
        },
      })

      if (!fetchResponse.ok) {
        throw new Error(`API error: ${fetchResponse.status} ${fetchResponse.statusText}`)
      }

      const data = await fetchResponse.json()
      console.log('Reactivation response:', data)

      // Refresh subscription status
      await fetchSubscriptionStatus()

      return data
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to reactivate subscription'
      console.error('Error reactivating subscription:', errorMessage)
      error.value = errorMessage
      throw new Error(errorMessage)
    } finally {
      loading.value = false
    }
  }

  /**
   * Clear subscription cache from localStorage
   * Useful when logging out or when we need to refresh the subscription data
   */
  const clearCache = () => {
    removeFromStorage(STORAGE_KEYS.SUBSCRIPTION + '.plans')
    removeFromStorage(STORAGE_KEYS.SUBSCRIPTION + '.status')
    console.log('Subscription cache cleared')
  }

  // Return public interface
  return {
    // State
    plans,
    currentPlan,
    status,
    loading,
    error,

    // Computed
    isSubscribed,
    isTrialing,
    isCanceled,
    isPastDue,
    trialDaysLeft,

    // Methods
    fetchPlans,
    fetchSubscriptionStatus,
    subscribeToPlan,
    cancelSubscription,
    reactivateSubscription,
    hasFeature,
    isWithinLimits,
    getLimit,
    initialize,
    clearCache,
  }
})
