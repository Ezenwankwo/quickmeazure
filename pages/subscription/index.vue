<template>
  <div class="space-y-6">
    <div class="flex justify-between items-center">
      <h1 class="text-2xl font-bold">Subscription</h1>
    </div>
    
    <!-- Current Plan -->
    <UCard class="bg-white">
      <template #header>
        <h2 class="text-lg font-medium">Current Plan</h2>
      </template>
      
      <div class="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <div class="flex items-center">
            <span class="text-xl font-bold">{{ currentPlan.name }}</span>
            <UBadge v-if="currentPlan.id === 'standard'" color="primary" class="ml-2">POPULAR</UBadge>
          </div>
          <p class="text-gray-600 mt-1">{{ currentPlan.description }}</p>
          <div class="mt-2 flex flex-wrap gap-2">
            <UBadge v-for="feature in currentPlan.features" :key="feature" color="gray" variant="subtle">
              {{ feature }}
            </UBadge>
          </div>
        </div>
        
        <div class="mt-4 md:mt-0 text-right">
          <div class="text-2xl font-bold">{{ formatPrice(currentPlan.price) }}<span class="text-sm font-normal text-gray-500">/month</span></div>
          <p class="text-sm text-gray-600 mt-1">Next billing date: {{ nextBillingDate }}</p>
        </div>
      </div>
      
      <template #footer>
        <div class="flex justify-between items-center">
          <div>
            <p class="text-sm text-gray-600">
              <span class="font-medium">{{ clientCount }}</span> clients used out of 
              <span class="font-medium">{{ currentPlan.clientLimit ? currentPlan.clientLimit : 'Unlimited' }}</span>
            </p>
            <div v-if="currentPlan.clientLimit" class="w-full bg-gray-200 rounded-full h-2 mt-2">
              <div 
                class="bg-primary-600 h-2 rounded-full" 
                :style="{ width: `${Math.min((clientCount / currentPlan.clientLimit) * 100, 100)}%` }"
              ></div>
            </div>
          </div>
          
          <UButton
            v-if="currentPlan.id !== 'premium'"
            color="primary"
            @click="showUpgradeModal = true"
          >
            Upgrade Plan
          </UButton>
        </div>
      </template>
    </UCard>
    
    <!-- All Plans Comparison -->
    <UCard class="bg-white">
      <template #header>
        <h2 class="text-lg font-medium">Compare Plans</h2>
      </template>
      
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead>
            <tr>
              <th class="py-3 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">Features</th>
              <th v-for="plan in plans" :key="plan.id" class="py-3 text-center text-sm font-medium text-gray-500 uppercase tracking-wider">
                {{ plan.name }}
              </th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <!-- Price Row -->
            <tr>
              <td class="py-4 text-sm font-medium text-gray-900">Price</td>
              <td v-for="plan in plans" :key="`${plan.id}-price`" class="py-4 text-center text-sm text-gray-500">
                <span class="font-bold">{{ formatPrice(plan.price) }}</span>/month
              </td>
            </tr>
            
            <!-- Client Limit Row -->
            <tr>
              <td class="py-4 text-sm font-medium text-gray-900">Client Limit</td>
              <td v-for="plan in plans" :key="`${plan.id}-limit`" class="py-4 text-center text-sm text-gray-500">
                {{ plan.clientLimit ? plan.clientLimit : 'Unlimited' }}
              </td>
            </tr>
            
            <!-- Feature Rows -->
            <tr v-for="(feature, index) in allFeatures" :key="index">
              <td class="py-4 text-sm font-medium text-gray-900">{{ feature }}</td>
              <td v-for="plan in plans" :key="`${plan.id}-${index}`" class="py-4 text-center text-sm text-gray-500">
                <UIcon 
                  v-if="planHasFeature(plan, feature)" 
                  name="i-heroicons-check-circle" 
                  class="text-green-500 mx-auto" 
                />
                <UIcon 
                  v-else 
                  name="i-heroicons-x-circle" 
                  class="text-gray-300 mx-auto" 
                />
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </UCard>
    
    <!-- Payment History -->
    <UCard class="bg-white">
      <template #header>
        <h2 class="text-lg font-medium">Payment History</h2>
      </template>
      
      <UTable 
        :columns="paymentColumns" 
        :rows="paymentHistory" 
        :ui="{ 
          td: { 
            padding: 'py-3 px-4' 
          } 
        }"
      >
        <template #amount-data="{ row }">
          <span class="font-medium">{{ formatPrice(row.amount) }}</span>
        </template>
        
        <template #status-data="{ row }">
          <UBadge
            :color="row.status === 'Paid' ? 'green' : 'yellow'"
            variant="subtle"
            size="sm"
          >
            {{ row.status }}
          </UBadge>
        </template>
        
        <template #actions-data="{ row }">
          <UButton
            color="gray"
            variant="ghost"
            icon="i-heroicons-document-text"
            size="xs"
            @click="downloadInvoice(row)"
          >
            Invoice
          </UButton>
        </template>
      </UTable>
      
      <template #footer>
        <div v-if="paymentHistory.length === 0" class="text-center py-4">
          <p class="text-gray-500">No payment history available</p>
        </div>
      </template>
    </UCard>
    
    <!-- Upgrade Plan Modal -->
    <UModal v-model="showUpgradeModal">
      <UCard>
        <template #header>
          <h3 class="text-lg font-medium">Upgrade Your Plan</h3>
        </template>
        
        <div class="space-y-4">
          <p>Choose the plan that best fits your business needs:</p>
          
          <div class="space-y-3">
            <URadio 
              v-for="plan in upgradePlans" 
              :key="plan.id"
              v-model="selectedUpgradePlan"
              :value="plan.id"
              :name="`plan-${plan.id}`"
            >
              <div class="flex justify-between w-full">
                <div>
                  <span class="font-medium">{{ plan.name }}</span>
                  <p class="text-sm text-gray-500">{{ plan.description }}</p>
                </div>
                <span class="font-medium">{{ formatPrice(plan.price) }}/month</span>
              </div>
            </URadio>
          </div>
          
          <div class="bg-gray-50 p-4 rounded-lg mt-4">
            <h4 class="font-medium mb-2">Payment Summary</h4>
            <div class="flex justify-between">
              <span>{{ getSelectedPlan(selectedUpgradePlan)?.name }}</span>
              <span>{{ formatPrice(getSelectedPlan(selectedUpgradePlan)?.price) }}</span>
            </div>
            <div class="border-t border-gray-200 my-2 pt-2 flex justify-between font-medium">
              <span>Total</span>
              <span>{{ formatPrice(getSelectedPlan(selectedUpgradePlan)?.price) }}</span>
            </div>
          </div>
        </div>
        
        <template #footer>
          <div class="flex justify-end space-x-4">
            <UButton
              color="gray"
              variant="outline"
              @click="showUpgradeModal = false"
            >
              Cancel
            </UButton>
            <UButton
              color="primary"
              @click="upgradePlan"
              :loading="isUpgrading"
            >
              Confirm Upgrade
            </UButton>
          </div>
        </template>
      </UCard>
    </UModal>
  </div>
</template>

<script setup>
// Set page metadata
useHead({
  title: 'Subscription - QuickMeazure',
});

// Mock subscription plans
const plans = [
  {
    id: 'free',
    name: 'Free Plan',
    description: 'Basic plan for small tailoring businesses',
    price: 0,
    clientLimit: 100,
    features: ['Up to 100 clients', 'Basic measurements', 'Payment tracking'],
  },
  {
    id: 'standard',
    name: 'Standard Plan',
    description: 'Standard plan for growing tailoring businesses',
    price: 5000,
    clientLimit: 500,
    features: [
      'Up to 500 clients', 
      'Advanced measurements', 
      'Payment tracking',
      'Style catalog',
      'Email notifications'
    ],
  },
  {
    id: 'premium',
    name: 'Premium Plan',
    description: 'Premium plan for established tailoring businesses',
    price: 10000,
    clientLimit: null, // Unlimited
    features: [
      'Unlimited clients', 
      'Advanced measurements', 
      'Payment tracking',
      'Style catalog',
      'Email notifications',
      'Analytics dashboard',
      'Priority support'
    ],
  },
];

// Current plan (mock data)
const currentPlan = ref(plans[1]); // Standard plan
const clientCount = ref(87);
const nextBillingDate = ref('December 15, 2023');

// Payment history columns
const paymentColumns = [
  {
    key: 'date',
    label: 'Date',
  },
  {
    key: 'description',
    label: 'Description',
  },
  {
    key: 'amount',
    label: 'Amount',
  },
  {
    key: 'status',
    label: 'Status',
  },
  {
    key: 'actions',
    label: '',
  },
];

// Mock payment history
const paymentHistory = ref([
  {
    id: '1',
    date: 'Nov 15, 2023',
    description: 'Standard Plan - Monthly',
    amount: 5000,
    status: 'Paid',
  },
  {
    id: '2',
    date: 'Oct 15, 2023',
    description: 'Standard Plan - Monthly',
    amount: 5000,
    status: 'Paid',
  },
  {
    id: '3',
    date: 'Sep 15, 2023',
    description: 'Standard Plan - Monthly',
    amount: 5000,
    status: 'Paid',
  },
]);

// Upgrade modal
const showUpgradeModal = ref(false);
const selectedUpgradePlan = ref('premium');
const isUpgrading = ref(false);

// Get upgrade plans (plans higher than current)
const upgradePlans = computed(() => {
  return plans.filter(plan => plan.price > currentPlan.value.price);
});

// Get all unique features across all plans
const allFeatures = computed(() => {
  const featuresSet = new Set();
  plans.forEach(plan => {
    plan.features.forEach(feature => featuresSet.add(feature));
  });
  return Array.from(featuresSet);
});

// Helper functions
const formatPrice = (price) => {
  return `₦${price.toLocaleString()}`;
};

const planHasFeature = (plan, feature) => {
  return plan.features.includes(feature);
};

const getSelectedPlan = (planId) => {
  return plans.find(plan => plan.id === planId);
};

const downloadInvoice = (payment) => {
  // In a real app, this would download the invoice
  console.log('Downloading invoice for payment:', payment.id);
};

const upgradePlan = async () => {
  isUpgrading.value = true;
  
  try {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Update current plan
    const newPlan = plans.find(plan => plan.id === selectedUpgradePlan.value);
    if (newPlan) {
      currentPlan.value = newPlan;
      
      // Add new payment to history
      paymentHistory.value.unshift({
        id: `${paymentHistory.value.length + 1}`,
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        description: `${newPlan.name} - Monthly`,
        amount: newPlan.price,
        status: 'Paid',
      });
    }
    
    showUpgradeModal.value = false;
  } catch (error) {
    console.error('Upgrade failed:', error);
    // Show error notification
  } finally {
    isUpgrading.value = false;
  }
};
</script>