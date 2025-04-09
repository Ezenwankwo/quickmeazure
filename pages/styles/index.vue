<template>
  <div class="space-y-6">
    <div class="flex justify-between items-center">
      <h1 class="text-2xl font-bold">Style Catalog</h1>
      <UButton
        to="/styles/new"
        color="primary"
        icon="i-heroicons-plus"
      >
        Add New Style
      </UButton>
    </div>
    
    <!-- Search and Filter -->
    <div class="flex flex-col md:flex-row gap-4">
      <UInput
        v-model="search"
        placeholder="Search styles..."
        icon="i-heroicons-magnifying-glass"
        class="md:w-80"
        @input="filterStyles"
      />
      
      <div class="flex gap-2 ml-auto">
        <USelect
          v-model="sortBy"
          :options="sortOptions"
          placeholder="Sort by"
          @update:model-value="filterStyles"
        />
      </div>
    </div>
    
    <!-- Styles Grid -->
    <div v-if="!isLoading && filteredStyles.length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <UCard 
        v-for="style in filteredStyles" 
        :key="style.id"
        class="bg-white hover:shadow-md transition-shadow"
      >
        <div class="aspect-w-16 aspect-h-9 bg-gray-100 rounded-t-md overflow-hidden">
          <img 
            v-if="style.imageUrl" 
            :src="style.imageUrl" 
            :alt="style.name" 
            class="w-full h-full object-cover"
          />
          <div v-else class="w-full h-full flex items-center justify-center">
            <UIcon name="i-heroicons-photo" class="text-gray-400 text-4xl" />
          </div>
        </div>
        
        <div class="p-4">
          <h3 class="text-lg font-medium">{{ style.name }}</h3>
          <p v-if="style.description" class="text-gray-600 mt-1 line-clamp-2">{{ style.description }}</p>
        </div>
        
        <template #footer>
          <div class="flex justify-between items-center">
            <span class="text-sm text-gray-500">Added {{ formatDate(style.createdAt) }}</span>
            <div class="flex space-x-2">
              <UButton
                color="gray"
                variant="ghost"
                icon="i-heroicons-pencil-square"
                size="sm"
                :to="`/styles/${style.id}`"
              />
              <UButton
                color="gray"
                variant="ghost"
                icon="i-heroicons-trash"
                size="sm"
                @click="confirmDelete(style)"
              />
            </div>
          </div>
        </template>
      </UCard>
    </div>
    
    <!-- Empty State -->
    <UCard v-else-if="!isLoading && filteredStyles.length === 0" class="bg-white py-12">
      <div class="text-center">
        <UIcon name="i-heroicons-swatch" class="text-gray-400 text-5xl mx-auto mb-4" />
        <h3 class="text-lg font-medium mb-2">No styles found</h3>
        <p class="text-gray-600 mb-6">
          {{ search ? 'Try adjusting your search' : 'Get started by adding your first style to your catalog' }}
        </p>
        <UButton
          v-if="!search"
          to="/styles/new"
          color="primary"
        >
          Add New Style
        </UButton>
        <UButton
          v-else
          color="gray"
          variant="outline"
          @click="resetSearch"
        >
          Clear Search
        </UButton>
      </div>
    </UCard>
    
    <!-- Loading State -->
    <UCard v-else class="bg-white py-12">
      <div class="text-center">
        <UIcon name="i-heroicons-arrow-path" class="text-gray-400 text-5xl mx-auto mb-4 animate-spin" />
        <h3 class="text-lg font-medium">Loading styles...</h3>
      </div>
    </UCard>
    
    <!-- Delete Confirmation Modal -->
    <UModal v-model="showDeleteModal">
      <UCard>
        <template #header>
          <h3 class="text-lg font-medium">Confirm Deletion</h3>
        </template>
        
        <p>Are you sure you want to delete <strong>{{ styleToDelete?.name }}</strong>? This action cannot be undone.</p>
        
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
  { label: 'Newest first', value: 'newest' },
  { label: 'Oldest first', value: 'oldest' },
  { label: 'Name (A-Z)', value: 'name-asc' },
  { label: 'Name (Z-A)', value: 'name-desc' },
];

// Mock data - would be replaced with API call
onMounted(async () => {
  try {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Mock data
    styles.value = [
      {
        id: '1',
        name: 'Classic Suit',
        description: 'Traditional two-piece suit with notched lapels and single-breasted jacket.',
        imageUrl: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
        createdAt: Date.now() - 7 * 24 * 60 * 60 * 1000, // 7 days ago
      },
      {
        id: '2',
        name: 'Modern Blazer',
        description: 'Contemporary slim-fit blazer with minimal details and clean lines.',
        imageUrl: 'https://images.unsplash.com/photo-1617127365659-c47fa864d8bc?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
        createdAt: Date.now() - 14 * 24 * 60 * 60 * 1000, // 14 days ago
      },
      {
        id: '3',
        name: 'Traditional Agbada',
        description: 'Elegant flowing robe with intricate embroidery, perfect for special occasions.',
        imageUrl: 'https://images.unsplash.com/photo-1590735213920-68192a487bc2?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
        createdAt: Date.now() - 21 * 24 * 60 * 60 * 1000, // 21 days ago
      },
      {
        id: '4',
        name: 'Senator Style',
        description: 'Contemporary Nigerian attire featuring a long tunic and matching trousers.',
        imageUrl: 'https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
        createdAt: Date.now() - 30 * 24 * 60 * 60 * 1000, // 30 days ago
      },
      {
        id: '5',
        name: 'Casual Shirt',
        description: 'Relaxed fit button-up shirt with modern collar design.',
        imageUrl: null, // No image example
        createdAt: Date.now() - 45 * 24 * 60 * 60 * 1000, // 45 days ago
      },
    ];
    
    filterStyles();
    isLoading.value = false;
  } catch (error) {
    console.error('Error loading styles:', error);
    isLoading.value = false;
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
    day: 'numeric', 
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
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Remove from list
    styles.value = styles.value.filter(s => s.id !== styleToDelete.value.id);
    filterStyles();
    
    // Show success notification
    // In a real app, this would use a notification system
    console.log(`Style "${styleToDelete.value.name}" deleted successfully`);
    
    // Close modal
    showDeleteModal.value = false;
    styleToDelete.value = null;
  } catch (error) {
    console.error('Error deleting style:', error);
    // Show error notification
  } finally {
    isDeleting.value = false;
  }
};
</script>