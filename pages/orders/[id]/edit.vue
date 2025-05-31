<template>
  <div class="space-y-6">
    <div class="flex items-center mb-4">
      <UButton
        icon="i-heroicons-arrow-left"
        color="gray"
        variant="ghost"
        size="lg"
        :to="`/orders/${orderId}/detail`"
        class="mr-4"
      />
      <h1 class="text-xl font-bold">Edit Order</h1>
    </div>

    <div v-if="isLoading" class="flex justify-center py-12">
      <USkeleton class="h-32 w-full">
        <div class="h-full flex items-center justify-center text-gray-400">
          Loading order details...
        </div>
      </USkeleton>
    </div>

    <UCard v-else class="bg-white">
      <form class="space-y-6" @submit.prevent="saveOrder">
        <!-- Basic Information -->
        <div>
          <div class="grid grid-cols-1 gap-6">
            <!-- Client (read-only) -->
            <UFormField
for="clientId"
label="Client"
name="clientId"
required>
              <UInput
                id="clientId"
                :model-value="clientName"
                disabled
                class="bg-gray-50 w-full"
                icon="i-heroicons-user"
                size="lg"
              />
            </UFormField>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <!-- Style Selection -->
              <UFormField for="styleId" label="Style" name="styleId">
                <USelectMenu
                  id="styleId"
                  v-model="form.styleId"
                  :items="styleOptions"
                  size="lg"
                  class="w-full"
                  placeholder="Select a style (optional)"
                />
              </UFormField>

              <!-- Order Status -->
              <UFormField
for="status"
label="Status"
name="status"
required>
                <USelectMenu
                  id="status"
                  v-model="form.status"
                  :items="statusOptions"
                  size="lg"
                  class="w-full"
                  placeholder="Select status"
                  required
                />
              </UFormField>

              <!-- Due Date -->
              <UFormField for="dueDate" label="Due Date" name="dueDate">
                <UInput
                  id="dueDate"
                  v-model="form.dueDate"
                  type="date"
                  size="lg"
                  class="w-full"
                  icon="i-heroicons-calendar"
                />
              </UFormField>
            </div>
          </div>
        </div>

        <!-- Collapsible Sections -->
        <div class="mt-6 space-y-4">
          <!-- Payment Section -->
          <div class="border rounded-lg overflow-hidden shadow-sm transition-all hover:shadow-md">
            <div
              class="flex justify-between items-center p-4 cursor-pointer transition-colors"
              :class="
                openSections.includes('payment')
                  ? 'bg-primary-50 border-b border-primary-100'
                  : 'bg-white'
              "
              @click="toggleSection('payment')"
            >
              <div class="font-medium flex items-center">
                <UIcon name="i-heroicons-banknotes" class="h-5 w-5 mr-2 text-primary-500" />
                Payment Information
              </div>
              <UIcon
                :name="
                  openSections.includes('payment')
                    ? 'i-heroicons-chevron-up'
                    : 'i-heroicons-chevron-down'
                "
                class="h-5 w-5 transition-transform text-primary-500"
              />
            </div>

            <div
              v-show="openSections.includes('payment')"
              class="p-6 bg-gray-50 rounded-b-lg space-y-6 border-t border-primary-100"
            >
              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <UFormField
for="totalAmount"
label="Total Amount"
name="totalAmount"
required>
                  <UInput
                    id="totalAmount"
                    v-model.number="form.totalAmount"
                    type="number"
                    step="0.01"
                    min="0"
                    size="lg"
                    class="w-full"
                    required
                    @input="calculateBalance"
                  >
                    <template #leading>
                      <span class="inline-flex items-center text-primary-700 text-sm font-medium">
                        ₦
                      </span>
                    </template>
                  </UInput>
                </UFormField>

                <UFormField for="depositAmount" label="Deposit Amount" name="depositAmount">
                  <UInput
                    id="depositAmount"
                    v-model.number="form.depositAmount"
                    type="number"
                    step="0.01"
                    min="0"
                    size="lg"
                    class="w-full"
                    @input="calculateBalance"
                  >
                    <template #leading>
                      <span class="inline-flex items-center text-primary-700 text-sm font-medium">
                        ₦
                      </span>
                    </template>
                  </UInput>
                </UFormField>

                <UFormField for="balanceAmount" label="Balance Due" name="balanceAmount">
                  <UInput
                    id="balanceAmount"
                    :model-value="balanceAmount"
                    type="number"
                    disabled
                    class="w-full bg-gray-50"
                    size="lg"
                  >
                    <template #leading>
                      <span class="inline-flex items-center text-primary-700 text-sm font-medium">
                        ₦
                      </span>
                    </template>
                  </UInput>
                </UFormField>
              </div>
            </div>
          </div>

          <!-- Additional Information Section -->
          <div class="border rounded-lg overflow-hidden shadow-sm transition-all hover:shadow-md">
            <div
              class="flex justify-between items-center p-4 cursor-pointer transition-colors"
              :class="
                openSections.includes('notes')
                  ? 'bg-primary-50 border-b border-primary-100'
                  : 'bg-white'
              "
              @click="toggleSection('notes')"
            >
              <div class="font-medium flex items-center">
                <UIcon name="i-heroicons-document-text" class="h-5 w-5 mr-2 text-primary-500" />
                Additional Information
              </div>
              <UIcon
                :name="
                  openSections.includes('notes')
                    ? 'i-heroicons-chevron-up'
                    : 'i-heroicons-chevron-down'
                "
                class="h-5 w-5 transition-transform text-primary-500"
              />
            </div>

            <div
              v-show="openSections.includes('notes')"
              class="p-6 bg-gray-50 rounded-b-lg space-y-6 border-t border-primary-100"
            >
              <UFormField for="notes" label="Notes" name="notes">
                <UTextarea
                  id="notes"
                  v-model="form.notes"
                  placeholder="Add any additional notes about this order..."
                  :rows="4"
                  class="w-full"
                  size="lg"
                />
              </UFormField>
            </div>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="flex justify-end space-x-4 pt-6 border-t mt-6">
          <UButton
            type="button"
            color="neutral"
            variant="outline"
            size="lg"
            :to="`/orders/${orderId}/detail`"
            icon="i-heroicons-x-mark"
          >
            Cancel
          </UButton>
          <UButton
            type="submit"
            color="primary"
            :loading="isSubmitting"
            size="lg"
            icon="i-heroicons-check"
          >
            Save Changes
          </UButton>
        </div>
      </form>
    </UCard>
  </div>
</template>

<script setup>
// Get the order ID from the route
// Import stores and utilities
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useHead } from '#imports'
import { useAuthStore } from '~/store/modules/auth'
import { useStyleStore } from '~/store'

const route = useRoute()
const orderId = route.params.id

// Initialize stores
const styleStore = useStyleStore()
const authStore = useAuthStore()

// Set page metadata
useHead({
  title: 'Edit Order - QuickMeazure',
  meta: [{ name: 'viewport', content: 'width=device-width, initial-scale=1, maximum-scale=1' }],
})

// Track which sections are open
const openSections = ref(['payment', 'notes'])

// Toggle section visibility
const toggleSection = sectionValue => {
  if (!openSections.value.includes(sectionValue)) {
    openSections.value.push(sectionValue)
  } else {
    openSections.value = openSections.value.filter(item => item !== sectionValue)
  }
}

// Form state
const form = ref({
  clientId: '',
  styleId: null,
  status: '',
  dueDate: '',
  totalAmount: 0,
  depositAmount: 0,
  notes: '',
})

// Error state for validation
const _errors = ref({})

// Client name for display
const clientName = ref('')

// State variables
const isLoading = ref(true)
const isSubmitting = ref(false)

// Computed for style dropdown options
const styleOptions = computed(() => {
  return styleStore.styles.map(style => ({
    label: style.name || 'Unnamed Style',
    value: style.id,
    icon: 'i-heroicons-swatch',
  }))
})

// Computed for balance amount
const balanceAmount = computed(() => {
  return (form.value.totalAmount || 0) - (form.value.depositAmount || 0)
})

// Status options with icons
const statusOptions = [
  { label: 'Pending', value: 'Pending', icon: 'i-heroicons-clock' },
  { label: 'In Progress', value: 'In Progress', icon: 'i-heroicons-arrow-path' },
  { label: 'Ready for Pickup', value: 'Ready for Pickup', icon: 'i-heroicons-check-badge' },
  { label: 'Completed', value: 'Completed', icon: 'i-heroicons-check-circle' },
  { label: 'Cancelled', value: 'Cancelled', icon: 'i-heroicons-x-circle' },
]

// Computed for balance amount
const balanceAmount = computed(() => {
  return (form.value.totalAmount || 0) - (form.value.depositAmount || 0)
})

// Calculate balance when total or deposit changes
const calculateBalance = () => {
  // Form validation to ensure deposit isn't more than total
  if (form.value.depositAmount > form.value.totalAmount) {
    form.value.depositAmount = form.value.totalAmount
  }
}

// Format date for input field
const formatDateForInput = dateString => {
  if (!dateString) return ''

  try {
    // Handle different date formats
    let date

    if (typeof dateString === 'number') {
      // Handle timestamp number
      date = new Date(dateString)
    } else if (typeof dateString === 'string') {
      // Check if it's an ISO string or other format
      if (dateString.includes('T')) {
        // ISO format
        date = new Date(dateString)
      } else if (dateString.includes('-')) {
        // YYYY-MM-DD format
        const [year, month, day] = dateString.split('-').map(Number)
        date = new Date(year, month - 1, day)
      } else {
        // Try general parsing
        date = new Date(dateString)
      }
    } else {
      // Default fallback
      date = new Date(dateString)
    }

    // Check if date is valid
    if (isNaN(date.getTime())) {
      console.warn('Invalid date:', dateString)
      return ''
    }

    // Format as YYYY-MM-DD for input type="date"
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')

    return `${year}-${month}-${day}`
  } catch (error) {
    console.error('Error formatting date:', error, dateString)
    return ''
  }
}

// Save the order
const saveOrder = async () => {
  isSubmitting.value = true

  try {
    // Get auth store instance
    const authStore = useAuthStore()

    // Check if user is authenticated
    if (!authStore.isLoggedIn) {
      useToast().add({
        title: 'Authentication required',
        description: 'Please log in to edit an order',
        color: 'orange',
      })
      navigateTo('/auth/login')
      return
    }

    // Prepare data with proper type conversions
    const orderData = {
      clientId: form.value.clientId,
      styleId: form.value.styleId === '' ? null : form.value.styleId,
      status: form.value.status,
      dueDate: form.value.dueDate ? new Date(form.value.dueDate).getTime() : null,
      totalAmount: Number(form.value.totalAmount || 0),
      depositAmount: Number(form.value.depositAmount || 0),
      notes: form.value.notes || '',
    }

    console.log('Sending order update:', orderData)

    // Update the order
    try {
      await $fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        body: orderData,
        headers: {
          ...authStore.getAuthHeaders(),
          'Content-Type': 'application/json',
        },
      })

      // Show success message
      useToast().add({
        title: 'Success',
        description: 'Order updated successfully',
        color: 'green',
      })

      // Navigate back to the order details page
      navigateTo(`/orders/${orderId}/detail`)
    } catch (apiError) {
      console.error('API error when updating order:', apiError)

      if (apiError.response) {
        console.error('Error response:', apiError.response._data)
      }

      throw apiError // Re-throw for the outer catch block
    }
  } catch (error) {
    console.error('Error updating order:', error)

    // Handle different types of errors
    let errorMessage = 'Failed to update order. Please try again.'

    if (error.response?.status === 401) {
      errorMessage = 'Your session has expired. Please log in again.'
      navigateTo('/auth/login')
    } else if (error.response?.status === 404) {
      errorMessage = 'Order not found. It may have been deleted.'
      navigateTo('/orders')
    } else if (error.response?.status === 400) {
      errorMessage = 'Invalid order data. Please check your inputs.'
    } else if (error.message) {
      errorMessage = error.message
    }

    useToast().add({
      title: 'Error',
      description: errorMessage,
      color: 'error',
    })
  } finally {
    isSubmitting.value = false
  }
}

// Fetch order, measurements and styles data
const fetchData = async () => {
  isLoading.value = true

  try {
    // Check if user is authenticated
    if (!authStore.isLoggedIn) {
      useToast().add({
        title: 'Authentication required',
        description: 'Please log in to edit an order',
        color: 'warning',
      })
      navigateTo('/auth/login')
      return
    }

    // Fetch styles first, so we have style data available when processing the order
    await styleStore.fetchStyles()

    // Then fetch the order data
    console.log(`Fetching order with ID: ${orderId}`)
    let orderData

    try {
      orderData = await $fetch(`/api/orders/${orderId}`, {
        headers: {
          ...authStore.getAuthHeaders(),
          'Content-Type': 'application/json',
        },
      })

      console.log('Retrieved order data:', orderData)
    } catch (orderError) {
      console.error('Error fetching order:', orderError)

      if (orderError.response?.status === 404) {
        useToast().add({
          title: 'Error',
          description: 'Order not found. It may have been deleted.',
          color: 'error',
        })

        setTimeout(() => {
          navigateTo('/orders')
        }, 1500)
        return
      }

      throw orderError // Re-throw for the outer catch block
    }

    if (!orderData || !orderData.id) {
      throw new Error('Invalid order data received')
    }

    // Now populate the form with existing data
    form.value = {
      clientId: orderData.clientId || '',
      styleId: orderData.styleId || null, // Use null instead of empty string for consistency
      status: orderData.status || 'Pending',
      dueDate: orderData.dueDate ? formatDateForInput(orderData.dueDate) : '',
      totalAmount: Number(orderData.totalAmount || 0),
      depositAmount: Number(orderData.depositAmount || 0),
      notes: orderData.notes || '',
    }

    // Set client name for display
    clientName.value = orderData.clientName || 'Client'

    console.log('Form initialized with:', form.value)
  } catch (error) {
    console.error('Error fetching data:', error)
    let errorMessage = 'Failed to load order data. Please try again.'

    // Log detailed error information
    if (error.response) {
      console.error('Response status:', error.response.status)
      console.error('Response data:', error.response._data)

      // Handle specific error cases
      if (error.response.status === 401) {
        errorMessage = 'Your session has expired. Please log in again.'
        navigateTo('/auth/login')
      } else if (error.response.status === 404) {
        errorMessage = 'Order not found. It may have been deleted.'
        navigateTo('/orders')
      }
    } else {
      console.error('Error details:', error.message || 'Unknown error')
    }

    useToast().add({
      title: 'Error',
      description: errorMessage,
      color: 'error',
    })
  } finally {
    isLoading.value = false
  }
}

// Fetch data on component mount
onMounted(() => {
  fetchData()
})

// Watch for style loading state
watch(
  () => styleStore.isLoading,
  loading => {
    if (!loading && styleStore.error) {
      useToast().add({
        title: 'Error',
        description: styleStore.error,
        color: 'error',
      })
    }
  }
)
</script>
