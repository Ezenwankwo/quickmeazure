<template>
  <div class="space-y-6">
    <!-- Header with back button and title -->
    <div class="flex items-center">
      <UButton
        icon="i-heroicons-arrow-left"
        color="gray"
        variant="ghost"
        to="/measurements"
        class="mr-4"
      />
      <h1 class="text-2xl font-bold">Measurement Details</h1>
      
      <!-- Action Buttons -->
      <div class="ml-auto flex space-x-2">
        <UButton
          color="primary"
          variant="outline"
          icon="i-heroicons-pencil"
          :to="`/measurements/${$route.params.id}/edit`"
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
      <UButton color="red" variant="link" to="/measurements" class="mt-2">
        Return to Measurements
      </UButton>
    </UAlert>
    
    <!-- Measurement details -->
    <template v-else-if="measurement">
      <!-- Client information -->
      <UCard class="bg-white">
        <div class="flex items-center mb-4">
          <div class="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center mr-4">
            <span class="text-primary-700 font-medium text-lg">{{ getInitials(clientName) }}</span>
          </div>
          <div>
            <h2 class="text-xl font-medium">{{ clientName }}</h2>
            <p class="text-gray-500">
              Added {{ formatDate(measurement.createdAt) }}
              <span v-if="measurement.updatedAt !== measurement.createdAt">
                · Updated {{ formatDate(measurement.updatedAt) }}
              </span>
            </p>
          </div>
          <UButton
            class="ml-auto"
            color="gray"
            variant="ghost"
            icon="i-heroicons-user"
            :to="`/clients/${measurement.clientId}`"
          >
            View Client
          </UButton>
        </div>
      </UCard>
      
      <!-- Upper Body Measurements -->
      <UCard class="bg-white">
        <h3 class="text-lg font-medium mb-4">Upper Body Measurements</h3>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <MeasurementItem label="Bust/Chest" :value="measurement.bust" />
          <MeasurementItem label="Waist" :value="measurement.waist" />
          <MeasurementItem label="Hip" :value="measurement.hip" />
          <MeasurementItem label="Shoulder" :value="measurement.shoulder" />
          <MeasurementItem label="Sleeve Length" :value="measurement.sleeve" />
          <MeasurementItem label="Back Width" :value="measurement.back" />
          <MeasurementItem label="Neck" :value="measurement.neck" />
          <MeasurementItem label="Armhole" :value="measurement.armhole" />
          <MeasurementItem label="Wrist" :value="measurement.wrist" />
        </div>
      </UCard>
      
      <!-- Lower Body Measurements -->
      <UCard class="bg-white">
        <h3 class="text-lg font-medium mb-4">Lower Body Measurements</h3>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <MeasurementItem label="Inseam" :value="measurement.inseam" />
          <MeasurementItem label="Thigh" :value="measurement.thigh" />
          <MeasurementItem label="Calf" :value="measurement.calf" />
          <MeasurementItem label="Ankle" :value="measurement.ankle" />
        </div>
      </UCard>
      
      <!-- Custom Measurements -->
      <UCard v-if="customMeasurements && customMeasurements.length > 0" class="bg-white">
        <h3 class="text-lg font-medium mb-4">Custom Measurements</h3>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <MeasurementItem 
            v-for="(item, index) in customMeasurements" 
            :key="index"
            :label="item.name"
            :value="item.value"
          />
        </div>
      </UCard>
      
      <!-- Notes -->
      <UCard class="bg-white">
        <h3 class="text-lg font-medium mb-4">Notes</h3>
        <p v-if="measurement.notes" class="whitespace-pre-line">{{ measurement.notes }}</p>
        <p v-else class="text-gray-500 italic">No notes added yet</p>
      </UCard>
    </template>
    
    <!-- Delete confirmation modal -->
    <UModal v-model="confirmDelete">
      <UCard>
        <template #header>
          <div class="flex items-center">
            <UIcon name="i-heroicons-exclamation-triangle" class="text-red-500 mr-2" />
            <h3 class="text-lg font-medium">Delete Measurement</h3>
          </div>
        </template>
        
        <p>Are you sure you want to delete this measurement? This action cannot be undone.</p>
        
        <template #footer>
          <div class="flex justify-end space-x-2">
            <UButton color="gray" variant="outline" @click="confirmDelete = false">
              Cancel
            </UButton>
            <UButton color="red" :loading="isDeleting" @click="deleteMeasurement">
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
  title: 'Measurement Details - QuickMeazure',
});

// Get measurement ID from route
const route = useRoute();
const router = useRouter();
const measurementId = route.params.id;

// State variables
const measurement = ref(null);
const clientName = ref('');
const customMeasurements = ref([]);
const isLoading = ref(true);
const isDeleting = ref(false);
const error = ref(null);
const confirmDelete = ref(false);

// Fetch measurement data
async function fetchMeasurement() {
  isLoading.value = true;
  error.value = null;
  
  try {
    // Get auth token from the auth store
    const auth = useAuth();
    const token = auth.token.value;
    
    if (!token) {
      // Redirect to login if not authenticated
      useToast().add({
        title: 'Authentication required',
        description: 'Please log in to view measurement details',
        color: 'orange'
      });
      navigateTo('/auth/login');
      return;
    }
    
    // Fetch measurement data with authorization
    const response = await $fetch(`/api/measurements/${measurementId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    measurement.value = response;
    clientName.value = response.clientName || '';
    
    // Parse custom measurements if they exist
    if (response.customMeasurements) {
      if (typeof response.customMeasurements === 'string') {
        try {
          customMeasurements.value = Object.entries(JSON.parse(response.customMeasurements))
            .map(([name, value]) => ({ name, value }));
        } catch (e) {
          console.error('Error parsing custom measurements:', e);
          customMeasurements.value = [];
        }
      } else {
        customMeasurements.value = Object.entries(response.customMeasurements)
          .map(([name, value]) => ({ name, value }));
      }
    } else {
      customMeasurements.value = [];
    }
  } catch (err) {
    console.error('Error fetching measurement:', err);
    let errorMessage = 'Failed to load measurement details. Please try again.';
    
    // Handle unauthorized errors
    if (err.response?.status === 401) {
      errorMessage = 'Your session has expired. Please log in again.';
      // Redirect to login
      navigateTo('/auth/login');
    } else if (err.response?.status === 404) {
      errorMessage = 'Measurement not found. It may have been deleted.';
    }
    
    error.value = errorMessage;
  } finally {
    isLoading.value = false;
  }
}

// Delete measurement
async function deleteMeasurement() {
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
    
    // Call delete endpoint with authorization
    await $fetch(`/api/measurements/${measurementId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    // Show success notification
    useToast().add({
      title: 'Measurement deleted',
      description: 'The measurement has been successfully deleted',
      color: 'green',
    });
    
    // Redirect to measurements list
    router.push('/measurements');
  } catch (err) {
    console.error('Error deleting measurement:', err);
    let errorMessage = 'Failed to delete measurement. Please try again.';
    
    // Handle unauthorized errors
    if (err.response?.status === 401) {
      errorMessage = 'Your session has expired. Please log in again.';
      // Redirect to login
      navigateTo('/auth/login');
    }
    
    useToast().add({
      title: 'Error',
      description: errorMessage,
      color: 'red',
    });
    
    confirmDelete.value = false;
  } finally {
    isDeleting.value = false;
  }
}

// Helper functions
function getInitials(name) {
  if (!name) return '';
  return name
    .split(' ')
    .map(part => part.charAt(0).toUpperCase())
    .slice(0, 2)
    .join('');
}

function formatDate(timestamp) {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

// Initialize
onMounted(() => {
  fetchMeasurement();
});
</script>

<script>
// Measurement item component
const MeasurementItem = defineComponent({
  props: {
    label: {
      type: String,
      required: true
    },
    value: {
      type: [String, Number],
      default: null
    }
  },
  setup(props) {
    return () => {
      if (props.value === null || props.value === undefined || props.value === '') {
        return h('div', { class: 'p-3 border border-gray-200 rounded-md bg-gray-50' }, [
          h('p', { class: 'text-sm font-medium text-gray-500' }, props.label),
          h('p', { class: 'text-gray-400 italic mt-1' }, 'Not recorded')
        ]);
      }
      
      return h('div', { class: 'p-3 border border-gray-200 rounded-md' }, [
        h('p', { class: 'text-sm font-medium text-gray-500' }, props.label),
        h('p', { class: 'text-lg font-medium mt-1' }, `${props.value} in`)
      ]);
    };
  }
});
</script> 