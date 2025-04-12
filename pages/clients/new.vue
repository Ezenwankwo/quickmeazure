<template>
  <div class="space-y-6">
    <div class="flex items-center">
      <UButton
        icon="i-heroicons-arrow-left"
        color="gray"
        variant="ghost"
        to="/clients"
        class="mr-4"
      />
      <h1 class="text-xl font-bold">Add New Client</h1>
    </div>
    
    <UCard class="bg-white">
      <form @submit.prevent="saveClient" class="space-y-6">
        <!-- Personal Information -->
        <div>
          <h2 class="text-lg font-medium mb-4">Personal Information</h2>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <UFormGroup label="Full Name" name="name" required>
              <UInput
                v-model="client.name"
                placeholder="Enter client's full name"
                required
              />
            </UFormGroup>
            
            <UFormGroup label="Email" name="email">
              <UInput
                v-model="client.email"
                type="email"
                placeholder="Enter client's email"
              />
            </UFormGroup>
            
            <UFormGroup label="Phone Number" name="phone" required>
              <UInput
                v-model="client.phone"
                placeholder="Enter client's phone number"
                required
              />
            </UFormGroup>
            
            <UFormGroup label="Address" name="address">
              <UInput
                v-model="client.address"
                placeholder="Enter client's address"
              />
            </UFormGroup>
          </div>
        </div>
        
        <!-- Additional Information -->
        <div>
          <h2 class="text-lg font-medium mb-4">Additional Information</h2>
          <UFormGroup label="Notes" name="notes">
            <UTextarea
              v-model="client.notes"
              placeholder="Add any additional notes about this client"
              rows="4"
            />
          </UFormGroup>
        </div>
        
        <!-- Action Buttons -->
        <div class="flex justify-end space-x-4">
          <UButton
            type="button"
            color="gray"
            variant="outline"
            to="/clients"
          >
            Cancel
          </UButton>
          
          <UButton
            type="submit"
            color="primary"
            :loading="isSaving"
          >
            Save Client
          </UButton>
        </div>
      </form>
    </UCard>
  </div>
</template>

<script setup>
// Set page metadata
useHead({
  title: 'Add New Client - QuickMeazure',
});

// Client data
const client = ref({
  name: '',
  email: '',
  phone: '',
  address: '',
  notes: '',
});

const isSaving = ref(false);

// Save client function
const saveClient = async () => {
  isSaving.value = true;
  
  try {
    // Validate required fields
    if (!client.value.name) {
      useToast().add({
        title: 'Missing information',
        description: 'Please enter the client name',
        color: 'red'
      });
      isSaving.value = false;
      return;
    }
    
    // Get auth token from the auth store
    const auth = useAuth();
    const token = auth.token.value;
    
    if (!token) {
      // Redirect to login if not authenticated
      useToast().add({
        title: 'Authentication required',
        description: 'Please log in to add clients',
        color: 'orange'
      });
      navigateTo('/auth/login');
      return;
    }
    
    // Call API to save client
    const newClient = await $fetch('/api/clients', {
      method: 'POST',
      body: client.value,
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    // Show success notification
    useToast().add({
      title: 'Client saved',
      description: 'The client has been added successfully',
      color: 'green'
    });
    
    // Redirect to client detail page
    navigateTo(`/clients/${newClient.id}`);
  } catch (error) {
    console.error('Failed to save client:', error);
    let errorMessage = 'An error occurred while saving the client';
    
    // Get more specific error message if available
    if (error.data?.statusMessage) {
      errorMessage = error.data.statusMessage;
    }
    
    // Handle unauthorized errors
    if (error.response?.status === 401) {
      errorMessage = 'Your session has expired. Please log in again.';
      // Redirect to login
      navigateTo('/auth/login');
    }
    
    useToast().add({
      title: 'Error',
      description: errorMessage,
      color: 'red'
    });
  } finally {
    isSaving.value = false;
  }
};
</script>