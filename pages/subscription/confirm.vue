<template>
  <div class="min-h-[calc(100vh-80px)] flex items-center justify-center py-12">
    <div class="max-w-3xl w-full space-y-8 bg-white p-8 rounded-xl shadow">
      <div class="text-center">
        <h2 class="text-2xl md:text-3xl font-bold text-gray-900">Confirm Your Plan</h2>
        <p class="mt-2 text-gray-600">You're almost there! Confirm your subscription plan to continue.</p>
      </div>
      
      <!-- Selected Plan Card -->
      <div v-if="selectedPlan" class="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div v-if="selectedPlan.value === 'standard'" class="bg-primary-500 text-white text-center py-2 text-sm font-medium">
          MOST POPULAR
        </div>
        
        <div class="p-6">
          <div class="flex justify-between items-start">
            <div>
              <h3 class="text-xl font-bold">{{ selectedPlan.label || 'Free Plan' }}</h3>
              <p class="text-gray-600 mt-1">{{ selectedPlan.description || 'Basic features for small businesses' }}</p>
            </div>
            <div class="text-right">
              <div class="text-2xl font-bold">{{ selectedPlan.price || '₦0' }}</div>
              <div class="text-sm text-gray-500">{{ billingPeriod === 'annual' ? 'per year' : 'per month' }}</div>
            </div>
          </div>
          
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
      
      <!-- Payment Section (only for paid plans) -->
      <div v-if="selectedPlan.numericPrice > 0" class="space-y-6">
        <div class="border-t border-gray-200 pt-6">
          <h3 class="text-lg font-medium mb-4">Payment Details</h3>
          
          <form @submit.prevent="processPayment" class="space-y-4">
            <!-- Payment Methods -->
            <UFormField label="Payment Method" required>
              <URadioGroup v-model="paymentMethod" :options="paymentMethods" />
            </UFormField>
            
            <!-- Card Details (only show if card is selected) -->
            <div v-if="paymentMethod === 'card'" class="space-y-4">
              <UFormField label="Card Number" required>
                <UInput v-model="cardDetails.number" placeholder="1234 5678 9012 3456" />
              </UFormField>
              
              <div class="grid grid-cols-2 gap-4">
                <UFormField label="Expiry Date" required>
                  <UInput v-model="cardDetails.expiry" placeholder="MM/YY" />
                </UFormField>
                
                <UFormField label="CVC" required>
                  <UInput v-model="cardDetails.cvc" placeholder="123" type="password" />
                </UFormField>
              </div>
              
              <UFormField label="Name on Card" required>
                <UInput v-model="cardDetails.name" placeholder="John Doe" />
              </UFormField>
            </div>
            
            <!-- Bank Transfer Details (only show if bank transfer is selected) -->
            <div v-if="paymentMethod === 'bank'" class="p-4 bg-gray-50 rounded-lg">
              <h4 class="font-medium mb-2">Bank Transfer Details</h4>
              <p class="text-sm text-gray-600 mb-2">Please make a transfer to the following account:</p>
              <div class="space-y-1 text-sm">
                <div class="flex justify-between">
                  <span class="font-medium">Bank Name:</span>
                  <span>First Bank of Nigeria</span>
                </div>
                <div class="flex justify-between">
                  <span class="font-medium">Account Name:</span>
                  <span>QuickMeazure Ltd</span>
                </div>
                <div class="flex justify-between">
                  <span class="font-medium">Account Number:</span>
                  <span>1234567890</span>
                </div>
                <div class="flex justify-between">
                  <span class="font-medium">Amount:</span>
                  <span>{{ selectedPlan.price }}</span>
                </div>
              </div>
              <p class="text-sm text-gray-600 mt-2">Please use your email as the reference. We'll verify your payment within 24 hours.</p>
            </div>
            
            <!-- Payment Summary -->
            <div class="bg-gray-50 p-4 rounded-lg mt-6">
              <h4 class="font-medium mb-2">Payment Summary</h4>
              <div class="flex justify-between">
                <span>{{ selectedPlan.label }} ({{ billingPeriod === 'annual' ? 'Annual' : 'Monthly' }})</span>
                <span>{{ selectedPlan.price }}</span>
              </div>
              <div class="border-t border-gray-200 my-2 pt-2 flex justify-between font-medium">
                <span>Total</span>
                <span>{{ selectedPlan.price }}</span>
              </div>
            </div>
            
            <!-- Submit Button -->
            <div class="flex flex-col sm:flex-row gap-3 sm:justify-between mt-6">
              <UButton
                type="button"
                color="gray"
                variant="outline"
                @click="skipPayment"
                :disabled="isProcessing"
              >
                {{ selectedPlan.numericPrice > 0 ? 'Choose Free Plan Instead' : 'Skip' }}
              </UButton>
              
              <UButton
                type="submit"
                color="primary"
                :loading="isProcessing"
                :disabled="isProcessing || (paymentMethod === 'card' && !isCardDetailsValid)"
              >
                {{ paymentMethod === 'bank' ? 'Confirm Bank Transfer' : 'Complete Payment' }}
              </UButton>
            </div>
          </form>
        </div>
      </div>
      
      <!-- If Free Plan -->
      <div v-else class="flex justify-end mt-6">
        <UButton
          color="primary"
          :loading="isProcessing"
          @click="skipPayment"
        >
          Continue to Dashboard
        </UButton>
      </div>
    </div>
  </div>
  
  <!-- Change Plan Modal (using v-model:open) -->
  <UModal v-model:open="showChangePlanModal" title="Select a Different Plan">
    <div class="space-y-6">
      <p class="text-gray-600">Choose the plan that best fits your needs:</p>
      
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
      <div class="space-y-4">
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
                <h4 class="font-medium">{{ plan.label }}</h4>
                <UBadge v-if="plan.value === 'standard'" color="primary" size="xs">Popular</UBadge>
              </div>
              <p class="text-sm text-gray-600 mt-1">{{ plan.description }}</p>
              <ul class="mt-2 space-y-1">
                <li v-for="(feature, index) in plan.features?.slice(0,3)" :key="index" class="text-xs text-gray-700 flex items-center">
                  <UIcon name="i-heroicons-check-circle" class="text-green-500 mr-1 flex-shrink-0" size="xs" />
                  <span>{{ feature }}</span>
                </li>
                <li v-if="plan.features?.length > 3" class="text-xs text-gray-700">
                  <UIcon name="i-heroicons-plus-circle" class="text-gray-500 mr-1" size="xs" />
                  <span>{{ plan.features.length - 3 }} more features</span>
                </li>
              </ul>
            </div>
            <div class="text-right md:min-w-[120px]">
              <div class="font-bold text-lg">{{ formatPrice(plan.numericPrice, isAnnualBilling) }}</div>
              <div class="text-xs text-gray-500">
                {{ isAnnualBilling ? 'per year' : 'per month' }}
              </div>
              <UButton 
                v-if="tempSelectedPlan !== plan.value"
                size="xs" 
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

      <!-- Selected Plan Summary -->
      <div v-if="tempSelectedPlan && getSelectedTempPlan" class="mt-4 bg-gray-50 p-4 rounded-lg">
        <h4 class="font-medium mb-2">Summary</h4>
        <div class="flex justify-between">
          <span>{{ getSelectedTempPlan.label }} ({{ isAnnualBilling ? 'Annual' : 'Monthly' }})</span>
          <span>{{ formatPrice(getSelectedTempPlan.numericPrice, isAnnualBilling) }}</span>
        </div>
        <div v-if="isAnnualBilling" class="flex justify-between text-sm text-gray-600">
          <span>Savings</span>
          <span class="text-green-600">{{ calculateSavings(getSelectedTempPlan.numericPrice) }}</span>
        </div>
        <div class="border-t border-gray-200 my-2 pt-2 flex justify-between font-medium">
          <span>Total</span>
          <span>{{ formatPrice(getSelectedTempPlan.numericPrice, isAnnualBilling) }}</span>
        </div>
      </div>
    </div>
    
    <template #footer>
      <div class="flex justify-between">
        <UButton
          color="gray"
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
import { useSubscription } from '~/composables/useSubscription';
import { useAuth } from '~/composables/useAuth';
import { onMounted } from 'vue';

// Add toast composable
const toast = useToast();

// Set page metadata
useHead({
  title: 'Confirm Subscription - QuickMeazure',
});

// Set layout for this page
definePageMeta({
  layout: 'auth'
});

const route = useRoute();
const { subscriptionPlans } = useSubscription();
const auth = useAuth();

// Get plan from URL query params or use free as default
const planType = ref(route.query.plan || 'free');
const billingPeriod = ref(route.query.billing || 'monthly');

// Payment methods
const paymentMethods = [
  { label: 'Credit/Debit Card', value: 'card' },
  { label: 'Bank Transfer', value: 'bank' }
];

// Form state
const paymentMethod = ref('card');
const cardDetails = ref({
  number: '',
  expiry: '',
  cvc: '',
  name: ''
});
const isProcessing = ref(false);

// Find the selected plan from subscription plans
const selectedPlan = computed(() => {
  const planId = planType.value.includes('-')
    ? planType.value.split('-')[0]
    : planType.value;
    
  return subscriptionPlans.value.find(plan => plan.value === planId) || subscriptionPlans.value[0];
});

// Initialize tempSelectedPlan with current plan value
const tempSelectedPlan = ref(selectedPlan.value?.value || 'free');

// Check if card details are valid
const isCardDetailsValid = computed(() => {
  return (
    cardDetails.value.number.trim() !== '' &&
    cardDetails.value.expiry.trim() !== '' &&
    cardDetails.value.cvc.trim() !== '' &&
    cardDetails.value.name.trim() !== ''
  );
});

// Process payment
const processPayment = async () => {
  isProcessing.value = true;
  
  try {
    // Mock successful payment processing
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Update user subscription plan
    // In a real app, you would make an API call here to update the user's plan
    // await updateUserSubscription(selectedPlan.value.value, billingPeriod.value);
    
    // Show success message
    toast.add({
      title: 'Payment Successful',
      description: `You are now subscribed to the ${selectedPlan.value.label} plan!`,
      color: 'green'
    });
    
    // Redirect to dashboard
    navigateTo('/dashboard');
  } catch (error) {
    console.error('Payment processing failed:', error);
    toast.add({
      title: 'Payment Failed',
      description: 'There was an error processing your payment. Please try again.',
      color: 'red'
    });
  } finally {
    isProcessing.value = false;
  }
};

// Skip payment and go to dashboard
const skipPayment = async () => {
  isProcessing.value = true;
  
  try {
    // If skipping payment, default to free plan
    // In a real app, you would make an API call here to update the user's plan to free
    await new Promise(resolve => setTimeout(resolve, 800));
    
    navigateTo('/dashboard');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    isProcessing.value = false;
  }
};

// Change Plan Modal
const showChangePlanModal = ref(false);

// Toggle modal function
const toggleChangePlanModal = () => {
  showChangePlanModal.value = !showChangePlanModal.value;
};

const isAnnualBilling = ref(billingPeriod.value === 'annual');

const toggleBilling = () => {
  isAnnualBilling.value = !isAnnualBilling.value;
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
  
  // Reset payment form if changing plans
  if (newPlan && newPlan.numericPrice > 0) {
    // Default to card payment for paid plans
    paymentMethod.value = 'card';
    
    // Reset card details
    cardDetails.value = {
      number: '',
      expiry: '',
      cvc: '',
      name: ''
    };
  }
  
  // Close the modal
  showChangePlanModal.value = false;
  
  // Show a confirmation message
  toast.add({
    title: 'Plan Changed',
    description: `You've selected the ${newPlan ? newPlan.label : tempSelectedPlan.value} plan.`,
    color: 'green'
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
  return subscriptionPlans.value;
});

// Calculate savings when paying annually
const calculateSavings = (price) => {
  if (!price) return '₦0';
  const monthlyPrice = price;
  const annualPrice = price * 12 * 0.85; // 15% discount
  const savings = (monthlyPrice * 12) - annualPrice;
  return `₦${savings.toLocaleString()}`;
};

// Format price based on billing period
const formatPrice = (price, isAnnual) => {
  if (price === undefined || price === null) return '₦0';
  
  let displayPrice = price;
  if (isAnnual) {
    displayPrice = price * 12 * 0.85; // Apply 15% discount for annual billing
  }
  
  return `₦${displayPrice.toLocaleString()}${isAnnual ? '/year' : '/month'}`;
};
</script> 