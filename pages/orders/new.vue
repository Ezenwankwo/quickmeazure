<template>
  <div class="space-y-6">
    <div class="flex items-center">
      <UButton
        icon="i-heroicons-arrow-left"
        color="gray"
        variant="ghost"
        to="/orders"
        class="mr-4"
      />
      <h1 class="text-xl font-bold">Create New Order</h1>
    </div>
    
    <UCard class="bg-white">
      <form @submit.prevent="saveOrder" class="space-y-6">
        <!-- Basic Information -->
        <div>
          <h2 class="text-lg font-medium mb-4">Order Information</h2>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <!-- Measurement Selection (instead of client) -->
            <UFormGroup label="Measurement" name="measurementId" required>
              <USelect
                v-model="form.measurementId"
                :options="measurementOptions"
                placeholder="Select a measurement"
                required
                @update:model-value="updateClientId"
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
            to="/orders"
          >
            Cancel
          </UButton>
          <UButton
            type="submit"
            color="primary"
            :loading="isSubmitting"
          >
            Create Order
          </UButton>
        </div>
      </form>
    </UCard>
  </div>
</template>

<script setup>
// Set page metadata
useHead({
  title: 'Create New Order - QuickMeazure',
});

// Import auth composable
import { useSessionAuth } from '~/composables/useSessionAuth';

// Form state
const form = ref({
  measurementId: '',
  clientId: '',
  styleId: '',
  status: 'Pending',
  dueDate: '',
  totalAmount: 0,
  depositAmount: 0,
  notes: '',
});

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

// State variables
const isSubmitting = ref(false);
const measurements = ref([]);
const styles = ref([]);

// Generate options for measurements dropdown
const measurementOptions = computed(() => {
  return measurements.value.map(measurement => ({
    label: `${measurement.clientName} - ${formatMeasurementLabel(measurement)}`,
    value: measurement.id
  }));
});

// Format measurement label to show key measurements in the dropdown
const formatMeasurementLabel = (measurement) => {
  const keyMeasurements = [];
  if (measurement.bust) keyMeasurements.push(`Bust: ${measurement.bust}"`);
  if (measurement.waist) keyMeasurements.push(`Waist: ${measurement.waist}"`);
  if (measurement.hip) keyMeasurements.push(`Hip: ${measurement.hip}"`);
  
  return keyMeasurements.length > 0 
    ? keyMeasurements.join(', ') 
    : 'Measurement ' + new Date(measurement.updatedAt).toLocaleDateString();
};

const styleOptions = computed(() => {
  return styles.value.map(style => ({
    label: style.name,
    value: style.id
  }));
});

// When measurement is selected, set the clientId
const updateClientId = () => {
  const selectedMeasurement = measurements.value.find(m => m.id === form.value.measurementId);
  if (selectedMeasurement) {
    form.value.clientId = selectedMeasurement.clientId;
  }
};

// Calculate balance when total or deposit changes
const calculateBalance = () => {
  // Form validation to ensure deposit isn't more than total
  if (form.value.depositAmount > form.value.totalAmount) {
    form.value.depositAmount = form.value.totalAmount;
  }
};

// Fetch measurements and styles data
const fetchData = async () => {
  try {
    // Get auth token from the auth store
    const auth = useSessionAuth();
    const token = auth.token.value;
    
    if (!token) {
      // Redirect to login if not authenticated
      useToast().add({
        title: 'Authentication required',
        description: 'Please log in to create an order',
        color: 'orange'
      });
      navigateTo('/auth/login');
      return;
    }
    
    // Fetch measurements
    const measurementsData = await $fetch('/api/measurements', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    measurements.value = measurementsData;
    
    // Fetch styles
    const stylesData = await $fetch('/api/styles', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    styles.value = stylesData;
  } catch (error) {
    console.error('Error fetching data:', error);
    useToast().add({
      title: 'Error',
      description: 'Failed to load required data. Please refresh the page.',
      color: 'red',
    });
  }
};

// Save the order
const saveOrder = async () => {
  // Form validation
  if (!form.value.measurementId || !form.value.clientId || form.value.totalAmount <= 0) {
    useToast().add({
      title: 'Validation Error',
      description: 'Please fill in all required fields.',
      color: 'red',
    });
    return;
  }
  
  isSubmitting.value = true;
  
  try {
    // Get auth token from the auth store
    const auth = useSessionAuth();
    const token = auth.token.value;
    
    // Format due date
    let dueDate = null;
    if (form.value.dueDate) {
      dueDate = new Date(form.value.dueDate);
    }
    
    // Call the create order API
    const newOrder = await $fetch('/api/orders', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: {
        clientId: form.value.clientId,
        measurementId: form.value.measurementId,
        styleId: form.value.styleId || null,
        status: form.value.status,
        dueDate: dueDate,
        totalAmount: form.value.totalAmount,
        depositAmount: form.value.depositAmount || 0,
        notes: form.value.notes
      }
    });
    
    // Show success notification
    useToast().add({
      title: 'Order Created',
      description: 'New order has been created successfully.',
      color: 'green',
    });
    
    // Redirect to order detail page
    navigateTo(`/orders/${newOrder.id}/detail`);
  } catch (error) {
    console.error('Error creating order:', error);
    let errorMessage = 'Failed to create order. Please try again.';
    
    // Handle unauthorized errors
    if (error.response?.status === 401) {
      errorMessage = 'Your session has expired. Please log in again.';
      // Redirect to login
      navigateTo('/auth/login');
    }
    
    useToast().add({
      title: 'Error',
      description: errorMessage,
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