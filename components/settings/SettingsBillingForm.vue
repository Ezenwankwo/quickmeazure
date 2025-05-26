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
            <h3 class="text-base font-medium text-gray-900">Payment Methods</h3>
          </div>

          <div v-if="loadingPaymentMethods" class="py-4 flex flex-col items-center justify-center">
            <UIcon name="i-heroicons-arrow-path" class="animate-spin h-6 w-6 text-gray-400 mb-2" />
            <p class="text-xs text-gray-500">Loading payment methods...</p>
          </div>

          <div v-else-if="paymentMethods.length === 0" class="py-4 text-center">
            <p class="text-sm text-gray-500">No payment methods found</p>
            <UButton
color="primary"
variant="soft"
class="mt-2"
@click="addPaymentMethod">
              <UIcon name="i-heroicons-plus" class="mr-1 h-4 w-4" />
              Add Payment Method
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
                    <span
                      v-if="method.isDefault"
                      class="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800"
                    >
                      Default
                    </span>
                  </div>
                  <p class="text-xs text-gray-500">
                    Expires {{ method.expiryMonth }}/{{ method.expiryYear }}
                  </p>
                </div>
              </div>
              <UButton
                size="xs"
                color="gray"
                variant="ghost"
                class="hover:bg-red-50 hover:text-red-600 transition-colors"
                @click="removePaymentMethod(method.id)"
              >
                <UIcon name="i-heroicons-trash" class="h-4 w-4" />
              </UButton>
            </div>

            <!-- Add Another Payment Method Button -->
            <UButton
              variant="soft"
              color="primary"
              class="justify-center"
              @click="addPaymentMethod"
            >
              <UIcon name="i-heroicons-plus" class="mr-1 h-4 w-4" />
              Add Another Payment Method
            </UButton>
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
                    ${{ invoice.amount.toFixed(2) }}
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

  <!-- Remove Payment Method Modal -->
  <DeleteModal
    v-model="showRemovePaymentMethodModal"
    title="Remove Payment Method"
    message="Are you sure you want to remove this payment method?"
    confirm-text="Remove"
    :loading="removePaymentMethodLoading"
    @confirm="confirmRemovePaymentMethod"
  />

  <!-- Change Plan Modal -->
  <UModal
    v-model:open="showChangePlanModal"
    title="Select a Different Plan"
    aria-labelledby="plan-selection-modal-title"
    role="dialog"
  >
    <template #header>
      <h2 id="plan-selection-modal-title" class="text-lg font-medium text-gray-900">
        Select a Different Plan
      </h2>
    </template>
    <template #body>
      <div class="space-y-6">
        <!-- Billing Toggle -->
        <div class="flex flex-col items-center mb-6">
          <div class="flex justify-center items-center gap-4 mb-2">
            <span :class="{ 'font-semibold': !isAnnualBilling, 'text-gray-500': isAnnualBilling }"
              >Monthly</span
            >
            <button
              class="relative inline-flex h-6 w-12 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
              :class="{ 'bg-primary-600': isAnnualBilling, 'bg-gray-300': !isAnnualBilling }"
              role="switch"
              type="button"
              :aria-checked="isAnnualBilling"
              aria-label="Toggle between monthly and annual billing"
              @click="toggleBilling"
            >
              <span
                class="inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out"
                :class="{ 'translate-x-6': isAnnualBilling, 'translate-x-0': !isAnnualBilling }"
              />
            </button>
            <span :class="{ 'font-semibold': isAnnualBilling, 'text-gray-500': !isAnnualBilling }"
              >Annual</span
            >
            <span
              v-if="isAnnualBilling"
              class="text-sm bg-primary-100 text-primary-800 py-1 px-2 rounded-full font-medium"
              >Save 15%</span
            >
          </div>
          <p class="text-sm text-center text-primary-700 bg-primary-50 py-2 px-4 rounded-full">
            <span v-if="isAnnualBilling"
              >Annual billing saves you 15% compared to monthly billing</span
            >
            <span v-else>Switch to annual billing to save 15%</span>
          </p>
        </div>

        <!-- Plan Options -->
        <div :key="'plan-options-' + modalRefreshKey" class="space-y-4">
          <div
            v-for="plan in displayedPlans"
            :key="plan.value"
            class="border border-gray-200 rounded-lg p-4 cursor-pointer hover:border-primary-500 transition-colors"
            :class="{ 'border-primary-500 bg-primary-50': tempSelectedPlan === plan.value }"
            @click="tempSelectedPlan = plan.value"
          >
            <!-- Responsive layout with better stacking on small screens -->
            <div class="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
              <div class="flex-1">
                <div class="flex items-center gap-2 flex-wrap">
                  <h4 class="text-lg font-medium">
                    {{ plan.label }}
                  </h4>
                  <UBadge v-if="plan.value === 'professional'" color="primary" size="xs">
                    Popular
                  </UBadge>
                  <!-- Show savings badge for annual plans -->
                  <UBadge
                    v-if="isAnnualBilling && plan.numericPrice > 0"
                    color="success"
                    size="xs"
                    class="ml-auto sm:ml-0"
                  >
                    Save 15%
                  </UBadge>
                </div>
                <p class="text-base text-gray-600 mt-1">
                  {{ plan.description }}
                </p>

                <!-- Plan pricing with monthly equivalent for annual plans -->
                <div class="mt-2 mb-3 sm:hidden">
                  <!-- Mobile only pricing -->
                  <div class="font-bold text-lg">
                    ₦{{ plan?.numericPrice?.toLocaleString() || '0' }}/{{
                      isAnnualBilling ? 'year' : 'month'
                    }}
                  </div>
                  <div
                    v-if="isAnnualBilling && plan.numericPrice > 0"
                    class="text-sm text-gray-600"
                  >
                    (₦{{ Math.round(plan.numericPrice / 12).toLocaleString() }}/month equivalent)
                  </div>
                  <div v-if="plan.numericPrice === 0" class="text-sm font-medium text-green-600">
                    Free forever
                  </div>
                </div>

                <!-- Feature list with expandable view -->
                <div class="relative">
                  <ul class="mt-2 space-y-1">
                    <li
                      v-for="(feature, index) in plan.features?.slice(0, 3)"
                      :key="index"
                      class="text-sm text-gray-700 flex items-center"
                    >
                      <UIcon
                        name="i-heroicons-check"
                        class="text-primary-600 mr-2 h-4 w-4 flex-shrink-0"
                      />
                      {{ feature }}
                    </li>
                  </ul>
                </div>
              </div>

              <!-- Desktop pricing (right side) -->
              <div class="text-right sm:min-w-[140px] flex flex-col items-end justify-between">
                <div class="hidden sm:block">
                  <!-- Desktop only pricing -->
                  <div class="font-bold text-lg">
                    ₦{{ plan?.numericPrice?.toLocaleString() || '0' }}/{{
                      isAnnualBilling ? 'year' : 'month'
                    }}
                  </div>
                  <div
                    v-if="isAnnualBilling && plan.numericPrice > 0"
                    class="text-sm text-gray-600"
                  >
                    (₦{{ Math.round(plan.numericPrice / 12).toLocaleString() }}/month equivalent)
                  </div>
                  <div v-if="plan.numericPrice === 0" class="text-sm font-medium text-green-600">
                    Free forever
                  </div>
                </div>

                <!-- Selection indicator -->
                <div class="mt-3 sm:mt-auto">
                  <UButton
                    v-if="tempSelectedPlan === plan.value"
                    size="sm"
                    color="primary"
                    variant="subtle"
                    class="whitespace-nowrap"
                  >
                    Selected
                  </UButton>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>
    <template #footer>
      <div class="flex justify-end space-x-3">
        <UButton color="neutral" variant="outline" @click="showChangePlanModal = false">
          Cancel
        </UButton>
        <div class="relative">
          <!-- Use a standard button for more control over disabled state -->
          <button
            type="button"
            class="px-4 py-2 rounded-md font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            :class="{
              'bg-primary-600 text-white hover:bg-primary-700': tempSelectedPlan,
              'bg-gray-300 text-gray-500 cursor-not-allowed': !tempSelectedPlan,
              'opacity-75 cursor-wait': changePlanLoading,
            }"
            :disabled="!tempSelectedPlan || changePlanLoading"
            @click="tempSelectedPlan ? confirmPlanChange() : null"
          >
            <span
              v-if="!tempSelectedPlan"
              class="absolute -top-6 left-1/2 transform -translate-x-1/2 text-xs text-red-500 whitespace-nowrap"
            >
              Please select a plan
            </span>
            Confirm Change
          </button>
        </div>
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import DeleteModal from '~/components/DeleteModal.vue'
import { computed, onMounted } from 'vue'
import { useSubscriptionStore } from '~/store/modules/subscription'
import { useAuthStore } from '~/store/modules/auth'
import { useUserStore } from '~/store/modules/user'
import { usePaystack } from '~/composables/usePaystack'

// Access Nuxt UI's toast system
const nuxtApp = useNuxtApp()
const toast = nuxtApp.$toast
const subscriptionStore = useSubscriptionStore()
const authStore = useAuthStore()

// Track initial loading to avoid showing success toast on first load
let initialLoad = true

// Access store properties reactively
const plans = computed(() => subscriptionStore.plans)
const currentPlan = computed(() => subscriptionStore.currentPlan)
const status = computed(() => subscriptionStore.status)
const loading = computed(() => subscriptionStore.loading)
const error = computed(() => subscriptionStore.error)
const isSubscribed = computed(() => subscriptionStore.isSubscribed)
const isTrialing = computed(() => subscriptionStore.isTrialing)
const isCanceled = computed(() => subscriptionStore.isCanceled)
const isPastDue = computed(() => subscriptionStore.isPastDue)

// We'll use this in a future feature
const _trialDaysLeft = computed(() => subscriptionStore.trialDaysLeft)

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
    return currentPlan.value.name
  }
  // If there's no active subscription and no current plan, show No Active Plan
  if (!isSubscribed.value && !currentPlan.value) {
    return 'No Active Plan'
  }
  // Otherwise, show current plan name or fallback to Free Plan
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

// Methods
const refreshSubscription = async () => {
  try {
    console.log('Refreshing subscription data...')
    // Fetch plans and status separately to better handle errors
    try {
      await subscriptionStore.fetchPlans()
      console.log('Plans fetched successfully')
    } catch (planErr) {
      console.error('Error fetching plans:', planErr)
      // Continue to fetch status even if plans fail
    }

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
    if (!initialLoad) {
      if (toast) {
        toast.add({
          title: 'Updated',
          description: 'Subscription information updated',
          color: 'green',
        })
      } else {
        console.log('Toast notification system not available')
      }
    }
  } catch (err) {
    console.error('Error in refreshSubscription:', err)
    if (toast) {
      toast.add({
        title: 'Error',
        description: 'Failed to refresh subscription information',
        color: 'red',
      })
    } else {
      console.error('Toast notification system not available')
    }
  } finally {
    initialLoad = false
  }
}

// Payment method management
const addPaymentMethod = () => {
  const { processPaymentMethodVerification } = usePaystack()
  const authStore = useAuthStore()
  const { $toast } = useNuxtApp() // Get toast inside the function to ensure it's available

  // Show loading toast
  const loadingToast = $toast?.add({
    title: 'Processing',
    description: 'Opening payment modal...',
    color: 'blue',
    timeout: 0,
  })

  // Process payment with Paystack for 50 naira
  processPaymentMethodVerification({
    onSuccess: async () => {
      // Close loading toast
      if (loadingToast) loadingToast.close()

      // Show success toast
      $toast?.add({
        title: 'Payment Successful',
        description: 'Processing your payment method...',
        color: 'green',
        timeout: 3000,
      })

      try {
        // Get the payment verification response from localStorage
        // The usePaystack composable stores this after successful payment
        const paystackResponse = JSON.parse(localStorage.getItem('lastPaystackResponse') || '{}')

        console.log('Paystack response from localStorage:', paystackResponse)

        if (!paystackResponse || !paystackResponse.reference) {
          throw new Error('Payment verification failed: Missing payment reference')
        }

        // Extract card details from the response
        // We're using the mock card details stored in localStorage
        const cardDetails = {
          type: 'card',
          last4: paystackResponse.last4 || '1234', // Last 4 digits of card (mock data)
          expiryMonth: paystackResponse.exp_month || '12',
          expiryYear: paystackResponse.exp_year || '2025',
          brand: paystackResponse.card_type || 'Visa',
          providerId: paystackResponse.reference,
          metadata: {
            email: authStore.user?.email,
            authorization_code: paystackResponse.authorization_code || '',
            status: paystackResponse.status || 'success',
            message: paystackResponse.message || 'Transaction successful',
          },
        }

        console.log('Creating payment method with card details:', cardDetails)

        // Add payment method to the database
        await subscriptionStore.addPaymentMethod(paystackResponse.reference, cardDetails)

        // Refresh payment methods
        await refreshSubscription()

        // Show success toast
        $toast?.add({
          title: 'Success',
          description: 'Payment method added successfully',
          color: 'green',
        })
      } catch (error) {
        console.error('Error adding payment method:', error)
        $toast?.add({
          title: 'Error',
          description: error.message || 'Failed to add payment method',
          color: 'red',
        })
      }
    },
    onError: error => {
      // Close loading toast
      if (loadingToast) loadingToast.close()

      console.error('Payment error:', error)
      $toast?.add({
        title: 'Payment Failed',
        description: error.message || 'An error occurred during payment',
        color: 'red',
      })
    },
  })
}

// State for payment method removal modal
const showRemovePaymentMethodModal = ref(false)
const removePaymentMethodLoading = ref(false)
const paymentMethodToRemove = ref(null)

// Open the payment method removal modal
const removePaymentMethod = id => {
  paymentMethodToRemove.value = id
  showRemovePaymentMethodModal.value = true
}

// Confirm payment method removal
const confirmRemovePaymentMethod = async () => {
  const { $toast } = useNuxtApp() // Get toast inside the function to ensure it's available
  removePaymentMethodLoading.value = true

  try {
    // Show loading toast
    const loadingToast = $toast?.add({
      title: 'Processing',
      description: 'Removing payment method...',
      color: 'blue',
      timeout: 0,
    })

    console.log('Removing payment method with ID:', paymentMethodToRemove.value)

    // Call the API to remove the payment method
    await subscriptionStore.removePaymentMethod(paymentMethodToRemove.value)

    // Close loading toast
    if (loadingToast) loadingToast.close()

    // Refresh payment methods
    await refreshSubscription()

    // Show success toast
    $toast?.add({
      title: 'Success',
      description: 'Payment method removed successfully',
      color: 'green',
    })
  } catch (error) {
    console.error('Error removing payment method:', error)
    $toast?.add({
      title: 'Error',
      description: error.message || 'Failed to remove payment method',
      color: 'red',
    })
  } finally {
    removePaymentMethodLoading.value = false
    showRemovePaymentMethodModal.value = false
    paymentMethodToRemove.value = null
  }
}

// Invoice viewing
const viewInvoice = id => {
  // This would typically open a modal with invoice details or download a PDF
  // For now, we'll just show a toast
  $toast.add({
    title: 'Coming Soon',
    description: `Invoice viewing for ID: ${id} will be available soon`,
    color: 'blue',
  })
}

// Change Plan Modal State
const showChangePlanModal = ref(false)
const isAnnualBilling = ref(false)
const tempSelectedPlan = ref('')
const modalRefreshKey = ref(0)
const changePlanLoading = ref(false)

// Toggle billing period
function toggleBilling() {
  isAnnualBilling.value = !isAnnualBilling.value
  modalRefreshKey.value++ // Force refresh of modal content
}

// Get monthly and annual plans from the store
const monthlyPlans = computed(() => {
  console.log(
    'Monthly plans filtering:',
    plans.value.map(p => `${p.name} (${p.id}): interval=${p.interval}, price=${p.price}`)
  )
  return plans.value.filter(plan => {
    // Handle different interval naming conventions (monthly, month)
    const isMonthly = plan.interval === 'month' || plan.interval === 'monthly'
    return isMonthly && plan.price > 0
  })
})

const annualPlans = computed(() => {
  console.log(
    'Annual plans filtering:',
    plans.value.map(p => `${p.name} (${p.id}): interval=${p.interval}, price=${p.price}`)
  )
  return plans.value.filter(plan => {
    // Handle different interval naming conventions (annual, year, yearly)
    const isAnnual =
      plan.interval === 'year' || plan.interval === 'annual' || plan.interval === 'yearly'
    return isAnnual && plan.price > 0
  })
})

// Displayed plans for the modal
const displayedPlans = computed(() => {
  // Select the correct set of plans based on the current billing period
  const plansList = isAnnualBilling.value ? annualPlans.value : monthlyPlans.value

  console.log(
    `Selected ${isAnnualBilling.value ? 'annual' : 'monthly'} plans for display:`,
    plansList
  )

  // Format plans for display
  const formattedPlans = plansList
    .map(plan => {
      // Safely access nested properties with proper fallbacks
      const planFeatures = Array.isArray(plan.features) ? plan.features : []
      const planLimits = plan.limits || {}

      return {
        id: String(plan.id),
        value: String(plan.id), // Use the numeric ID as the value instead of the plan name
        name: plan.name.toLowerCase(), // Keep the name for reference
        label: plan.name,
        description: plan.description || '',
        price: `₦${Number(plan.price).toLocaleString()}/${isAnnualBilling.value ? 'year' : 'month'}`,
        numericPrice: Number(plan.price),
        features: planFeatures,
        maxClients: planLimits.clients || plan.maxClients || 0,
        interval: plan.interval,
        isFeatured: plan.isFeatured || false,
      }
    })
    .sort((a, b) => (a.numericPrice || 0) - (b.numericPrice || 0))

  console.log('Formatted plans for display:', formattedPlans)
  return formattedPlans
})

// Toggle modal function
const showChangePlanDialog = () => {
  // Set the initial billing period based on current subscription
  isAnnualBilling.value = status.value?.interval === 'year'
  // Show the modal
  showChangePlanModal.value = true
  // Force refresh of modal content
  modalRefreshKey.value++
}

// Watch for modal open to set the selected plan
watch(showChangePlanModal, newVal => {
  if (newVal) {
    // Initialize tempSelectedPlan with current plan value when modal opens
    tempSelectedPlan.value = currentPlan.value?.name?.toLowerCase() || 'growth'
  }
})

// Watch for billing toggle changes to update the display
watch(isAnnualBilling, () => {
  modalRefreshKey.value++ // Force refresh of modal content
})

// Handle plan change confirmation
const confirmPlanChange = async () => {
  try {
    if (!tempSelectedPlan.value) return

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
                name: userStore.profile.name || '',
              }
            } else {
              authStore.user.email = userStore.profile.email
            }
          }
        }
      } catch (refreshError) {
        console.error('Error during session refresh:', refreshError)
      }

      // Final check after all attempts
      if (!authStore.user || !authStore.user.email) {
        throw new Error(
          'Unable to retrieve your email address. Please try logging out and back in.'
        )
      }
    }

    console.log('User email available:', authStore.user.email)

    // Find the selected plan details
    const selectedPlan = displayedPlans.value.find(plan => plan.value === tempSelectedPlan.value)
    if (!selectedPlan) {
      throw new Error('Selected plan not found')
    }

    // Get the price based on the billing interval and extract the numeric value
    const priceString = selectedPlan.price
    console.log('Raw plan price:', priceString, 'for plan:', selectedPlan.label)

    // Extract numeric value from formatted price string (e.g., "₦3,000/month" -> 3000)
    let amount = 0
    if (typeof priceString === 'string') {
      // Remove currency symbol, commas, and any text after numbers
      const numericString = priceString.replace(/[^0-9.]/g, '')
      amount = parseFloat(numericString)
    } else if (typeof priceString === 'number') {
      amount = priceString
    }

    // Ensure amount is a valid positive number
    if (isNaN(amount) || amount <= 0) {
      console.error('Could not extract valid price from:', priceString, 'for plan:', selectedPlan)
      throw new Error(
        'The selected plan has an invalid price format. Please try a different plan or contact support.'
      )
    }

    console.log('Extracted payment amount:', amount, 'for plan:', selectedPlan.label)

    // Use Paystack for payment processing
    const { processPayment } = usePaystack()

    // Close the modal first
    showChangePlanModal.value = false

    // Process payment with Paystack
    // We're now using the numeric ID directly as the plan value
    console.log(
      'Using plan ID for payment:',
      tempSelectedPlan.value,
      'for plan:',
      selectedPlan.label
    )

    processPayment({
      amount, // This is now guaranteed to be a valid positive number
      planId: tempSelectedPlan.value, // This is already the numeric ID
      planName: selectedPlan.label,
      billingPeriod: isAnnualBilling.value ? 'year' : 'month',
      onSuccess: async () => {
        // Payment successful, now change the plan
        try {
          // Call the API to change the plan
          await subscriptionStore.changePlan({
            planId: tempSelectedPlan.value,
            billingInterval: isAnnualBilling.value ? 'year' : 'month',
          })

          // Show success message
          if (toast) {
            toast.add({
              title: 'Plan Changed',
              description: 'Your subscription plan has been updated successfully',
              color: 'success',
            })
          }

          // Refresh subscription status
          await subscriptionStore.fetchSubscriptionStatus()
        } catch (error) {
          console.error('Error changing plan after payment:', error)
          if (toast) {
            toast.add({
              title: 'Error',
              description: 'Payment was successful but plan update failed. Please contact support.',
              color: 'error',
            })
          }
        } finally {
          changePlanLoading.value = false
        }
      },
      onError: error => {
        console.error('Payment error:', error)
        if (toast) {
          toast.add({
            title: 'Payment Failed',
            description: 'Failed to process payment. Please try again.',
            color: 'error',
          })
        }
        changePlanLoading.value = false
      },
    })
  } catch (_error) {
    if (toast) {
      toast.add({
        title: 'Error',
        description: 'Failed to change plan. Please try again.',
        color: 'error',
      })
    } else {
      console.error('Toast notification system not available')
    }
  } finally {
    changePlanLoading.value = false
  }
}

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
    $toast.add({
      title: 'Subscription Canceled',
      description: 'Your subscription has been canceled',
      color: 'success',
    })
  } catch (_err) {
    $toast.add({
      title: 'Error',
      description: 'Failed to cancel subscription',
      color: 'red',
    })
  }
}

const reactivateSubscription = async () => {
  try {
    await subscriptionStore.reactivateSubscription()
    $toast.add({
      title: 'Subscription Reactivated',
      description: 'Your subscription has been reactivated',
      color: 'green',
    })
  } catch (_err) {
    $toast.add({
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
      $toast.error('Please log in to view your subscription details')
      return
    }

    console.log('Auth token available:', !!authStore.token)
    console.log('Auth headers:', authStore.getAuthHeaders())

    // Refresh subscription data
    await refreshSubscription()
  } catch (err) {
    console.error('Error initializing billing form:', err)
    $toast.error(`Error loading subscription data: ${err?.message || 'Unknown error'}`)
  }
})
</script>
