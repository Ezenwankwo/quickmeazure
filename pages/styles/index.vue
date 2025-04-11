<template>
  <div class="space-y-8">
    <!-- Header with animated underline effect -->
    <PageHeader 
      title="Style Catalog"
      subtitle="Browse and manage your design collection"
      :primaryAction="{
        label: 'Add New Style',
        icon: 'i-heroicons-plus',
        to: '/styles/new'
      }"
    />
    
    <!-- Search and Filter with glassy effect -->
    <UCard class="bg-white/80 backdrop-blur-sm border border-gray-100 shadow-sm">
      <div class="flex flex-col space-y-3 sm:space-y-0 sm:flex-row sm:gap-4 items-center">
        <div class="relative w-full sm:w-80 group">
          <UInput
            v-model="search"
            placeholder="Search styles..."
            icon="i-heroicons-magnifying-glass"
            class="w-full focus-within:ring-2 ring-primary-200"
            @input="filterStyles"
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
            @update:model-value="filterStyles"
          />
        </div>
      </div>
    </UCard>
    
    <!-- Styles Grid with improved cards -->
    <div v-if="!isLoading && filteredStyles.length > 0" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
      <UCard 
        v-for="style in filteredStyles" 
        :key="style.id"
        class="bg-white border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 overflow-hidden group flex flex-col"
      >
        <div class="aspect-w-3 aspect-h-4 bg-gray-100 overflow-hidden flex-grow rounded-md">
          <img 
            v-if="style.imageUrl" 
            :src="style.imageUrl" 
            :alt="style.name" 
            class="w-full h-full object-contain transition-transform duration-500 p-2 rounded-md"
          />
          <div v-else class="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
            <UIcon name="i-heroicons-squares-2x2" class="text-gray-400 text-3xl sm:text-5xl" />
          </div>
        </div>
        
        <div class="pt-3">
          <div class="flex items-center justify-between">
            <h3 class="text-base sm:text-lg font-semibold text-gray-800 group-hover:text-primary-600 transition-colors truncate">{{ style.name }}</h3>
            <UTooltip text="View Details">
              <UButton
                color="gray"
                variant="ghost"
                icon="i-heroicons-eye"
                size="2xs"
                :to="`/styles/${style.id}/detail`"
                class="hover:bg-gray-100"
              />
            </UTooltip>
          </div>
          <p v-if="style.description" class="text-gray-600 line-clamp-1 text-xs sm:text-sm leading-relaxed">{{ style.description }}</p>
        </div>
        
        <template #footer>
          <div class="flex justify-between items-center p-0 transition-colors">
            <span class="text-xxs sm:text-xs text-gray-500 flex items-center">
              {{ formatDate(style.createdAt) }}
            </span>
            <div class="flex space-x-1">
              <UTooltip text="Edit Style">
                <UButton
                  color="primary"
                  variant="ghost"
                  icon="i-heroicons-pencil-square"
                  size="2xs"
                  :to="`/styles/${style.id}/edit`"
                  class="hover:bg-primary-100"
                />
              </UTooltip>
              <UTooltip text="Delete Style">
                <UButton
                  color="red"
                  variant="ghost"
                  icon="i-heroicons-trash"
                  size="2xs"
                  @click="confirmDelete(style)"
                  class="hover:bg-red-100"
                />
              </UTooltip>
            </div>
          </div>
        </template>
      </UCard>
    </div>
    
    <!-- Empty State with improved visuals -->
    <UCard v-else-if="!isLoading && filteredStyles.length === 0" class="bg-white py-8 sm:py-16 border border-dashed border-gray-300">
      <div class="text-center max-w-md mx-auto px-4 sm:px-0">
        <div class="bg-gray-50 rounded-full w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center mx-auto mb-4 sm:mb-6">
          <UIcon name="i-heroicons-swatch" class="text-gray-400 text-3xl sm:text-4xl" />
        </div>
        <h3 class="text-lg sm:text-xl font-semibold text-gray-800 mb-2 sm:mb-3">No styles found</h3>
        <p class="text-gray-600 mb-4 sm:mb-6 max-w-xs mx-auto text-sm sm:text-base">
          {{ search ? 'Try adjusting your search or clear filters to see all styles' : 'Get started by adding your first style to your catalog' }}
        </p>
        <UButton
          v-if="!search"
          to="/styles/new"
          color="primary"
          class="px-4 sm:px-6 py-2"
        >
          Create Your First Style
        </UButton>
        <UButton
          v-else
          color="gray"
          variant="outline"
          @click="resetSearch"
          icon="i-heroicons-arrow-path"
          class="px-4 sm:px-6"
        >
          Reset Filters
        </UButton>
      </div>
    </UCard>
    
    <!-- Loading State with skeleton -->
    <div v-else>
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
        <UCard v-for="i in 6" :key="i" class="bg-white overflow-hidden border border-gray-100">
          <div class="aspect-w-3 aspect-h-4 bg-gray-200 animate-pulse"></div>
          <div class="p-3 sm:p-5 space-y-2 sm:space-y-3">
            <div class="flex items-center justify-between">
              <div class="h-5 sm:h-6 bg-gray-200 rounded animate-pulse w-3/4"></div>
              <div class="h-4 sm:h-5 bg-gray-200 rounded-full animate-pulse w-12 sm:w-16"></div>
            </div>
            <div class="h-3 sm:h-4 bg-gray-200 rounded animate-pulse w-full"></div>
            <div class="h-3 sm:h-4 bg-gray-200 rounded animate-pulse w-2/3"></div>
          </div>
          <template #footer>
            <div class="flex justify-between items-center px-3 pb-2 sm:p-5">
              <div class="h-3 sm:h-4 bg-gray-200 rounded animate-pulse w-1/3"></div>
              <div class="flex space-x-1 sm:space-x-2">
                <div class="h-6 w-6 sm:h-8 sm:w-8 bg-gray-200 rounded animate-pulse"></div>
                <div class="h-6 w-6 sm:h-8 sm:w-8 bg-gray-200 rounded animate-pulse"></div>
              </div>
            </div>
          </template>
        </UCard>
      </div>
    </div>
    
    <!-- Delete Confirmation Modal -->
    <UModal v-model="showDeleteModal">
      <UCard>
        <template #header>
          <div class="flex items-center">
            <UIcon name="i-heroicons-exclamation-triangle" class="text-red-500 mr-2" />
            <h3 class="text-lg font-medium">Delete Style</h3>
          </div>
        </template>
        
        <p>Are you sure you want to delete <strong>{{ styleToDelete?.name }}</strong>? This action cannot be undone and will permanently remove this style from your catalog.</p>
        
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
              @click="deleteStyle"
              :loading="isDeleting"
              :disabled="isDeleting"
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
  title: 'Style Catalog - QuickMeazure',
  meta: [
    { name: 'description', content: 'Browse and manage your clothing design styles and patterns' }
  ]
});

// State
const search = ref('');
const sortBy = ref('newest');
const isLoading = ref(true);
const styles = ref([]);
const filteredStyles = ref([]);
const showDeleteModal = ref(false);
const styleToDelete = ref(null);
const isDeleting = ref(false);

// Sort options
const sortOptions = [
  { label: 'Newest first', value: 'newest', icon: 'i-heroicons-arrow-up' },
  { label: 'Oldest first', value: 'oldest', icon: 'i-heroicons-arrow-down' },
  { label: 'Name (A-Z)', value: 'name-asc', icon: 'i-heroicons-bars-arrow-down' },
  { label: 'Name (Z-A)', value: 'name-desc', icon: 'i-heroicons-bars-arrow-up' },
];

// Load data
onMounted(async () => {
  try {
    isLoading.value = true;
    
    const { authFetch } = useApiAuth();
    
    // Fetch styles from the API using authFetch
    styles.value = await authFetch('/api/styles');
    
    filterStyles();
    isLoading.value = false;
  } catch (error) {
    console.error('Error loading styles:', error);
    isLoading.value = false;
    
    // Show error notification (session expiry is automatically handled by authFetch)
    useToast().add({
      title: 'Error',
      description: 'Failed to load styles. Please try again.',
      color: 'red'
    });
  }
});

// Filter and sort styles based on search and sort criteria
const filterStyles = () => {
  // Filter by search term
  let result = styles.value;
  
  if (search.value) {
    const searchLower = search.value.toLowerCase();
    result = result.filter(style => 
      style.name.toLowerCase().includes(searchLower) || 
      (style.description && style.description.toLowerCase().includes(searchLower))
    );
  }
  
  // Sort results
  result = [...result].sort((a, b) => {
    switch (sortBy.value) {
      case 'newest':
        return b.createdAt - a.createdAt;
      case 'oldest':
        return a.createdAt - b.createdAt;
      case 'name-asc':
        return a.name.localeCompare(b.name);
      case 'name-desc':
        return b.name.localeCompare(a.name);
      default:
        return 0;
    }
  });
  
  filteredStyles.value = result;
};

// Reset search
const resetSearch = () => {
  search.value = '';
  filterStyles();
};

// Format date
const formatDate = (timestamp) => {
  return new Date(timestamp).toLocaleDateString('en-US', { 
    month: 'short', 
    day: '2-digit', 
    year: 'numeric' 
  });
};

// Confirm delete
const confirmDelete = (style) => {
  styleToDelete.value = style;
  showDeleteModal.value = true;
};

// Delete style
const deleteStyle = async () => {
  if (!styleToDelete.value) return;
  
  isDeleting.value = true;
  
  try {
    const { authFetch } = useApiAuth();
    
    // Call the delete endpoint using authFetch
    await authFetch(`/api/styles/${styleToDelete.value.id}`, {
      method: 'DELETE'
    });
    
    // Remove from list
    styles.value = styles.value.filter(s => s.id !== styleToDelete.value.id);
    filterStyles();
    
    // Show success notification
    useToast().add({
      title: 'Style Deleted',
      description: `"${styleToDelete.value.name}" was successfully removed.`,
      color: 'green'
    });
    
    // Close modal
    showDeleteModal.value = false;
    styleToDelete.value = null;
  } catch (error) {
    console.error('Error deleting style:', error);
    
    // Show error notification (session expiry is handled by authFetch)
    if (!error.message?.includes('No authentication token')) {
      useToast().add({
        title: 'Error',
        description: 'Failed to delete style. Please try again.',
        color: 'red'
      });
    }
  } finally {
    isDeleting.value = false;
  }
};
</script>