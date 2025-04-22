<template>
  <div class="space-y-4 sm:space-y-6">
    <div class="flex items-center">
      <UButton
        icon="i-heroicons-arrow-left"
        color="gray"
        variant="ghost"
        :to="`/orders/${orderId}/detail`"
        class="mr-4"
      />
      <h1 class="text-xl font-bold">Edit Order</h1>
    </div>
    
    <div v-if="isLoading" class="flex justify-center py-12">
      <ULoading />
    </div>
    
    <UCard v-else class="bg-white">
      <form @submit.prevent="saveOrder" class="space-y-6">
        <!-- Basic Information -->
        <div>
          <h2 class="text-lg font-medium mb-4">Order Information</h2>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <!-- Client (read-only) -->
            <UFormGroup label="Client" name="clientId" required>
              <UInput
                :model-value="clientName"
                disabled
                class="bg-gray-50"
              />
            </UFormGroup>
            
            <!-- Measurement Selection -->
            <UFormGroup label="Measurement" name="measurementId" required>
              <USelect
                v-model="form.measurementId"
                :options="measurementOptions"
                placeholder="Select a measurement"
                required
              />
            </UFormGroup>
            
            <!-- Style Selection -->
            <UFormGroup label="Style" name="styleId">
              <USelect
                v-model="form.styleId"
                :options="styleOptions"
                placeholder="Select a style (optional)"
              />
            </UFormGroup>

            <!-- Order Status -->
            <UFormGroup label="Status" name="status" required>
              <USelect
                v-model="form.status"
                :options="statusOptions"
                placeholder="Select status"
                required
              />
            </UFormGroup>
            
            <!-- Due Date -->
            <UFormGroup label="Due Date" name="dueDate">
              <UInput
                v-model="form.dueDate"
                type="date"
              />
            </UFormGroup>
          </div>
        </div>
        
        <!-- Payment Information -->
        <div>
          <h2 class="text-lg font-medium mb-4">Payment Information</h2>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <UFormGroup label="Total Amount" name="totalAmount" required>
              <UInputGroup>
                <template #prepend>
                  <span class="text-gray-500">₦</span>
                </template>
                <UInput
                  v-model.number="form.totalAmount"
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  @input="calculateBalance"
                />
              </UInputGroup>
            </UFormGroup>
            
            <UFormGroup label="Deposit Amount" name="depositAmount">
              <UInputGroup>
                <template #prepend>
                  <span class="text-gray-500">₦</span>
                </template>
                <UInput
                  v-model.number="form.depositAmount"
                  type="number"
                  step="0.01"
                  min="0"
                  @input="calculateBalance"
                />
              </UInputGroup>
            </UFormGroup>

            <UFormGroup label="Balance Due" name="balanceAmount">
              <UInputGroup>
                <template #prepend>
                  <span class="text-gray-500">₦</span>
                </template>
                <UInput
                  :model-value="balanceAmount"
                  type="number"
                  disabled
                  class="bg-gray-50"
                />
              </UInputGroup>
            </UFormGroup>
          </div>
        </div>
        
        <!-- Additional Information -->
        <div>
          <h2 class="text-lg font-medium mb-4">Additional Information</h2>
          <UFormGroup label="Notes" name="notes">
            <UTextarea
              v-model="form.notes"
              placeholder="Add any additional notes about this order..."
              rows="4"
            />
          </UFormGroup>
        </div>
        
        <!-- Action Buttons -->
        <div class="flex justify-end space-x-4">
          <UButton
            type="button"
            color="gray"
            variant="outline"
            :to="`/orders/${orderId}/detail`"
          >
            Cancel
          </UButton>
          <UButton
            type="submit"
            color="primary"
            :loading="isSubmitting"
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
const route = useRoute();
const orderId = route.params.id;

// Import auth composable
import { useSessionAuth } from '~/composables/useSessionAuth';

// Set page metadata
useHead({
  title: 'Edit Order - QuickMeazure',
  meta: [
    { name: 'viewport', content: 'width=device-width, initial-scale=1, maximum-scale=1' }
  ]
});

// Form state
const form = ref({
  measurementId: '',
  clientId: '',
  styleId: '',
  status: '',
  dueDate: '',
  totalAmount: 0,
  depositAmount: 0,
  notes: '',
});

// Client name for display
const clientName = ref('');

// State variables
const isLoading = ref(true);
const isSubmitting = ref(false);
const measurements = ref([]);
const styles = ref([]);

// Computed for balance amount
const balanceAmount = computed(() => {
  return (form.value.totalAmount || 0) - (form.value.depositAmount || 0);
});

// Status options
const statusOptions = [
  { label: 'Pending', value: 'Pending' },
  { label: 'In Progress', value: 'In Progress' },
  { label: 'Ready for Pickup', value: 'Ready for Pickup' },
  { label: 'Completed', value: 'Completed' },
  { label: 'Cancelled', value: 'Cancelled' },
];

// Generate options for measurements dropdown - filtered by client
const measurementOptions = computed(() => {
  // Check if we have a valid clientId before filtering
  if (!form.value.clientId) return [];
  
  // Filter measurements by clientId and ensure they exist
  return measurements.value
    .filter(measurement => measurement.clientId === form.value.clientId)
    .map(measurement => ({
      label: formatMeasurementLabel(measurement),
      value: measurement.id
    }));
});

// Format measurement label to show key measurements in the dropdown
const formatMeasurementLabel = (measurement) => {
  if (!measurement) return 'Unknown measurement';
  
  const keyMeasurements = [];
  if (measurement.bust) keyMeasurements.push(`Bust: ${measurement.bust}"`);
  if (measurement.waist) keyMeasurements.push(`Waist: ${measurement.waist}"`);
  if (measurement.hip) keyMeasurements.push(`Hip: ${measurement.hip}"`);
  
  return keyMeasurements.length > 0 
    ? keyMeasurements.join(', ') 
    : 'Measurement ' + new Date(measurement.updatedAt || Date.now()).toLocaleDateString();
};

const styleOptions = computed(() => {
  return styles.value.map(style => ({
    label: style.name,
    value: style.id
  }));
});

// Calculate balance when total or deposit changes
const calculateBalance = () => {
  // Form validation to ensure deposit isn't more than total
  if (form.value.depositAmount > form.value.totalAmount) {
    form.value.depositAmount = form.value.totalAmount;
  }
};

// Format date for input field
const formatDateForInput = (dateString) => {
  if (!dateString) return '';
  
  try {
    // Handle different date formats
    let date;
    
    if (typeof dateString === 'number') {
      // Handle timestamp number
      date = new Date(dateString);
    } else if (typeof dateString === 'string') {
      // Check if it's an ISO string or other format
      if (dateString.includes('T')) {
        // ISO format
        date = new Date(dateString);
      } else if (dateString.includes('-')) {
        // YYYY-MM-DD format
        const [year, month, day] = dateString.split('-').map(Number);
        date = new Date(year, month - 1, day);
      } else {
        // Try general parsing
        date = new Date(dateString);
      }
    } else {
      // Default fallback
      date = new Date(dateString);
    }
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      console.warn('Invalid date:', dateString);
      return '';
    }
    
    // Format as YYYY-MM-DD for input type="date"
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
  } catch (error) {
    console.error('Error formatting date:', error, dateString);
    return '';
  }
};

// Fetch order, measurements and styles data
const fetchData = async () => {
  isLoading.value = true;
  
  try {
    // Get auth token from the auth store
    const auth = useSessionAuth();
    const token = auth.token.value;
    
    if (!token) {
      // Redirect to login if not authenticated
      useToast().add({
        title: 'Authentication required',
        description: 'Please log in to edit an order',
        color: 'orange'
      });
      navigateTo('/auth/login');
      return;
    }
    
    // Fetch the order data
    const orderData = await $fetch(`/api/orders/${orderId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('Retrieved order data:', orderData);
    
    // Fetch measurements and styles before populating form
    // to ensure all data is available for filters
    
    // Fetch measurements
    const measurementsData = await $fetch('/api/measurements', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    measurements.value = measurementsData;
    console.log('Retrieved measurements:', measurementsData.length);
    
    // Fetch styles
    const stylesData = await $fetch('/api/styles', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    styles.value = stylesData;
    
    // Now populate the form with existing data
    form.value = {
      clientId: orderData.clientId || '',
      measurementId: orderData.measurementId || '',
      styleId: orderData.styleId || '',
      status: orderData.status || 'Pending',
      dueDate: orderData.dueDate ? formatDateForInput(orderData.dueDate) : '',
      totalAmount: orderData.totalAmount || 0,
      depositAmount: orderData.depositAmount || 0,
      notes: orderData.notes || '',
    };
    
    // Set client name for display
    clientName.value = orderData.clientName || 'Client';
    
    console.log('Form initialized with:', form.value);
    console.log('Available measurement options:', measurementOptions.value);
    
  } catch (error) {
    console.error('Error fetching data:', error);
    let errorMessage = 'Failed to load order data. Please try again.';
    
    // Handle unauthorized errors
    if (error.response?.status === 401) {
      errorMessage = 'Your session has expired. Please log in again.';
      navigateTo('/auth/login');
    }
    
    useToast().add({
      title: 'Error',
      description: errorMessage,
      color: 'red',
    });
  } finally {
    isLoading.value = false;
  }
};

// Save the order
const saveOrder = async () => {
  isSubmitting.value = true;
  
  try {
    // Validate form data
    if (!form.value.measurementId) {
      useToast().add({
        title: 'Validation Error',
        description: 'Please select a measurement',
        color: 'red',
      });
      isSubmitting.value = false;
      return;
    }
    
    // Get auth token from the auth store
    const auth = useSessionAuth();
    const token = auth.token.value;
    
    // Prepare data with proper type conversions
    const orderData = {
      measurementId: form.value.measurementId,
      clientId: form.value.clientId,
      styleId: form.value.styleId === '' ? null : form.value.styleId,
      status: form.value.status,
      // Simple direct timestamp conversion
      dueDate: form.value.dueDate 
        ? new Date(form.value.dueDate).getTime() 
        : null,
      totalAmount: Number(form.value.totalAmount || 0),
      depositAmount: Number(form.value.depositAmount || 0),
      notes: form.value.notes || ''
    };
    
    console.log('Sending order update:', orderData);
    
    // Update the order
    await $fetch(`/api/orders/${orderId}`, {
      method: 'PATCH',
      body: orderData,
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    // Show success message
    useToast().add({
      title: 'Success',
      description: 'Order updated successfully',
      color: 'green',
    });
    
    // Navigate back to the order details page
    navigateTo(`/orders/${orderId}/detail`);
    
  } catch (error) {
    console.error('Error updating order:', error);
    
    // Handle error with details
    useToast().add({
      title: 'Error',
      description: error.message || 'Failed to update order. Please try again.',
      color: 'red',
    });
  } finally {
    isSubmitting.value = false;
  }
};

// Fetch data on component mount
onMounted(() => {
  fetchData();
});
</script> 