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
    
    <!-- Search and Filter -->
    <div class="flex flex-col md:flex-row gap-4">
      <UInput
        v-model="search"
        placeholder="Search clients..."
        icon="i-heroicons-magnifying-glass"
        class="md:w-80"
        @input="filterClients"
      />
      
      <div class="flex gap-2 ml-auto">
        <USelect
          v-model="sortBy"
          :options="sortOptions"
          placeholder="Sort by"
          @update:model-value="filterClients"
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
        <UFormGroup label="Date Added">
          <USelect
            v-model="filters.dateAdded"
            :options="dateOptions"
            placeholder="Any time"
            @update:model-value="filterClients"
          />
        </UFormGroup>
        
        <UFormGroup label="Has Measurements">
          <USelect
            v-model="filters.hasMeasurements"
            :options="booleanOptions"
            placeholder="All clients"
            @update:model-value="filterClients"
          />
        </UFormGroup>
        
        <UFormGroup label="Has Orders">
          <USelect
            v-model="filters.hasOrders"
            :options="booleanOptions"
            placeholder="All clients"
            @update:model-value="filterClients"
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
    
    <!-- Clients Table (desktop) / Cards (mobile) -->
    <UCard class="bg-white">
      <!-- Desktop Table View (hidden on mobile) -->
      <div class="hidden sm:block">
        <UTable 
          :columns="columns" 
          :rows="filteredClients" 
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
        <template v-if="!isLoading && filteredClients.length > 0">
          <UCard 
            v-for="client in filteredClients" 
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
        <div class="flex flex-col sm:flex-row justify-between items-center gap-4">
          <div class="text-sm text-gray-500 order-2 sm:order-1">
            Showing {{ filteredClients.length }} of {{ clients.length }} clients
          </div>
          <UPagination
            v-model="currentPage"
            :page-count="pageCount"
            :total="filteredClients.length"
            :ui="{ rounded: 'rounded-lg' }"
            class="order-1 sm:order-2"
          />
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
import { useAuth } from '~/composables/useAuth';

// Table configuration
const columns = [
  {
    key: 'name',
    label: 'Name',
    sortable: true,
  },
  {
    key: 'phone',
    label: 'Phone',
    sortable: true,
  },
  {
    key: 'email',
    label: 'Email',
    sortable: true,
  },
  {
    key: 'measurements',
    label: 'Measurements',
    sortable: true,
  },
  {
    key: 'createdAt',
    label: 'Date Added',
    sortable: true,
  },
  {
    key: 'actions',
    label: 'Actions',
    sortable: false,
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

// Computed properties
const pageCount = computed(() => {
  return Math.ceil(filteredClients.value.length / 10);
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
  let filtered = [...clients.value];
  
  // Apply search filter
  if (search.value) {
    const searchLower = search.value.toLowerCase();
    filtered = filtered.filter(client => 
      client.name.toLowerCase().includes(searchLower) ||
      (client.phone && client.phone.toLowerCase().includes(searchLower)) ||
      (client.email && client.email.toLowerCase().includes(searchLower))
    );
  }
  
  // Apply date filter
  if (filters.value.dateAdded) {
    const now = new Date();
    let cutoffDate = new Date();
    
    switch (filters.value.dateAdded) {
      case '7days':
        cutoffDate.setDate(now.getDate() - 7);
        break;
      case '30days':
        cutoffDate.setDate(now.getDate() - 30);
        break;
      case '3months':
        cutoffDate.setMonth(now.getMonth() - 3);
        break;
      case '1year':
        cutoffDate.setFullYear(now.getFullYear() - 1);
        break;
    }
    
    filtered = filtered.filter(client => {
      const clientDate = new Date(client.createdAt);
      return clientDate >= cutoffDate;
    });
  }
  
  // Apply measurement filter
  if (filters.value.hasMeasurements !== null) {
    filtered = filtered.filter(client => 
      client.hasMeasurements === filters.value.hasMeasurements
    );
  }
  
  // Apply orders filter
  if (filters.value.hasOrders !== null) {
    filtered = filtered.filter(client => 
      client.hasOrders === filters.value.hasOrders
    );
  }
  
  // Apply sorting
  if (sortBy.value) {
    const [field, direction] = sortBy.value.split('-');
    
    filtered.sort((a, b) => {
      let comparison = 0;
      
      if (field === 'name') {
        comparison = a.name.localeCompare(b.name);
      } else if (field === 'date') {
        const dateA = new Date(a.createdAt).getTime();
        const dateB = new Date(b.createdAt).getTime();
        comparison = dateA - dateB;
      }
      
      return direction === 'desc' ? -comparison : comparison;
    });
  }
  
  filteredClients.value = filtered;
};

const resetFilters = () => {
  search.value = '';
  filters.value = {
    dateAdded: null,
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
    // Get auth token from the auth store
    const auth = useAuth();
    const token = auth.token.value;
    
    // Call the delete endpoint
    await $fetch(`/api/clients/${clientToDelete.value.id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
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
    // Get auth token from the auth store
    const auth = useAuth();
    const token = auth.token.value;
    
    if (!token) {
      // Redirect to login if not authenticated
      useToast().add({
        title: 'Authentication required',
        description: 'Please log in to view your clients',
        color: 'orange'
      });
      navigateTo('/auth/login');
      return;
    }
    
    const data = await $fetch('/api/clients', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    // Process data to include measurement and order indicators
    clients.value = data.map(client => ({
      ...client,
      createdAt: new Date(client.createdAt).toISOString(),
    }));
    
    filterClients();
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
</script>