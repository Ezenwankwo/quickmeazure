import type {
  SubscriptionPlan,
  PaymentMethod,
  BillingHistoryItem,
  SubscriptionStatus,
  SubscriptionCheckoutParams,
  UpdatePaymentMethodParams,
  CancelSubscriptionParams,
  ResumeSubscriptionParams,
} from '~/types/subscription'

interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
}

export const useSubscriptionApi = () => {
  const { $api } = useNuxtApp()
  const authStore = useAuthStore()
  const toast = useToast()

  // Helper function to handle API calls
  const handleApiCall = async <T>(
    request: () => Promise<ApiResponse<T>>,
    errorMessage: string
  ): Promise<ApiResponse<T>> => {
    try {
      const response = await request()
      if (!response.success) {
        toast.add({
          title: 'Error',
          description: response.error || errorMessage,
          color: 'error',
        })
      }
      return response
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || errorMessage
      toast.add({
        title: 'Error',
        description: message,
        color: 'error',
      })
      return { success: false, error: message }
    }
  }

  // Get all subscription plans
  const getPlans = async (): Promise<ApiResponse<SubscriptionPlan[]>> => {
    return handleApiCall<SubscriptionPlan[]>(async () => {
      const { data } = await $api.get('/api/subscription/plans')
      return { success: true, data }
    }, 'Failed to fetch subscription plans')
  }

  // Get current subscription status
  const getSubscriptionStatus = async (): Promise<ApiResponse<SubscriptionStatus>> => {
    if (!authStore.isAuthenticated) {
      return { success: false, error: 'Not authenticated' }
    }

    return handleApiCall<SubscriptionStatus>(async () => {
      const { data } = await $api.get('/api/subscription/status')
      return { success: true, data }
    }, 'Failed to fetch subscription status')
  }

  // Get payment methods
  const getPaymentMethods = async (): Promise<ApiResponse<PaymentMethod[]>> => {
    if (!authStore.isAuthenticated) {
      return { success: false, error: 'Not authenticated' }
    }

    return handleApiCall<PaymentMethod[]>(async () => {
      const { data } = await $api.get('/api/subscription/payment-methods')
      return { success: true, data }
    }, 'Failed to fetch payment methods')
  }

  // Get billing history
  const getBillingHistory = async (): Promise<ApiResponse<BillingHistoryItem[]>> => {
    if (!authStore.isAuthenticated) {
      return { success: false, error: 'Not authenticated' }
    }

    return handleApiCall<BillingHistoryItem[]>(async () => {
      const { data } = await $api.get('/api/subscription/billing-history')
      return { success: true, data }
    }, 'Failed to fetch billing history')
  }

  // Create checkout session
  const createCheckoutSession = async (
    params: SubscriptionCheckoutParams
  ): Promise<ApiResponse<{ sessionId: string }>> => {
    return handleApiCall<{ sessionId: string }>(async () => {
      const { data } = await $api.post('/api/subscription/checkout', params)
      return { success: true, data }
    }, 'Failed to create checkout session')
  }

  // Update payment method
  const updatePaymentMethod = async (
    params: UpdatePaymentMethodParams
  ): Promise<ApiResponse<{ success: boolean }>> => {
    return handleApiCall<{ success: boolean }>(async () => {
      const { data } = await $api.post('/api/subscription/update-payment-method', params)
      return { success: true, data }
    }, 'Failed to update payment method')
  }

  // Cancel subscription
  const cancelSubscription = async (
    params: CancelSubscriptionParams = {}
  ): Promise<ApiResponse<{ success: boolean }>> => {
    return handleApiCall<{ success: boolean }>(async () => {
      const { data } = await $api.post('/api/subscription/cancel', params)
      return { success: true, data }
    }, 'Failed to cancel subscription')
  }

  // Resume subscription
  const resumeSubscription = async (
    params: ResumeSubscriptionParams = {}
  ): Promise<ApiResponse<{ success: boolean }>> => {
    return handleApiCall<{ success: boolean }>(async () => {
      const { data } = await $api.post('/api/subscription/resume', params)
      return { success: true, data }
    }, 'Failed to resume subscription')
  }

  return {
    getPlans,
    getSubscriptionStatus,
    getPaymentMethods,
    getBillingHistory,
    createCheckoutSession,
    updatePaymentMethod,
    cancelSubscription,
    resumeSubscription,
  }
}
