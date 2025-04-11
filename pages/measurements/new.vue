<template>
  <div class="space-y-6">
    <div class="flex items-center">
      <UButton
        icon="i-heroicons-arrow-left"
        color="gray"
        variant="ghost"
        to="/measurements"
        class="mr-4"
      />
      <h1 class="text-xl font-bold">Add New Measurement</h1>
    </div>
    
    <UCard class="bg-white">
      <form @submit.prevent="saveMeasurement" class="space-y-6">
        <!-- Client Selection -->
        <UFormGroup label="Client" name="client" required>
          <USelect
            v-model="selectedClientId"
            :options="clientOptions"
            placeholder="Select a client"
            required
          />
        </UFormGroup>
        
        <!-- Measurement Sections -->
        <div>
          <h2 class="text-lg font-medium mb-4">Upper Body Measurements</h2>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <UFormGroup label="Bust/Chest" name="bust">
              <UInput
                v-model="measurements.bust"
                placeholder="Inches"
                suffix="in"
              />
            </UFormGroup>
            
            <UFormGroup label="Waist" name="waist">
              <UInput
                v-model="measurements.waist"
                placeholder="Inches"
                suffix="in"
              />
            </UFormGroup>
            
            <UFormGroup label="Hip" name="hip">
              <UInput
                v-model="measurements.hip"
                placeholder="Inches"
                suffix="in"
              />
            </UFormGroup>
            
            <UFormGroup label="Shoulder" name="shoulder">
              <UInput
                v-model="measurements.shoulder"
                placeholder="Inches"
                suffix="in"
              />
            </UFormGroup>
            
            <UFormGroup label="Sleeve Length" name="sleeve">
              <UInput
                v-model="measurements.sleeve"
                placeholder="Inches"
                suffix="in"
              />
            </UFormGroup>
            
            <UFormGroup label="Back Width" name="back">
              <UInput
                v-model="measurements.back"
                placeholder="Inches"
                suffix="in"
              />
            </UFormGroup>
            
            <UFormGroup label="Neck" name="neck">
              <UInput
                v-model="measurements.neck"
                placeholder="Inches"
                suffix="in"
              />
            </UFormGroup>
            
            <UFormGroup label="Armhole" name="armhole">
              <UInput
                v-model="measurements.armhole"
                placeholder="Inches"
                suffix="in"
              />
            </UFormGroup>
            
            <UFormGroup label="Wrist" name="wrist">
              <UInput
                v-model="measurements.wrist"
                placeholder="Inches"
                suffix="in"
              />
            </UFormGroup>
          </div>
        </div>
        
        <div>
          <h2 class="text-lg font-medium mb-4">Lower Body Measurements</h2>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <UFormGroup label="Inseam" name="inseam">
              <UInput
                v-model="measurements.inseam"
                placeholder="Inches"
                suffix="in"
              />
            </UFormGroup>
            
            <UFormGroup label="Thigh" name="thigh">
              <UInput
                v-model="measurements.thigh"
                placeholder="Inches"
                suffix="in"
              />
            </UFormGroup>
            
            <UFormGroup label="Calf" name="calf">
              <UInput
                v-model="measurements.calf"
                placeholder="Inches"
                suffix="in"
              />
            </UFormGroup>
            
            <UFormGroup label="Ankle" name="ankle">
              <UInput
                v-model="measurements.ankle"
                placeholder="Inches"
                suffix="in"
              />
            </UFormGroup>
          </div>
        </div>
        
        <!-- Custom Measurements -->
        <div>
          <div class="flex justify-between items-center mb-4">
            <h2 class="text-lg font-medium">Custom Measurements</h2>
            <UButton
              type="button"
              color="gray"
              variant="ghost"
              icon="i-heroicons-plus"
              @click="addCustomMeasurement"
            >
              Add Custom
            </UButton>
          </div>
          
          <div v-if="customMeasurements.length > 0" class="space-y-4">
            <div v-for="(item, index) in customMeasurements" :key="index" class="flex items-center gap-4">
              <UInput
                v-model="item.name"
                placeholder="Measurement name"
                class="flex-1"
              />
              <UInput
                v-model="item.value"
                placeholder="Value"
                suffix="in"
                class="flex-1"
              />
              <UButton
                type="button"
                color="gray"
                variant="ghost"
                icon="i-heroicons-trash"
                @click="removeCustomMeasurement(index)"
              />
            </div>
          </div>
          
          <div v-else class="text-center py-4 border border-dashed border-gray-300 rounded-lg">
            <p class="text-gray-500">No custom measurements added</p>
            <UButton
              type="button"
              color="gray"
              variant="ghost"
              icon="i-heroicons-plus"
              class="mt-2"
              @click="addCustomMeasurement"
            >
              Add Custom Measurement
            </UButton>
          </div>
        </div>
        
        <!-- Notes -->
        <UFormGroup label="Notes" name="notes">
          <UTextarea
            v-model="measurements.notes"
            placeholder="Add any additional notes about these measurements"
            rows="4"
          />
        </UFormGroup>
        
        <!-- Action Buttons -->
        <div class="flex justify-end space-x-4">
          <UButton
            type="button"
            color="gray"
            variant="outline"
            to="/measurements"
          >
            Cancel
          </UButton>
          
          <UButton
            type="submit"
            color="primary"
            :loading="isSaving"
          >
            Save Measurements
          </UButton>
        </div>
      </form>
    </UCard>
  </div>
</template>

<script setup>
// Set page metadata
useHead({
  title: 'Add New Measurement - QuickMeazure',
});

// State management
const clients = ref([]);
const isLoading = ref(true);
const selectedClientId = ref('');

// Form data for measurements
const measurements = ref({
  bust: '',
  waist: '',
  hip: '',
  shoulder: '',
  sleeve: '',
  inseam: '',
  neck: '',
  chest: '',
  back: '',
  thigh: '',
  calf: '',
  ankle: '',
  wrist: '',
  armhole: '',
  notes: '',
});

// Custom measurements
const customMeasurements = ref([]);

// Client options for select dropdown
const clientOptions = computed(() => {
  return clients.value.map(client => ({
    label: client.name,
    value: client.id,
  }));
});

const isSaving = ref(false);

// Fetch clients for the dropdown
const fetchClients = async () => {
  isLoading.value = true;
  
  try {
    // Get auth token from the auth store
    const auth = useAuth();
    const token = auth.token.value;
    
    if (!token) {
      // Redirect to login if not authenticated
      useToast().add({
        title: 'Authentication required',
        description: 'Please log in to add measurements',
        color: 'orange'
      });
      navigateTo('/auth/login');
      return;
    }
    
    // Fetch clients from API
    const data = await $fetch('/api/clients', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    clients.value = data;
  } catch (error) {
    console.error('Error fetching clients:', error);
    let errorMessage = 'Failed to load clients. Please refresh the page.';
    
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
    isLoading.value = false;
  }
};

// Validate and parse numeric inputs
const parseNumericInputs = () => {
  const parsedMeasurements = {};
  
  // Parse each measurement field if it has a value
  Object.keys(measurements.value).forEach(key => {
    const value = measurements.value[key];
    if (value === '' || value === null) {
      parsedMeasurements[key] = null;
    } else if (key !== 'notes') {
      const parsed = parseFloat(value);
      parsedMeasurements[key] = isNaN(parsed) ? null : parsed;
    } else {
      parsedMeasurements[key] = value;
    }
  });
  
  return parsedMeasurements;
};

// Format custom measurements for API
const formatCustomMeasurements = () => {
  // Filter out empty custom measurements
  return customMeasurements.value
    .filter(item => item.name.trim() !== '' && item.value.trim() !== '')
    .reduce((acc, item) => {
      // Parse the value as a number if possible
      const value = parseFloat(item.value);
      acc[item.name.trim()] = isNaN(value) ? item.value.trim() : value;
      return acc;
    }, {});
};

// Add custom measurement field
const addCustomMeasurement = () => {
  customMeasurements.value.push({ name: '', value: '' });
};

// Remove custom measurement field
const removeCustomMeasurement = (index) => {
  customMeasurements.value.splice(index, 1);
};

// Save measurement
const saveMeasurement = async () => {
  // Validate client selection
  if (!selectedClientId.value) {
    useToast().add({
      title: 'Client required',
      description: 'Please select a client for this measurement',
      color: 'red'
    });
    return;
  }
  
  // Check if at least one measurement is filled
  const hasMeasurements = Object.keys(measurements.value).some(key => {
    return key !== 'notes' && measurements.value[key] !== '' && measurements.value[key] !== null;
  });
  
  const hasCustomMeasurements = customMeasurements.value.some(item => 
    item.name.trim() !== '' && item.value.trim() !== ''
  );
  
  if (!hasMeasurements && !hasCustomMeasurements) {
    useToast().add({
      title: 'No measurements',
      description: 'Please add at least one measurement',
      color: 'red'
    });
    return;
  }
  
  isSaving.value = true;
  
  try {
    // Get auth token from the auth store
    const auth = useAuth();
    const token = auth.token.value;
    
    if (!token) {
      useToast().add({
        title: 'Authentication required',
        description: 'Please log in to save measurements',
        color: 'orange'
      });
      navigateTo('/auth/login');
      return;
    }
    
    // Prepare measurement data
    const parsedMeasurements = parseNumericInputs();
    const customData = formatCustomMeasurements();
    
    // Create final data object
    const measurementData = {
      ...parsedMeasurements,
      customMeasurements: Object.keys(customData).length > 0 ? customData : null,
      clientId: selectedClientId.value,
    };
    
    // Call API to save measurement
    await $fetch('/api/measurements', {
      method: 'POST',
      body: measurementData,
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    // Show success notification
    useToast().add({
      title: 'Measurements saved',
      description: 'Measurements have been saved successfully',
      color: 'green'
    });
    
    // Redirect to measurements list
    navigateTo('/measurements');
  } catch (error) {
    console.error('Failed to save measurements:', error);
    let errorMessage = 'An error occurred while saving measurements';
    
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

// Initialize
onMounted(() => {
  fetchClients();
});
</script>