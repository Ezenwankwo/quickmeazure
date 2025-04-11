<template>
  <div class="space-y-6">
    <PageHeader
      title="Edit Client"
      subtitle="Update client information"
      :primaryAction="{
        label: 'Back to Client',
        icon: 'i-heroicons-arrow-left',
        to: `/clients/${clientId}`
      }"
    />
    
    <div v-if="isLoading" class="flex justify-center py-12">
      <ULoading />
    </div>
    
    <template v-else-if="client">
      <UCard class="bg-white">
        <form @submit.prevent="updateClient" class="space-y-6">
          <!-- Client Information -->
          <h2 class="text-lg font-medium mb-4">Client Information</h2>
          
          <UFormGroup label="Name" name="name" required>
            <UInput
              v-model="form.name"
              placeholder="Enter client name"
              required
            />
          </UFormGroup>
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <UFormGroup label="Email" name="email">
              <UInput
                v-model="form.email"
                type="email"
                placeholder="Enter client email"
              />
            </UFormGroup>
            
            <UFormGroup label="Phone" name="phone">
              <UInput
                v-model="form.phone"
                placeholder="Enter client phone number"
              />
            </UFormGroup>
          </div>
          
          <UFormGroup label="Address" name="address">
            <UInput
              v-model="form.address"
              placeholder="Enter client address"
            />
          </UFormGroup>
          
          <UFormGroup label="Notes" name="notes">
            <UTextarea
              v-model="form.notes"
              placeholder="Add any additional notes about this client..."
              :ui="{ base: 'h-24' }"
            />
          </UFormGroup>
          
          <div class="flex justify-between items-center pt-4">
            <!-- Delete Button -->
            <UButton
              type="button"
              color="red"
              variant="ghost"
              @click="confirmDelete"
              :disabled="isSubmitting"
            >
              Delete Client
            </UButton>
            
            <!-- Action Buttons -->
            <div class="flex space-x-3">
              <UButton
                type="button"
                color="gray"
                variant="outline"
                :to="`/clients/${clientId}`"
                :disabled="isSubmitting"
              >
                Cancel
              </UButton>
              
              <UButton
                type="submit"
                color="primary"
                :loading="isSubmitting"
              >
                Save Changes
              </UButton>
            </div>
          </div>
        </form>
      </UCard>
      
      <!-- Delete Confirmation Modal -->
      <UModal v-model="showDeleteModal">
        <UCard>
          <template #header>
            <div class="flex items-center">
              <UIcon name="i-heroicons-exclamation-triangle" class="text-red-500 mr-2" />
              <h3 class="text-lg font-medium">Delete Client</h3>
            </div>
          </template>
          
          <p>Are you sure you want to delete <strong>{{ client.name }}</strong>? This action cannot be undone and will also delete all measurements and orders for this client.</p>
          
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
                @click="deleteClient"
                :loading="isDeleting"
              >
                Delete
              </UButton>
            </div>
          </template>
        </UCard>
      </UModal>
    </template>
    
    <template v-else>
      <UCard class="bg-white">
        <div class="py-12 text-center">
          <UIcon name="i-heroicons-face-frown" class="text-gray-400 mx-auto mb-2" size="xl" />
          <h3 class="text-lg font-medium text-gray-900">Client not found</h3>
          <p class="text-gray-500 mt-1 mb-4">This client doesn't exist or you don't have access to it.</p>
          <UButton
            color="primary"
            to="/clients"
            icon="i-heroicons-arrow-left"
          >
            Back to Clients
          </UButton>
        </div>
      </UCard>
    </template>
  </div>
</template>

<script setup>
// Get client ID from route
const route = useRoute();
const clientId = route.params.id;

// State
const client = ref(null);
const isLoading = ref(true);
const isSubmitting = ref(false);
const isDeleting = ref(false);
const showDeleteModal = ref(false);

// Form state
const form = ref({
  name: '',
  email: '',
  phone: '',
  address: '',
  notes: '',
});

// Set page metadata
useHead({
  title: 'Edit Client - QuickMeazure',
});

// Fetch client details
const fetchClient = async () => {
  isLoading.value = true;
  
  try {
    // Get auth token from the auth store
    const auth = useAuth();
    const token = auth.token.value;
    
    if (!token) {
      // Redirect to login if not authenticated
      useToast().add({
        title: 'Authentication required',
        description: 'Please log in to edit client details',
        color: 'orange'
      });
      navigateTo('/auth/login');
      return;
    }
    
    // Fetch client by ID
    const data = await $fetch(`/api/clients/${clientId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    client.value = data;
    
    // Populate form with client data
    form.value = {
      name: data.name || '',
      email: data.email || '',
      phone: data.phone || '',
      address: data.address || '',
      notes: data.notes || '',
    };
  } catch (error) {
    console.error('Error fetching client:', error);
    let errorMessage = 'Failed to load client details. Please try again.';
    
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
  } finally {
    isLoading.value = false;
  }
};

// Update client
const updateClient = async () => {
  // Form validation
  if (!form.value.name.trim()) {
    useToast().add({
      title: 'Validation Error',
      description: 'Client name is required',
      color: 'red',
    });
    return;
  }
  
  isSubmitting.value = true;
  
  try {
    // Get auth token from the auth store
    const auth = useAuth();
    const token = auth.token.value;
    
    // Call the update endpoint
    await $fetch(`/api/clients/${clientId}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: form.value
    });
    
    // Show success message
    useToast().add({
      title: 'Client Updated',
      description: 'Client information has been updated successfully',
      color: 'green',
    });
    
    // Navigate back to client details
    navigateTo(`/clients/${clientId}`);
  } catch (error) {
    console.error('Error updating client:', error);
    let errorMessage = 'Failed to update client. Please try again.';
    
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
  } finally {
    isSubmitting.value = false;
  }
};

// Confirm delete
const confirmDelete = () => {
  showDeleteModal.value = true;
};

// Delete client
const deleteClient = async () => {
  isDeleting.value = true;
  
  try {
    // Get auth token from the auth store
    const auth = useAuth();
    const token = auth.token.value;
    
    // Call the delete endpoint
    await $fetch(`/api/clients/${clientId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    // Show success message
    useToast().add({
      title: 'Client Deleted',
      description: 'Client has been deleted successfully',
      color: 'green',
    });
    
    // Navigate back to clients list
    navigateTo('/clients');
  } catch (error) {
    console.error('Error deleting client:', error);
    let errorMessage = 'Failed to delete client. Please try again.';
    
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
  } finally {
    isDeleting.value = false;
    showDeleteModal.value = false;
  }
};

// Fetch data on component mount
onMounted(() => {
  fetchClient();
});
</script> 