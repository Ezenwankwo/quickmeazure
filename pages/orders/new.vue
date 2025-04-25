<template>
  <div class="space-y-6">
    <div class="flex items-center">
      <UButton
        icon="i-heroicons-arrow-left"
        color="gray"
        variant="ghost"
        size="lg"
        to="/orders"
        class="mr-4"
      />
      <h1 class="text-xl font-bold">Create New Order</h1>
    </div>
    
    <UCard class="bg-white">
      <form @submit.prevent="saveOrder" class="space-y-6">
        <!-- Basic Information -->
        <div>
          <div class="grid grid-cols-1 gap-6">
            <!-- Client Selection -->
            <UFormField label="Client" name="clientId" required>
              <USelectMenu
                v-model="form.clientId"
                :items="clientOptions"
                size="lg"
                class="w-full"
                placeholder="Select a client"
                required
              />
            </UFormField>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <!-- Style Selection -->
              <UFormField label="Style" name="styleId">
                <USelectMenu
                  v-model="form.styleId"
                  :items="styleOptions"
                  size="lg"
                  class="w-full"
                  placeholder="Select a style (optional)"
                />
              </UFormField>

              <!-- Order Status -->
              <UFormField label="Status" name="status" required>
                <USelectMenu
                  v-model="form.status"
                  :items="statusOptions"
                  size="lg"
                  class="w-full"
                  placeholder="Select status"
                  required
                />
              </UFormField>
              
              <!-- Due Date -->
              <UFormField label="Due Date" name="dueDate">
                <UInput
                  v-model="form.dueDate"
                  type="date"
                  size="lg"
                  class="w-full"
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
              @click="toggleSection('payment')" 
              class="flex justify-between items-center p-4 cursor-pointer transition-colors"
              :class="openSections.includes('payment') ? 'bg-primary-50 border-b border-primary-100' : 'bg-white'"
            >
              <div class="font-medium flex items-center">
                <UIcon 
                  name="i-heroicons-banknotes" 
                  class="h-5 w-5 mr-2 text-primary-500"
                />
                Payment Information
              </div>
              <UIcon 
                :name="openSections.includes('payment') ? 'i-heroicons-chevron-up' : 'i-heroicons-chevron-down'" 
                class="h-5 w-5 transition-transform text-primary-500"
              />
            </div>
            
            <div v-show="openSections.includes('payment')" class="p-6 bg-gray-50 rounded-b-lg space-y-6 border-t border-primary-100">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <UFormField label="Total Amount" name="totalAmount" required>
                  <UInput
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
                
                <UFormField label="Deposit Amount" name="depositAmount">
                  <UInput
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

                <UFormField label="Balance Due" name="balanceAmount">
                  <UInput
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
              @click="toggleSection('notes')" 
              class="flex justify-between items-center p-4 cursor-pointer transition-colors"
              :class="openSections.includes('notes') ? 'bg-primary-50 border-b border-primary-100' : 'bg-white'"
            >
              <div class="font-medium flex items-center">
                <UIcon 
                  name="i-heroicons-document-text" 
                  class="h-5 w-5 mr-2 text-primary-500"
                />
                Additional Information
              </div>
              <UIcon 
                :name="openSections.includes('notes') ? 'i-heroicons-chevron-up' : 'i-heroicons-chevron-down'" 
                class="h-5 w-5 transition-transform text-primary-500"
              />
            </div>
            
            <div v-show="openSections.includes('notes')" class="p-6 bg-gray-50 rounded-b-lg space-y-6 border-t border-primary-100">
              <UFormField label="Notes" name="notes">
                <UTextarea
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
            to="/orders"
          >
            Cancel
          </UButton>
          <UButton
            type="submit"
            color="primary"
            :loading="isSubmitting"
            size="lg"
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

// Track which sections are open
const openSections = ref(['payment']);

// Toggle section visibility
const toggleSection = (sectionValue) => {
  if (!openSections.value.includes(sectionValue)) {
    openSections.value.push(sectionValue);
  } else {
    openSections.value = openSections.value.filter(item => item !== sectionValue);
  }
};

// Form state
const form = ref({
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
const clients = ref([]);
const styles = ref([]);

// Generate options for clients dropdown
const clientOptions = computed(() => {
  if (!clients.value || !Array.isArray(clients.value) || clients.value.length === 0) {
    console.log('No clients available to display');
    return [];
  }
  
  return clients.value.map(client => ({
    label: client.name + (client.phone ? ` (${client.phone})` : ''),
    value: client.id,
    icon: 'i-heroicons-user'
  }));
});

const styleOptions = computed(() => {
  if (!styles.value || !Array.isArray(styles.value) || styles.value.length === 0) {
    console.log('No styles available to display');
    return [];
  }
  
  return styles.value.map(style => ({
    label: style.name || 'Unnamed Style',
    value: style.id,
    icon: 'i-heroicons-swatch'
  }));
});

// Calculate balance when total or deposit changes
const calculateBalance = () => {
  // Form validation to ensure deposit isn't more than total
  if (form.value.depositAmount > form.value.totalAmount) {
    form.value.depositAmount = form.value.totalAmount;
  }
};

// Fetch clients and styles data
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
    
    // Fetch clients
    console.log('Fetching clients data...');
    const clientsData = await $fetch('/api/clients', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (clientsData && clientsData.data) {
      clients.value = clientsData.data;
      console.log(`Successfully loaded ${clients.value.length} clients`);
    } else {
      console.warn('Clients data is not in the expected format', clientsData);
      clients.value = [];
    }
    
    // Fetch styles
    console.log('Fetching styles data...');
    const stylesData = await $fetch('/api/styles', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (stylesData && stylesData.data) {
      styles.value = stylesData.data;
      console.log(`Successfully loaded ${styles.value.length} styles`);
    } else {
      console.warn('Styles data is not in the expected format', stylesData);
      styles.value = [];
    }
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
  if (!form.value.clientId || form.value.totalAmount <= 0) {
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
        clientId: typeof form.value.clientId === 'object' ? form.value.clientId.value : form.value.clientId,
        styleId: form.value.styleId ? (typeof form.value.styleId === 'object' ? form.value.styleId.value : form.value.styleId) : null,
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