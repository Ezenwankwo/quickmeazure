<template>
  <div class="space-y-6">
    <div class="flex justify-between items-center">
      <h1 class="text-2xl font-bold">Clients</h1>
      <UButton
        to="/clients/new"
        color="primary"
        icon="i-heroicons-plus"
      >
        Add New Client
      </UButton>
    </div>
    
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
    
    <!-- Clients Table -->
    <UCard class="bg-white">
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
      
      <!-- Pagination -->
      <template #footer>
        <div class="flex justify-between items-center">
          <div class="text-sm text-gray-500">
            Showing {{ filteredClients.length }} of {{ clients.length }} clients
          </div>
          <UPagination
            v-model="currentPage"
            :page-count="pageCount"
            :total="filteredClients.length"
            :ui="{ rounded: 'rounded-lg' }"
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

// Mock data
const clients = ref([
  {
    id: '1',
    name: 'John Doe',
    phone: '+234 801 234 5678',
    email: 'john.doe@example.com',
    hasMeasurements: true,
    createdAt: '2023-11-15',
  },
  {
    id: '2',
    name: 'Jane Smith',
    phone: '+234 802 345 6789',
    email: 'jane.smith@example.com',
    hasMeasurements: true,
    createdAt: '2023-11-10',
  },
  {
    id: '3',
    name: 'Robert Johnson',
    phone: '+234 803 456 7890',
    email: 'robert.johnson@example.com',
    hasMeasurements: false,
    createdAt: '2023-11-05',
  },
  {
    id: '4',
    name: 'Sarah Williams',
    phone: '+234 804 567 8901',
    email: 'sarah.williams@example.com',
    hasMeasurements: true,
    createdAt: '2023-10-28',
  },
  {
    id: '5',
    name: 'Michael Brown',
    phone: '+234 805 678 9012',
    email: 'michael.brown@example.com',
    hasMeasurements: false,
    createdAt: '2023-10-20',
  },
  {
    id: '6',
    name: 'Emily Davis',
    phone: '+234 806 789 0123',
    email: 'emily.davis@example.com',
    hasMeasurements: true,
    createdAt: '2023-10-15',
  },
  {
    id: '7',
    name: 'David Wilson',
    phone: '+234 807 890 1234',
    email: 'david.wilson@example.com',
    hasMeasurements: false,
    createdAt: '2023-10-10',
  },
  {
    id: '8',
    name: 'Olivia Taylor',
    phone: '+234 808 901 2345',
    email: 'olivia.taylor@example.com',
    hasMeasurements: true,
    createdAt: '2023-10-05',
  },
  {
    id: '9',
    name: 'James Anderson',
    phone: '+234 809 012 3456',
    email: 'james.anderson@example.com',
    hasMeasurements: true,
    createdAt: '2023-09-28',
  },
  {
    id: '10',
    name: 'Sophia Martinez',
    phone: '+234 701 123 4567',
    email: 'sophia.martinez@example.com',
    hasMeasurements: false,
    createdAt: '2023-09-20',
  },
]);

// State variables
const isLoading = ref(false);
const search = ref('');
const sortBy = ref('name-asc');
const isFilterOpen = ref(false);
const currentPage = ref(1);
const pageSize = 10;
const filteredClients = ref([...clients.value]);

// Filter options
const sortOptions = [
  { label: 'Name (A-Z)', value: 'name-asc' },
  { label: 'Name (Z-A)', value: 'name-desc' },
  { label: 'Date Added (Newest)', value: 'date-desc' },
  { label: 'Date Added (Oldest)', value: 'date-asc' },
];

const dateOptions = [
  { label: 'Any time', value: 'any' },
  { label: 'Today', value: 'today' },
  { label: 'This week', value: 'week' },
  { label: 'This month', value: 'month' },
  { label: 'This year', value: 'year' },
];

const booleanOptions = [
  { label: 'All clients', value: 'any' },
  { label: 'Yes', value: 'yes' },
  { label: 'No', value: 'no' },
];

const filters = ref({
  dateAdded: 'any',
  hasMeasurements: 'any',
  hasOrders: 'any',
});

// Computed properties
const isFilterApplied = computed(() => {
  return filters.value.dateAdded !== 'any' || 
         filters.value.hasMeasurements !== 'any' || 
         filters.value.hasOrders !== 'any';
});

const pageCount = computed(() => {
  return Math.ceil(filteredClients.value.length / pageSize);
});

// Delete client functionality
const isDeleteModalOpen = ref(false);
const clientToDelete = ref(null);
const isDeleting = ref(false);

const confirmDelete = (client) => {
  clientToDelete.value = client;
  isDeleteModalOpen.value = true;
};

const deleteClient = async () => {
  isDeleting.value = true;
  
  try {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Remove client from list
    clients.value = clients.value.filter(c => c.id !== clientToDelete.value.id);
    filteredClients.value = filteredClients.value.filter(c => c.id !== clientToDelete.value.id);
    
    // Show success notification
    isDeleteModalOpen.value = false;
  } catch (error) {
    console.error('Delete failed:', error);
    // Show error notification
  } finally {
    isDeleting.value = false;
  }
};

// Filter and sort clients
const filterClients = () => {
  isLoading.value = true;
  
  // Simulate API delay
  setTimeout(() => {
    let result = [...clients.value];
    
    // Apply search filter
    if (search.value) {
      const searchLower = search.value.toLowerCase();
      result = result.filter(client => 
        client.name.toLowerCase().includes(searchLower) ||
        client.email.toLowerCase().includes(searchLower) ||
        client.phone.includes(search.value)
      );
    }
    
    // Apply measurement filter
    if (filters.value.hasMeasurements !== 'any') {
      const hasMeasurements = filters.value.hasMeasurements === 'yes';
      result = result.filter(client => client.hasMeasurements === hasMeasurements);
    }
    
    // Apply date filter (simplified for demo)
    if (filters.value.dateAdded !== 'any') {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
      
      result = result.filter(client => {
        const clientDate = new Date(client.createdAt).getTime();
        
        switch (filters.value.dateAdded) {
          case 'today':
            return clientDate >= today;
          case 'week':
            const weekAgo = today - 7 * 24 * 60 * 60 * 1000;
            return clientDate >= weekAgo;
          case 'month':
            const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate()).getTime();
            return clientDate >= monthAgo;
          case 'year':
            const yearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate()).getTime();
            return clientDate >= yearAgo;
          default:
            return true;
        }
      });
    }
    
    // Apply sorting
    result.sort((a, b) => {
      switch (sortBy.value) {
        case 'name-asc':
          return a.name.localeCompare(b.name);
        case 'name-desc':
          return b.name.localeCompare(a.name);
        case 'date-asc':
          return new Date(a.createdAt) - new Date(b.createdAt);
        case 'date-desc':
          return new Date(b.createdAt) - new Date(a.createdAt);
        default:
          return 0;
      }
    });
    
    filteredClients.value = result;
    isLoading.value = false;
  }, 300);
};

// Reset all filters
const resetFilters = () => {
  search.value = '';
  sortBy.value = 'name-asc';
  filters.value = {
    dateAdded: 'any',
    hasMeasurements: 'any',
    hasOrders: 'any',
  };
  filterClients();
};

// Helper function to get initials from name
const getInitials = (name) => {
  return name
    .split(' ')
    .map(part => part.charAt(0))
    .join('')
    .toUpperCase()
    .substring(0, 2);
};

// Initialize
onMounted(() => {
  filterClients();
});
</script>