<template>
  <div class="space-y-8">
    <!-- Header with back button and title -->
    <div class="flex items-center justify-between">
      <div class="flex items-center">
        <UButton
          icon="i-heroicons-arrow-left"
          color="gray"
          variant="ghost"
          to="/styles"
          class="mr-3"
        />
        <h1 class="text-2xl font-bold text-gray-800">Style Details</h1>
      </div>
    </div>
    
    <!-- Loading state -->
    <div v-if="isLoading" class="flex justify-center py-12">
      <UIcon name="i-heroicons-arrow-path" class="animate-spin h-8 w-8 text-gray-400" />
    </div>
    
    <!-- Error state -->
    <UAlert v-else-if="error" color="red" icon="i-heroicons-exclamation-triangle">
      <p>{{ error }}</p>
      <UButton color="red" variant="link" to="/styles" class="mt-2">
        Return to Styles
      </UButton>
    </UAlert>
    
    <!-- Style details -->
    <div v-else-if="style" class="grid grid-cols-1 gap-6">
      <!-- Combined card with image, name and description -->
      <UCard class="bg-white shadow-md">
        <template #header>
          <div class="flex justify-between items-center">
            <h2 class="text-xl font-semibold text-gray-800">{{ style.name }}</h2>
            <UBadge color="primary" variant="subtle">Style</UBadge>
          </div>
        </template>
        
        <div class="flex flex-col md:flex-row gap-6">
          <!-- Left side: Image -->
          <div class="w-full md:w-1/3">
            <div class="aspect-w-3 aspect-h-4 bg-gray-100 rounded-md overflow-hidden">
              <img 
                v-if="style.imageUrl" 
                :src="style.imageUrl" 
                :alt="style.name" 
                class="w-full h-full object-contain rounded-md p-2"
              />
              <div v-else class="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                <UIcon name="i-heroicons-squares-2x2" class="text-gray-400 text-5xl" />
              </div>
            </div>
          </div>
          
          <!-- Right side: Details -->
          <div class="w-full md:w-2/3 space-y-4">
            <div>
              <h3 class="text-sm font-medium text-gray-500 mb-1">Description</h3>
              <p v-if="style.description" class="text-gray-700">{{ style.description }}</p>
              <p v-else class="text-gray-400 italic">No description provided</p>
            </div>
            
            <div v-if="style.notes" class="border-t border-gray-100 pt-3">
              <h3 class="text-sm font-medium text-gray-500 mb-1">Notes</h3>
              <p class="text-gray-700">{{ style.notes }}</p>
            </div>
          </div>
        </div>
        
        <template #footer>
          <div class="flex justify-between items-center">
            <div class="flex items-center text-sm text-gray-500">
              <UIcon name="i-heroicons-calendar" class="mr-1" />
              <span>Added {{ formatDate(style.createdAt) }}</span>
            </div>
            
            <div class="flex space-x-2">
              <UButton
                color="primary"
                variant="outline"
                icon="i-heroicons-pencil"
                :to="`/styles/${$route.params.id}/edit`"
                :disabled="isLoading"
              />
              <UButton
                color="error"
                variant="outline"
                icon="i-heroicons-trash"
                @click="confirmDelete = true"
                :disabled="isLoading || isDeleting"
              />
            </div>
          </div>
        </template>
      </UCard>
      
      <!-- Related orders -->
      <UCard class="bg-white shadow-md">
        <template #header>
          <div class="flex justify-between items-center">
            <h3 class="text-lg font-medium">Related Orders</h3>
            <UBadge color="gray" variant="subtle">{{ relatedOrders?.length || 0 }}</UBadge>
          </div>
        </template>
        
        <div v-if="relatedOrders && relatedOrders.length > 0">
          <UTable 
            :columns="[
              { key: 'client', label: 'Client', id: 'client' },
              { key: 'date', label: 'Order Date', id: 'date' },
              { key: 'status', label: 'Status', id: 'status' },
              { key: 'actions', label: '', id: 'actions' }
            ]"
            :rows="relatedOrders"
            :ui="{ 
              td: { 
                padding: 'py-2 px-3' 
              } 
            }"
          >
            <template #client-data="{ row }">
              <div class="flex items-center">
                <div class="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center mr-2">
                  <span class="text-primary-700 font-medium text-sm">{{ getInitials(row.clientName) }}</span>
                </div>
                <div>
                  <div class="font-medium text-gray-900 text-sm">{{ row.clientName }}</div>
                </div>
              </div>
            </template>
            
            <template #date-data="{ row }">
              <div class="text-sm text-gray-600">{{ formatDate(row.createdAt) }}</div>
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
            
            <template #actions-data="{ row }">
              <UButton
                icon="i-heroicons-eye"
                color="gray"
                variant="ghost"
                size="xs"
                :to="`/orders/${row.id}/detail`"
              />
            </template>
          </UTable>
        </div>
        
        <div v-else class="text-center py-6">
          <UIcon name="i-heroicons-shopping-bag" class="mx-auto h-10 w-10 text-gray-300" />
          <h3 class="mt-2 text-sm font-medium text-gray-900">No Orders Yet</h3>
          <p class="mt-1 text-sm text-gray-500">
            This style hasn't been used in any orders yet.
          </p>
          <UButton
            to="/orders/new"
            color="primary"
            variant="outline"
            class="mt-4"
            size="sm"
          >
            Create Order
          </UButton>
        </div>
      </UCard>
    </div>
    
    <!-- Delete Confirmation Modal -->
    <DeleteModal
      v-model="confirmDelete"
      title="Delete Style"
      :message="`Are you sure you want to delete <strong>${style?.name}</strong>? This action cannot be undone and will permanently remove this style from your catalog.`"
      @confirm="deleteStyle"
      :loading="isDeleting"
    />
  </div>
</template>

<script setup>
import { useRoute, useRouter } from 'vue-router';
import DeleteModal from '~/components/DeleteModal.vue';

// Set page metadata
useHead({
  title: 'Style Details - QuickMeazure',
  meta: [
    { name: 'description', content: 'View detailed information about a clothing style' }
  ]
});

const route = useRoute();
const router = useRouter();
const toast = useToast();

// State
const style = ref(null);
const relatedOrders = ref([]);
const isLoading = ref(true);
const isDeleting = ref(false);
const error = ref(null);
const confirmDelete = ref(false);

// Fetch style data
onMounted(async () => {
  try {
    const styleId = route.params.id;
    isLoading.value = true;
    
    // Get auth token
    const auth = useSessionAuth();
    const token = auth.token.value;
    
    if (!token) {
      error.value = 'Authentication required. Please log in.';
      isLoading.value = false;
      return;
    }
    
    console.log('Fetching style with ID:', styleId);
    
    // Use useFetch with correct headers
    const { data: fetchData, error: fetchError } = await useFetch(`/api/styles/${styleId}`, {
      key: `style-${styleId}`,
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    // Check for error
    if (fetchError.value) {
      console.error('Fetch error:', fetchError.value);
      error.value = `Error: ${fetchError.value.message || 'Failed to load style'}`;
      isLoading.value = false;
      return;
    }
    
    // Check if we have data
    if (fetchData.value) {
      console.log('API response data:', fetchData.value);
      style.value = fetchData.value.style;
      relatedOrders.value = fetchData.value.relatedOrders || [];
    } else {
      console.error('No data in API response');
      error.value = 'Failed to load style data. Please try again.';
    }
    
    isLoading.value = false;
  } catch (err) {
    console.error('Error in style detail page:', err);
    error.value = 'Failed to load style details. Please try again.';
    isLoading.value = false;
  }
});

// Format date for display
const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-US', { 
    month: 'short', 
    day: '2-digit', 
    year: 'numeric' 
  }).format(date);
};

// Get initials from a name
const getInitials = (name) => {
  if (!name) return '?';
  return name
    .split(' ')
    .map(part => part[0])
    .join('')
    .toUpperCase()
    .substring(0, 2);
};

// Get color based on order status
const getStatusColor = (status) => {
  const statusColors = {
    'pending': 'yellow',
    'in-progress': 'blue',
    'completed': 'green',
    'cancelled': 'red'
  };
  
  return statusColors[status?.toLowerCase()] || 'gray';
};

// Delete style
const deleteStyle = async () => {
  try {
    isDeleting.value = true;
    
    // Get auth token
    const auth = useSessionAuth();
    const token = auth.token.value;
    
    if (!token) {
      toast.add({
        title: 'Authentication Required',
        description: 'Please log in to delete this style.',
        color: 'orange'
      });
      confirmDelete.value = false;
      isDeleting.value = false;
      return;
    }
    
    // Delete the style using direct $fetch for simplicity
    const response = await $fetch(`/api/styles/${route.params.id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (response && response.success) {
      toast.add({
        title: 'Success',
        description: 'Style deleted successfully',
        color: 'green'
      });
      
      router.push('/styles');
    } else {
      toast.add({
        title: 'Error',
        description: 'Failed to delete style. Please try again.',
        color: 'red'
      });
      confirmDelete.value = false;
    }
    
    isDeleting.value = false;
  } catch (err) {
    console.error('Error deleting style:', err);
    
    toast.add({
      title: 'Error',
      description: 'Failed to delete style. Please try again.',
      color: 'red'
    });
    
    confirmDelete.value = false;
    isDeleting.value = false;
  }
};
</script> 