<template>
  <div class="space-y-6">
    <div class="flex justify-between items-center">
      <h1 class="text-2xl font-bold">Measurements</h1>
      <UButton
        to="/measurements/new"
        color="primary"
        icon="i-heroicons-plus"
      >
        Add New Measurement
      </UButton>
    </div>
    
    <!-- Search and Filter -->
    <div class="flex flex-col md:flex-row gap-4">
      <UInput
        v-model="search"
        placeholder="Search client name..."
        icon="i-heroicons-magnifying-glass"
        class="md:w-80"
        @input="filterMeasurements"
      />
      
      <div class="flex gap-2 ml-auto">
        <USelect
          v-model="sortBy"
          :options="sortOptions"
          placeholder="Sort by"
          @update:model-value="filterMeasurements"
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
            @update:model-value="filterMeasurements"
          />
        </UFormGroup>
        
        <UFormGroup label="Has Orders">
          <USelect
            v-model="filters.hasOrders"
            :options="booleanOptions"
            placeholder="All clients"
            @update:model-value="filterMeasurements"
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
    
    <!-- Measurements Table -->
    <UCard class="bg-white">
      <UTable 
        :columns="columns" 
        :rows="filteredMeasurements" 
        :loading="isLoading"
        :empty-state="{
          icon: 'i-heroicons-variable',
          label: 'No measurements found',
          description: search || isFilterApplied ? 'Try adjusting your search or filters' : 'Get started by adding your first measurement',
          action: search || isFilterApplied ? { label: 'Reset filters', click: resetFilters } : { label: 'Add measurement', to: '/measurements/new' }
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
        
        <template #measurements-data="{ row }">
          <div class="flex flex-wrap gap-1">
            <UBadge v-for="(value, key) in row.keyMeasurements" :key="key" color="gray" variant="subtle" size="sm">
              {{ key }}: {{ value }}
            </UBadge>
          </div>
        </template>
        
        <template #actions-data="{ row }">
          <div class="flex space-x-2">
            <UButton
              :to="`/measurements/${row.id}`"
              color="gray"
              variant="ghost"
              icon="i-heroicons-eye"
              size="xs"
            />
            <UButton
              :to="`/measurements/${row.id}/edit`"
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
            Showing {{ filteredMeasurements.length }} of {{ measurements.length }} measurements
          </div>
          <UPagination
            v-model="currentPage"
            :page-count="pageCount"
            :total="filteredMeasurements.length"
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
            <h3 class="text-lg font-medium">Delete Measurement</h3>
          </div>
        </template>
        
        <p>Are you sure you want to delete measurements for <strong>{{ measurementToDelete?.client }}</strong>? This action cannot be undone.</p>
        
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
              @click="deleteMeasurement"
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
  title: 'Measurements - QuickMeazure',
});

// Table configuration
const columns = [
  {
    key: 'client',
    label: 'Client',
    sortable: true,
  },
  {
    key: 'measurements',
    label: 'Key Measurements',
    sortable: false,
  },
  {
    key: 'lastUpdated',
    label: 'Last Updated',
    sortable: true,
  },
  {
    key: 'actions',
    label: 'Actions',
    sortable: false,
  },
];

// Mock data
const measurements = ref([
  {
    id: '1',
    clientId: '1',
    client: 'John Doe',
    keyMeasurements: {
      'Chest': '42"',
      'Waist': '36"',
      'Hip': '40"',
      'Sleeve': '25"',
    },
    lastUpdated: '2023-11-15',
    hasOrders: true,
  },
  {
    id: '2',
    clientId: '2',
    client: 'Jane Smith',
    keyMeasurements: {
      'Bust': '38"',
      'Waist': '30"',
      'Hip': '40"',
      'Shoulder': '15"',
    },
    lastUpdated: '2023-11-10',
    hasOrders: true,
  },
  {
    id: '3',
    clientId: '4',
    client: 'Sarah Williams',
    keyMeasurements: {
      'Bust': '36"',
      'Waist': '28"',
      'Hip': '38"',
      'Inseam': '30"',
    },
    lastUpdated: '2023-10-28',
    hasOrders: false,
  },
  {
    id: '4',
    clientId: '6',
    client: 'Emily Davis',
    keyMeasurements: {
      'Bust': '34"',
      'Waist': '26"',
      'Hip': '36"',
      'Sleeve': '23"',
    },
    lastUpdated: '2023-10-15',
    hasOrders: true,
  },
  {
    id: '5',
    clientId: '8',
    client: 'Olivia Taylor',
    keyMeasurements: {
      'Bust': '32"',
      'Waist': '24"',
      'Hip': '34"',
      'Shoulder': '14"',
    },
    lastUpdated: '2023-10-05',
    hasOrders: true,
  },
  {
    id: '6',
    clientId: '9',
    client: 'James Anderson',
    keyMeasurements: {
      'Chest': '44"',
      'Waist': '38"',
      'Hip': '42"',
      'Inseam': '32"',
    },
    lastUpdated: '2023-09-28',
    hasOrders: false,
  },
]);

// State variables
const isLoading = ref(false);
const search = ref('');
const sortBy = ref('client-asc');
const isFilterOpen = ref(false);
const currentPage = ref(1);
const pageSize = 10;
const filteredMeasurements = ref([...measurements.value]);

// Filter options
const sortOptions = [
  { label: 'Client Name (A-Z)', value: 'client-asc' },
  { label: 'Client Name (Z-A)', value: 'client-desc' },
  { label: 'Last Updated (Newest)', value: 'date-desc' },
  { label: 'Last Updated (Oldest)', value: 'date-asc' },
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
  hasOrders: 'any',
});

// Computed properties
const isFilterApplied = computed(() => {
  return filters.value.dateAdded !== 'any' || 
         filters.value.hasOrders !== 'any';
});

const pageCount = computed(() => {
  return Math.ceil(filteredMeasurements.value.length / pageSize);
});

// Delete measurement functionality
const isDeleteModalOpen = ref(false);
const measurementToDelete = ref(null);
const isDeleting = ref(false);

const confirmDelete = (measurement) => {
  measurementToDelete.value = measurement;
  isDeleteModalOpen.value = true;
};

const deleteMeasurement = async () => {
  isDeleting.value = true;
  
  try {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Remove measurement from list
    measurements.value = measurements.value.filter(m => m.id !== measurementToDelete.value.id);
    filteredMeasurements.value = filteredMeasurements.value.filter(m => m.id !== measurementToDelete.value.id);
    
    // Show success notification
    isDeleteModalOpen.value = false;
  } catch (error) {
    console.error('Delete failed:', error);
    // Show error notification
  } finally {
    isDeleting.value = false;
  }
};

// Filter and sort measurements
const filterMeasurements = () => {
  isLoading.value = true;
  
  // Simulate API delay
  setTimeout(() => {
    let result = [...measurements.value];
    
    // Apply search filter
    if (search.value) {
      const searchLower = search.value.toLowerCase();
      result = result.filter(measurement => 
        measurement.client.toLowerCase().includes(searchLower)
      );
    }
    
    // Apply order filter
    if (filters.value.hasOrders !== 'any') {
      const hasOrders = filters.value.hasOrders === 'yes';
      result = result.filter(measurement => measurement.hasOrders === hasOrders);
    }
    
    // Apply date filter (simplified for demo)
    if (filters.value.dateAdded !== 'any') {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
      
      result = result.filter(measurement => {
        const measurementDate = new Date(measurement.lastUpdated).getTime();
        
        switch (filters.value.dateAdded) {
          case 'today':
            return measurementDate >= today;
          case 'week':
            const weekAgo = today - 7 * 24 * 60 * 60 * 1000;
            return measurementDate >= weekAgo;
          case 'month':
            const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate()).getTime();
            return measurementDate >= monthAgo;
          case 'year':
            const yearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate()).getTime();
            return measurementDate >= yearAgo;
          default:
            return true;
        }
      });
    }
    
    // Apply sorting
    result.sort((a, b) => {
      switch (sortBy.value) {
        case 'client-asc':
          return a.client.localeCompare(b.client);
        case 'client-desc':
          return b.client.localeCompare(a.client);
        case 'date-asc':
          return new Date(a.lastUpdated) - new Date(b.lastUpdated);
        case 'date-desc':
          return new Date(b.lastUpdated) - new Date(a.lastUpdated);
        default:
          return 0;
      }
    });
    
    filteredMeasurements.value = result;
    isLoading.value = false;
  }, 300);
};

// Reset all filters
const resetFilters = () => {
  search.value = '';
  sortBy.value = 'client-asc';
  filters.value = {
    dateAdded: 'any',
    hasOrders: 'any',
  };
  filterMeasurements();
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
  filterMeasurements();
});
</script>