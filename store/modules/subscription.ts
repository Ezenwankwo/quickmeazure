import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
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

// Define payment method types
export interface PaymentMethod {
  id: number
  type: string
  last4: string
  expiryMonth: string
  expiryYear: string
  brand: string
  isDefault: boolean
  createdAt: string
}

// Define payment/invoice types
export interface BillingHistoryItem {
  id: number
  date: string
  description: string
  amount: number
  status: string
  reference?: string
  metadata?: any
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
  const billingHistory = ref<BillingHistoryItem[]>([])
  const paymentMethods = ref<PaymentMethod[]>([])
  const loading = ref(false)
  const loadingBillingHistory = ref(false)
  const loadingPaymentMethods = ref(false)
  const error = ref<string | null>(null)
  const lastFetched = ref<number>(0)

  // Get stores for auth
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
      const url = '/api/subscriptions/plans'
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
      const url = '/api/subscriptions/current'
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
        active: data.data.active || false,
        planId: data.data.planId || null,
        trialEndsAt: data.data.trialEndsAt || null,
        currentPeriodEndsAt: data.data.currentPeriodEndsAt || null,
        canceledAt: data.data.canceledAt || null,
        pastDue: data.data.pastDue || false,
      }

      // Cache subscription status in localStorage
      setToStorage(STORAGE_KEYS.SUBSCRIPTION + '.status', status.value)

      // If a new token was returned with the subscription data, update it in the auth store
      if (data.token) {
        console.log('Updating token with new subscription data')
        authStore.updateToken(data.token)
      }

      // Check if the response includes plan data directly
      if (data.data.plan) {
        console.log('Using plan data from subscription response:', data.data.plan)
        // Convert the plan data to match our SubscriptionPlan interface
        currentPlan.value = {
          id: String(data.data.plan.id),
          name: data.data.plan.name,
          description: data.data.plan.description,
          price: data.data.plan.price,
          interval: data.data.plan.interval as 'monthly' | 'yearly',
          features: data.data.plan.features || [],
          limits: {
            clients: data.data.plan.maxClients || 0,
            templates: data.data.plan.maxStyles || 0,
            users: 1, // Default to 1 user
            storage: data.data.plan.maxStorage || 0,
          },
        }

        // Add this plan to the plans list if it's not already there
        if (!plans.value.some(p => p.id === currentPlan.value?.id)) {
          plans.value.push(currentPlan.value)
        }
      } else if (plans.value.length > 0 && status.value.planId) {
        // Fallback to finding the plan in our cached plans
        currentPlan.value = plans.value.find(p => p.id === String(status.value.planId)) || null
      } else if (status.value.planId) {
        // Fetch plans if we don't have them yet
        await fetchPlans()
        currentPlan.value = plans.value.find(p => p.id === String(status.value.planId)) || null
      } else {
        // No plan ID, so no current plan
        currentPlan.value = null
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
   * @param paymentReference Payment reference from payment provider
   * @param cardDetails Card details from payment provider
   */
  const subscribeToPlan = async (planId: string, paymentReference?: string, cardDetails?: any) => {
    try {
      loading.value = true
      error.value = null

      // Make direct fetch request
      const url = '/api/subscriptions/create'
      console.log('Subscribing to plan:', planId)

      // Get plan details to determine if it's a paid plan
      const plan = plans.value.find(p => p.id === planId)
      const isPaidPlan = plan && plan.price > 0

      // For paid plans, we need payment reference and card details
      if (isPaidPlan && (!paymentReference || !cardDetails)) {
        throw new Error('Payment reference and card details are required for paid plans')
      }

      // Prepare request body
      const requestBody: any = {
        planId,
        planName: plan?.name || '',
        billingPeriod: plan?.interval === 'year' ? 'annual' : 'monthly',
      }

      // Add payment details for paid plans
      if (isPaidPlan && paymentReference) {
        requestBody.paymentReference = paymentReference
        requestBody.amount = plan?.price || 0
        requestBody.cardDetails = cardDetails
      }

      const fetchResponse = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: authStore.token ? `Bearer ${authStore.token}` : '',
        },
        body: JSON.stringify(requestBody),
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
   * Change subscription plan
   * @param params Object containing planId, billingInterval, and optional payment information
   */
  const changePlan = async (params: {
    planId: string
    billingInterval: string
    paymentReference?: string
    cardDetails?: any
  }) => {
    try {
      loading.value = true
      error.value = null

      // Make direct fetch request
      const url = '/api/subscriptions/change-plan'

      // Validate that we have a valid plan ID
      if (!params.planId) {
        throw new Error('Plan ID is required')
      }

      // Ensure planId is always a number
      const planIdNum = Number(params.planId)
      if (isNaN(planIdNum)) {
        console.error('Invalid plan ID format:', params.planId)
        throw new Error('Invalid plan ID format')
      }

      // Check if this is a paid plan that requires payment information
      const targetPlan = plans.value.find(p => p.id === params.planId.toString())
      const isPaidPlan = targetPlan && targetPlan.price > 0

      // Prepare request parameters
      const requestParams: any = {
        planId: planIdNum,
        billingInterval: params.billingInterval,
      }

      // Include payment information if provided
      if (isPaidPlan && params.paymentReference) {
        console.log('Including payment information in plan change request')
        requestParams.paymentReference = params.paymentReference
        requestParams.cardDetails = params.cardDetails
      }

      console.log('Changing plan to:', requestParams)

      const fetchResponse = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: authStore.token ? `Bearer ${authStore.token}` : '',
        },
        body: JSON.stringify(requestParams),
      })

      if (!fetchResponse.ok) {
        throw new Error(`API error: ${fetchResponse.status} ${fetchResponse.statusText}`)
      }

      const data = await fetchResponse.json()
      console.log('Plan change response:', data)

      // If the response includes a new token, update it in the auth store
      if (data.token) {
        console.log('Received new token with updated subscription data')
        authStore.updateToken(data.token)
      }

      // Refresh subscription status
      await fetchSubscriptionStatus()

      return data
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to change subscription plan'
      console.error('Error changing plan:', errorMessage)
      error.value = errorMessage
      throw err
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
      const url = '/api/subscriptions/cancel'
      console.log('Canceling subscription, immediate:', immediate)

      // Get auth headers from auth store for consistent token handling
      const headers = {
        'Content-Type': 'application/json',
        ...authStore.getAuthHeaders(),
      }

      console.log('Using auth headers:', headers)

      const fetchResponse = await fetch(url, {
        method: 'POST',
        headers,
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

  /**
   * Fetch billing history
   */
  const fetchBillingHistory = async () => {
    try {
      loadingBillingHistory.value = true
      error.value = null

      // Make direct fetch request
      const url = '/api/subscriptions/billing-history'
      console.log('Fetching billing history...')

      // Get auth headers from auth store
      const authHeaders = authStore.getAuthHeaders()

      const fetchResponse = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders,
        },
        cache: 'no-store',
      })

      if (!fetchResponse.ok) {
        throw new Error(`API error: ${fetchResponse.status} ${fetchResponse.statusText}`)
      }

      const data = await fetchResponse.json()
      console.log('Billing history response:', data)

      // Update billing history in store
      billingHistory.value = data.data || []

      return billingHistory.value
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to fetch billing history'
      console.error('Error fetching billing history:', errorMessage)
      error.value = errorMessage
      return []
    } finally {
      loadingBillingHistory.value = false
    }
  }

  /**
   * Fetch payment methods
   */
  const fetchPaymentMethods = async () => {
    try {
      loadingPaymentMethods.value = true
      error.value = null

      // Make direct fetch request
      const url = '/api/subscriptions/payment-methods'
      console.log('Fetching payment methods...')

      // Get auth headers from auth store
      const authHeaders = authStore.getAuthHeaders()

      const fetchResponse = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders,
        },
        cache: 'no-store',
      })

      if (!fetchResponse.ok) {
        throw new Error(`API error: ${fetchResponse.status} ${fetchResponse.statusText}`)
      }

      const data = await fetchResponse.json()
      console.log('Payment methods response:', data)

      // Update payment methods in store
      paymentMethods.value = data.data || []

      return paymentMethods.value
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to fetch payment methods'
      console.error('Error fetching payment methods:', errorMessage)
      error.value = errorMessage
      return []
    } finally {
      loadingPaymentMethods.value = false
    }
  }

  /**
   * Add a new payment method
   * @param reference Paystack payment reference
   * @param cardDetails Card details from Paystack response
   */
  const addPaymentMethod = async (reference: string, cardDetails: any) => {
    try {
      loadingPaymentMethods.value = true
      error.value = null

      // Make direct fetch request
      const url = '/api/subscriptions/payment-methods'
      console.log('Adding payment method with reference:', reference)

      const fetchResponse = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: authStore.token ? `Bearer ${authStore.token}` : '',
        },
        body: JSON.stringify({
          reference,
          cardDetails,
        }),
      })

      if (!fetchResponse.ok) {
        throw new Error(`API error: ${fetchResponse.status} ${fetchResponse.statusText}`)
      }

      const data = await fetchResponse.json()
      console.log('Add payment method response:', data)

      // Refresh payment methods list
      await fetchPaymentMethods()

      return data.data
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to add payment method'
      console.error('Error adding payment method:', errorMessage)
      error.value = errorMessage
      throw err
    } finally {
      loadingPaymentMethods.value = false
    }
  }

  /**
   * Remove a payment method
   * @param id ID of the payment method to remove
   */
  const removePaymentMethod = async (id: number) => {
    try {
      loadingPaymentMethods.value = true
      error.value = null

      // Make direct fetch request
      const url = `/api/subscriptions/payment-methods/${id}`
      console.log('Removing payment method with ID:', id)

      const fetchResponse = await fetch(url, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: authStore.token ? `Bearer ${authStore.token}` : '',
        },
      })

      if (!fetchResponse.ok) {
        throw new Error(`API error: ${fetchResponse.status} ${fetchResponse.statusText}`)
      }

      const data = await fetchResponse.json()
      console.log('Remove payment method response:', data)

      // Refresh payment methods list
      await fetchPaymentMethods()

      return data.data
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to remove payment method'
      console.error('Error removing payment method:', errorMessage)
      error.value = errorMessage
      throw err
    } finally {
      loadingPaymentMethods.value = false
    }
  }

  // Return public interface
  return {
    // State
    plans,
    currentPlan,
    status,
    billingHistory,
    paymentMethods,
    loading,
    loadingBillingHistory,
    loadingPaymentMethods,
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
    fetchBillingHistory,
    fetchPaymentMethods,
    subscribeToPlan,
    cancelSubscription,
    reactivateSubscription,
    changePlan,
    hasFeature,
    isWithinLimits,
    getLimit,
    initialize,
    clearCache,
    addPaymentMethod,
    removePaymentMethod,
  }
})
