<template>
  <div class="space-y-6">
    <PageHeader
      title="Subscription History"
      subtitle="View your subscription history and manage your current plan"
    />
    
    <!-- Current Subscription -->
    <UCard class="bg-white">
      <template #header>
        <h2 class="text-lg font-medium">Current Subscription</h2>
      </template>
      
      <div v-if="isLoading" class="py-4 flex justify-center">
        <UIcon name="i-heroicons-arrow-path" class="animate-spin h-6 w-6 text-primary-500" />
      </div>
      
      <div v-else-if="!subscription" class="py-4 text-center">
        <p class="text-gray-600">You don't have an active subscription.</p>
        <UButton to="/subscription" color="primary" class="mt-4">
          View Subscription Plans
        </UButton>
      </div>
      
      <div v-else class="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <div class="flex items-center">
            <span class="text-xl font-bold">{{ currentPlan?.name }}</span>
            <UBadge v-if="subscription.status === 'active'" color="green" class="ml-2">ACTIVE</UBadge>
            <UBadge v-else-if="subscription.status === 'canceled'" color="yellow" class="ml-2">CANCELED</UBadge>
            <UBadge v-else-if="subscription.status === 'expired'" color="red" class="ml-2">EXPIRED</UBadge>
          </div>
          <p class="text-gray-600 mt-1">{{ currentPlan?.description }}</p>
          <div class="mt-2 flex flex-wrap gap-2">
            <UBadge v-for="feature in currentPlan?.features?.slice(0, 3)" :key="feature" color="gray" variant="subtle">
              {{ feature }}
            </UBadge>
            <UBadge v-if="currentPlan?.features && currentPlan.features.length > 3" color="gray" variant="subtle">
              +{{ currentPlan.features.length - 3 }} more
            </UBadge>
          </div>
        </div>
        
        <div class="mt-4 md:mt-0 text-right">
          <div class="text-2xl font-bold">{{ formatPrice(subscription.amount) }}<span class="text-sm font-normal text-gray-500">/{{ subscription.billingPeriod }}</span></div>
          <p class="text-sm text-gray-600 mt-1">
            {{ subscription.status === 'active' ? 'Next billing date:' : 'Subscription ends:' }} 
            {{ formatDate(nextBillingDate || subscription.endDate) }}
          </p>
        </div>
      </div>
      
      <template v-if="subscription && subscription.status === 'active'" #footer>
        <div class="flex justify-end">
          <UButton
            color="red"
            variant="outline"
            @click="showCancelModal = true"
          >
            Cancel Subscription
          </UButton>
        </div>
      </template>
    </UCard>
    
    <!-- Subscription History -->
    <UCard class="bg-white">
      <template #header>
        <h2 class="text-lg font-medium">Payment History</h2>
      </template>
      
      <div v-if="isLoading" class="py-4 flex justify-center">
        <UIcon name="i-heroicons-arrow-path" class="animate-spin h-6 w-6 text-primary-500" />
      </div>
      
      <div v-else-if="!paymentHistory.length" class="py-4 text-center">
        <p class="text-gray-600">No payment history found.</p>
      </div>
      
      <div v-else>
        <!-- Desktop Payment History Table -->
        <div class="hidden sm:block">
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
            
            <template #date-data="{ row }">
              {{ formatDate(row.date) }}
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
          </UTable>
        </div>
        
        <!-- Mobile Payment History -->
        <div class="sm:hidden space-y-4">
          <div v-for="payment in paymentHistory" :key="`mobile-payment-${payment.id}`" class="border-b border-gray-200 pb-4 last:border-0">
            <div class="flex justify-between">
              <span class="text-sm font-medium">{{ formatDate(payment.date) }}</span>
              <UBadge
                :color="payment.status === 'Paid' ? 'green' : 'yellow'"
                variant="subtle"
                size="sm"
              >
                {{ payment.status }}
              </UBadge>
            </div>
            <div class="mt-1 text-sm">{{ payment.description }}</div>
            <div class="mt-2 font-medium">{{ formatPrice(payment.amount) }}</div>
          </div>
        </div>
      </div>
    </UCard>
  </div>
  
  <!-- Cancel Subscription Modal -->
  <UModal v-model="showCancelModal" title="Cancel Subscription">
    <div class="space-y-4">
      <p>Are you sure you want to cancel your subscription? You'll continue to have access until your current billing period ends on {{ formatDate(nextBillingDate || subscription?.endDate) }}.</p>
      
      <UFormGroup label="Reason for cancellation (optional)">
        <UTextarea v-model="cancellationReason" placeholder="Tell us why you're canceling..." />
      </UFormGroup>
    </div>
    
    <template #footer>
      <div class="flex justify-end gap-2">
        <UButton color="gray" variant="outline" @click="showCancelModal = false">
          Keep Subscription
        </UButton>
        <UButton color="red" :loading="isCanceling" @click="cancelCurrentSubscription">
          Confirm Cancellation
        </UButton>
      </div>
    </template>
  </UModal>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useSubscriptionManagement } from '~/composables/useSubscriptionManagement';

// Page metadata
useHead({
  title: 'Subscription History - QuickMeazure'
});

// Subscription management
const { 
  subscription, 
  hasActiveSubscription, 
  currentPlan, 
  nextBillingDate,
  isLoading, 
  formatPrice, 
  formatDate, 
  loadSubscription, 
  cancelSubscription 
} = useSubscriptionManagement();

// Toast composable
const toast = useToast();

// Load payment history
const paymentHistory = computed(() => {
  if (!subscription.value) return [];
  
  // Create a history item for the current subscription
  return [
    {
      id: 1,
      date: subscription.value.startDate,
      description: `Payment for ${subscription.value.plan?.name || 'Subscription'} (${subscription.value.billingPeriod})`,
      amount: subscription.value.amount,
      status: 'Paid',
      reference: subscription.value.paymentReference
    }
  ];
});

// Table columns
const paymentColumns = [
  {
    key: 'date',
    label: 'Date',
    id: 'date'
  },
  {
    key: 'description',
    label: 'Description',
    id: 'description'
  },
  {
    key: 'amount',
    label: 'Amount',
    id: 'amount'
  },
  {
    key: 'status',
    label: 'Status',
    id: 'status'
  }
];

// Cancellation
const showCancelModal = ref(false);
const cancellationReason = ref('');
const isCanceling = ref(false);

// Cancel subscription
const cancelCurrentSubscription = async () => {
  isCanceling.value = true;
  
  try {
    const success = await cancelSubscription(cancellationReason.value);
    
    if (success) {
      showCancelModal.value = false;
      
      toast.add({
        title: 'Subscription Canceled',
        description: 'Your subscription has been canceled. You\'ll continue to have access until the end of your current billing period.',
        color: 'green'
      });
    } else {
      toast.add({
        title: 'Error',
        description: 'Failed to cancel your subscription. Please try again.',
        color: 'red'
      });
    }
  } catch (error) {
    console.error('Error canceling subscription:', error);
    toast.add({
      title: 'Error',
      description: 'An unexpected error occurred. Please try again.',
      color: 'red'
    });
  } finally {
    isCanceling.value = false;
  }
};
</script> 