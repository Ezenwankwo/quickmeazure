<template>
  <div class="space-y-6">
    <div class="flex justify-between items-center">
      <h1 class="text-2xl font-bold">Orders</h1>
      <UButton
        to="/orders/new"
        color="primary"
        icon="i-heroicons-plus"
      >
        Create New Order
      </UButton>
    </div>
    
    <!-- Search and Filter -->
    <div class="flex flex-col md:flex-row gap-4">
      <UInput
        v-model="search"
        placeholder="Search client name..."
        icon="i-heroicons-magnifying-glass"
        class="md:w-80"
        @input="filterOrders"
      />
      
      <div class="flex gap-2 ml-auto">
        <USelect
          v-model="sortBy"
          :options="sortOptions"
          placeholder="Sort by"
          @update:model-value="filterOrders"
        />
        
        <UButton
          color="gray"
          variant="ghost"
          icon="i-heroicons-funnel"
          @click="isFilterOpen = !isFilterOpen"
        >
          Filter
        </UButton>
      </div>
    </div>
    
    <!-- Filter Panel -->
    <UCard v-if="isFilterOpen" class="bg-white mb-4">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <UFormGroup label="Status">
          <USelect
            v-model="filters.status"
            :options="statusOptions"
            placeholder="All statuses"
            @update:model-value="filterOrders"
          />
        </UFormGroup>
        
        <UFormGroup label="Due Date">
          <USelect
            v-model="filters.dueDate"
            :options="dueDateOptions"
            placeholder="Any time"
            @update:model-value="filterOrders"
          />
        </UFormGroup>
        
        <UFormGroup label="Payment Status">
          <USelect
            v-model="filters.paymentStatus"
            :options="paymentStatusOptions"
            placeholder="All payment statuses"
            @update:model-value="filterOrders"
          />
        </UFormGroup>
      </div>
      
      <div class="flex justify-end mt-4">
        <UButton
          color="gray"
          variant="outline"
          @click="resetFilters"
        >
          Reset Filters
        </UButton>
      </div>
    </UCard>
    
    <!-- Orders Table -->
    <UCard class="bg-white">
      <UTable 
        :columns="columns" 
        :rows="filteredOrders" 
        :loading="isLoading"
        :empty-state="{
          icon: 'i-heroicons-shopping-bag',
          label: 'No orders found',
          description: search || isFilterApplied ? 'Try adjusting your search or filters' : 'Get started by creating your first order',
          action: search || isFilterApplied ? { label: 'Reset filters', click: resetFilters } : { label: 'Create order', to: '/orders/new' }
        }"
      >
        <template #client-data="{ row }">
          <div class="flex items-center">
            <div class="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center mr-3">
              <span class="text-primary-700 font-medium">{{ getInitials(row.client) }}</span>
            </div>
            <NuxtLink :to="`/clients/${row.clientId}`" class="font-medium text-primary-600 hover:underline">
              {{ row.client }}
            </NuxtLink>
          </div>
        </template>
        
        <template #style-data="{ row }">
          <div v-if="row.style" class="flex items-center">
            <div v-if="row.styleImageUrl" class="w-8 h-8 rounded bg-gray-100 mr-2 overflow-hidden">
              <img :src="row.styleImageUrl" :alt="row.style" class="w-full h-full object-cover" />
            </div>
            <span>{{ row.style }}</span>
          </div>
          <span v-else class="text-gray-500">—</span>
        </template>
        
        <template #dueDate-data="{ row }">
          <div class="flex items-center">
            <span :class="{
              'text-red-600': isOverdue(row.dueDate),
              'text-amber-600': isDueSoon(row.dueDate) && !isOverdue(row.dueDate),
            }">{{ formatDate(row.dueDate) }}</span>
            
            <UBadge 
              v-if="isOverdue(row.dueDate)" 
              color="red" 
              variant="subtle"
              size="xs"
              class="ml-2"
            >
              Overdue
            </UBadge>
            
            <UBadge 
              v-else-if="isDueSoon(row.dueDate)" 
              color="amber" 
              variant="subtle"
              size="xs"
              class="ml-2"
            >
              Due Soon
            </UBadge>
          </div>
        </template>
        
        <template #status-data="{ row }">
          <UBadge
            :color="getStatusColor(row.status)"
            variant="subtle"
            size="sm"
          >
            {{ row.status }}
          </UBadge>
        </template>
        
        <template #payment-data="{ row }">
          <div>
            <div class="font-medium">{{ formatPrice(row.totalAmount) }}</div>
            <div class="text-xs text-gray-500">
              <span v-if="row.balanceAmount > 0">
                {{ formatPrice(row.depositAmount) }} paid
              </span>
              <span v-else class="text-green-600 font-medium">Paid in full</span>
            </div>
          </div>
        </template>
        
        <template #actions-data="{ row }">
          <div class="flex space-x-2">
            <UButton
              color="gray"
              variant="ghost"
              icon="i-heroicons-eye"
              size="xs"
              :to="`/orders/${row.id}`"
            />
            <UButton
              color="gray"
              variant="ghost"
              icon="i-heroicons-pencil-square"
              size="xs"
              :to="`/orders/${row.id}/edit`"
            />
            <UDropdown
              :items="[
                [
                  {
                    label: 'Mark as Completed',
                    icon: 'i-heroicons-check-circle',
                    click: () => updateOrderStatus(row, 'Completed'),
                    disabled: row.status === 'Completed'
                  },
                  {
                    label: 'Record Payment',
                    icon: 'i-heroicons-currency-dollar',
                    to: `/orders/${row.id}/payment`,
                    disabled: row.balanceAmount <= 0
                  }
                ],
                [
                  {
                    label: 'Delete Order',
                    icon: 'i-heroicons-trash',
                    click: () => confirmDelete(row),
                    color: 'red'
                  }
                ]
              ]"
            >
              <UButton
                color="gray"
                variant="ghost"
                icon="i-heroicons-ellipsis-vertical"
                size="xs"
              />
            </UDropdown>
          </div>
        </template>
      </UTable>
    </UCard>
    
    <!-- Delete Confirmation Modal -->
    <UModal v-model="showDeleteModal">
      <UCard>
        <template #header>
          <h3 class="text-lg font-medium">Confirm Deletion</h3>
        </template>
        
        <p>Are you sure you want to delete the order for <strong>{{ orderToDelete?.client }}</strong>? This action cannot be undone.</p>
        
        <template #footer>
          <div class="flex justify-end space-x-4">
            <UButton
              color="gray"
              variant="outline"
              @click="showDeleteModal = false"
            >
              Cancel
            </UButton>
            <UButton
              color="red"
              @click="deleteOrder"
              :loading="isDeleting"
            >
              Delete
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
  title: 'Orders - QuickMeazure',
});

// State
const search = ref('');
const sortBy = ref('dueDate-asc');
const isLoading = ref(true);
const orders = ref([]);
const filteredOrders = ref([]);
const isFilterOpen = ref(false);
const showDeleteModal = ref(false);
const orderToDelete = ref(null);
const isDeleting = ref(false);

// Filters
const filters = ref({
  status: 'any',
  dueDate: 'any',
  paymentStatus: 'any',
});

// Options for filters
const statusOptions = [
  { label: 'All statuses', value: 'any' },
  { label: 'Pending', value: 'Pending' },
  { label: 'In Progress', value: 'In Progress' },
  { label: 'Ready for Pickup', value: 'Ready for Pickup' },
  { label: 'Completed', value: 'Completed' },
  { label: 'Cancelled', value: 'Cancelled' },
];

const dueDateOptions = [
  { label: 'Any time', value: 'any' },
  { label: 'Overdue', value: 'overdue' },
  { label: 'Due today', value: 'today' },
  { label: 'Due this week', value: 'thisWeek' },
  { label: 'Due next week', value: 'nextWeek' },
  { label: 'Due this month', value: 'thisMonth' },
];

const paymentStatusOptions = [
  { label: 'All payment statuses', value: 'any' },
  { label: 'Paid in full', value: 'paid' },
  { label: 'Partial payment', value: 'partial' },
  { label: 'No payment', value: 'none' },
];

// Sort options
const sortOptions = [
  { label: 'Due date (earliest first)', value: 'dueDate-asc' },
  { label: 'Due date (latest first)', value: 'dueDate-desc' },
  { label: 'Client name (A-Z)', value: 'client-asc' },
  { label: 'Client name (Z-A)', value: 'client-desc' },
  { label: 'Total amount (high to low)', value: 'amount-desc' },
  { label: 'Total amount (low to high)', value: 'amount-asc' },
  { label: 'Recently added', value: 'created-desc' },
];

// Table columns
const columns = [
  {
    key: 'client',
    label: 'Client',
  },
  {
    key: 'style',
    label: 'Style',
  },
  {
    key: 'dueDate',
    label: 'Due Date',
  },
  {
    key: 'status',
    label: 'Status',
  },
  {
    key: 'payment',
    label: 'Payment',
  },
  {
    key: 'actions',
    label: '',
    sortable: false,
  },
];

// Load orders
onMounted(async () => {
  try {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Mock data
    orders.value = [
      {
        id: '1',
        clientId: '1',
        client: 'John Doe',
        style: 'Classic Suit',
        styleId: '1',
        styleImageUrl: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
        dueDate: Date.now() + 2 * 24 * 60 * 60 * 1000, // 2 days from now
        status: 'In Progress',
        totalAmount: 45000,
        depositAmount: 20000,
        balanceAmount: 25000,
        createdAt: Date.now() - 7 * 24 * 60 * 60 * 1000, // 7 days ago
      },
      {
        id: '2',
        clientId: '2',
        client: 'Jane Smith',
        style: 'Traditional Agbada',
        styleId: '3',
        styleImageUrl: 'https://images.unsplash.com/photo-1590735213920-68192a487bc2?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
        dueDate: Date.now() - 1 * 24 * 60 * 60 * 1000, // 1 day ago (overdue)
        status: 'Ready for Pickup',
        totalAmount: 65000,
        depositAmount: 65000,
        balanceAmount: 0,
        createdAt: Date.now() - 14 * 24 * 60 * 60 * 1000, // 14 days ago
      },
      {
        id: '3',
        clientId: '3',
        client: 'Michael Johnson',
        style: 'Modern Blazer',
        styleId: '2',
        styleImageUrl: 'https://images.unsplash.com/photo-1617127365659-c47fa864d8bc?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
        dueDate: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days from now
        status: 'Pending',
        totalAmount: 35000,
        depositAmount: 15000,
        balanceAmount: 20000,
        createdAt: Date.now() - 3 * 24 * 60 * 60 * 1000, // 3 days ago
      },
      {
        id: '4',
        clientId: '4',
        client: 'Sarah Williams',
        style: null,
        styleId: null,
        styleImageUrl: null,
        dueDate: Date.now() + 14 * 24 * 60 * 60 * 1000, // 14 days from now
        status: 'Completed',
        totalAmount: 25000,
        depositAmount: 25000,
        balanceAmount: 0,
        createdAt: Date.now() - 21 * 24 * 60 * 60 * 1000, // 21 days ago
      },
      {
        id: '5',
        clientId: '5',
        client: 'David Brown',
        style: 'Senator Style',
        styleId: '4',
        styleImageUrl: 'https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
        dueDate: Date.now() + 1 * 24 * 60 * 60 * 1000, // 1 day from now
        status: 'In Progress',
        totalAmount: 55000,
        depositAmount: 0,
        balanceAmount: 55000,
        createdAt: Date.now() - 5 * 24 * 60 * 60 * 1000, // 5 days ago
      },
    ];
    
    filterOrders();
    isLoading.value = false;
  } catch (error) {
    console.error('Error loading orders:', error);
    isLoading.value = false;
  }
});

// Computed property to check if any filter is applied
const isFilterApplied = computed(() => {
  return filters.value.status !== 'any' || 
         filters.value.dueDate !== 'any' || 
         filters.value.paymentStatus !== 'any';
});

// Filter and sort orders
const filterOrders = () => {
  // Filter by search term
  let result = orders.value;
  
  if (search.value) {
    const searchLower = search.value.toLowerCase();
    result = result.filter(order => 
      order.client.toLowerCase().includes(searchLower) ||
      (order.style && order.style.toLowerCase().includes(searchLower))
    );
  }
  
  // Apply filters
  if (filters.value.status !== 'any') {
    result = result.filter(order => order.status === filters.value.status);
  }
  
  if (filters.value.dueDate !== 'any') {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const tomorrow = today + 24 * 60 * 60 * 1000;
    const nextWeek = today + 7 * 24 * 60 * 60 * 1000;
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1).getTime();
    
    switch (filters.value.dueDate) {
      case 'overdue':
        result = result.filter(order => order.dueDate < today);
        break;
      case 'today':
        result = result.filter(order => order.dueDate >= today && order.dueDate < tomorrow);
        break;
      case 'thisWeek':
        result = result.filter(order => order.dueDate >= today && order.dueDate < nextWeek);
        break;
      case 'nextWeek':
        result = result.filter(order => order.dueDate >= nextWeek && order.dueDate < (nextWeek + 7 * 24 * 60 * 60 * 1000));
        break;
      case 'thisMonth':
        result = result.filter(order => order.dueDate >= today && order.dueDate < nextMonth);
        break;
    }
  }
  
  if (filters.value.paymentStatus !== 'any') {
    switch (filters.value.paymentStatus) {
      case 'paid':
        result = result.filter(order => order.balanceAmount <= 0);
        break;
      case 'partial':
        result = result.filter(order => order.depositAmount > 0 && order.balanceAmount > 0);
        break;
      case 'none':
        result = result.filter(order => order.depositAmount <= 0);
        break;
    }
  }
  
  // Sort results
  result = [...result].sort((a, b) => {
    switch (sortBy.value) {
      case 'dueDate-asc':
        return a.dueDate - b.dueDate;
      case 'dueDate-desc':
        return b.dueDate - a.dueDate;
      case 'client-asc':
        return a.client.localeCompare(b.client);
      case 'client-desc':
        return b.client.localeCompare(a.client);
      case 'amount-desc':
        return b.totalAmount - a.totalAmount;
      case 'amount-asc':
        return a.totalAmount - b.totalAmount;
      case 'created-desc':
        return b.createdAt - a.createdAt;
      default:
        return 0;
    }
  });
  
  filteredOrders.value = result;
};

// Reset filters
const resetFilters = () => {
  search.value = '';
  filters.value = {
    status: 'any',
    dueDate: 'any',
    paymentStatus: 'any',
  };
  filterOrders();
};

// Format date
const formatDate = (timestamp) => {
  return new Date(timestamp).toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric', 
    year: 'numeric' 
  });
};

// Format price
const formatPrice = (amount) => {
  return `₦${amount.toLocaleString()}`;
};

// Get initials from name
const getInitials = (name) => {
  return name
    .split(' ')
    .map(part => part.charAt(0))
    .join('')
    .toUpperCase()
    .substring(0, 2);
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
    case 'Pending':
      return 'gray';
    case 'In Progress':
      return 'blue';
    case 'Ready for Pickup':
      return 'amber';
    case 'Completed':
      return 'green';
    case 'Cancelled':
      return 'red';
    default:
      return 'gray';
  }
};

// Confirm delete
const confirmDelete = (order) => {
  orderToDelete.value = order;
  showDeleteModal.value = true;
};

// Delete order
const deleteOrder = async () => {
  if (!orderToDelete.value) return;
  
  isDeleting.value = true;
  
  try {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Remove from list
    orders.value = orders.value.filter(o => o.id !== orderToDelete.value.id);
    filterOrders();
    
    // Show success notification
    // In a real app, this would use a notification system
    console.log(`Order for "${orderToDelete.value.client}" deleted successfully`);
    
    // Close modal
    showDeleteModal.value = false;
    orderToDelete.value = null;
  } catch (error) {
    console.error('Error deleting order:', error);
    // Show error notification
  } finally {
    isDeleting.value = false;
  }
};

// Update order status
const updateOrderStatus = async (order, newStatus) => {
  try {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Update order status
    const orderIndex = orders.value.findIndex(o => o.id === order.id);
    if (orderIndex !== -1) {
      orders.value[orderIndex].status = newStatus;
      filterOrders();
    }
    
    // Show success notification
    // In a real app, this would use a notification system
    console.log(`Order status updated to "${newStatus}" successfully`);
  } catch (error) {
    console.error('Error updating order status:', error);
    // Show error notification
  }
};
</script>