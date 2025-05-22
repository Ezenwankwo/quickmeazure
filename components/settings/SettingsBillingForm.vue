<template>
  <div class="space-y-6">
    <UCard>
      <template #header>
        <div class="flex items-center">
          <UIcon name="i-heroicons-credit-card" class="mr-2 text-primary-500 h-5 w-5" />
          <h2 class="text-xl font-semibold text-gray-900">Billing & Subscription</h2>
        </div>
        <p class="mt-1 text-sm text-gray-500">
          Manage your subscription plan and payment methods.
        </p>
      </template>
      
      <div class="space-y-6">
        <!-- Current Plan -->
        <div>
          <h3 class="text-base font-medium text-gray-900 mb-4">Current Plan</h3>
          
          <div class="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <div class="flex items-center justify-between">
              <div>
                <div class="flex items-center">
                  <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
                    Professional
                  </span>
                  <span class="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Active
                  </span>
                </div>
                <p class="mt-1 text-sm text-gray-600">
                  All features included with unlimited clients and measurements
                </p>
                <p class="mt-2 text-sm text-gray-500">
                  Renews on June 15, 2025
                </p>
              </div>
              <div>
                <UButton 
                  color="gray" 
                  variant="soft"
                >
                  Change Plan
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
              icon="i-heroicons-plus"
            >
              Add Payment Method
            </UButton>
          </div>
          
          <div class="space-y-3">
            <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
              <div class="flex items-center">
                <UIcon name="i-heroicons-credit-card" class="h-8 w-8 text-gray-700 mr-3" />
                <div>
                  <div class="flex items-center">
                    <p class="text-sm font-medium text-gray-900">Visa •••• 4242</p>
                    <span class="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
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
              <template #amount-data="{ row }">
                ${{ row.amount.toFixed(2) }}
              </template>
              <template #status-data="{ row }">
                <UBadge
                  color="green"
                  variant="subtle"
                  size="xs"
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
                >
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
import { ref } from 'vue';

// Billing history
const billingHistory = ref([
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
]);

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
];
</script>
