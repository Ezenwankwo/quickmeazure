<template>
  <div class="subscription-confirm-page">
    <div class="max-w-3xl w-full space-y-8 bg-white py-8 px-4 rounded-xl shadow">
      <div class="text-center">
        <h2 class="text-2xl md:text-3xl font-bold text-gray-900">Confirm Your Plan</h2>
        <p class="mt-2 text-gray-600">Confirm your subscription plan to continue.</p>
      </div>
      
      <!-- Selected Plan Card -->
      <div v-if="selectedPlan" class="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div class="p-6">
          <div class="flex justify-between items-center">
            <div>
              <h3 class="text-2xl font-bold">{{ selectedPlan.label || 'Free Plan' }}</h3>
            </div>
            <div class="text-right">
              <div class="text-xl font-bold">{{ selectedPlan.price || '₦0' }}</div>
            </div>
          </div>
          <p class="text-gray-600 mt-1">{{ selectedPlan.description || 'Basic features for small businesses' }}</p>
          
          <div class="mt-6">
            <h4 class="font-medium mb-2">Plan Features:</h4>
            <ul class="space-y-2">
              <li v-for="feature in (selectedPlan?.features || [])" :key="feature" class="flex items-center">
                <UIcon name="i-heroicons-check-circle" class="text-green-500 mr-2" />
                <span>{{ feature }}</span>
              </li>
              <li v-if="!selectedPlan?.features || selectedPlan.features.length === 0" class="flex items-center">
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
              @click="toggleChangePlanModal"
            >
              Change Plan
            </UButton>
          </div>
        </div>
      </div>
      
      <!-- Continue Button -->
      <div class="flex justify-end mt-6">
        <template v-if="selectedPlan.numericPrice > 0">
          <PaystackButton
            :amount="selectedPlan.numericPrice"
            :plan-id="selectedPlan.id"
            :plan-name="selectedPlan.label"
            :billing-period="billingPeriod"
            size="lg"
            @success="onPaymentSuccess"
          >
            Make Payment
          </PaystackButton>
        </template>
        <template v-else>
          <UButton
            color="primary"
            :loading="isProcessing"
            size="lg"
            @click="skipPayment"
          >
            Continue
          </UButton>
        </template>
      </div>
    </div>
  </div>
  
  <!-- Change Plan Modal (using v-model:open) -->
  <UModal v-model:open="showChangePlanModal" title="Select a Different Plan">
    <template #body>
      <div class="space-y-6">
      
      <!-- Billing Toggle -->
      <div class="flex justify-center items-center gap-4 mb-4">
        <span :class="{ 'font-semibold': !isAnnualBilling, 'text-gray-500': isAnnualBilling }">Monthly</span>
        <button 
          @click="toggleBilling" 
          class="relative inline-flex h-6 w-12 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none"
          :class="{ 'bg-primary-600': isAnnualBilling, 'bg-gray-300': !isAnnualBilling }"
          role="switch"
          type="button"
          aria-checked="false"
        >
          <span 
            class="inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out"
            :class="{ 'translate-x-6': isAnnualBilling, 'translate-x-0': !isAnnualBilling }"
          ></span>
        </button>
        <span :class="{ 'font-semibold': isAnnualBilling, 'text-gray-500': !isAnnualBilling }">Annual</span>
        <span v-if="isAnnualBilling" class="text-sm bg-primary-100 text-primary-800 py-1 px-2 rounded-full">Save 15%</span>
      </div>
      
      <!-- Plan Options -->
      <div class="space-y-4" :key="'plan-options-' + modalRefreshKey">
        <div 
          v-for="plan in displayedPlans" 
          :key="plan.value"
          class="border border-gray-200 rounded-lg p-4 cursor-pointer hover:border-primary-500 transition-colors"
          :class="{ 'border-primary-500 bg-primary-50': tempSelectedPlan === plan.value }"
          @click="tempSelectedPlan = plan.value"
        >
          <div class="flex flex-col md:flex-row md:justify-between md:items-start gap-3">
            <div>
              <div class="flex items-center gap-2">
                <h4 class="text-lg font-medium">{{ plan.label }}</h4>
                <UBadge v-if="plan.value === 'professional'" color="primary" size="xs">Popular</UBadge>
              </div>
              <p class="text-base text-gray-600 mt-1">{{ plan.description }}</p>
              <ul class="mt-2 space-y-1">
                <li v-for="(feature, index) in plan.features?.slice(0,3)" :key="index" class="text-sm text-gray-700 flex items-center">
                  <UIcon name="i-heroicons-check-circle" class="text-green-500 mr-1 flex-shrink-0" size="sm" />
                  <span>{{ feature }}</span>
                </li>
                <li v-if="plan.features?.length > 3" class="text-sm text-gray-700">
                  <UIcon name="i-heroicons-plus-circle" class="text-gray-500 mr-1" size="xs" />
                  <span>{{ plan.features.length - 3 }} more features</span>
                </li>
              </ul>
            </div>
            <div class="text-right md:min-w-[120px]">
              <div class="font-bold text-lg">₦{{ plan?.numericPrice?.toLocaleString() || '0' }}/{{ isAnnualBilling ? 'year' : 'month' }}</div>
              <UButton 
                v-if="tempSelectedPlan !== plan.value"
                size="sm" 
                color="primary" 
                variant="ghost" 
                class="mt-2"
                @click.stop="tempSelectedPlan = plan.value"
              >
                Select
              </UButton>
              <UBadge 
                v-else 
                color="primary" 
                variant="subtle" 
                class="mt-2"
              >
                Selected
              </UBadge>
            </div>
          </div>
        </div>
      </div>
    </div>
    </template>
    
    <template #footer>
      <div class="w-full flex justify-end gap-3" style="display: flex; justify-content: flex-end;">
        <UButton
          color="neutral"
          variant="outline"
          @click="showChangePlanModal = false"
        >
          Cancel
        </UButton>
        
        <UButton
          color="primary"
          @click="changePlan"
          :disabled="!tempSelectedPlan"
        >
          Confirm Plan
        </UButton>
      </div>
    </template>
  </UModal>
</template>

<script setup>
import { ref, computed, watch, nextTick } from 'vue';
import { monthlyPlans, annualPlans } from '~/data/subscription-plans';
import { usePaystack } from '~/composables/usePaystack';
import { useSubscriptionManagement } from '~/composables/useSubscriptionManagement';

// Add toast composable
const toast = useToast();
// Add paystack composable
const { processPayment } = usePaystack();
// Add subscription management
const { loadSubscription, createSubscription } = useSubscriptionManagement();

// Set page metadata
useHead({
  title: 'Confirm Subscription - QuickMeazure',
});

// Set layout for this page
definePageMeta({
  layout: 'subscription',
  middleware: 'subscription'
});

const route = useRoute();

// Create a computed property for subscription plans based on the imported plan data
const subscriptionPlans = computed(() => {
  // Use the appropriate plans based on billing period
  const plansData = billingPeriod.value === 'annual' ? annualPlans : monthlyPlans;
  
  return plansData.map(plan => ({
    id: plan.id,
    value: plan.name.toLowerCase(),
    label: plan.name,
    description: plan.description,
    price: `₦${plan.price.toLocaleString()}/${billingPeriod.value === 'annual' ? 'year' : 'month'}`,
    numericPrice: plan.price,
    features: plan.features,
    maxClients: plan.maxClients,
    interval: plan.interval
  }));
});

// Get plan from URL query params or use free as default
const planType = ref(route.query.plan || 'growth');
const billingPeriod = ref(route.query.billing || 'monthly');

// Form state
const isProcessing = ref(false);

// Find the selected plan from subscription plans
const selectedPlan = computed(() => {
  const planId = planType.value.includes('-')
    ? planType.value.split('-')[0]
    : planType.value;
    
  return subscriptionPlans.value.find(plan => plan.value === planId) || subscriptionPlans.value[0];
});

// Initialize tempSelectedPlan with current plan value
const tempSelectedPlan = ref(selectedPlan.value?.value || 'growth');


// Continue to dashboard with selected plan
const skipPayment = async () => {
  // If plan has a price, process payment with Paystack
  if (selectedPlan.value?.numericPrice > 0) {
    processPaystackPayment();
    return;
  }
  
  // Otherwise continue with free plan
  isProcessing.value = true;
  
  try {
    // Create a subscription object for free/growth plan users
    const result = await createSubscription({
      planId: selectedPlan.value.id,
      planName: selectedPlan.value.label,
      billingPeriod: billingPeriod.value
    });
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to create subscription');
    }
    
    // Show success message
    toast.add({
      title: 'Plan Selected',
      description: `You have selected the ${selectedPlan.value.label} plan!`,
      color: 'primary'
    });
    
    navigateTo('/settings/measurements');
  } catch (error) {
    console.error('Error:', error);
    
    // Show error toast
    toast.add({
      title: 'Error',
      description: error.message || 'Failed to set up your subscription. Please try again.',
      color: 'red'
    });
  } finally {
    isProcessing.value = false;
  }
};

// Handle successful payment
const onPaymentSuccess = async () => {
  // Reload subscription data
  await loadSubscription();
  
  // Navigate to setup measurements after successful subscription
  navigateTo('/auth/setup-measurements');
};

// Process payment with Paystack
const processPaystackPayment = () => {
  isProcessing.value = true;
  
  processPayment({
    amount: selectedPlan.value.numericPrice,
    planId: selectedPlan.value.id,
    planName: selectedPlan.value.label,
    billingPeriod: billingPeriod.value,
    onSuccess: () => {
      // Payment successful
      toast.add({
        title: 'Payment Successful',
        description: `Your payment for the ${selectedPlan.value.label} plan was successful!`,
        color: 'primary'
      });
      
      // Navigate to dashboard
      navigateTo('/auth/setup-measurements');
    },
    onError: (error) => {
      // Payment failed
      console.error('Payment error:', error);
      
      toast.add({
        title: 'Payment Failed',
        description: 'The payment was not successful. Please try again.',
        color: 'red'
      });
      
      isProcessing.value = false;
    }
  });
};

// Change Plan Modal
const showChangePlanModal = ref(false);

// Toggle modal function
const toggleChangePlanModal = () => {
  showChangePlanModal.value = !showChangePlanModal.value;
};

const isAnnualBilling = ref(billingPeriod.value === 'annual');

// Add a modal refresh key
const modalRefreshKey = ref(0);

// Toggle billing function - completely reset modal display
const toggleBilling = () => {
  isAnnualBilling.value = !isAnnualBilling.value;
  // Force Vue to completely re-render by changing the key
  modalRefreshKey.value++;
};

const changePlan = () => {
  if (!tempSelectedPlan.value) return;
  
  // Update the plan type and billing period
  planType.value = tempSelectedPlan.value;
  billingPeriod.value = isAnnualBilling.value ? 'annual' : 'monthly';
  
  // Update the URL query parameters without refreshing the page
  const query = { 
    ...route.query,
    plan: planType.value,
    billing: billingPeriod.value
  };
  
  // Use router.replace to update the URL without refreshing
  navigateTo({
    path: route.path,
    query
  }, { replace: true });
  
  // Get the updated selected plan
  const newPlan = subscriptionPlans.value.find(p => p.value === tempSelectedPlan.value);

  
  // Close the modal
  showChangePlanModal.value = false;
  
  // Show a confirmation message
  toast.add({
    title: 'Plan Changed',
    description: `You've selected the ${newPlan ? newPlan.label : tempSelectedPlan.value} plan.`,
    color: 'primary'
  });
};

// Get selected temp plan
const getSelectedTempPlan = computed(() => {
  const planId = tempSelectedPlan.value.includes('-')
    ? tempSelectedPlan.value.split('-')[0]
    : tempSelectedPlan.value;
    
  return subscriptionPlans.value.find(plan => plan.value === planId) || subscriptionPlans.value[0];
});

// Displayed plans - show all plans including free
const displayedPlans = computed(() => {
  // Select the correct set of plans based on the current billing period
  const plansList = isAnnualBilling.value ? annualPlans : monthlyPlans;
  
  // Format plans for display
  return plansList.map(plan => ({
    id: plan.id,
    value: plan.name.toLowerCase(),
    label: plan.name,
    description: plan.description,
    price: `₦${plan.price.toLocaleString()}/${isAnnualBilling.value ? 'year' : 'month'}`,
    numericPrice: plan.price,
    features: plan.features,
    maxClients: plan.maxClients,
    interval: plan.interval
  })).sort((a, b) => (a.numericPrice || 0) - (b.numericPrice || 0));
});

// Add this line to debug the plans when the modal opens
watch(showChangePlanModal, (newVal) => {
  if (newVal) {
    // Initialize tempSelectedPlan with current plan value when modal opens
    tempSelectedPlan.value = selectedPlan.value?.value || 'growth';
  }
});

// Watch for billing toggle changes to update the temp selected plan
watch(isAnnualBilling, () => {
  // Extract the base plan name without billing period suffix
  const currentPlanBase = tempSelectedPlan.value.split('-')[0];
  
  // Find the equivalent plan in the current plans list (based on the name)
  const currentPlans = isAnnualBilling.value ? annualPlans : monthlyPlans;
  const matchingPlan = currentPlans.find(p => 
    p.name.toLowerCase() === currentPlanBase.toLowerCase()
  );
  
  if (matchingPlan) {
    tempSelectedPlan.value = matchingPlan.name.toLowerCase();
  }
});
</script>

<style scoped>
/* Hide all navigation elements */
.subscription-confirm-page :deep(nav),
.subscription-confirm-page :deep(header),
.subscription-confirm-page :deep([class*="navigation"]),
.subscription-confirm-page :deep([class*="nav-"]),
.subscription-confirm-page :deep([class*="-nav"]) {
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