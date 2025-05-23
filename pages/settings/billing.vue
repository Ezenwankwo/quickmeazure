<template>
  <div class="space-y-6">
    <!-- Current Plan -->
    <UCard>
      <template #header>
        <h2 class="text-lg font-semibold text-gray-900">Current Plan</h2>
      </template>

      <div class="space-y-4">
        <div class="flex items-center justify-between">
          <div>
            <h3 class="text-base font-medium text-gray-900">Free Plan</h3>
            <p class="text-sm text-gray-500">Your current subscription</p>
          </div>
          <UBadge color="gray"> Active </UBadge>
        </div>

        <div class="mt-4 pt-4 border-t border-gray-200">
          <h4 class="text-sm font-medium text-gray-900">Plan Details</h4>
          <ul role="list" class="mt-2 space-y-2">
            <li class="flex items-center text-sm text-gray-600">
              <UIcon name="i-heroicons-check-circle" class="h-5 w-5 text-green-500 mr-2" />
              <span>Up to 10 clients</span>
            </li>
            <li class="flex items-center text-sm text-gray-600">
              <UIcon name="i-heroicons-check-circle" class="h-5 w-5 text-green-500 mr-2" />
              <span>Basic measurements</span>
            </li>
            <li class="flex items-center text-sm text-gray-600">
              <UIcon name="i-heroicons-check-circle" class="h-5 w-5 text-green-500 mr-2" />
              <span>Email support</span>
            </li>
          </ul>
        </div>

        <div class="mt-4 flex">
          <UButton to="/pricing" color="primary"> Upgrade Plan </UButton>
        </div>
      </div>
    </UCard>

    <!-- Payment Methods -->
    <UCard>
      <template #header>
        <div class="flex items-center justify-between">
          <h2 class="text-lg font-semibold text-gray-900">Payment Methods</h2>
          <UButton size="sm" color="white" @click="isAddPaymentMethodOpen = true">
            Add Payment Method
          </UButton>
        </div>
      </template>

      <div class="space-y-4">
        <div v-if="paymentMethods.length > 0" class="space-y-3">
          <div
            v-for="method in paymentMethods"
            :key="method.id"
            class="flex items-center justify-between p-3 border rounded-lg"
          >
            <div class="flex items-center">
              <div class="p-2 rounded-full bg-gray-100 mr-3">
                <UIcon name="i-heroicons-credit-card" class="h-5 w-5 text-gray-600" />
              </div>
              <div>
                <p class="text-sm font-medium text-gray-900">
                  {{ method.brand }} ending in {{ method.last4 }}
                </p>
                <p class="text-xs text-gray-500">
                  Expires {{ method.exp_month }}/{{ method.exp_year }}
                </p>
              </div>
            </div>
            <div class="flex items-center space-x-2">
              <UButton
v-if="method.is_default"
size="xs"
color="gray"
variant="soft"
disabled>
                Default
              </UButton>
              <UButton
v-else
size="xs"
color="white"
@click="setDefaultPaymentMethod(method.id)">
                Set as default
              </UButton>
              <UButton
                size="xs"
                color="gray"
                variant="ghost"
                @click="removePaymentMethod(method.id)"
              >
                Remove
              </UButton>
            </div>
          </div>
        </div>
        <div v-else class="text-center py-8">
          <UIcon name="i-heroicons-credit-card" class="mx-auto h-12 w-12 text-gray-300" />
          <h3 class="mt-2 text-sm font-medium text-gray-900">No payment methods</h3>
          <p class="mt-1 text-sm text-gray-500">Add a payment method to get started.</p>
          <div class="mt-6">
            <UButton @click="isAddPaymentMethodOpen = true">
              <UIcon name="i-heroicons-plus" class="h-5 w-5 mr-2" />
              Add Payment Method
            </UButton>
          </div>
        </div>
      </div>
    </UCard>

    <!-- Billing History -->
    <UCard>
      <template #header>
        <h2 class="text-lg font-semibold text-gray-900">Billing History</h2>
      </template>

      <div class="overflow-x-auto">
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
                <span class="sr-only">View</span>
              </th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr v-for="invoice in billingHistory" :key="invoice.id" class="hover:bg-gray-50">
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {{ formatDate(invoice.date) }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {{ invoice.description }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {{ formatCurrency(invoice.amount) }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <UBadge :color="getStatusColor(invoice.status)">
                  {{ invoice.status }}
                </UBadge>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <UButton size="xs" color="gray" variant="ghost"> View </UButton>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="billingHistory.length === 0" class="text-center py-8">
        <UIcon name="i-heroicons-document-text" class="mx-auto h-12 w-12 text-gray-300" />
        <h3 class="mt-2 text-sm font-medium text-gray-900">No billing history</h3>
        <p class="mt-1 text-sm text-gray-500">Your billing history will appear here.</p>
      </div>
    </UCard>

    <!-- Add Payment Method Modal -->
    <UModal v-model="isAddPaymentMethodOpen">
      <UCard>
        <template #header>
          <div class="flex items-center justify-between">
            <h3 class="text-lg font-semibold text-gray-900">Add Payment Method</h3>
            <UButton
              color="gray"
              variant="ghost"
              icon="i-heroicons-x-mark"
              @click="isAddPaymentMethodOpen = false"
            />
          </div>
        </template>

        <div class="space-y-4">
          <UFormGroup label="Card Number">
            <UInput
              v-model="newPaymentMethod.cardNumber"
              placeholder="1234 5678 9012 3456"
              :ui="{
                input: {
                  base: 'w-full',
                  padding: { '2xs': 'px-3 py-1.5' },
                },
              }"
            />
          </UFormGroup>

          <div class="grid grid-cols-2 gap-4">
            <UFormGroup label="Expiry Date">
              <UInput
                v-model="newPaymentMethod.expiry"
                placeholder="MM/YY"
                :ui="{
                  input: {
                    base: 'w-full',
                    padding: { '2xs': 'px-3 py-1.5' },
                  },
                }"
              />
            </UFormGroup>

            <UFormGroup label="CVC">
              <UInput
                v-model="newPaymentMethod.cvc"
                placeholder="CVC"
                type="password"
                :ui="{
                  input: {
                    base: 'w-full',
                    padding: { '2xs': 'px-3 py-1.5' },
                  },
                }"
              />
            </UFormGroup>
          </div>

          <UFormGroup label="Name on Card">
            <UInput
              v-model="newPaymentMethod.name"
              placeholder="John Doe"
              :ui="{
                input: {
                  base: 'w-full',
                  padding: { '2xs': 'px-3 py-1.5' },
                },
              }"
            />
          </UFormGroup>

          <div class="flex justify-end space-x-3 pt-4">
            <UButton color="gray" variant="ghost" @click="isAddPaymentMethodOpen = false">
              Cancel
            </UButton>
            <UButton color="primary" :loading="isAddingPaymentMethod" @click="addPaymentMethod">
              Add Payment Method
            </UButton>
          </div>
        </div>
      </UCard>
    </UModal>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const isAddPaymentMethodOpen = ref(false)
const isAddingPaymentMethod = ref(false)

const paymentMethods = ref([
  {
    id: '1',
    brand: 'Visa',
    last4: '4242',
    exp_month: '12',
    exp_year: '25',
    is_default: true,
  },
  {
    id: '2',
    brand: 'Mastercard',
    last4: '4444',
    exp_month: '06',
    exp_year: '24',
    is_default: false,
  },
])

const billingHistory = ref([
  {
    id: '1',
    date: '2023-06-15',
    description: 'Premium Plan - Monthly',
    amount: 19.99,
    status: 'Paid',
  },
  {
    id: '2',
    date: '2023-05-15',
    description: 'Premium Plan - Monthly',
    amount: 19.99,
    status: 'Paid',
  },
  {
    id: '3',
    date: '2023-04-15',
    description: 'Premium Plan - Monthly',
    amount: 19.99,
    status: 'Refunded',
  },
])

const newPaymentMethod = ref({
  cardNumber: '',
  expiry: '',
  cvc: '',
  name: '',
})

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount)
}

const getStatusColor = (status: string) => {
  switch (status.toLowerCase()) {
    case 'paid':
      return 'green'
    case 'pending':
      return 'yellow'
    case 'failed':
    case 'refunded':
      return 'red'
    default:
      return 'gray'
  }
}

const addPaymentMethod = async () => {
  try {
    isAddingPaymentMethod.value = true

    // TODO: Call API to add payment method
    // await $fetch('/api/payment-methods', {
    //   method: 'POST',
    //   body: newPaymentMethod.value
    // });

    // Reset form
    newPaymentMethod.value = {
      cardNumber: '',
      expiry: '',
      cvc: '',
      name: '',
    }

    // Close modal
    isAddPaymentMethodOpen.value = false

    useToast().add({
      title: 'Payment method added',
      icon: 'i-heroicons-check-circle',
    })
  } catch (error) {
    console.error('Error adding payment method:', error)
    useToast().add({
      title: 'Error adding payment method',
      description: error.message || 'Please try again',
      color: 'red',
      icon: 'i-heroicons-exclamation-triangle',
    })
  } finally {
    isAddingPaymentMethod.value = false
  }
}

const setDefaultPaymentMethod = async (id: string) => {
  try {
    // TODO: Call API to set default payment method
    // await $fetch(`/api/payment-methods/${id}/default`, {
    //   method: 'PUT'
    // });

    // Update local state
    paymentMethods.value = paymentMethods.value.map(method => ({
      ...method,
      is_default: method.id === id,
    }))

    useToast().add({
      title: 'Default payment method updated',
      icon: 'i-heroicons-check-circle',
    })
  } catch (error) {
    console.error('Error setting default payment method:', error)
    useToast().add({
      title: 'Error updating payment method',
      description: error.message || 'Please try again',
      color: 'red',
      icon: 'i-heroicons-exclamation-triangle',
    })
  }
}

const removePaymentMethod = async (id: string) => {
  if (!confirm('Are you sure you want to remove this payment method?')) {
    return
  }

  try {
    // TODO: Call API to remove payment method
    // await $fetch(`/api/payment-methods/${id}`, {
    //   method: 'DELETE'
    // });

    // Update local state
    paymentMethods.value = paymentMethods.value.filter(method => method.id !== id)

    useToast().add({
      title: 'Payment method removed',
      icon: 'i-heroicons-check-circle',
    })
  } catch (error) {
    console.error('Error removing payment method:', error)
    useToast().add({
      title: 'Error removing payment method',
      description: error.message || 'Please try again',
      color: 'red',
      icon: 'i-heroicons-exclamation-triangle',
    })
  }
}
</script>
