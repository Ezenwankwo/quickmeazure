<template>
  <div class="space-y-6">
    <PageHeader
      title="Orders"
      subtitle="Manage your customer orders and track payments"
      :primaryAction="{
        label: 'Create New Order',
        icon: 'i-heroicons-plus',
        to: '/orders/new'
      }"
    />
    
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
    
    <!-- Orders Table (desktop) / Cards (mobile) -->
    <UCard class="bg-white">
      <!-- Desktop Table View (hidden on mobile) -->
      <div class="hidden md:block">
        <UTable 
          :columns="columns" 
          :rows="filteredOrders" 
          :loading="isLoading"
          :empty-state="{
            icon: 'i-heroicons-shopping-bag',
            label: 'No orders found',
            description: search || isFilterApplied.value ? 'Try adjusting your search or filters' : 'Get started by creating your first order',
            action: search || isFilterApplied.value ? { label: 'Reset filters', click: resetFilters } : { label: 'Create order', to: '/orders/new' }
          }"
        >
          <template #client-data="{ row }">
            <div class="flex items-center">
              <div class="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center mr-3">
                <span class="text-primary-700 font-medium">{{ getInitials(row.client) }}</span>
              </div>
              <NuxtLink :to="`/orders/${row.id}/detail`" class="font-medium text-primary-600 hover:underline">
                {{ row.clientName }}
              </NuxtLink>
            </div>
          </template>
          
          <template #style-data="{ row }">
            <span v-if="row.style">{{ row.style }}</span>
            <span v-else class="text-gray-400">No style</span>
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
      </div>
      
      <!-- Mobile Card View -->
      <div class="md:hidden space-y-4">
        <!-- Loading state for mobile -->
        <template v-if="isLoading">
          <div v-for="i in 3" :key="i" class="bg-white rounded-lg border border-gray-200 shadow-sm p-4 space-y-4">
            <div class="flex items-center">
              <div class="w-10 h-10 rounded-full bg-gray-200 animate-pulse mr-3"></div>
              <div class="h-6 bg-gray-200 rounded animate-pulse w-1/2"></div>
            </div>
            <div class="space-y-2">
              <div class="flex justify-between py-1 border-b border-gray-100">
                <div class="h-4 bg-gray-200 rounded animate-pulse w-1/4"></div>
                <div class="h-4 bg-gray-200 rounded animate-pulse w-1/3"></div>
              </div>
              <div class="flex justify-between py-1 border-b border-gray-100">
                <div class="h-4 bg-gray-200 rounded animate-pulse w-1/4"></div>
                <div class="h-4 bg-gray-200 rounded animate-pulse w-2/5"></div>
              </div>
              <div class="flex justify-between py-1 border-b border-gray-100">
                <div class="h-4 bg-gray-200 rounded animate-pulse w-1/4"></div>
                <div class="h-4 bg-gray-200 rounded animate-pulse w-1/6"></div>
              </div>
            </div>
            <div class="flex justify-between items-center pt-2">
              <div class="h-8 bg-gray-200 rounded animate-pulse w-1/4"></div>
              <div class="flex space-x-2">
                <div class="h-8 w-8 bg-gray-200 rounded animate-pulse"></div>
                <div class="h-8 w-8 bg-gray-200 rounded animate-pulse"></div>
              </div>
            </div>
          </div>
        </template>

        <!-- Orders list for mobile -->
        <template v-else-if="filteredOrders.length > 0">
          <div v-for="order in filteredOrders" :key="order.id" class="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
            <div class="flex items-start mb-3">
              <div class="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center mr-3 flex-shrink-0">
                <span class="text-primary-700 font-medium text-lg">{{ getInitials(order.client) }}</span>
              </div>
              <div class="flex-1 min-w-0">
                <NuxtLink :to="`/orders/${order.id}/detail`" class="font-semibold text-lg text-primary-600 hover:underline block truncate">
                  {{ order.client }}
                </NuxtLink>
                <div class="mt-1">
                  <UBadge
                    :color="getStatusColor(order.status)"
                    variant="subtle"
                    size="sm"
                  >
                    {{ order.status }}
                  </UBadge>
                </div>
              </div>
            </div>
            
            <div class="space-y-2 text-sm">
              <div class="flex justify-between py-1 border-b border-gray-100">
                <span class="text-gray-500">Style</span>
                <span v-if="order.style" class="text-right">{{ order.style }}</span>
                <span v-else class="text-gray-400">No style</span>
              </div>
              <div class="flex justify-between py-1 border-b border-gray-100">
                <span class="text-gray-500">Due Date</span>
                <div v-if="order.dueDate" class="flex items-center" :class="{
                  'text-red-600 font-medium': isOverdue(order.dueDate),
                  'text-amber-600 font-medium': !isOverdue(order.dueDate) && isDueSoon(order.dueDate)
                }">
                  <span class="text-right">{{ formatDate(order.dueDate) }}</span>
                  <UIcon v-if="isOverdue(order.dueDate)" name="i-heroicons-exclamation-circle" class="text-red-500 ml-1" />
                  <UIcon v-else-if="isDueSoon(order.dueDate)" name="i-heroicons-clock" class="text-amber-500 ml-1" />
                </div>
                <span v-else class="text-gray-400">Not set</span>
              </div>
              <div class="flex justify-between py-1 border-b border-gray-100">
                <span class="text-gray-500">Payment</span>
                <div class="text-right">
                  <div class="font-medium">{{ formatPrice(order.totalAmount) }}</div>
                  <span :class="{
                    'text-green-600': order.balanceAmount <= 0,
                    'text-amber-600': order.depositAmount > 0 && order.balanceAmount > 0,
                    'text-gray-500': order.depositAmount <= 0
                  }">
                    <template v-if="order.balanceAmount <= 0">(Paid)</template>
                    <template v-else-if="order.depositAmount > 0">({{ formatPrice(order.balanceAmount) }} balance)</template>
                    <template v-else>(No payment)</template>
                  </span>
                </div>
              </div>
              <div class="flex justify-between py-1">
                <span class="text-gray-500">Created</span>
                <span class="text-right">{{ formatDate(order.createdAt) }}</span>
              </div>
            </div>
            
            <div class="flex justify-between mt-3 pt-3 border-t border-gray-100">
              <UButton
                v-if="order.balanceAmount > 0"
                color="primary"
                variant="outline"
                size="sm"
                :to="`/orders/${order.id}/payment`"
                icon="i-heroicons-currency-dollar"
              >
                Payment
              </UButton>
              <span v-else></span>
              
              <div class="flex space-x-2">
                <UButton
                  color="gray"
                  variant="ghost"
                  icon="i-heroicons-eye"
                  size="sm"
                  :to="`/orders/${order.id}/detail`"
                />
                <UButton
                  color="gray"
                  variant="ghost"
                  icon="i-heroicons-pencil-square"
                  size="sm"
                  :to="`/orders/${order.id}/edit`"
                />
                <UDropdown
                  :items="[
                    [
                      {
                        label: 'Mark as Completed',
                        icon: 'i-heroicons-check-circle',
                        click: () => updateOrderStatus(order, 'Completed'),
                        disabled: order.status === 'Completed'
                      },
                      {
                        label: 'Record Payment',
                        icon: 'i-heroicons-currency-dollar',
                        to: `/orders/${order.id}/payment`,
                        disabled: order.balanceAmount <= 0
                      }
                    ],
                    [
                      {
                        label: 'Delete Order',
                        icon: 'i-heroicons-trash',
                        click: () => confirmDelete(order),
                        color: 'red'
                      }
                    ]
                  ]"
                >
                  <UButton
                    color="gray"
                    variant="ghost"
                    icon="i-heroicons-ellipsis-vertical"
                    size="sm"
                  />
                </UDropdown>
              </div>
            </div>
          </div>
        </template>

        <!-- Empty state for mobile -->
        <div v-else class="py-12 flex flex-col items-center">
          <UIcon name="i-heroicons-shopping-bag" class="text-gray-400 mb-4" size="xl" />
          <h3 class="font-medium text-lg text-gray-900">No orders found</h3>
          <p class="text-gray-500 text-center mt-1">
            {{ search || isFilterApplied.value ? 'Try adjusting your search or filters' : 'Get started by creating your first order' }}
          </p>
          <UButton
            v-if="search || isFilterApplied.value"
            color="gray"
            variant="outline"
            class="mt-4"
            @click="resetFilters"
          >
            Reset filters
          </UButton>
          <UButton
            v-else
            color="primary"
            class="mt-4"
            to="/orders/new"
            icon="i-heroicons-plus"
          >
            Create order
          </UButton>
        </div>
      </div>
      
      <!-- Pagination -->
      <template #footer>
        <div class="flex flex-col sm:flex-row justify-between items-center gap-4">
          <div class="text-sm text-gray-500 order-2 sm:order-1">
            Showing {{ filteredOrders.length }} of {{ orders.length }} orders
          </div>
          <UPagination
            v-model="currentPage"
            :page-count="pageCount"
            :total="filteredOrders.length"
            :ui="{ rounded: 'rounded-lg' }"
            class="order-1 sm:order-2"
          />
        </div>
      </template>
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

// Import auth composable
import { useAuth } from '~/composables/useAuth';

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
const currentPage = ref(1);

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

// Fetch orders from API
const fetchOrders = async () => {
  isLoading.value = true;
  
  try {
    // Get auth token from the auth store
    const auth = useAuth();
    const token = auth.token.value;
    
    if (!token) {
      // Redirect to login if not authenticated
      useToast().add({
        title: 'Authentication required',
        description: 'Please log in to view your orders',
        color: 'orange'
      });
      navigateTo('/auth/login');
      return;
    }
    
    // Fetch orders from API
    const data = await $fetch('/api/orders', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    // Map data to our format
    orders.value = data.map(order => ({
      id: order.id,
      clientId: order.clientId,
      client: order.clientName,
      style: order.styleName,
      styleId: order.styleId,
      styleImageUrl: order.styleImageUrl,
      status: order.status,
      dueDate: order.dueDate,
      totalAmount: order.totalAmount,
      depositAmount: order.depositAmount,
      balanceAmount: order.balanceAmount,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
    }));
    
    filterOrders();
  } catch (error) {
    console.error('Error loading orders:', error);
    useToast().add({
      title: 'Error',
      description: 'Failed to load orders. Please try again.',
      color: 'red',
    });
  } finally {
    isLoading.value = false;
  }
};

// Call fetchOrders on component mount
onMounted(() => {
  fetchOrders();
});

// Computed property to check if any filter is applied
const isFilterApplied = computed(() => {
  return filters.value.status !== 'any' || 
         filters.value.dueDate !== 'any' || 
         filters.value.paymentStatus !== 'any';
});

const pageCount = computed(() => {
  return Math.ceil(filteredOrders.value.length / 10);
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
    day: '2-digit', 
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
    // Get auth token from the auth store
    const auth = useAuth();
    const token = auth.token.value;
    
    // Call the delete endpoint
    await $fetch(`/api/orders/${orderToDelete.value.id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    // Remove from local array
    const index = orders.value.findIndex(o => o.id === orderToDelete.value.id);
    if (index !== -1) {
      orders.value.splice(index, 1);
    }
    
    // Update filtered orders
    filterOrders();
    
    // Show success notification
    useToast().add({
      title: 'Order deleted',
      description: `Order for ${orderToDelete.value.client} has been deleted successfully.`,
      color: 'green',
    });
    
    // Close modal
    showDeleteModal.value = false;
    orderToDelete.value = null;
  } catch (error) {
    console.error('Error deleting order:', error);
    let errorMessage = 'Failed to delete order. Please try again.';
    
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
    isDeleting.value = false;
  }
};

// Update order status
const updateOrderStatus = async (order, newStatus) => {
  try {
    // Get auth token from the auth store
    const auth = useAuth();
    const token = auth.token.value;
    
    // Call the update endpoint
    await $fetch(`/api/orders/${order.id}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: {
        status: newStatus
      }
    });
    
    // Update locally
    const index = orders.value.findIndex(o => o.id === order.id);
    if (index !== -1) {
      orders.value[index].status = newStatus;
      filterOrders(); // Refresh filtered list
    }
    
    // Show success notification
    useToast().add({
      title: 'Status updated',
      description: `Order for ${order.client} is now ${newStatus}`,
      color: 'green',
    });
  } catch (error) {
    console.error('Error updating order status:', error);
    let errorMessage = 'Failed to update order status. Please try again.';
    
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
  }
};
</script>