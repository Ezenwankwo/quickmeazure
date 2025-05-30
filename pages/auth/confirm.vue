<template>
  <div class="confirm-page-wrapper">
    <div class="flex min-h-screen flex-col items-center justify-center bg-gray-50 space-y-6">
      <!-- Signup Steps - First Item -->
      <div class="max-w-3xl w-full mb-6">
        <SignupSteps :current-step="2" />
      </div>

      <!-- Title and Subtitle - Outside Card -->
      <div class="text-center mb-6 w-full max-w-3xl">
        <h2 class="text-2xl md:text-3xl font-bold text-gray-900">Confirm Your Plan</h2>
        <p class="mt-2 text-gray-600">Confirm your subscription plan to continue.</p>
      </div>

      <div class="max-w-3xl w-full space-y-6 bg-white p-4 sm:py-8 rounded-xl shadow">
        <!-- Selected Plan Card -->
        <div v-if="selectedPlan" class="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div class="p-6">
            <div class="flex justify-between items-center">
              <div>
                <h3 class="text-2xl font-bold">
                  {{ selectedPlan.label || 'Free Plan' }}
                </h3>
              </div>
              <div class="text-right">
                <div class="text-xl font-bold">
                  {{ selectedPlan.price || '₦0' }}
                </div>
              </div>
            </div>
            <p class="text-gray-600 mt-1">
              {{ selectedPlan.description || 'Basic features for small businesses' }}
            </p>

            <div class="mt-6">
              <h4 class="font-medium mb-2">Plan Features:</h4>
              <ul class="space-y-2">
                <li
                  v-for="feature in selectedPlan?.features || []"
                  :key="feature"
                  class="flex items-center"
                >
                  <UIcon name="i-heroicons-check-circle" class="text-green-500 mr-2" />
                  <span>{{ feature }}</span>
                </li>
                <li
                  v-if="!selectedPlan?.features || selectedPlan.features.length === 0"
                  class="flex items-center"
                >
                  <UIcon name="i-heroicons-check-circle" class="text-green-500 mr-2" />
                  <span>Basic plan features</span>
                </li>
              </ul>
            </div>

            <!-- Change Plan Button -->
            <div class="mt-6 flex justify-end">
              <UButton
                size="sm"
                color="gray"
                variant="ghost"
                icon="i-heroicons-pencil-square"
                aria-label="Change subscription plan"
                class="text-xs sm:text-sm"
                @click="toggleChangePlanModal"
              >
                Change Plan
              </UButton>
            </div>
          </div>
        </div>

        <!-- Continue Button with clear indication -->
        <div class="mt-8 border-t border-gray-200 pt-6">
          <div
            v-if="selectedPlan.numericPrice === 0"
            class="bg-green-50 p-4 rounded-lg mb-4 border border-green-100"
          >
            <div class="flex items-start">
              <UIcon
                name="i-heroicons-check-circle"
                class="text-green-500 mr-2 mt-0.5 flex-shrink-0"
              />
              <div>
                <h4 class="font-medium text-green-800">Free Plan Selected</h4>
                <p class="text-sm text-green-700 mt-1">
                  You've selected the free plan. No payment is required to continue.
                </p>
              </div>
            </div>
          </div>

          <div class="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div class="text-sm text-gray-600 order-2 sm:order-1">
              <p>You can change your plan at any time from your account settings.</p>
            </div>

            <div class="order-1 sm:order-2 w-full sm:w-auto">
              <template v-if="selectedPlan.numericPrice > 0">
                <PaystackButton
                  :amount="selectedPlan.numericPrice"
                  :plan-id="selectedPlan.id"
                  :plan-name="selectedPlan.label"
                  :billing-period="billingPeriod"
                  size="lg"
                  class="w-full sm:w-auto"
                  @success="onPaymentSuccess"
                  @error="onPaymentError"
                >
                  Make Payment (₦{{ selectedPlan.numericPrice.toLocaleString() }})
                </PaystackButton>
              </template>
              <template v-else>
                <UButton
                  color="primary"
                  :loading="isProcessing"
                  size="lg"
                  class="w-full sm:w-auto"
                  @click="skipPayment"
                >
                  Continue with Free Plan
                </UButton>
              </template>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Change Plan Modal -->
    <PlanSelectionModal
      v-model="showChangePlanModal"
      v-model:selected-plan="tempSelectedPlan"
      title="Select a Different Plan"
      confirm-button-text="Change Plan"
      :default-billing-period="billingPeriod.value"
      @confirm="changePlan"
      @close="onPlanModalClose"
      @error="handlePlanFetchError"
    />
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick as _nextTick } from 'vue'
import { monthlyPlans, annualPlans } from '~/data/subscription-plans'
import { usePaystack } from '~/composables/usePaystack'
import { useSubscriptionManagement } from '~/composables/useSubscriptionManagement'
import PlanSelectionModal from '~/components/plans/PlanSelectionModal.vue'

// Add toast composable
const toast = useToast()
// Add paystack composable
const { processPayment } = usePaystack()
// Add subscription management
const { loadSubscription: _loadSubscription, createSubscription } = useSubscriptionManagement()

// Set page metadata
useHead({
  title: 'Confirm Plan',
})

// Set layout for this page
definePageMeta({
  layout: 'subscription',
  middleware: 'subscription',
})

const route = useRoute()

// Create a computed property for subscription plans based on the imported plan data
const subscriptionPlans = computed(() => {
  // Use the appropriate plans based on billing period
  const plansData = billingPeriod.value === 'annual' ? annualPlans : monthlyPlans

  return plansData.map(plan => ({
    id: plan.id,
    value: plan.name.toLowerCase(),
    label: plan.name,
    description: plan.description,
    price: `₦${plan.price.toLocaleString()}/${billingPeriod.value === 'annual' ? 'year' : 'month'}`,
    numericPrice: plan.price,
    features: plan.features,
    maxClients: plan.maxClients,
    interval: plan.interval,
  }))
})

// Get plan from URL query params or use free as default
const planType = ref(route.query.plan || 'growth')
const billingPeriod = ref(route.query.billing || 'monthly')

// Form state
const isProcessing = ref(false)

// Find the selected plan from subscription plans
const selectedPlan = computed(() => {
  const planId = planType.value.includes('-') ? planType.value.split('-')[0] : planType.value

  return subscriptionPlans.value.find(plan => plan.value === planId) || subscriptionPlans.value[0]
})

// Initialize tempSelectedPlan with current plan value
const tempSelectedPlan = ref(selectedPlan.value?.value || 'growth')

// Continue to dashboard with selected plan
const skipPayment = async () => {
  // If plan has a price, process payment with Paystack
  if (selectedPlan.value?.numericPrice > 0) {
    processPaystackPayment()
    return
  }

  // Otherwise continue with free plan
  isProcessing.value = true

  try {
    // Create a subscription object for free/growth plan users
    const result = await createSubscription({
      planId: selectedPlan.value.id,
      planName: selectedPlan.value.label,
      billingPeriod: billingPeriod.value,
    })

    if (!result.success) {
      throw new Error(result.error || 'Failed to create subscription')
    }

    // Show success message
    toast.add({
      title: 'Plan Selected',
      description: `You have selected the ${selectedPlan.value.label} plan!`,
      color: 'primary',
    })

    navigateTo('/auth/setup-measurements')
  } catch (error) {
    console.error('Error:', error)

    // Show error toast
    toast.add({
      title: 'Error',
      description: error.message || 'Failed to set up your subscription. Please try again.',
      color: 'red',
    })
  } finally {
    isProcessing.value = false
  }
}

// Handle successful payment
function onPaymentSuccess(response) {
  console.log('Payment successful', response)
  toast.success('Payment successful! Redirecting to next step...')
  // Redirect to setup measurements
  router.push('/auth/setup-measurements')
}

// Handle payment errors
function onPaymentError(error) {
  console.error('Payment failed', error)
  toast.error('Payment failed. Please try again or choose another payment method.')
  isProcessing.value = false
}

// Process payment with Paystack
async function processPaystackPayment() {
  try {
    isProcessing.value = true

    // Create subscription first
    const subscriptionData = {
      planId: selectedPlan.value.id,
      billingPeriod: billingPeriod.value,
      amount: selectedPlan.value.numericPrice,
    }

    const { data: subscription } = await createSubscription(subscriptionData)

    // Process payment
    const paymentData = {
      amount: selectedPlan.value.numericPrice,
      email: user.value.email,
      metadata: {
        subscriptionId: subscription.id,
        planId: selectedPlan.value.id,
        planName: selectedPlan.value.label,
        billingPeriod: billingPeriod.value,
      },
    }

    const paymentResponse = await processPayment(paymentData)
    console.log('Payment response:', paymentResponse)

    // Show success message
    toast.success('Payment successful! Continuing to next step...')

    // Redirect to setup measurements
    router.push('/auth/setup-measurements')
  } catch (error) {
    console.error('Error processing payment:', error)

    // Show detailed error message based on error type
    if (error.response && error.response.data && error.response.data.message) {
      toast.error(`Payment error: ${error.response.data.message}`)
    } else if (error.message) {
      toast.error(`Payment error: ${error.message}`)
    } else {
      toast.error(
        'There was an error processing your payment. Please try again or contact support.'
      )
    }

    // Provide recovery options
    toast.info('You can try again or select a different plan.')
  } finally {
    isProcessing.value = false
  }
}

// Change Plan Modal
const showChangePlanModal = ref(false)

// Toggle modal function
const toggleChangePlanModal = () => {
  showChangePlanModal.value = !showChangePlanModal.value
}

// Billing period is now handled by the PlanSelectionModal
const _isAnnualBilling = ref(billingPeriod.value === 'annual')

// Handle modal close
const onPlanModalClose = () => {
  showChangePlanModal.value = false
}

const changePlan = () => {
  if (!tempSelectedPlan.value) return

  // Update the plan type and billing period
  planType.value = tempSelectedPlan.value
  const isAnnual = tempSelectedPlan.value.includes('yearly')
  billingPeriod.value = isAnnual ? 'annual' : 'monthly'

  // Update the URL query parameters without refreshing the page
  const query = {
    ...route.query,
    plan: planType.value,
    billing: billingPeriod.value,
  }

  // Use router.replace to update the URL without refreshing
  navigateTo(
    {
      path: route.path,
      query,
    },
    { replace: true }
  )

  // Get the updated selected plan
  const newPlan = subscriptionPlans.value.find(p => p.value === tempSelectedPlan.value)

  // Close the modal
  showChangePlanModal.value = false

  // Show a confirmation message
  toast.add({
    title: 'Plan Changed',
    description: `You've selected the ${newPlan ? newPlan.label : tempSelectedPlan.value} plan.`,
    color: 'primary',
  })
}

// Get selected temp plan
const _getSelectedTempPlan = computed(() => {
  if (!tempSelectedPlan.value) return monthlyPlans[0]
  const planId = tempSelectedPlan.value.includes('-')
  return monthlyPlans.find(p => p.value === planId) || monthlyPlans[0]
})

// Handle plan fetch errors
const handlePlanFetchError = error => {
  useToast().add({
    title: 'Error',
    description: error?.message || 'Failed to load plans. Please try again later.',
    color: 'red',
  })
}

// Watch for modal open to initialize the selected plan
watch(showChangePlanModal, newVal => {
  if (newVal) {
    // Initialize tempSelectedPlan with current plan value when modal opens
    tempSelectedPlan.value = selectedPlan.value?.value || 'growth'
  }
})
</script>

<style scoped>
/* Hide all navigation elements */
.subscription-confirm-page :deep(nav),
.subscription-confirm-page :deep(header),
.subscription-confirm-page :deep([class*='navigation']),
.subscription-confirm-page :deep([class*='nav-']),
.subscription-confirm-page :deep([class*='-nav']) {
  display: none !important;
}

/* Ensure content takes full viewport */
:global(html),
:global(body),
:global(#__nuxt) {
  height: 100%;
  margin: 0;
  padding: 0;
}

.subscription-confirm-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
}
</style>
