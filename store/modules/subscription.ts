import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type {
  SubscriptionPlan,
  PaymentMethod,
  BillingHistoryItem,
  PlanLimits,
  SubscriptionStatus,
} from '~/types/subscription'

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
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  const lastFetched = ref<number>(0)

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

  // Helper function to check if a feature is available in the current plan
  const hasFeature = (featureId: string): boolean => {
    if (!currentPlan.value) return false
    return currentPlan.value.features?.includes(featureId) || false
  }

  // Check if current usage is within plan limits
  const isWithinLimits = (limitType: keyof PlanLimits, currentValue: number): boolean => {
    if (!currentPlan.value) return false
    const limit = currentPlan.value.limits[limitType]
    return limit === -1 || currentValue <= limit // -1 means unlimited
  }

  // Get a specific limit from the current plan
  const getLimit = (limitType: keyof PlanLimits): number => {
    if (!currentPlan.value) return 0
    return currentPlan.value.limits[limitType]
  }

  // State setters
  const setPlans = (newPlans: SubscriptionPlan[]) => {
    plans.value = newPlans
    lastFetched.value = Date.now()
  }

  const setCurrentPlan = (plan: SubscriptionPlan | null) => {
    currentPlan.value = plan
  }

  const setStatus = (newStatus: SubscriptionStatus) => {
    status.value = newStatus
  }

  const setBillingHistory = (history: BillingHistoryItem[]) => {
    billingHistory.value = history
  }

  const setPaymentMethods = (methods: PaymentMethod[]) => {
    paymentMethods.value = methods
  }

  const setLoading = (loading: boolean) => {
    isLoading.value = loading
  }

  const setError = (err: string | null) => {
    error.value = err
  }

  const clearCache = () => {
    plans.value = []
    currentPlan.value = null
    status.value = {
      active: false,
      planId: null,
      trialEndsAt: null,
      currentPeriodEndsAt: null,
      canceledAt: null,
      pastDue: false,
    }
    billingHistory.value = []
    paymentMethods.value = []
    error.value = null
    lastFetched.value = 0
  }

  return {
    // State
    plans,
    currentPlan,
    status,
    billingHistory,
    paymentMethods,
    isLoading,
    error,
    lastFetched,

    // Computed
    isSubscribed,
    isTrialing,
    isCanceled,
    isPastDue,
    trialDaysLeft,

    // Actions
    setPlans,
    setCurrentPlan,
    setStatus,
    setBillingHistory,
    setPaymentMethods,
    setLoading,
    setError,
    clearCache,
    hasFeature,
    isWithinLimits,
    getLimit,
  }
})
