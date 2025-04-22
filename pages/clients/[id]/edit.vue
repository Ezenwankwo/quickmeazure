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
          
          <!-- Measurements Section -->
          <div class="pt-6 border-t border-gray-200">
            <div class="flex items-center justify-between mb-4">
              <h2 class="text-lg font-medium">Measurements</h2>
              <UButton 
                type="button" 
                color="gray" 
                variant="ghost" 
                icon="i-heroicons-plus-circle" 
                @click="showMeasurements = !showMeasurements"
              >
                {{ showMeasurements ? 'Hide Measurements' : 'Show Measurements' }}
              </UButton>
            </div>
            
            <div v-if="showMeasurements" class="bg-gray-50 p-4 rounded-lg">
              <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                <UFormGroup label="Height (cm)" name="height">
                  <UInput v-model="form.measurements.height" type="number" step="0.1" placeholder="Height in cm" />
                </UFormGroup>
                
                <UFormGroup label="Weight (kg)" name="weight">
                  <UInput v-model="form.measurements.weight" type="number" step="0.1" placeholder="Weight in kg" />
                </UFormGroup>
                
                <UFormGroup label="Bust (cm)" name="bust">
                  <UInput v-model="form.measurements.bust" type="number" step="0.1" placeholder="Bust in cm" />
                </UFormGroup>
                
                <UFormGroup label="Waist (cm)" name="waist">
                  <UInput v-model="form.measurements.waist" type="number" step="0.1" placeholder="Waist in cm" />
                </UFormGroup>
                
                <UFormGroup label="Hip (cm)" name="hip">
                  <UInput v-model="form.measurements.hip" type="number" step="0.1" placeholder="Hip in cm" />
                </UFormGroup>
                
                <UFormGroup label="Inseam (cm)" name="inseam">
                  <UInput v-model="form.measurements.inseam" type="number" step="0.1" placeholder="Inseam in cm" />
                </UFormGroup>
                
                <UFormGroup label="Shoulder (cm)" name="shoulder">
                  <UInput v-model="form.measurements.shoulder" type="number" step="0.1" placeholder="Shoulder in cm" />
                </UFormGroup>
                
                <UFormGroup label="Sleeve (cm)" name="sleeve">
                  <UInput v-model="form.measurements.sleeve" type="number" step="0.1" placeholder="Sleeve in cm" />
                </UFormGroup>
                
                <UFormGroup label="Neck (cm)" name="neck">
                  <UInput v-model="form.measurements.neck" type="number" step="0.1" placeholder="Neck in cm" />
                </UFormGroup>
                
                <UFormGroup label="Chest (cm)" name="chest">
                  <UInput v-model="form.measurements.chest" type="number" step="0.1" placeholder="Chest in cm" />
                </UFormGroup>
                
                <UFormGroup label="Thigh (cm)" name="thigh">
                  <UInput v-model="form.measurements.thigh" type="number" step="0.1" placeholder="Thigh in cm" />
                </UFormGroup>
              </div>
              
              <UFormGroup label="Measurement Notes" name="measurementNotes" class="mt-4">
                <UTextarea
                  v-model="form.measurements.notes"
                  placeholder="Add any notes about these measurements"
                  rows="3"
                />
              </UFormGroup>
            </div>
          </div>
          
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
const showMeasurements = ref(true);

// Form state
const form = ref({
  name: '',
  email: '',
  phone: '',
  address: '',
  notes: '',
  measurements: {
    height: null,
    weight: null,
    bust: null,
    waist: null,
    hip: null,
    inseam: null,
    shoulder: null,
    sleeve: null,
    neck: null,
    chest: null,
    thigh: null,
    notes: '',
    additionalMeasurements: {}
  }
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
    
    // Set client data
    client.value = data;
    
    // Initialize form with client data
    form.value = {
      name: data.name || '',
      email: data.email || '',
      phone: data.phone || '',
      address: data.address || '',
      notes: data.notes || '',
      measurements: data.measurement ? {
        height: data.measurement.height,
        weight: data.measurement.weight,
        bust: data.measurement.bust,
        waist: data.measurement.waist,
        hip: data.measurement.hip,
        inseam: data.measurement.inseam,
        shoulder: data.measurement.shoulder,
        sleeve: data.measurement.sleeve,
        neck: data.measurement.neck,
        chest: data.measurement.chest,
        thigh: data.measurement.thigh,
        notes: data.measurement.notes || '',
        additionalMeasurements: data.measurement.additionalMeasurements || {}
      } : {
        height: null,
        weight: null,
        bust: null,
        waist: null,
        hip: null,
        inseam: null,
        shoulder: null,
        sleeve: null,
        neck: null,
        chest: null,
        thigh: null,
        notes: '',
        additionalMeasurements: {}
      }
    };
    
    // Hide measurements section if there's no measurement data
    if (!data.measurement) {
      showMeasurements.value = false;
    }
  } catch (error) {
    console.error('Error fetching client:', error);
    let errorMessage = 'Failed to load client details';
    
    // Handle specific error cases
    if (error.response?.status === 404) {
      errorMessage = 'Client not found';
    } else if (error.response?.status === 401) {
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
    isLoading.value = false;
  }
};

// Update client
const updateClient = async () => {
  isSubmitting.value = true;
  
  try {
    // Validate form
    if (!form.value.name) {
      useToast().add({
        title: 'Missing information',
        description: 'Please enter the client name',
        color: 'red'
      });
      isSubmitting.value = false;
      return;
    }
    
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
    
    // Update client
    await $fetch(`/api/clients/${clientId}`, {
      method: 'PUT',
      body: {
        name: form.value.name,
        email: form.value.email,
        phone: form.value.phone,
        address: form.value.address,
        notes: form.value.notes,
        measurements: showMeasurements.value ? form.value.measurements : null
      },
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    // Show success message
    useToast().add({
      title: 'Client updated',
      description: 'Client information has been updated successfully',
      color: 'green'
    });
    
    // Navigate back to client details
    navigateTo(`/clients/${clientId}`);
  } catch (error) {
    console.error('Error updating client:', error);
    let errorMessage = 'Failed to update client';
    
    // Handle specific error cases
    if (error.response?.status === 404) {
      errorMessage = 'Client not found';
    } else if (error.response?.status === 401) {
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
    
    if (!token) {
      // Redirect to login if not authenticated
      useToast().add({
        title: 'Authentication required',
        description: 'Please log in to delete clients',
        color: 'orange'
      });
      navigateTo('/auth/login');
      return;
    }
    
    // Delete client
    await $fetch(`/api/clients/${clientId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    // Show success message
    useToast().add({
      title: 'Client deleted',
      description: 'Client has been deleted successfully',
      color: 'green'
    });
    
    // Navigate back to clients list
    navigateTo('/clients');
  } catch (error) {
    console.error('Error deleting client:', error);
    let errorMessage = 'Failed to delete client';
    
    // Handle specific error cases
    if (error.response?.status === 404) {
      errorMessage = 'Client not found';
    } else if (error.response?.status === 401) {
      errorMessage = 'Your session has expired. Please log in again.';
      // Redirect to login
      navigateTo('/auth/login');
    }
    
    useToast().add({
      title: 'Error',
      description: errorMessage,
      color: 'red'
    });
    
    // Close modal
    showDeleteModal.value = false;
  } finally {
    isDeleting.value = false;
  }
};

// Fetch client data on mount
onMounted(fetchClient);
</script> 