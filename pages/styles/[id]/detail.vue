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
      
      <!-- Action Buttons -->
      <div class="flex space-x-2">
        <UButton
          color="primary"
          variant="outline"
          icon="i-heroicons-pencil"
          :to="`/styles/${$route.params.id}/edit`"
          :disabled="isLoading"
        >
          Edit
        </UButton>
        <UButton
          color="red"
          variant="outline"
          icon="i-heroicons-trash"
          @click="confirmDelete = true"
          :disabled="isLoading || isDeleting"
        >
          Delete
        </UButton>
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
    <div v-else-if="style" class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Left column: Image -->
      <UCard class="lg:col-span-1 overflow-hidden shadow-md hover:shadow-lg transition-shadow">
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
        
        <template #footer>
          <div class="flex justify-between items-center">
            <span class="text-xs text-gray-500">Added {{ formatDate(style.createdAt) }}</span>
            <span v-if="style.updatedAt && style.updatedAt !== style.createdAt" class="text-xs text-gray-500">
              Updated {{ formatDate(style.updatedAt) }}
            </span>
          </div>
        </template>
      </UCard>
      
      <!-- Right column: Details and Related Orders -->
      <div class="lg:col-span-2 space-y-6">
        <!-- Style information -->
        <UCard class="bg-white shadow-md">
          <template #header>
            <div class="flex justify-between items-center">
              <h2 class="text-xl font-semibold text-gray-800">{{ style.name }}</h2>
              <UBadge color="primary" variant="subtle">Style</UBadge>
            </div>
          </template>
          
          <div class="space-y-4">
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
          
          <template #footer>
            <div class="flex items-center text-sm text-gray-500">
              <UIcon name="i-heroicons-information-circle" class="mr-1" />
              <span>Style ID: <span class="font-mono">{{ style.id }}</span></span>
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
    </div>
    
    <!-- Delete Confirmation Modal -->
    <UModal v-model="confirmDelete">
      <UCard>
        <template #header>
          <div class="flex items-center">
            <UIcon name="i-heroicons-exclamation-triangle" class="text-red-500 mr-2" />
            <h3 class="text-lg font-medium">Delete Style</h3>
          </div>
        </template>
        
        <p>Are you sure you want to delete <strong>{{ style?.name }}</strong>? This action cannot be undone and will permanently remove this style from your catalog.</p>
        
        <template #footer>
          <div class="flex justify-end space-x-4">
            <UButton
              color="gray"
              variant="outline"
              @click="confirmDelete = false"
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
import { useRoute, useRouter } from 'vue-router';

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
    
    const { authFetch } = useApiAuth();
    
    // Fetch style data from API with authentication
    const response = await authFetch(`/api/styles/${styleId}`);
    
    // The API now returns an object with style and relatedOrders
    style.value = response.style;
    
    // Set related orders from the API response (or fetch them separately)
    relatedOrders.value = response.relatedOrders || [];
    
    isLoading.value = false;
  } catch (err) {
    console.error('Error loading style details:', err);
    
    // Show error only if not an auth error (those are handled by authFetch)
    if (!err.message?.includes('No authentication token')) {
      error.value = 'Failed to load style details. Please try again.';
    }
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
    
    const { authFetch } = useApiAuth();
    
    await authFetch(`/api/styles/${route.params.id}`, {
      method: 'DELETE'
    });
    
    toast.add({
      title: 'Success',
      description: 'Style deleted successfully',
      color: 'green'
    });
    
    router.push('/styles');
  } catch (err) {
    console.error('Error deleting style:', err);
    
    // Show error only if not an auth error (those are handled by authFetch)
    if (!err.message?.includes('No authentication token')) {
      toast.add({
        title: 'Error',
        description: 'Failed to delete style. Please try again.',
        color: 'red'
      });
      confirmDelete.value = false;
    }
    isDeleting.value = false;
  }
};
</script> 