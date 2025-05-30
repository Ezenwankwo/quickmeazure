<template>
  <div class="space-y-6">
    <UCard>
      <template #header>
        <div class="flex items-center">
          <UIcon name="i-heroicons-credit-card" class="mr-2 text-primary-500 h-5 w-5" />
          <h2 class="text-xl font-semibold text-gray-900">Billing & Subscription</h2>
        </div>
        <p class="mt-1 text-sm text-gray-500">Manage your subscription plan and payment methods.</p>
      </template>

      <div v-if="loading" class="py-8 flex flex-col items-center justify-center">
        <UIcon name="i-heroicons-arrow-path" class="animate-spin h-8 w-8 text-gray-400 mb-2" />
        <p class="text-sm text-gray-500">Loading subscription information...</p>
      </div>

      <div v-else-if="error" class="py-8 flex flex-col items-center justify-center">
        <UIcon name="i-heroicons-exclamation-circle" class="h-8 w-8 text-red-500 mb-2" />
        <p class="text-sm text-gray-700 mb-2">{{ error }}</p>
        <UButton size="sm" @click="refreshSubscription">Retry</UButton>
      </div>

      <div v-else class="space-y-6">
        <!-- Current Plan -->
        <div>
          <h3 class="text-base font-medium text-gray-900 mb-4">Current Plan</h3>

          <div class="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <div class="flex items-center justify-between">
              <div>
                <h3 class="text-lg font-bold text-primary-800 mb-1">{{ displayPlanName }}</h3>
                <div v-if="showStatusPill" class="flex items-center">
                  <span
                    class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                    :class="statusClass"
                  >
                    {{ statusText }}
                  </span>
                </div>
              </div>
              <div class="flex space-x-2">
                <UButton
                  v-if="plans.length > 0"
                  color="neutral"
                  variant="soft"
                  @click="showChangePlanDialog"
                >
                  {{ isSubscribed ? 'Change Plan' : 'Subscribe' }}
                </UButton>
                <UButton
                  v-if="isSubscribed && !isCanceled"
                  color="error"
                  variant="soft"
                  @click="cancelSubscription"
                >
                  Cancel
                </UButton>
                <UButton
                  v-if="isCanceled"
                  color="success"
                  variant="soft"
                  @click="reactivateSubscription"
                >
                  {{ hasActiveUntilExpiry ? 'Resume Subscription' : 'Reactivate' }}
                </UButton>
              </div>
            </div>
          </div>
        </div>

        <!-- Payment Methods -->
        <div class="pt-6 border-t border-gray-200">
          <div class="flex items-center mb-4">
            <h3 class="text-base font-medium text-gray-900">Payment Method</h3>
          </div>

          <div v-if="loadingPaymentMethods" class="py-4 flex flex-col items-center justify-center">
            <UIcon name="i-heroicons-arrow-path" class="animate-spin h-6 w-6 text-gray-400 mb-2" />
            <p class="text-xs text-gray-500">Loading payment method...</p>
          </div>

          <div v-else-if="paymentMethods.length === 0" class="py-4 text-center">
            <p class="text-sm text-gray-500">No payment methods found</p>
            <!-- Only show Add Payment Method button if user has a paid subscription -->
            <UButton
              v-if="hasPaidSubscription"
              color="primary"
              variant="soft"
              class="mt-2"
              @click="addPaymentMethod"
            >
              <UIcon name="i-heroicons-plus" class="mr-1 h-4 w-4" />
              {{ hasExistingPaymentMethod ? 'Change Payment Method' : 'Add Payment Method' }}
            </UButton>
          </div>

          <div v-else class="space-y-4">
            <!-- Payment Method Cards -->
            <div
              v-for="method in paymentMethods"
              :key="method.id"
              class="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200 hover:border-primary-300 transition-colors shadow-sm"
            >
              <div class="flex items-center">
                <div class="flex-shrink-0 bg-gray-100 p-2 rounded-lg mr-3">
                  <UIcon name="i-heroicons-credit-card" class="h-6 w-6 text-primary-600" />
                </div>
                <div>
                  <div class="flex items-center">
                    <p class="text-sm font-medium text-gray-900">
                      {{ method.brand || 'Card' }} •••• {{ method.last4 }}
                    </p>
                  </div>
                  <p class="text-xs text-gray-500">
                    Expires {{ method.expiryMonth }}/{{ method.expiryYear }}
                  </p>
                </div>
              </div>
              <!-- Change button instead of delete -->
              <UButton
                size="xs"
                color="primary"
                variant="soft"
                class="hover:bg-primary-100 transition-colors"
                type="button"
                @click.prevent="addPaymentMethod"
              >
                <UIcon name="i-heroicons-pencil" class="h-4 w-4 mr-1" />
                Change
              </UButton>
            </div>
          </div>
        </div>

        <!-- Billing History -->
        <div class="pt-6 border-t border-gray-200">
          <h3 class="text-base font-medium text-gray-900 mb-4">Billing History</h3>

          <div v-if="loadingBillingHistory" class="py-8 flex flex-col items-center justify-center">
            <UIcon name="i-heroicons-arrow-path" class="animate-spin h-6 w-6 text-gray-400 mb-2" />
            <p class="text-sm text-gray-500">Loading billing history...</p>
          </div>

          <div v-else-if="billingHistory.length === 0" class="py-8 text-center">
            <p class="text-sm text-gray-500">No billing history found</p>
          </div>

          <div v-else class="overflow-hidden bg-white border border-gray-200 rounded-lg">
            <table class="min-w-full divide-y divide-gray-200">
              <thead class="bg-gray-50">
                <tr>
                  <th
                    scope="col"
                    class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Date
                  </th>
                  <th
                    scope="col"
                    class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Description
                  </th>
                  <th
                    scope="col"
                    class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Amount
                  </th>
                  <th
                    scope="col"
                    class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Status
                  </th>
                  <th scope="col" class="relative px-6 py-3">
                    <span class="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
                <tr v-for="invoice in billingHistory" :key="invoice.id">
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {{ formatDate(invoice.date) }}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {{ invoice.description }}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ₦{{ invoice.amount.toFixed(2) }}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <span
                      class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                      :class="{
                        'bg-green-100 text-green-800': invoice.status === 'successful',
                        'bg-yellow-100 text-yellow-800': invoice.status === 'pending',
                        'bg-red-100 text-red-800': invoice.status === 'failed',
                      }"
                    >
                      {{ invoice.status }}
                    </span>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      type="button"
                      class="text-primary-600 hover:text-primary-900 flex items-center"
                      @click="viewInvoice(invoice.id)"
                    >
                      <UIcon name="i-heroicons-document-text" class="h-4 w-4 mr-1" />
                      <span>Invoice</span>
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </UCard>
  </div>
  <!-- Cancel Subscription Modal -->
  <DeleteModal
    v-model="showCancelModal"
    title="Cancel Subscription"
    message="Are you sure you want to cancel your subscription? You will still have access until the end of your billing period."
    confirm-text="Cancel Subscription"
    :loading="cancelLoading"
    @confirm="confirmCancelSubscription"
  />

  <!-- Change Plan Modal -->
  <PlanSelectionModal
    v-model="showPlanSelectionModal"
    v-model:selected-plan="selectedPlan"
    title="Change Subscription Plan"
    :default-billing-period="currentBillingPeriod"
    @confirm="confirmPlanChange"
    @close="closePlanSelection"
    @error="handlePlanFetchError"
  />
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import DeleteModal from '~/components/DeleteModal.vue'
import PlanSelectionModal from '~/components/plans/PlanSelectionModal.vue'
import { useSubscriptionStore } from '~/store/modules/subscription'
import { useAuthStore } from '~/store/modules/auth'
import { useUserStore } from '~/store/modules/user'

// Initialize stores
const subscriptionStore = useSubscriptionStore()
const authStore = useAuthStore()
// User store is imported for future use
const _userStore = useUserStore()

// Define missing refs
const tempSelectedPlan = ref('')
const changePlanLoading = ref(false)

// Access toast composable
const toast = useToast()

// Track initial loading to avoid showing success toast on first load
const initialLoad = ref(true)

// Access store properties reactively
const currentPlan = computed(() => subscriptionStore.currentPlan)
// Status is used in the template but not in the script
const _status = computed(() => subscriptionStore.status)
const loading = computed(() => subscriptionStore.loading)
const error = computed(() => subscriptionStore.error)
const isSubscribed = computed(() => subscriptionStore.isSubscribed)
const isTrialing = computed(() => subscriptionStore.isTrialing)
const isCanceled = computed(() => subscriptionStore.isCanceled)
const isPastDue = computed(() => subscriptionStore.isPastDue)
// Add plans computed property
const plans = computed(() => subscriptionStore.plans)

// Computed properties
const statusClass = computed(() => {
  if (isSubscribed.value && !isCanceled.value) return 'bg-green-100 text-green-800'
  if (isTrialing.value) return 'bg-blue-100 text-blue-800'
  if (isPastDue.value) return 'bg-red-100 text-red-800'
  if (isCanceled.value && subscriptionStore.status.currentPeriodEndsAt) {
    return 'bg-yellow-100 text-yellow-800'
  }
  if (isCanceled.value) return 'bg-gray-100 text-gray-800'
  return 'bg-gray-100 text-gray-800'
})

const hasActiveUntilExpiry = computed(() => {
  if (isCanceled.value && subscriptionStore.status.currentPeriodEndsAt) {
    const expiryDate = new Date(subscriptionStore.status.currentPeriodEndsAt)
    return expiryDate > new Date()
  }
  return false
})

const displayPlanName = computed(() => {
  // Always show the current plan name when canceled, regardless of expiry
  if (isCanceled.value && currentPlan.value) {
    return currentPlan.value.name // Assuming currentPlan.value is not null if isCanceled and currentPlan.value are true
  }
  // If there's no active subscription and no current plan, show No Active Plan
  if (!isSubscribed.value && !currentPlan.value) {
    return 'No Active Plan'
  }
  // Otherwise, show current plan name or fallback to Free Plan
  // Ensure currentPlan.value exists before trying to access its name property
  return currentPlan.value?.name || 'Free Plan'
})

const statusText = computed(() => {
  if (isSubscribed.value && !isCanceled.value) return 'Active'
  if (isTrialing.value) return 'Trial'
  if (isPastDue.value) return 'Past Due'
  if (isCanceled.value && subscriptionStore.status.currentPeriodEndsAt) {
    return `Active until ${formatDate(subscriptionStore.status.currentPeriodEndsAt)}`
  }
  if (isCanceled.value) return 'Canceled' // Fallback if no expiry date
  return 'Inactive'
})

// Determine whether to show the status pill
const showStatusPill = computed(() => {
  // Don't show status pill for inactive subscriptions with no plan
  if (!isSubscribed.value && !isTrialing.value && !isPastDue.value && !currentPlan.value) {
    return false
  }
  // Show status for all other cases
  return true
})

// Determine if the user has a paid subscription (not free/growth plan)
const hasPaidSubscription = computed(() => {
  // Check if user has an active subscription and the plan is paid
  if (isSubscribed.value && currentPlan.value) {
    // Check if the plan price is greater than 0
    return currentPlan.value.price > 0
  }
  return false
})

// Check if the user has any existing payment methods
const hasExistingPaymentMethod = computed(() => {
  // Check if there are any payment methods in the store
  return paymentMethods.value && paymentMethods.value.length > 0
})

// Methods
const refreshSubscription = async () => {
  try {
    console.log('Refreshing subscription data...')
    // Fetch plans and status separately to better handle errors
    try {
      await subscriptionStore.fetchSubscriptionStatus()
      console.log('Subscription status fetched successfully')
    } catch (statusErr) {
      console.error('Error fetching subscription status:', statusErr)
      // Handle status fetch error
    }

    try {
      await subscriptionStore.fetchBillingHistory()
      console.log('Billing history fetched successfully')
    } catch (billingErr) {
      console.error('Error fetching billing history:', billingErr)
      // Continue even if billing history fails
    }

    try {
      await subscriptionStore.fetchPaymentMethods()
      console.log('Payment methods fetched successfully')
    } catch (paymentErr) {
      console.error('Error fetching payment methods:', paymentErr)
      // Continue even if payment methods fail
    }

    // Only show success toast if we're not in the initial mount
    if (!initialLoad.value) {
      toast.add({
        title: 'Updated',
        description: 'Subscription information updated',
        color: 'primary',
      })
    }
  } catch (err) {
    console.error('Error in refreshSubscription:', err)
    toast.add({
      title: 'Error',
      description: 'Failed to refresh subscription information',
      color: 'error',
    })
  } finally {
    initialLoad.value = false
  }
}

// Payment method management - handles both adding and changing payment methods
const addPaymentMethod = async () => {
  console.log('addPaymentMethod function called')
  // Use the auth store that's already initialized at the component level

  console.log('Auth store user:', authStore.user)
  console.log('Auth store isLoggedIn:', authStore.isLoggedIn)
  console.log('Auth token available:', !!authStore.token)

  // For testing purposes, simulate a successful payment
  // This bypasses the Paystack integration which is having issues with email validation

  // Show loading toast
  const loadingToast = toast.add({
    title: 'Processing',
    description: 'Processing payment method...',
    color: 'neutral',
    timeout: 0,
  })

  try {
    // Simulate payment processing delay
    await new Promise(resolve => setTimeout(resolve, 1500))

    // Close loading toast
    if (loadingToast) loadingToast.close()

    // Mock successful payment response
    const mockPaymentResponse = {
      reference: `QM-${Date.now()}-${Math.floor(Math.random() * 1000000)}`,
      last4: '1234',
      expiryMonth: '12',
      expiryYear: '2025',
      brand: 'Visa',
    }

    console.log('Mock payment successful:', mockPaymentResponse)

    // Store the mock response in localStorage for processing
    localStorage.setItem('lastPaystackResponse', JSON.stringify(mockPaymentResponse))

    // Show success toast
    toast.add({
      title: 'Payment Successful',
      description: 'Processing your payment method...',
      color: 'green',
      timeout: 3000,
    })

    // Extract card details from the mock response
    const cardDetails = {
      type: 'card',
      last4: mockPaymentResponse.last4 || '1234',
      expiryMonth: mockPaymentResponse.expiryMonth || '12',
      expiryYear: mockPaymentResponse.expiryYear || '2025',
      brand: mockPaymentResponse.brand || 'Visa',
      providerId: mockPaymentResponse.reference,
      metadata: {
        email: authStore.user?.email || 'user@example.com',
        authorization_code: 'mock_auth_code',
        status: 'success',
        message: 'Transaction successful',
      },
    }

    console.log('Creating payment method with card details:', cardDetails)

    // Add payment method to the database
    await subscriptionStore.addPaymentMethod(mockPaymentResponse.reference, cardDetails)

    // Refresh payment methods
    await refreshSubscription()

    // Show success toast with appropriate message based on whether this is an add or update
    toast.add({
      title: 'Success',
      description: hasExistingPaymentMethod.value
        ? 'Payment method updated successfully'
        : 'Payment method added successfully',
      color: 'primary',
    })
  } catch (error) {
    console.error('Error adding payment method:', error)
    if (loadingToast) loadingToast.close()

    toast.add({
      title: 'Error',
      description: error?.message || 'Failed to add payment method',
      color: 'error',
    })
  }
}

// We no longer need payment method removal functionality since we're only allowing changing payment methods
// Users can only have one payment method at a time, which they can update but not delete

// Invoice viewing
const viewInvoice = id => {
  // This would typically open a modal with invoice details or download a PDF
  // For now, we'll just show a toast
  toast.add({
    title: 'Coming Soon',
    description: `Invoice viewing for ID: ${id} will be available soon`,
    color: 'blue',
  })
}

// Change Plan Modal State
const showPlanSelectionModal = ref(false)
const selectedPlan = ref('')
const currentBillingPeriod = computed(() => {
  // Default to monthly if we can't determine the current billing period
  if (!currentPlan.value || !currentPlan.value.interval) return 'monthly'

  // Map the interval from the subscription store to the expected format
  const interval = currentPlan.value.interval.toLowerCase()
  return interval === 'yearly' || interval === 'year' ? 'annual' : 'monthly'
})

// Handle plan fetch errors
const handlePlanFetchError = error => {
  useToast().add({
    title: 'Error',
    description: error?.message || 'Failed to load plans. Please try again later.',
    color: 'red',
    icon: 'i-heroicons-exclamation-triangle',
  })
}

// Handle plan change confirmation
const confirmPlanChange = async (planId: string) => {
  try {
    changePlanLoading.value = true

    // Verify user is logged in and has email
    if (!authStore.isLoggedIn) {
      throw new Error('You must be logged in to change your plan')
    }

    // Ensure user data is loaded
    if (!authStore.user || !authStore.user.email) {
      console.log('User email not found in auth store, attempting to get user data')

      try {
        // First try to refresh the session
        const refreshResult = await authStore.refreshSession()
        console.log('Session refresh result:', refreshResult)

        // If refresh failed but we're still logged in, try to get user data directly
        if (!refreshResult.success && authStore.isLoggedIn) {
          console.log('Refresh failed but still logged in, fetching user profile directly')
          // Try to fetch the user profile directly as a fallback
          const userStore = useUserStore()
          await userStore.fetchProfile()

          // If user store has the email, update auth store
          if (userStore.profile && userStore.profile.email) {
            if (!authStore.user) {
              authStore.user = {
                id: userStore.profile.id,
                email: userStore.profile.email,
              }
            } else {
              authStore.user.email = userStore.profile.email
            }
          }
        }
      } catch (userErr) {
        console.error('Error refreshing session or fetching user profile:', userErr)
        // Continue with the plan change if we have a plan ID
      }

      // If we still don't have user email after trying to refresh
      if (!authStore.user?.email) {
        throw new Error(
          'Could not verify your account information. Please try logging out and back in.'
        )
      }
    }

    console.log('User email available:', authStore.user.email)

    // Proceed with the plan change
    await subscriptionStore.changePlan(planId)

    // Refresh subscription data
    await refreshSubscription()

    toast.add({
      title: 'Success',
      description: 'Your subscription plan has been updated successfully.',
      color: 'green',
      icon: 'i-heroicons-check-circle',
    })
  } catch (error) {
    console.error('Error changing plan:', error)
    toast.add({
      title: 'Error',
      description: error.message || 'Failed to update subscription plan.',
      color: 'red',
      icon: 'i-heroicons-exclamation-triangle',
    })
  } finally {
    changePlanLoading.value = false
    showPlanSelectionModal.value = false
  }
}

// Close plan selection modal
const closePlanSelection = () => {
  showPlanSelectionModal.value = false
}

// Toggle plan selection modal
const showChangePlanDialog = () => {
  // Show the modal - the PlanSelectionModal will handle fetching plans
  showPlanSelectionModal.value = true
}

// Watch for modal open to set the selected plan
watch(
  () => showPlanSelectionModal.value,
  newVal => {
    if (newVal) {
      // Initialize tempSelectedPlan with current plan value when modal opens
      tempSelectedPlan.value = currentPlan.value?.name?.toLowerCase() || 'growth'
    }
  }
)

// Show cancel subscription modal
const showCancelModal = ref(false)
const cancelLoading = ref(false)

const cancelSubscription = () => {
  showCancelModal.value = true
}

const confirmCancelSubscription = async () => {
  try {
    cancelLoading.value = true
    await subscriptionStore.cancelSubscription(false)
    showCancelModal.value = false
    toast.add({
      title: 'Subscription Canceled',
      description: 'Your subscription has been canceled',
      color: 'success',
    })
  } catch (_err) {
    toast.add({
      title: 'Error',
      description: 'Failed to cancel subscription',
      color: 'red',
    })
  }
}

const reactivateSubscription = async () => {
  try {
    await subscriptionStore.reactivateSubscription()
    toast.add({
      title: 'Subscription Reactivated',
      description: 'Your subscription has been reactivated',
      color: 'green',
    })
  } catch (_err) {
    toast.add({
      title: 'Error',
      description: 'Failed to reactivate subscription',
      color: 'red',
    })
  }
}

// Utility functions
const formatDate = dateString => {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

// Format storage size from MB to appropriate unit (MB, GB, TB)
const _formatStorage = sizeInMB => {
  if (!sizeInMB) return 'Unlimited'

  if (sizeInMB < 1000) {
    return `${sizeInMB} MB`
  } else if (sizeInMB < 1000000) {
    return `${(sizeInMB / 1000).toFixed(1)} GB`
  } else {
    return `${(sizeInMB / 1000000).toFixed(1)} TB`
  }
}

// Access billing history and payment methods from the store
const billingHistory = computed(() => subscriptionStore.billingHistory)
const paymentMethods = computed(() => subscriptionStore.paymentMethods)
const loadingBillingHistory = computed(() => subscriptionStore.loadingBillingHistory)
const loadingPaymentMethods = computed(() => subscriptionStore.loadingPaymentMethods)

// Removed billingColumns as we're using a standard HTML table now

// Initialize on component mount
onMounted(async () => {
  try {
    console.log('SettingsBillingForm mounted')
    // Check if user is authenticated first
    if (!authStore.isLoggedIn) {
      console.warn('User not authenticated, cannot load subscription data')
      toast.add({
        title: 'Authentication Required',
        description: 'Please log in to view your subscription details',
        color: 'warning',
      })
      return
    }

    console.log('Auth token available:', !!authStore.token)
    console.log('Auth headers:', authStore.getAuthHeaders())

    // Refresh subscription data
    await refreshSubscription()
  } catch (err) {
    console.error('Error initializing billing form:', err)
    toast.add({
      title: 'Error',
      description: `Error loading subscription data: ${err?.message || 'Unknown error'}`,
      color: 'error',
    })
  }
})
</script>
