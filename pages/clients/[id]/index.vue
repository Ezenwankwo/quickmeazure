<template>
  <div class="space-y-6">
    <PageHeader
      title="Client Details"
      subtitle="View and manage client information"
      :primaryAction="{
        label: 'Back to Clients',
        icon: 'i-heroicons-arrow-left',
        to: '/clients'
      }"
    />
    
    <div v-if="isLoading" class="flex justify-center py-12">
      <USkeleton class="h-32 w-full" />
    </div>
    
    <template v-else-if="client">
      <!-- Client Information -->
      <UCard class="bg-white">
        <template #header>
          <div class="flex items-center justify-between">
            <h2 class="text-lg font-medium">Client Information</h2>
            <UButton
              color="primary"
              variant="ghost"
              icon="i-heroicons-pencil-square"
              :to="`/clients/${clientId}/edit`"
            >
              Edit
            </UButton>
          </div>
        </template>
        
        <div class="flex flex-col md:flex-row gap-6">
          <!-- Avatar and Name -->
          <div class="flex flex-col items-center md:items-start">
            <div class="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center mb-3">
              <span class="text-primary-700 text-2xl font-medium">{{ getInitials(client.name) }}</span>
            </div>
            <h1 class="text-xl font-bold text-gray-900 mb-1">{{ client.name }}</h1>
            <p class="text-gray-500">Client since {{ formatDate(client.createdAt) }}</p>
          </div>
          
          <!-- Contact Info -->
          <div class="flex-1 space-y-4">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div class="text-sm text-gray-500 mb-1">Email</div>
                <div>{{ client.email || 'Not provided' }}</div>
              </div>
              <div>
                <div class="text-sm text-gray-500 mb-1">Phone</div>
                <div>{{ client.phone || 'Not provided' }}</div>
              </div>
              <div>
                <div class="text-sm text-gray-500 mb-1">Address</div>
                <div>{{ client.address || 'Not provided' }}</div>
              </div>
            </div>
            
          </div>
        </div>
      </UCard>
      
      <!-- Measurements Card -->
      <UCard v-if="client" class="bg-white">
        <template #header>
          <div class="flex items-center justify-between">
            <h2 class="text-lg font-medium">Measurements</h2>
            <UButton
              color="primary"
              variant="ghost"
              icon="i-heroicons-pencil-square"
              :to="`/clients/${clientId}/edit`"
            >
              Edit
            </UButton>
          </div>
        </template>
        
        <div v-if="client.measurement">
          <!-- Upper Body Measurements -->
          <div class="mb-6">
            <h4 class="text-sm font-medium text-gray-700 mb-3 flex items-center">
              Upper Body
            </h4>
            <div class="grid grid-cols-2 md:grid-cols-3 gap-3">
              <div v-if="client.measurement.bust !== null" class="bg-white border border-gray-200 rounded-lg p-3 shadow-sm">
                <div class="text-xs text-gray-500 mb-1">Bust</div>
                <div class="font-medium">{{ client.measurement.bust }}"</div>
              </div>
              
              <div v-if="client.measurement.waist !== null" class="bg-white border border-gray-200 rounded-lg p-3 shadow-sm">
                <div class="text-xs text-gray-500 mb-1">Waist</div>
                <div class="font-medium">{{ client.measurement.waist }}"</div>
              </div>
              
              <div v-if="client.measurement.chest !== null" class="bg-white border border-gray-200 rounded-lg p-3 shadow-sm">
                <div class="text-xs text-gray-500 mb-1">Chest</div>
                <div class="font-medium">{{ client.measurement.chest }}"</div>
              </div>
              
              <div v-if="client.measurement.shoulder !== null" class="bg-white border border-gray-200 rounded-lg p-3 shadow-sm">
                <div class="text-xs text-gray-500 mb-1">Shoulder</div>
                <div class="font-medium">{{ client.measurement.shoulder }}"</div>
              </div>
              
              <div v-if="client.measurement.sleeve !== null" class="bg-white border border-gray-200 rounded-lg p-3 shadow-sm">
                <div class="text-xs text-gray-500 mb-1">Sleeve</div>
                <div class="font-medium">{{ client.measurement.sleeve }}"</div>
              </div>
              
              <div v-if="client.measurement.neck !== null" class="bg-white border border-gray-200 rounded-lg p-3 shadow-sm">
                <div class="text-xs text-gray-500 mb-1">Neck</div>
                <div class="font-medium">{{ client.measurement.neck }}"</div>
              </div>
            </div>
          </div>
          
          <!-- Lower Body Measurements -->
          <div class="mb-6">
            <h4 class="text-sm font-medium text-gray-700 mb-3 flex items-center">
              Lower Body
            </h4>
            <div class="grid grid-cols-2 md:grid-cols-3 gap-3">
              <div v-if="client.measurement.hip !== null" class="bg-white border border-gray-200 rounded-lg p-3 shadow-sm">
                <div class="text-xs text-gray-500 mb-1">Hip</div>
                <div class="font-medium">{{ client.measurement.hip }}"</div>
              </div>
              
              <div v-if="client.measurement.inseam !== null" class="bg-white border border-gray-200 rounded-lg p-3 shadow-sm">
                <div class="text-xs text-gray-500 mb-1">Inseam</div>
                <div class="font-medium">{{ client.measurement.inseam }}"</div>
              </div>
              
              <div v-if="client.measurement.thigh !== null" class="bg-white border border-gray-200 rounded-lg p-3 shadow-sm">
                <div class="text-xs text-gray-500 mb-1">Thigh</div>
                <div class="font-medium">{{ client.measurement.thigh }}"</div>
              </div>
            </div>
          </div>
          
          <!-- Custom Measurements -->
          <div v-if="client.measurement.additionalMeasurements && Object.keys(client.measurement.additionalMeasurements).length > 0" class="mb-6">
            <h4 class="text-sm font-medium text-gray-700 mb-3 flex items-center">
              Custom Measurements
            </h4>
            <div class="grid grid-cols-2 md:grid-cols-3 gap-3">
              <div v-for="(value, key) in client.measurement.additionalMeasurements" :key="key" 
                  class="bg-white border border-gray-200 rounded-lg p-3 shadow-sm">
                <div class="text-xs text-gray-500 mb-1">{{ key }}</div>
                <div class="font-medium">{{ value }}</div>
              </div>
            </div>
          </div>
          
          <!-- Measurement Notes -->
          <div v-if="client.measurement.notes" class="mb-4">
            <h4 class="text-sm font-medium text-gray-700 mb-3 flex items-center">
              Notes
            </h4>
            <div class="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
              <div class="whitespace-pre-line">{{ client.measurement.notes }}</div>
            </div>
          </div>
          
          <div v-if="client.measurement.lastUpdated" class="mt-4 text-xs text-gray-500 italic">
            Last updated: {{ formatDate(client.measurement.lastUpdated) }}
          </div>
        </div>
        
        <div v-else class="text-center py-5 bg-white border border-gray-200 rounded-lg shadow-sm">
          <UIcon name="i-heroicons-ruler" class="text-gray-400 mx-auto mb-2" size="lg" />
          <h3 class="text-base font-medium text-gray-900">No measurements available</h3>
          <p class="text-gray-500 text-sm mt-1">Measurements will appear here when added</p>
        </div>
      </UCard>
      
      <!-- Orders -->
      <UCard class="bg-white">
        <template #header>
          <div class="flex items-center justify-between">
            <h2 class="text-lg font-medium">Orders</h2>
            <UButton
              color="primary"
              variant="solid"
              icon="i-heroicons-plus"
              :to="`/orders/new?clientId=${clientId}`"
            >
              Create Order
            </UButton>
          </div>
        </template>
        
        <div v-if="isLoadingOrders" class="py-6 flex justify-center">
          <USkeleton class="h-24 w-full" />
        </div>
        
        <div v-else-if="orders.length === 0" class="py-6 text-center">
          <UIcon name="i-heroicons-shopping-bag" class="text-gray-400 mx-auto mb-2" size="xl" />
          <h3 class="text-lg font-medium text-gray-900">No orders yet</h3>
          <p class="text-gray-500 mt-1 mb-4">Create your first order for this client</p>
          <UButton
            color="primary"
            :to="`/orders/new?clientId=${clientId}`"
            icon="i-heroicons-plus"
          >
            Create Order
          </UButton>
        </div>
        
        <div v-else>
          <UTable 
            :columns="orderColumns" 
            :rows="orders"
            hover
          >
            <template #status-data="{ row }">
              <UBadge
                :color="getStatusColor(row.status)"
                variant="subtle"
                size="sm"
              >
                {{ row.status }}
              </UBadge>
            </template>
            
            <template #dueDate-data="{ row }">
              <div v-if="row.dueDate" class="flex items-center">
                <span :class="{
                  'text-red-600 font-medium': isOverdue(row.dueDate),
                  'text-amber-600 font-medium': !isOverdue(row.dueDate) && isDueSoon(row.dueDate)
                }">
                  {{ formatDate(row.dueDate) }}
                </span>
                <UIcon v-if="isOverdue(row.dueDate)" name="i-heroicons-exclamation-circle" class="text-red-500 ml-1" />
                <UIcon v-else-if="isDueSoon(row.dueDate)" name="i-heroicons-clock" class="text-amber-500 ml-1" />
              </div>
              <span v-else class="text-gray-400">Not set</span>
            </template>
            
            <template #payment-data="{ row }">
              <div class="flex flex-col">
                <div class="text-sm font-medium">{{ formatPrice(row.totalAmount) }}</div>
                <div class="text-xs" :class="{
                  'text-green-600': row.balanceAmount <= 0,
                  'text-amber-600': row.depositAmount > 0 && row.balanceAmount > 0,
                  'text-gray-500': row.depositAmount <= 0
                }">
                  <template v-if="row.balanceAmount <= 0">Paid in full</template>
                  <template v-else-if="row.depositAmount > 0">{{ formatPrice(row.balanceAmount) }} balance</template>
                  <template v-else>No payment</template>
                </div>
              </div>
            </template>
            
            <template #actions-data="{ row }">
              <div class="flex space-x-2">
                <UButton
                  icon="i-heroicons-eye"
                  color="gray"
                  variant="ghost"
                  size="xs"
                  :to="`/orders/${row.id}/detail`"
                />
                <UButton
                  color="gray"
                  variant="ghost"
                  icon="i-heroicons-pencil-square"
                  size="xs"
                  :to="`/orders/${row.id}/edit`"
                />
              </div>
            </template>
          </UTable>
        </div>
      </UCard>
    </template>
    
    <template v-else>
      <UCard class="bg-white">
        <div class="py-12 text-center">
          <UIcon name="i-heroicons-face-frown" class="text-gray-400 mx-auto mb-2" size="xl" />
          <h3 class="text-lg font-medium text-gray-900">Client not found</h3>
          <p class="text-gray-500 mt-1 mb-4">This client doesn't exist or you don't have access to it.</p>
          <UButton
            color="primary"
            to="/clients"
            icon="i-heroicons-arrow-left"
          >
            Back to Clients
          </UButton>
        </div>
      </UCard>
    </template>
  </div>
</template>

<script setup>
// Get client ID from route
const route = useRoute();
const clientId = route.params.id;

// State
const client = ref(null);
const isLoading = ref(true);
const orders = ref([]);
const isLoadingOrders = ref(true);

// Set page metadata
useHead({
  title: client.value?.name ? `${client.value.name} - QuickMeazure` : 'Client Details - QuickMeazure',
});

// Watch for client name changes to update page title
watch(() => client.value?.name, (newName) => {
  if (newName) {
    useHead({
      title: `${newName} - QuickMeazure`,
    });
  }
});

// Fetch client details
const fetchClient = async () => {
  isLoading.value = true;
  
  try {
    // Get auth token from the auth store
    const auth = useSessionAuth();
    const token = auth.token.value;
    
    if (!token) {
      // Redirect to login if not authenticated
      useToast().add({
        title: 'Authentication required',
        description: 'Please log in to view client details',
        color: 'orange'
      });
      navigateTo('/auth/login');
      return;
    }
    
    // Fetch client by ID
    const data = await $fetch(`/api/clients/${clientId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    client.value = data;
  } catch (error) {
    console.error('Error fetching client:', error);
    let errorMessage = 'Failed to load client details. Please try again.';
    
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

// Fetch client orders
const fetchOrders = async () => {
  if (!clientId) return;
  isLoadingOrders.value = true;
  
  try {
    // Get auth token from the auth store
    const auth = useSessionAuth();
    const token = auth.token.value;
    
    // Fetch orders for this client
    const data = await $fetch(`/api/orders?clientId=${clientId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    orders.value = data;
  } catch (error) {
    console.error('Error fetching orders:', error);
    useToast().add({
      title: 'Error',
      description: 'Failed to load orders',
      color: 'red',
    });
  } finally {
    isLoadingOrders.value = false;
  }
};

// Column definitions for orders table
const orderColumns = [
  {
    key: 'status',
    label: 'Status',
    id: 'status'
  },
  {
    key: 'dueDate',
    label: 'Due Date',
    id: 'dueDate'
  },
  {
    key: 'payment',
    label: 'Payment',
    id: 'payment'
  },
  {
    key: 'actions',
    label: '',
    id: 'actions'
  },
];

// Utility functions
const getInitials = (name) => {
  if (!name) return '';
  return name.split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .substring(0, 2);
};

const formatDate = (timestamp) => {
  const date = new Date(timestamp);
  return date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: '2-digit', 
    year: 'numeric' 
  });
};

const formatPrice = (amount) => {
  return `₦${amount.toLocaleString()}`;
};

// Check if order is overdue
const isOverdue = (dueDate) => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  return dueDate < today;
};

// Check if order is due soon (within 3 days)
const isDueSoon = (dueDate) => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const threeDaysFromNow = today + 3 * 24 * 60 * 60 * 1000;
  return dueDate >= today && dueDate <= threeDaysFromNow;
};

// Get status color
const getStatusColor = (status) => {
  switch (status) {
    case 'Pending': return 'gray';
    case 'In Progress': return 'blue';
    case 'Ready for Pickup': return 'amber';
    case 'Completed': return 'green';
    case 'Cancelled': return 'red';
    default: return 'gray';
  }
};

// Fetch data on component mount
onMounted(() => {
  fetchClient();
  fetchOrders();
});
</script> 