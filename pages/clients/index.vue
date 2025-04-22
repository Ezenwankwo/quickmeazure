<template>
  <div class="space-y-6">
    <PageHeader
      title="Clients"
      subtitle="Manage your customer database"
      :primaryAction="{
        label: 'Add New Client',
        icon: 'i-heroicons-plus',
        to: '/clients/new'
      }"
    />
    
    <!-- Search and Filter with glassy effect -->
    <UCard class="bg-white/80 backdrop-blur-sm border border-gray-100 shadow-sm">
      <div class="flex flex-col space-y-3 sm:space-y-0 sm:flex-row sm:gap-4 items-center">
        <div class="relative w-full sm:w-80 group">
          <UInput
            v-model="search"
            placeholder="Search clients..."
            icon="i-heroicons-magnifying-glass"
            class="w-full focus-within:ring-2 ring-primary-200"
            @input="filterClients"
          />
          <span v-if="search" class="absolute right-2 top-2.5 cursor-pointer text-gray-400 hover:text-gray-600" @click="resetSearch">
            <UIcon name="i-heroicons-x-mark" class="w-5 h-5" />
          </span>
        </div>
        
        <div class="flex gap-2 w-full sm:w-auto sm:ml-auto">
          <USelect
            v-model="sortBy"
            :options="sortOptions"
            placeholder="Sort by"
            class="w-full sm:w-52 focus-within:ring-2 ring-primary-200"
            @update:model-value="filterClients"
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
        <UFormField label="Date Added">
          <USelect
            v-model="filters.dateAdded"
            :options="dateOptions"
            placeholder="Any time"
            class="focus-within:ring-2 ring-primary-200"
            @update:model-value="filterClients"
          />
        </UFormField>
        
        <UFormField label="Has Measurements">
          <USelect
            v-model="filters.hasMeasurements"
            :options="booleanOptions"
            placeholder="All clients"
            class="focus-within:ring-2 ring-primary-200"
            @update:model-value="filterClients"
          />
        </UFormField>
        
        <UFormField label="Has Orders">
          <USelect
            v-model="filters.hasOrders"
            :options="booleanOptions"
            placeholder="All clients"
            class="focus-within:ring-2 ring-primary-200"
            @update:model-value="filterClients"
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
    
    <!-- Clients Table (desktop) / Cards (mobile) -->
    <UCard class="bg-white">
      <!-- Desktop Table View (hidden on mobile) -->
      <div class="hidden sm:block">
        <UTable 
          :columns="columns" 
          :rows="paginatedClients" 
          :loading="isLoading"
          :empty-state="{
            icon: 'i-heroicons-user-plus',
            label: 'No clients found',
            description: search || isFilterApplied ? 'Try adjusting your search or filters' : 'Get started by adding your first client',
            action: search || isFilterApplied ? { label: 'Reset filters', click: resetFilters } : { label: 'Add client', to: '/clients/new' }
          }"
        >
          <template #name-data="{ row }">
            <div class="flex items-center">
              <div class="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center mr-3">
                <span class="text-primary-700 font-medium">{{ getInitials(row.name) }}</span>
              </div>
              <NuxtLink :to="`/clients/${row.id}`" class="font-medium text-primary-600 hover:underline">
                {{ row.name }}
              </NuxtLink>
            </div>
          </template>
          
          <template #measurements-data="{ row }">
            <UBadge v-if="row.hasMeasurements" color="green" variant="subtle" size="sm">
              Yes
            </UBadge>
            <UBadge v-else color="gray" variant="subtle" size="sm">
              No
            </UBadge>
          </template>
          
          <template #createdAt-data="{ row }">
            {{ formatDate(row.createdAt) }}
          </template>
          
          <template #actions-data="{ row }">
            <div class="flex space-x-2">
              <UButton
                :to="`/clients/${row.id}`"
                color="gray"
                variant="ghost"
                icon="i-heroicons-eye"
                size="xs"
              />
              <UButton
                :to="`/clients/${row.id}/edit`"
                color="gray"
                variant="ghost"
                icon="i-heroicons-pencil-square"
                size="xs"
              />
              <UButton
                color="gray"
                variant="ghost"
                icon="i-heroicons-trash"
                size="xs"
                @click="confirmDelete(row)"
              />
            </div>
          </template>
        </UTable>
      </div>
      
      <!-- Mobile Card View (shown only on mobile) -->
      <div class="sm:hidden space-y-4">
        <template v-if="!isLoading && paginatedClients.length > 0">
          <UCard 
            v-for="client in paginatedClients" 
            :key="client.id"
            class="border border-gray-200 shadow-sm"
          >
            <div class="flex items-center mb-3">
              <div class="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center mr-3">
                <span class="text-primary-700 font-medium text-lg">{{ getInitials(client.name) }}</span>
              </div>
              <NuxtLink :to="`/clients/${client.id}`" class="font-semibold text-lg text-primary-600 hover:underline">
                {{ client.name }}
              </NuxtLink>
            </div>
            
            <div class="space-y-2 text-sm">
              <div class="flex justify-between py-1 border-b border-gray-100">
                <span class="text-gray-500">Phone</span>
                <span>{{ client.phone }}</span>
              </div>
              <div class="flex justify-between py-1 border-b border-gray-100">
                <span class="text-gray-500">Email</span>
                <span class="text-right">{{ client.email }}</span>
              </div>
              <div class="flex justify-between py-1 border-b border-gray-100">
                <span class="text-gray-500">Measurements</span>
                <UBadge v-if="client.hasMeasurements" color="green" variant="subtle" size="sm">
                  Yes
                </UBadge>
                <UBadge v-else color="gray" variant="subtle" size="sm">
                  No
                </UBadge>
              </div>
              <div class="flex justify-between py-1 border-b border-gray-100">
                <span class="text-gray-500">Date Added</span>
                <span>{{ formatDate(client.createdAt) }}</span>
              </div>
            </div>
            
            <template #footer>
              <div class="flex justify-between items-center">
                <UButton
                  :to="`/clients/${client.id}`"
                  color="primary"
                  variant="ghost"
                  size="sm"
                >
                  View
                </UButton>
                
                <div class="flex space-x-2">
                  <UButton
                    :to="`/clients/${client.id}/edit`"
                    color="gray"
                    variant="ghost"
                    icon="i-heroicons-pencil-square"
                    size="sm"
                  />
                  <UButton
                    color="red"
                    variant="ghost"
                    icon="i-heroicons-trash"
                    size="sm"
                    @click="confirmDelete(client)"
                  />
                </div>
              </div>
            </template>
          </UCard>
        </template>
        
        <!-- Empty state for mobile -->
        <div v-else-if="!isLoading && filteredClients.length === 0" class="text-center py-8">
          <div class="bg-gray-50 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
            <UIcon name="i-heroicons-user-plus" class="text-gray-400 text-xl" />
          </div>
          <h3 class="text-lg font-medium text-gray-800 mb-1">No clients found</h3>
          <p class="text-gray-500 text-sm mb-4">
            {{ search || isFilterApplied ? 'Try adjusting your search or filters' : 'Get started by adding your first client' }}
          </p>
          <UButton
            v-if="!search && !isFilterApplied"
            to="/clients/new"
            color="primary"
            size="sm"
          >
            Add client
          </UButton>
          <UButton
            v-else
            color="gray"
            variant="outline"
            size="sm"
            @click="resetFilters"
          >
            Reset filters
          </UButton>
        </div>
        
        <!-- Loading state for mobile -->
        <template v-else>
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
      </div>
      
      <!-- Pagination -->
      <template #footer>
        <div class="flex flex-col sm:flex-row justify-between items-center gap-4" v-if="filteredClients.length > 0">
          <div class="text-sm text-gray-500 order-2 sm:order-1">
            Showing {{ Math.min((currentPage - 1) * ITEMS_PER_PAGE + 1, totalItems) }}-{{ Math.min(currentPage * ITEMS_PER_PAGE, totalItems) }} of {{ totalItems }} clients
          </div>
          
          <!-- Custom pagination -->
          <div v-if="showPagination" class="flex items-center space-x-1 order-1 sm:order-2">
            <!-- Previous button -->
            <UButton
              variant="ghost" 
              color="gray"
              :disabled="currentPage === 1"
              @click="currentPage > 1 && (currentPage--, fetchClients())"
              size="sm"
              icon="i-heroicons-chevron-left"
              class="rounded-lg"
            />
            
            <!-- First page -->
            <UButton
              variant="ghost" 
              color="gray"
              :class="currentPage === 1 ? 'bg-primary-50 text-primary-700' : ''"
              @click="currentPage = 1, fetchClients()"
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
              @click="currentPage = page, fetchClients()"
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
              @click="currentPage = pageCount, fetchClients()"
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
              @click="currentPage < pageCount && (currentPage++, fetchClients())"
              size="sm"
              icon="i-heroicons-chevron-right"
              class="rounded-lg"
            />
          </div>
        </div>
      </template>
    </UCard>
    
    <!-- Delete Confirmation Modal -->
    <UModal v-model="isDeleteModalOpen">
      <UCard>
        <template #header>
          <div class="flex items-center">
            <UIcon name="i-heroicons-exclamation-triangle" class="text-red-500 mr-2" />
            <h3 class="text-lg font-medium">Delete Client</h3>
          </div>
        </template>
        
        <p>Are you sure you want to delete <strong>{{ clientToDelete?.name }}</strong>? This action cannot be undone.</p>
        
        <template #footer>
          <div class="flex justify-end space-x-4">
            <UButton
              color="gray"
              variant="outline"
              @click="isDeleteModalOpen = false"
            >
              Cancel
            </UButton>
            <UButton
              color="red"
              @click="deleteClient"
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
  title: 'Clients - QuickMeazure',
});

// Import auth composable
import { useSessionAuth } from '~/composables/useSessionAuth';

// Table configuration
const columns = [
  {
    key: 'name',
    label: 'Name',
    sortable: true,
    id: 'name'
  },
  {
    key: 'phone',
    label: 'Phone',
    sortable: true,
    id: 'phone'
  },
  {
    key: 'email',
    label: 'Email',
    sortable: true,
    id: 'email'
  },
  {
    key: 'measurements',
    label: 'Measurements',
    sortable: true,
    id: 'measurements'
  },
  {
    key: 'createdAt',
    label: 'Date Added',
    sortable: true,
    id: 'createdAt'
  },
  {
    key: 'actions',
    label: 'Actions',
    sortable: false,
    id: 'actions'
  },
];

// State management
const clients = ref([]);
const isLoading = ref(true);
const search = ref('');
const isFilterOpen = ref(false);
const filteredClients = ref([]);
const currentPage = ref(1);
const isDeleteModalOpen = ref(false);
const clientToDelete = ref(null);
const isDeleting = ref(false);
const totalItems = ref(0);
const totalPages = ref(0);

// Sort and filter options
const sortBy = ref('name-asc');
const sortOptions = [
  { label: 'Name (A-Z)', value: 'name-asc' },
  { label: 'Name (Z-A)', value: 'name-desc' },
  { label: 'Newest First', value: 'date-desc' },
  { label: 'Oldest First', value: 'date-asc' },
];

const filters = ref({
  dateAdded: null,
  hasMeasurements: null,
  hasOrders: null,
});

const dateOptions = [
  { label: 'Last 7 days', value: '7days' },
  { label: 'Last 30 days', value: '30days' },
  { label: 'Last 3 months', value: '3months' },
  { label: 'Last year', value: '1year' },
];

const booleanOptions = [
  { label: 'Yes', value: true },
  { label: 'No', value: false },
];

// Constants
const ITEMS_PER_PAGE = 10;

// Computed properties
const pageCount = computed(() => {
  return totalPages.value;
});

const paginatedClients = computed(() => {
  return filteredClients.value;
});

const showPagination = computed(() => {
  return totalPages.value > 1;
});

const isFilterApplied = computed(() => {
  return filters.value.dateAdded !== null ||
    filters.value.hasMeasurements !== null ||
    filters.value.hasOrders !== null;
});

// Functions
const getInitials = (name) => {
  if (!name) return '';
  return name.split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .substring(0, 2);
};

const filterClients = () => {
  // Reset to first page when filter changes
  currentPage.value = 1;
  // Fetch data with new filters
  fetchClients();
};

const resetSearch = () => {
  search.value = '';
  filterClients();
};

const resetFilters = () => {
  search.value = '';
  filters.value = {
    hasMeasurements: null,
    hasOrders: null,
  };
  sortBy.value = 'name-asc';
  isFilterOpen.value = false;
  filterClients();
};

const confirmDelete = (client) => {
  clientToDelete.value = client;
  isDeleteModalOpen.value = true;
};

const deleteClient = async () => {
  if (!clientToDelete.value) return;
  
  isDeleting.value = true;
  
  try {
    // Get auth from our new session management composable
    const auth = useSessionAuth();
    
    // Call the delete endpoint
    await $fetch(`/api/clients/${clientToDelete.value.id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${auth.token.value}`
      }
    });
    
    // Remove from local array
    const index = clients.value.findIndex(c => c.id === clientToDelete.value.id);
    if (index !== -1) {
      clients.value.splice(index, 1);
    }
    
    // Update filtered clients
    filterClients();
    
    // Show success notification
    useToast().add({
      title: 'Client deleted',
      description: `${clientToDelete.value.name} has been deleted successfully.`,
      color: 'green',
    });
    
    // Close modal
    isDeleteModalOpen.value = false;
    clientToDelete.value = null;
  } catch (error) {
    console.error('Error deleting client:', error);
    let errorMessage = 'Failed to delete client. Please try again.';
    
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

// Fetch clients data
const fetchClients = async () => {
  isLoading.value = true;
  
  try {
    // Get auth from our new session management composable
    const auth = useSessionAuth();
    
    // Check if user is authenticated
    if (!auth.isLoggedIn.value || !auth.token.value) {
      // Redirect to login if not authenticated
      useToast().add({
        title: 'Authentication required',
        description: 'Please log in to view clients',
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
    
    // Add filter parameters
    if (filters.value.hasMeasurements !== null) {
      params.append('hasMeasurements', filters.value.hasMeasurements.toString());
    }
    
    if (filters.value.hasOrders !== null) {
      params.append('hasOrders', filters.value.hasOrders.toString());
    }
    
    // Make API request with all parameters
    const response = await $fetch(`/api/clients?${params.toString()}`, {
      headers: {
        'Authorization': `Bearer ${auth.token.value}`
      }
    });
    
    // Format the clients data for display
    clients.value = response.data.map(client => formatClientData(client));
    
    // Update pagination data from server response
    filteredClients.value = clients.value;
    
    // Update pagination from server response
    if (response.pagination) {
      currentPage.value = response.pagination.page;
      totalItems.value = response.pagination.total;
      totalPages.value = response.pagination.totalPages;
    }
  } catch (error) {
    console.error('Error fetching clients:', error);
    let errorMessage = 'Failed to load clients. Please refresh the page.';
    
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
    
    clients.value = [];
    filteredClients.value = [];
  } finally {
    isLoading.value = false;
  }
};

// Initial fetch on component mount
onMounted(() => {
  fetchClients();
});

const formatDate = (timestamp) => {
  const date = new Date(timestamp);
  const month = date.toLocaleString('en-US', { month: 'short' });
  const day = date.getDate().toString().padStart(2, '0');
  const year = date.getFullYear();
  return `${month} ${day}, ${year}`;
};

const getVisiblePageNumbers = () => {
  const visiblePages = [];
  const totalPages = pageCount.value;
  const current = currentPage.value;

  if (totalPages <= 5) {
    for (let i = 2; i <= totalPages - 1; i++) {
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

// Helper function to format client data
const formatClientData = (client) => {
  return {
    ...client,
    createdAt: new Date(client.createdAt).toISOString(),
  };
};
</script>