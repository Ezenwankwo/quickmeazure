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
      <h1 class="text-2xl font-bold">Add New Client</h1>
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
    if (!client.value.name || !client.value.phone) {
      // Show error notification
      return;
    }
    
    // Simulate API call to save client
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // In a real app, this would save to the database
    // For now, we'll just redirect to the clients page
    navigateTo('/clients');
  } catch (error) {
    console.error('Failed to save client:', error);
    // Show error notification
  } finally {
    isSaving.value = false;
  }
};
</script>