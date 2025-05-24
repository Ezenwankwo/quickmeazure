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
                <div class="flex items-center">
                  <span
                    class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800"
                  >
                    {{ currentPlan?.name || 'Free' }}
                  </span>
                  <span
                    class="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                    :class="statusClass"
                  >
                    {{ statusText }}
                  </span>
                </div>
                <p class="mt-1 text-sm text-gray-600">
                  {{ currentPlan?.description || 'No active subscription' }}
                </p>
                <p v-if="status.currentPeriodEndsAt" class="mt-2 text-sm text-gray-500">
                  {{ isCanceled ? 'Access until' : 'Renews on' }}:
                  {{ formatDate(status.currentPeriodEndsAt) }}
                </p>
                <p v-else-if="isTrialing && status.trialEndsAt" class="mt-2 text-sm text-gray-500">
                  Trial ends on: {{ formatDate(status.trialEndsAt) }}
                </p>
              </div>
              <div class="flex space-x-2">
                <UButton
                  v-if="plans.length > 0"
                  color="gray"
                  variant="soft"
                  @click="showChangePlanDialog"
                >
                  {{ isSubscribed ? 'Change Plan' : 'Subscribe' }}
                </UButton>
                <UButton
                  v-if="isSubscribed && !isCanceled"
                  color="red"
                  variant="soft"
                  @click="cancelSubscription"
                >
                  Cancel
                </UButton>
                <UButton
                  v-if="isCanceled"
                  color="green"
                  variant="soft"
                  @click="reactivateSubscription"
                >
                  Reactivate
                </UButton>
              </div>
            </div>
          </div>
        </div>

        <!-- Payment Methods -->
        <div class="pt-6 border-t border-gray-200">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-base font-medium text-gray-900">Payment Methods</h3>
            <UButton
size="sm"
color="gray"
variant="soft"
icon="i-heroicons-plus">
              Add Payment Method
            </UButton>
          </div>

          <div class="space-y-3">
            <div
              class="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
            >
              <div class="flex items-center">
                <UIcon name="i-heroicons-credit-card" class="h-8 w-8 text-gray-700 mr-3" />
                <div>
                  <div class="flex items-center">
                    <p class="text-sm font-medium text-gray-900">Visa •••• 4242</p>
                    <span
                      class="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
                    >
                      Default
                    </span>
                  </div>
                  <p class="text-xs text-gray-500">Expires 12/2025</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Billing History -->
        <div class="pt-6 border-t border-gray-200">
          <h3 class="text-base font-medium text-gray-900 mb-4">Billing History</h3>

          <div>
            <UTable :columns="billingColumns" :rows="billingHistory">
              <template #amount-data="{ row }"> ${{ row.amount.toFixed(2) }} </template>
              <template #status-data="{ row }">
                <UBadge color="green" variant="subtle" size="xs">
                  {{ row.status }}
                </UBadge>
              </template>
              <template #actions-data>
                <UButton
color="gray"
variant="ghost"
icon="i-heroicons-document-text"
size="xs">
                  Invoice
                </UButton>
              </template>
            </UTable>
          </div>
        </div>
      </div>
    </UCard>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useSubscriptionStore } from '~/store/modules/subscription'
import { useToast } from '@nuxtjs/toast'

const toast = useToast()
const subscriptionStore = useSubscriptionStore()

// Destructure store properties
const {
  plans,
  currentPlan,
  status,
  loading,
  error,
  isSubscribed,
  isTrialing,
  isCanceled,
  isPastDue,
} = subscriptionStore

// We'll use this in a future feature
const _trialDaysLeft = subscriptionStore.trialDaysLeft

// Computed properties
const statusClass = computed(() => {
  if (isSubscribed.value) return 'bg-green-100 text-green-800'
  if (isTrialing.value) return 'bg-blue-100 text-blue-800'
  if (isPastDue.value) return 'bg-red-100 text-red-800'
  if (isCanceled.value) return 'bg-gray-100 text-gray-800'
  return 'bg-gray-100 text-gray-800'
})

const statusText = computed(() => {
  if (isSubscribed.value && !isCanceled.value) return 'Active'
  if (isTrialing.value) return 'Trial'
  if (isPastDue.value) return 'Past Due'
  if (isCanceled.value) return 'Canceled'
  return 'Inactive'
})

// Methods
const refreshSubscription = async () => {
  try {
    await Promise.all([subscriptionStore.fetchPlans(), subscriptionStore.fetchSubscriptionStatus()])
    toast.add({
      title: 'Updated',
      description: 'Subscription information updated',
      color: 'green',
    })
  } catch (_err) {
    toast.add({
      title: 'Error',
      description: 'Failed to refresh subscription information',
      color: 'red',
    })
  }
}

const showChangePlanDialog = () => {
  // This would typically open a modal with plan options
  // For now, we'll just show a toast
  toast.add({
    title: 'Coming Soon',
    description: 'Plan change functionality will be available soon',
    color: 'blue',
  })
}

const cancelSubscription = async () => {
  try {
    if (
      confirm(
        'Are you sure you want to cancel your subscription? You will still have access until the end of your billing period.'
      )
    ) {
      await subscriptionStore.cancelSubscription(false)
      toast.add({
        title: 'Subscription Canceled',
        description: 'Your subscription has been canceled',
        color: 'green',
      })
    }
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

// Billing history
const billingHistory = [
  {
    id: 'inv_123456',
    date: 'May 15, 2025',
    description: 'Professional Plan - Monthly',
    amount: 29.99,
    status: 'paid',
  },
  {
    id: 'inv_123455',
    date: 'Apr 15, 2025',
    description: 'Professional Plan - Monthly',
    amount: 29.99,
    status: 'paid',
  },
  {
    id: 'inv_123454',
    date: 'Mar 15, 2025',
    description: 'Professional Plan - Monthly',
    amount: 29.99,
    status: 'paid',
  },
]

const billingColumns = [
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
]

// Initialize on component mount
onMounted(async () => {
  await refreshSubscription()
})
</script>
