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
    
    <!-- Search and Filter with glassy effect -->
    <UCard class="bg-white/80 backdrop-blur-sm border border-gray-100 shadow-sm">
      <div class="flex flex-col space-y-3 sm:space-y-0 sm:flex-row sm:gap-4 items-center">
        <div class="relative w-full sm:w-80 group">
          <UInput
            v-model="search"
            id="search-input"
            placeholder="Search client name..."
            icon="i-heroicons-magnifying-glass"
            size="lg"
            class="w-full focus-within:ring-2 ring-primary-200"
            @input="filterOrders"
          />
          <span v-if="search" class="absolute right-2 top-2.5 cursor-pointer text-gray-400 hover:text-gray-600" @click="resetSearch">
            <UIcon name="i-heroicons-x-mark" class="w-5 h-5" />
          </span>
        </div>
        
        <div class="flex gap-2 w-full sm:w-auto sm:ml-auto">
          <USelect
            v-model="sortBy"
            id="sort-select"
            :items="sortOptions"
            placeholder="Sort by"
            size="lg"
            class="w-full"
            @update:model-value="filterOrders"
          />
          
          <UButton
            color="gray"
            variant="ghost"
            icon="i-heroicons-funnel"
            class="flex-shrink-0"
            :class="{'text-primary-600 bg-primary-50': isFilterOpen}"
            @click="isFilterOpen = !isFilterOpen"
          >
            <span class="hidden sm:inline">Filter</span>
          </UButton>
        </div>
      </div>
    </UCard>
    
    <!-- Filter Panel -->
    <UCard v-if="isFilterOpen" class="bg-white/95 backdrop-blur-sm border border-gray-100 shadow-sm mt-2">
      <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        <UFormField label="Status">
          <USelect
            v-model="filters.status"
            id="status-filter"
            :items="statusOptions"
            placeholder="All statuses"
            size="lg"
            class="w-full"
            @update:model-value="filterOrders"
          />
        </UFormField>
        
        <UFormField label="Due Date">
          <USelect
            v-model="filters.dueDate"
            id="due-date-filter"
            :items="dueDateOptions"
            placeholder="Any time"
            size="lg"
            class="w-full"
            @update:model-value="filterOrders"
          />
        </UFormField>
        
        <UFormField label="Payment Status">
          <USelect
            v-model="filters.paymentStatus"
            id="payment-status-filter"
            :items="paymentStatusOptions"
            placeholder="All payment statuses"
            size="lg"
            class="w-full"
            @update:model-value="filterOrders"
          />
        </UFormField>
      </div>
      
      <div class="flex justify-end mt-4">
        <UButton
          color="gray"
          variant="outline"
          icon="i-heroicons-arrow-path"
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
          :rows="paginatedOrders" 
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
              <div class="w-8 h-8 rounded-full bg-gray-50 shadow-sm flex items-center justify-center mr-3 border border-gray-200">
                <span class="text-gray-700 font-semibold">{{ getInitials(row.client) }}</span>
              </div>
              <NuxtLink :to="`/orders/${row.id}/detail`" class="font-medium text-gray-800 hover:text-primary-700">
                {{ row.clientName || row.client }}
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
                'text-gray-500': row.depositAmount <= 0 && row.balanceAmount > 0
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
              <UButton
                color="gray"
                variant="ghost"
                icon="i-heroicons-trash"
                size="xs"
                class="text-red-500 hover:text-red-700"
                @click="confirmDelete(row)"
              />
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
        <template v-else-if="paginatedOrders.length > 0">
          <div v-for="order in paginatedOrders" :key="order.id" class="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
            <div class="flex items-start mb-3">
              <div class="w-10 h-10 rounded-full bg-gray-50 shadow-sm flex items-center justify-center mr-3 flex-shrink-0 border border-gray-200">
                <span class="text-gray-700 font-semibold text-lg">{{ getInitials(order.client) }}</span>
              </div>
              <div class="flex-1 min-w-0">
                <NuxtLink :to="`/orders/${order.id}/detail`" class="font-semibold text-lg text-gray-800 hover:text-primary-700 block truncate">
                  {{ order.client }}
                </NuxtLink>
                <div>
                  <UBadge
                    :color="getStatusColor(order.status)"
                    variant="subtle"
                    size="sm"
                    class="inline-flex px-2.5 py-0.5 rounded font-medium text-xs"
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
                    'text-gray-500': order.depositAmount <= 0 && order.balanceAmount > 0
                  }">
                    <template v-if="order.balanceAmount <= 0">(Paid in full)</template>
                    <template v-else-if="order.depositAmount > 0">
                      ({{ formatPrice(order.depositAmount) }} paid, {{ formatPrice(order.balanceAmount) }} balance)
                    </template>
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
                  size="xs"
                  :to="`/orders/${order.id}/edit`"
                />
                <UButton
                  color="gray"
                  variant="ghost"
                  icon="i-heroicons-trash"
                  size="sm"
                  class="text-red-500 hover:text-red-700"
                  @click="confirmDelete(order)"
                />
              </div>
            </div>
          </div>
        </template>

        <!-- Empty state for mobile -->
        <div v-else-if="filteredOrders.length === 0" class="py-12 flex flex-col items-center">
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
        <div class="flex flex-col sm:flex-row justify-between items-center gap-4" v-if="filteredOrders.length > 0">
          <div class="text-sm text-gray-500 order-2 sm:order-1">
            Showing {{ Math.min((currentPage - 1) * ITEMS_PER_PAGE + 1, totalItems) }}-{{ Math.min(currentPage * ITEMS_PER_PAGE, totalItems) }} of {{ totalItems }} orders
          </div>
          
          <!-- Pagination -->
          <div v-if="showPagination" class="flex items-center space-x-1 order-1 sm:order-2">
            <!-- Previous button -->
            <UButton
              variant="ghost" 
              color="gray"
              :disabled="currentPage === 1"
              @click="currentPage > 1 && (currentPage--, fetchOrders())"
              size="sm"
              icon="i-heroicons-chevron-left"
              class="rounded-lg"
            />
            
            <!-- First page -->
            <UButton
              variant="ghost" 
              color="gray"
              :class="currentPage === 1 ? 'bg-primary-50 text-primary-700' : ''"
              @click="currentPage = 1, fetchOrders()"
              size="sm"
              class="rounded-lg"
            >
              1
            </UButton>
            
            <!-- Ellipsis if needed -->
            <span v-if="currentPage > 3 && pageCount > 5" class="px-1">...</span>
            
            <!-- Pages before current -->
            <UButton
              v-for="page in getVisiblePageNumbers()"
              :key="page"
              variant="ghost" 
              color="gray"
              :class="currentPage === page ? 'bg-primary-50 text-primary-700' : ''"
              @click="currentPage = page, fetchOrders()"
              size="sm"
              class="rounded-lg"
            >
              {{ page }}
            </UButton>
            
            <!-- Ellipsis if needed -->
            <span v-if="currentPage < pageCount - 2 && pageCount > 5" class="px-1">...</span>
            
            <!-- Last page if not already shown -->
            <UButton
              v-if="pageCount > 1 && !getVisiblePageNumbers().includes(pageCount)"
              variant="ghost" 
              color="gray"
              :class="currentPage === pageCount ? 'bg-primary-50 text-primary-700' : ''"
              @click="currentPage = pageCount, fetchOrders()"
              size="sm"
              class="rounded-lg"
            >
              {{ pageCount }}
            </UButton>
            
            <!-- Next button -->
            <UButton
              variant="ghost" 
              color="gray"
              :disabled="currentPage === pageCount"
              @click="currentPage < pageCount && (currentPage++, fetchOrders())"
              size="sm"
              icon="i-heroicons-chevron-right"
              class="rounded-lg"
            />
          </div>
        </div>
      </template>
    </UCard>
    
    <!-- Delete Confirmation Modal -->
    <DeleteModal
      v-model="showDeleteModal"
      title="Confirm Deletion"
      :message="`Are you sure you want to delete the order for <strong>${orderToDelete?.client}</strong>? This action cannot be undone.`"
      @confirm="deleteOrder"
      :loading="isDeleting"
    />
  </div>
</template>

<script setup>
import DeleteModal from '~/components/DeleteModal.vue';

// Set page metadata
useHead({
  title: 'Orders - QuickMeazure',
});

// Import auth composable
import { useSessionAuth } from '~/composables/useSessionAuth';

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
const totalItems = ref(0);
const totalPages = ref(0);

// Filters
const filters = ref({
  status: 'all',
  dueDate: 'all',
  paymentStatus: 'any',
});

// Options for filters
const statusOptions = [
  { label: 'All statuses', value: 'all' },
  { label: 'Pending', value: 'Pending' },
  { label: 'In Progress', value: 'In Progress' },
  { label: 'Ready for Pickup', value: 'Ready for Pickup' },
  { label: 'Completed', value: 'Completed' },
  { label: 'Cancelled', value: 'Cancelled' },
];

const dueDateOptions = [
  { label: 'Any time', value: 'all' },
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
    id: 'client'
  },
  {
    key: 'style',
    label: 'Style',
    id: 'style'
  },
  {
    key: 'dueDate',
    label: 'Due Date',
    id: 'dueDate'
  },
  {
    key: 'status',
    label: 'Status',
    id: 'status'
  },
  {
    key: 'payment',
    label: 'Payment',
    id: 'payment'
  },
  {
    key: 'actions',
    label: '',
    sortable: false,
    id: 'actions'
  },
];

// Constants
const ITEMS_PER_PAGE = 10;

// Computed properties
const pageCount = computed(() => {
  return totalPages.value;
});

const paginatedOrders = computed(() => {
  return filteredOrders.value;
});

const showPagination = computed(() => {
  return totalPages.value > 1;
});

// Fetch orders from API
const fetchOrders = async () => {
  isLoading.value = true;
  
  try {
    // Get auth token from the auth store
    const auth = useSessionAuth();
    const token = auth.token.value;
    
    if (!token) {
      // Redirect to login if not authenticated
      useToast().add({
        title: 'Authentication required',
        description: 'Please log in to view orders',
        color: 'orange'
      });
      navigateTo('/auth/login');
      return;
    }
    
    // Build query parameters
    const params = new URLSearchParams();
    params.append('page', currentPage.value.toString());
    params.append('limit', ITEMS_PER_PAGE.toString());
    
    // Add search parameter if provided
    if (search.value.trim()) {
      params.append('search', search.value);
    }
    
    // Add sort parameters
    if (sortBy.value) {
      const [field, direction] = sortBy.value.split('-');
      params.append('sortField', field);
      params.append('sortOrder', direction);
    }
    
    // Add status filter if provided
    if (filters.value.status !== 'all') {
      params.append('status', filters.value.status);
    }
    
    // Add due date filters
    if (filters.value.dueDate !== 'all') {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      
      switch (filters.value.dueDate) {
        case 'overdue':
          params.append('dueDateEnd', today.toISOString().split('T')[0]);
          break;
        case 'today':
          params.append('dueDateStart', today.toISOString().split('T')[0]);
          params.append('dueDateEnd', today.toISOString().split('T')[0]);
          break;
        case 'this-week': {
          const endOfWeek = new Date(today);
          endOfWeek.setDate(today.getDate() + (6 - today.getDay()));
          params.append('dueDateStart', today.toISOString().split('T')[0]);
          params.append('dueDateEnd', endOfWeek.toISOString().split('T')[0]);
          break;
        }
        case 'this-month': {
          const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
          params.append('dueDateStart', today.toISOString().split('T')[0]);
          params.append('dueDateEnd', endOfMonth.toISOString().split('T')[0]);
          break;
        }
      }
    }
    
    // Make API request with all parameters
    const response = await $fetch(`/api/orders?${params.toString()}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    // Format the orders data for display
    orders.value = response.data.map(order => formatOrderData(order));
    
    // Update pagination data from server response
    filteredOrders.value = orders.value;
    
    // Update pagination from server response
    if (response.pagination) {
      currentPage.value = response.pagination.page;
      totalItems.value = response.pagination.total;
      totalPages.value = response.pagination.totalPages;
    }
  } catch (error) {
    console.error('Error fetching orders:', error);
    let errorMessage = 'Failed to load orders. Please refresh the page.';
    
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
    
    orders.value = [];
    filteredOrders.value = [];
  } finally {
    isLoading.value = false;
  }
};

// Helper function to format order data
const formatOrderData = (order) => {
  const dueDate = order.dueDate ? new Date(order.dueDate) : null;
  
  // Extract payment information from order details if it exists
  let depositAmount = 0;
  let balanceAmount = 0;
  
  // Extract payment data from order.payments or order.details.payments
  if (order.details && typeof order.details === 'object') {
    console.log('Order details found:', order.details);
    
    // Try to get payments from details
    if (order.details.payments) {
      console.log('Payments found in details:', order.details.payments);
      depositAmount = parseFloat(order.details.depositAmount || 0);
    }
    
    // Try to extract depositAmount directly
    if (order.details.depositAmount) {
      depositAmount = parseFloat(order.details.depositAmount);
    }
  }
  
  // Check if depositAmount comes directly from the order object
  if (order.depositAmount) {
    depositAmount = parseFloat(order.depositAmount);
  }
  
  // Calculate balance amount
  const totalAmount = order.totalAmount || 0;
  if (order.balanceAmount !== undefined) {
    balanceAmount = parseFloat(order.balanceAmount);
  } else {
    balanceAmount = totalAmount - depositAmount;
  }
  
  console.log('Payment details extracted:', { 
    totalAmount,
    depositAmount,
    balanceAmount
  });
  
  return {
    id: order.id,
    client: order.clientName,
    clientId: order.clientId,
    status: order.status,
    style: order.style || order.styleName || '', // Try multiple possible field names
    dueDate: dueDate,
    isOverdue: dueDate ? isOverdue(dueDate) : false,
    isDueSoon: dueDate ? isDueSoon(dueDate) : false,
    totalAmount: totalAmount,
    balanceAmount: balanceAmount,
    depositAmount: depositAmount,
    paymentStatus: balanceAmount > 0 ? (depositAmount > 0 ? 'partial' : 'none') : 'paid',
    createdAt: new Date(order.createdAt).toISOString(),
    updatedAt: new Date(order.updatedAt).toISOString(),
    styleImageUrl: order.styleImageUrl,
    // Include all original data
    originalData: order
  };
};

// Call fetchOrders on component mount
onMounted(() => {
  fetchOrders();
});

// Computed property to check if any filter is applied
const isFilterApplied = computed(() => {
  return filters.value.status !== 'all' || 
         filters.value.dueDate !== 'all' || 
         filters.value.paymentStatus !== 'any';
});

// Filter and sort orders
const filterOrders = () => {
  // Reset to first page when filter changes
  currentPage.value = 1;
  // Fetch data with new filters
  fetchOrders();
};

const resetFilters = () => {
  search.value = '';
  sortBy.value = 'dueDate-asc';
  filters.value = {
    status: 'all',
    dueDate: 'all',
    paymentStatus: 'any',
  };
  filterOrders();
};

// Reset search
const resetSearch = () => {
  search.value = '';
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
      return 'neutral';
    case 'In Progress':
      return 'primary';
    case 'Ready for Pickup':
      return 'warning';
    case 'Completed':
      return 'success';
    case 'Cancelled':
      return 'error';
    default:
      return 'neutral';
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
    const auth = useSessionAuth();
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
    const auth = useSessionAuth();
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

// Helper function to get visible page numbers
const getVisiblePageNumbers = () => {
  const visiblePages = [];
  const totalPages = pageCount.value;
  const current = currentPage.value;

  if (totalPages <= 5) {
    for (let i = 1; i <= totalPages; i++) {
      visiblePages.push(i);
    }
  } else {
    if (current <= 3) {
      for (let i = 2; i <= 4; i++) {
        visiblePages.push(i);
      }
    } else if (current >= totalPages - 2) {
      for (let i = totalPages - 3; i <= totalPages - 1; i++) {
        visiblePages.push(i);
      }
    } else {
      for (let i = current - 1; i <= current + 1; i++) {
        visiblePages.push(i);
      }
    }
  }

  return visiblePages;
};
</script>