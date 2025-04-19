<template>
  <div class="space-y-6">
    <PageHeader
      title="Measurements"
      subtitle="Track and manage your client measurements collection"
      :primaryAction="{
        label: 'Add New Measurement',
        icon: 'i-heroicons-plus',
        to: '/measurements/new'
      }"
    />
    
    <!-- Search and Filter with glassy effect -->
    <UCard class="bg-white/80 backdrop-blur-sm border border-gray-100 shadow-sm">
      <div class="flex flex-col space-y-3 sm:space-y-0 sm:flex-row sm:gap-4 items-center">
        <div class="relative w-full sm:w-80 group">
          <UInput
            v-model="search"
            placeholder="Search client name..."
            icon="i-heroicons-magnifying-glass"
            class="w-full focus-within:ring-2 ring-primary-200"
            @input="filterMeasurements"
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
            @update:model-value="filterMeasurements"
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
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <UFormGroup label="Date Added">
          <USelect
            v-model="filters.dateAdded"
            :options="dateOptions"
            placeholder="Any time"
            class="focus-within:ring-2 ring-primary-200"
            @update:model-value="filterMeasurements"
          />
        </UFormGroup>
        
        <UFormGroup label="Has Orders">
          <USelect
            v-model="filters.hasOrders"
            :options="booleanOptions"
            placeholder="All clients"
            class="focus-within:ring-2 ring-primary-200"
            @update:model-value="filterMeasurements"
          />
        </UFormGroup>
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
    
    <!-- Measurements Table (desktop) / Cards (mobile) -->
    <UCard class="bg-white">
      <!-- Desktop Table View (hidden on mobile) -->
      <div class="hidden sm:block">
        <UTable 
          :columns="columns" 
          :rows="paginatedMeasurements" 
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
          
          <template #lastUpdated-data="{ row }">
            {{ formatDate(row.lastUpdated) }}
          </template>
          
          <template #actions-data="{ row }">
            <div class="flex space-x-2">
              <UButton
                :to="`/measurements/${row.id}/detail`"
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
      </div>
      
      <!-- Mobile Card View (shown only on mobile) -->
      <div class="sm:hidden space-y-4">
        <template v-if="!isLoading && paginatedMeasurements.length > 0">
          <UCard 
            v-for="measurement in paginatedMeasurements" 
            :key="measurement.id"
            class="border border-gray-200 shadow-sm"
          >
            <div class="flex items-center mb-3">
              <div class="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center mr-3">
                <span class="text-primary-700 font-medium text-lg">{{ getInitials(measurement.client) }}</span>
              </div>
              <NuxtLink :to="`/clients/${measurement.clientId}`" class="font-semibold text-lg text-primary-600 hover:underline">
                {{ measurement.client }}
              </NuxtLink>
            </div>
            
            <div class="space-y-3">
              <!-- Key Measurements -->
              <div>
                <h4 class="text-sm font-medium text-gray-500 mb-2">Key Measurements</h4>
                <div class="flex flex-wrap gap-2">
                  <UBadge 
                    v-for="(value, key) in measurement.keyMeasurements" 
                    :key="key" 
                    color="gray" 
                    variant="subtle"
                  >
                    {{ key }}: {{ value }}
                  </UBadge>
                </div>
              </div>
              
              <!-- Last Updated -->
              <div class="flex justify-between py-1 border-t border-gray-100 mt-2 pt-2">
                <span class="text-gray-500 text-sm">Last Updated</span>
                <span class="text-sm">{{ formatDate(measurement.lastUpdated) }}</span>
              </div>
            </div>
            
            <template #footer>
              <div class="flex justify-between items-center">
                <UButton
                  :to="`/measurements/${measurement.id}/detail`"
                  color="primary"
                  variant="ghost"
                  size="sm"
                >
                  View Details
                </UButton>
                
                <div class="flex space-x-2">
                  <UButton
                    :to="`/measurements/${measurement.id}/edit`"
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
                    @click="confirmDelete(measurement)"
                  />
                </div>
              </div>
            </template>
          </UCard>
        </template>
        
        <!-- Empty state for mobile -->
        <div v-else-if="!isLoading && filteredMeasurements.length === 0" class="text-center py-8">
          <div class="bg-gray-50 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
            <UIcon name="i-heroicons-variable" class="text-gray-400 text-xl" />
          </div>
          <h3 class="text-lg font-medium text-gray-800 mb-1">No measurements found</h3>
          <p class="text-gray-500 text-sm mb-4">
            {{ search || isFilterApplied ? 'Try adjusting your search or filters' : 'Get started by adding your first measurement' }}
          </p>
          <UButton
            v-if="!search && !isFilterApplied"
            to="/measurements/new"
            color="primary"
            size="sm"
          >
            Add measurement
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
            <div class="space-y-3">
              <div>
                <div class="h-4 bg-gray-200 rounded animate-pulse w-1/3 mb-2"></div>
                <div class="flex flex-wrap gap-2">
                  <div class="h-6 bg-gray-200 rounded-full animate-pulse w-16"></div>
                  <div class="h-6 bg-gray-200 rounded-full animate-pulse w-20"></div>
                  <div class="h-6 bg-gray-200 rounded-full animate-pulse w-24"></div>
                </div>
              </div>
              <div class="flex justify-between py-1 border-t border-gray-100 mt-2 pt-2">
                <div class="h-4 bg-gray-200 rounded animate-pulse w-1/4"></div>
                <div class="h-4 bg-gray-200 rounded animate-pulse w-1/3"></div>
              </div>
            </div>
            <div class="flex justify-between items-center pt-2">
              <div class="h-8 bg-gray-200 rounded animate-pulse w-1/3"></div>
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
        <div class="flex flex-col sm:flex-row justify-between items-center gap-4" v-if="filteredMeasurements.length > 0">
          <div class="text-sm text-gray-500 order-2 sm:order-1">
            Showing {{ Math.min((currentPage - 1) * ITEMS_PER_PAGE + 1, totalItems) }}-{{ Math.min(currentPage * ITEMS_PER_PAGE, totalItems) }} of {{ totalItems }} measurements
          </div>
          
          <!-- Custom pagination -->
          <div v-if="showPagination" class="flex items-center space-x-1 order-1 sm:order-2">
            <!-- Previous button -->
            <UButton
              variant="ghost" 
              color="gray"
              :disabled="currentPage === 1"
              @click="currentPage > 1 && (currentPage--, fetchMeasurements())"
              size="sm"
              icon="i-heroicons-chevron-left"
              class="rounded-lg"
            />
            
            <!-- First page -->
            <UButton
              variant="ghost" 
              color="gray"
              :class="currentPage === 1 ? 'bg-primary-50 text-primary-700' : ''"
              @click="currentPage = 1, fetchMeasurements()"
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
              @click="currentPage = page, fetchMeasurements()"
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
              @click="currentPage = pageCount, fetchMeasurements()"
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
              @click="currentPage < pageCount && (currentPage++, fetchMeasurements())"
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

// Import auth composable
import { useAuth } from '~/composables/useAuth';

// Table configuration
const columns = [
  {
    key: 'client',
    label: 'Client',
    sortable: true,
    id: 'client'
  },
  {
    key: 'measurements',
    label: 'Key Measurements',
    sortable: false,
    id: 'measurements'
  },
  {
    key: 'lastUpdated',
    label: 'Last Updated',
    sortable: true,
    id: 'lastUpdated'
  },
  {
    key: 'actions',
    label: 'Actions',
    sortable: false,
    id: 'actions'
  },
];

// State management
const measurements = ref([]);
const isLoading = ref(true);
const search = ref('');
const isFilterOpen = ref(false);
const filteredMeasurements = ref([]);
const currentPage = ref(1);
const isDeleteModalOpen = ref(false);
const measurementToDelete = ref(null);
const isDeleting = ref(false);
const totalItems = ref(0);
const totalPages = ref(0);

// Sort and filter options
const sortBy = ref('client-asc');
const sortOptions = [
  { label: 'Client Name (A-Z)', value: 'client-asc' },
  { label: 'Client Name (Z-A)', value: 'client-desc' },
  { label: 'Last Updated (Newest)', value: 'date-desc' },
  { label: 'Last Updated (Oldest)', value: 'date-asc' },
];

const filters = ref({
  dateAdded: null,
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
const ITEMS_PER_PAGE = 10;

const pageCount = computed(() => {
  return totalPages.value;
});

const paginatedMeasurements = computed(() => {
  return filteredMeasurements.value;
});

const showPagination = computed(() => {
  return totalPages.value > 1;
});

const isFilterApplied = computed(() => {
  return filters.value.dateAdded !== null || filters.value.hasOrders !== null;
});

// Helper functions
const getInitials = (name) => {
  if (!name) return '';
  return name.split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .substring(0, 2);
};

// Format measurements for display
const formatMeasurements = (measurement) => {
  const keyMeasurements = {};
  
  // Add the most important measurements
  if (measurement.bust) keyMeasurements['Bust'] = formatMeasurement(measurement.bust);
  if (measurement.waist) keyMeasurements['Waist'] = formatMeasurement(measurement.waist);
  if (measurement.hip) keyMeasurements['Hip'] = formatMeasurement(measurement.hip);
  if (measurement.shoulder) keyMeasurements['Shoulder'] = formatMeasurement(measurement.shoulder);
  if (measurement.chest) keyMeasurements['Chest'] = formatMeasurement(measurement.chest);
  if (measurement.sleeve) keyMeasurements['Sleeve'] = formatMeasurement(measurement.sleeve);
  
  return {
    id: measurement.id,
    clientId: measurement.clientId,
    client: measurement.clientName,
    keyMeasurements,
    lastUpdated: new Date(measurement.updatedAt).toISOString(),
    hasOrders: measurement.hasOrders, // Using real data from API
    // Include all original measurements for reference
    originalData: measurement
  };
};

const formatMeasurement = (value) => {
  if (value === null || value === undefined) return 'N/A';
  return `${value}"`;
};

const filterMeasurements = () => {
  // Reset to first page when filter changes
  currentPage.value = 1;
  // Fetch data with new filters
  fetchMeasurements();
};

const resetSearch = () => {
  search.value = '';
  filterMeasurements();
};

const resetFilters = () => {
  search.value = '';
  filters.value = {
    dateAdded: null,
    hasOrders: null,
  };
  sortBy.value = 'client-asc';
  isFilterOpen.value = false;
  filterMeasurements();
};

const confirmDelete = (measurement) => {
  measurementToDelete.value = measurement;
  isDeleteModalOpen.value = true;
};

// Delete measurement
const deleteMeasurement = async () => {
  if (!measurementToDelete.value) return;
  
  isDeleting.value = true;
  
  try {
    // Get auth token from the auth store
    const auth = useAuth();
    const token = auth.token.value;
    
    if (!token) {
      useToast().add({
        title: 'Authentication required',
        description: 'Please log in to delete measurements',
        color: 'orange'
      });
      navigateTo('/auth/login');
      return;
    }
    
    // Call the delete endpoint
    await $fetch(`/api/measurements/${measurementToDelete.value.id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    // Remove from local array
    const index = measurements.value.findIndex(m => m.id === measurementToDelete.value.id);
    if (index !== -1) {
      measurements.value.splice(index, 1);
    }
    
    // Update filtered measurements
    filterMeasurements();
    
    // Show success notification
    useToast().add({
      title: 'Measurement deleted',
      description: `Measurement for ${measurementToDelete.value.client} has been deleted successfully.`,
      color: 'green',
    });
    
    // Close modal
    isDeleteModalOpen.value = false;
    measurementToDelete.value = null;
  } catch (error) {
    console.error('Error deleting measurement:', error);
    let errorMessage = 'Failed to delete measurement. Please try again.';
    
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

// Fetch measurements data
const fetchMeasurements = async () => {
  isLoading.value = true;
  
  try {
    // Get auth token from the auth store
    const auth = useAuth();
    const token = auth.token.value;
    
    if (!token) {
      // Redirect to login if not authenticated
      useToast().add({
        title: 'Authentication required',
        description: 'Please log in to view measurements',
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
    if (filters.value.dateAdded) {
      params.append('dateFilter', filters.value.dateAdded);
    }
    
    if (filters.value.hasOrders !== null) {
      params.append('hasOrders', filters.value.hasOrders.toString());
    }
    
    // Make API request with all parameters
    const response = await $fetch(`/api/measurements?${params.toString()}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    // Format the measurements data for display
    measurements.value = response.data.map(measurement => formatMeasurements(measurement));
    
    // Update pagination data from server response
    filteredMeasurements.value = measurements.value;
    
    // Update pagination from server response
    if (response.pagination) {
      currentPage.value = response.pagination.page;
      totalItems.value = response.pagination.total;
      totalPages.value = response.pagination.totalPages;
    }
  } catch (error) {
    console.error('Error fetching measurements:', error);
    let errorMessage = 'Failed to load measurements. Please refresh the page.';
    
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
    
    measurements.value = [];
    filteredMeasurements.value = [];
  } finally {
    isLoading.value = false;
  }
};

// Initial fetch on component mount
onMounted(() => {
  fetchMeasurements();
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
</script>