<template>
  <div class="max-w-5xl mx-auto space-y-6 py-6">
    <div class="flex items-center justify-between mb-8">
      <div class="flex items-center">
        <UButton
          icon="i-heroicons-arrow-left"
          color="gray"
          variant="ghost"
          to="/clients"
          class="mr-2"
        />
        <h1 class="text-2xl font-bold">New Client</h1>
      </div>
      <UBadge color="primary" variant="soft" size="lg" class="text-sm">Quick Entry Form</UBadge>
    </div>
    
    <UCard class="bg-white shadow border-0">
      <form @submit.prevent="saveClient" class="space-y-8">
        <!-- Client Detail Section -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div class="space-y-2">
            <label for="clientName" class="block text-sm font-medium text-gray-700">Full Name <span class="text-red-500">*</span></label>
            <UInput
              v-model="client.name"
              id="clientName"
              placeholder="Client name"
              class="w-full"
              icon="i-heroicons-user"
              size="lg"
              autocomplete="name"
            />
          </div>
          
          <div class="space-y-2">
            <label for="clientPhone" class="block text-sm font-medium text-gray-700">Phone Number</label>
            <UInput
              v-model="client.phone"
              id="clientPhone"
              placeholder="Phone number"
              class="w-full"
              icon="i-heroicons-phone"
              size="lg"
              type="tel"
              autocomplete="tel"
            />
          </div>
        </div>
        
        <!-- Measurement Tabs -->
        <div class="mt-6">
          <div v-for="item in measurementSections" :key="item.value" class="mb-4 border rounded-lg overflow-hidden shadow-sm transition-all hover:shadow-md">
            <div 
              @click="toggleMeasurementSection(item.value)" 
              class="flex justify-between items-center p-4 cursor-pointer transition-colors"
              :class="openItems.includes(item.value) ? 'bg-primary-50 border-b border-primary-100' : 'bg-white'"
            >
              <div class="font-medium flex items-center">
                <UIcon 
                  :name="getMeasurementIcon(item.value)" 
                  class="h-5 w-5 mr-2 text-primary-500"
                />
                {{ item.label }}
              </div>
              <UIcon 
                :name="openItems.includes(item.value) ? 'i-heroicons-chevron-up' : 'i-heroicons-chevron-down'" 
                class="h-5 w-5 transition-transform text-primary-500"
              />
            </div>
            
            <div v-show="openItems.includes(item.value)" class="p-6 bg-gray-50 rounded-b-lg space-y-6 border-t border-primary-100">
              <!-- Upper Body Content -->
              <div v-if="item.value === 'upper'">
                <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  <div class="space-y-2">
                    <label for="bust" class="block text-sm font-medium text-gray-700">Bust</label>
                    <div class="flex">
                      <UInput 
                        v-model="measurements.bust" 
                        id="bust"
                        type="number" 
                        step="0.1" 
                        placeholder="0.0" 
                        class="w-full rounded-r-none focus:ring-primary-500"
                        size="lg"
                      />
                      <span class="inline-flex items-center px-3 border border-l-0 border-gray-300 bg-primary-50 text-primary-700 text-sm font-medium rounded-r-md">
                        in
                      </span>
                    </div>
                  </div>
                  
                  <div class="space-y-2">
                    <label for="shoulder" class="block text-sm font-medium text-gray-700">Shoulder</label>
                    <div class="flex">
                      <UInput 
                        v-model="measurements.shoulder" 
                        id="shoulder"
                        type="number" 
                        step="0.1" 
                        placeholder="0.0" 
                        class="w-full rounded-r-none focus:ring-primary-500"
                        size="lg"
                      />
                      <span class="inline-flex items-center px-3 border border-l-0 border-gray-300 bg-primary-50 text-primary-700 text-sm font-medium rounded-r-md">
                        in
                      </span>
                    </div>
                  </div>
                  
                  <div class="space-y-2">
                    <label for="sleeve" class="block text-sm font-medium text-gray-700">Sleeve</label>
                    <div class="flex">
                      <UInput 
                        v-model="measurements.sleeve" 
                        id="sleeve"
                        type="number" 
                        step="0.1" 
                        placeholder="0.0" 
                        class="w-full rounded-r-none focus:ring-primary-500"
                        size="lg"
                      />
                      <span class="inline-flex items-center px-3 border border-l-0 border-gray-300 bg-primary-50 text-primary-700 text-sm font-medium rounded-r-md">
                        in
                      </span>
                    </div>
                  </div>
                  
                  <div class="space-y-2">
                    <label for="neck" class="block text-sm font-medium text-gray-700">Neck</label>
                    <div class="flex">
                      <UInput 
                        v-model="measurements.neck" 
                        id="neck"
                        type="number" 
                        step="0.1" 
                        placeholder="0.0" 
                        class="w-full rounded-r-none focus:ring-primary-500"
                        size="lg"
                      />
                      <span class="inline-flex items-center px-3 border border-l-0 border-gray-300 bg-primary-50 text-primary-700 text-sm font-medium rounded-r-md">
                        in
                      </span>
                    </div>
                  </div>
                  
                  <div class="space-y-2">
                    <label for="chest" class="block text-sm font-medium text-gray-700">Chest</label>
                    <div class="flex">
                      <UInput 
                        v-model="measurements.chest" 
                        id="chest"
                        type="number" 
                        step="0.1" 
                        placeholder="0.0" 
                        class="w-full rounded-r-none focus:ring-primary-500"
                        size="lg"
                      />
                      <span class="inline-flex items-center px-3 border border-l-0 border-gray-300 bg-primary-50 text-primary-700 text-sm font-medium rounded-r-md">
                        in
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              
              <!-- Lower Body Content -->
              <div v-if="item.value === 'lower'">
                <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  <div class="space-y-2">
                    <label for="waist" class="block text-sm font-medium text-gray-700">Waist</label>
                    <div class="flex">
                      <UInput 
                        v-model="measurements.waist" 
                        id="waist"
                        type="number" 
                        step="0.1" 
                        placeholder="0.0" 
                        class="w-full rounded-r-none focus:ring-primary-500"
                        size="lg"
                      />
                      <span class="inline-flex items-center px-3 border border-l-0 border-gray-300 bg-primary-50 text-primary-700 text-sm font-medium rounded-r-md">
                        in
                      </span>
                    </div>
                  </div>
                  
                  <div class="space-y-2">
                    <label for="hip" class="block text-sm font-medium text-gray-700">Hip</label>
                    <div class="flex">
                      <UInput 
                        v-model="measurements.hip" 
                        id="hip"
                        type="number" 
                        step="0.1" 
                        placeholder="0.0" 
                        class="w-full rounded-r-none focus:ring-primary-500"
                        size="lg"
                      />
                      <span class="inline-flex items-center px-3 border border-l-0 border-gray-300 bg-primary-50 text-primary-700 text-sm font-medium rounded-r-md">
                        in
                      </span>
                    </div>
                  </div>
                  
                  <div class="space-y-2">
                    <label for="inseam" class="block text-sm font-medium text-gray-700">Inseam</label>
                    <div class="flex">
                      <UInput 
                        v-model="measurements.inseam" 
                        id="inseam"
                        type="number" 
                        step="0.1" 
                        placeholder="0.0" 
                        class="w-full rounded-r-none focus:ring-primary-500"
                        size="lg"
                      />
                      <span class="inline-flex items-center px-3 border border-l-0 border-gray-300 bg-primary-50 text-primary-700 text-sm font-medium rounded-r-md">
                        in
                      </span>
                    </div>
                  </div>
                  
                  <div class="space-y-2">
                    <label for="thigh" class="block text-sm font-medium text-gray-700">Thigh</label>
                    <div class="flex">
                      <UInput 
                        v-model="measurements.thigh" 
                        id="thigh"
                        type="number" 
                        step="0.1" 
                        placeholder="0.0" 
                        class="w-full rounded-r-none focus:ring-primary-500"
                        size="lg"
                      />
                      <span class="inline-flex items-center px-3 border border-l-0 border-gray-300 bg-primary-50 text-primary-700 text-sm font-medium rounded-r-md">
                        in
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              
              <!-- Custom Content -->
              <div v-if="item.value === 'custom'">
                <div v-for="(value, key) in measurements.additionalMeasurements" :key="key" class="flex gap-4 items-end mb-4 p-3 rounded-lg bg-white border border-gray-200 shadow-sm">
                  <div class="space-y-2 w-1/2">
                    <label :for="`custom-name-${key}`" class="block text-sm font-medium text-gray-700">Measurement Name</label>
                    <UInput 
                      v-model="customMeasurementKeys[key]" 
                      placeholder="e.g., Ankle width" 
                      class="w-full focus:ring-primary-500"
                      size="lg"
                      :id="`custom-name-${key}`"
                    />
                  </div>
                  
                  <div class="space-y-2 w-1/3">
                    <label :for="`custom-value-${key}`" class="block text-sm font-medium text-gray-700">Value</label>
                    <div class="flex">
                      <UInput 
                        v-model="measurements.additionalMeasurements[key]" 
                        type="number" 
                        step="0.1" 
                        placeholder="0.0" 
                        class="w-full rounded-r-none focus:ring-primary-500"
                        size="lg"
                        :id="`custom-value-${key}`"
                      />
                      <span class="inline-flex items-center px-3 border border-l-0 border-gray-300 bg-primary-50 text-primary-700 text-sm font-medium rounded-r-md">
                        in
                      </span>
                    </div>
                  </div>
                  
                  <UButton 
                    type="button" 
                    color="red" 
                    icon="i-heroicons-trash" 
                    variant="soft" 
                    @click="removeCustomMeasurement(key)" 
                    class="flex-shrink-0"
                    size="lg"
                  />
                </div>
                
                <div class="flex justify-center mt-6">
                  <UButton 
                    type="button" 
                    color="primary" 
                    variant="solid" 
                    icon="i-heroicons-plus-circle" 
                    @click="addCustomMeasurement"
                    class="shadow-sm hover:shadow-md transition-all duration-200 px-6"
                    size="lg"
                  >
                    <span class="font-medium">Add Custom Measurement</span>
                  </UButton>
                </div>
                
                <div v-if="Object.keys(measurements.additionalMeasurements).length === 0" class="text-center py-8 px-4">
                  <UIcon name="i-heroicons-pencil-square" class="mx-auto h-12 w-12 text-gray-300 mb-3" />
                  <h3 class="text-lg font-medium text-gray-700 mb-1">No custom measurements yet</h3>
                  <p class="text-gray-500 text-sm">Add specific measurements that aren't covered in the standard sections</p>
                </div>
              </div>
              
              <!-- Notes Content -->
              <div v-if="item.value === 'notes'">
                <div class="space-y-2">
                  <label for="measurement-notes" class="block text-sm font-medium text-gray-700">Measurement Notes</label>
                  <UTextarea
                    v-model="measurements.notes"
                    id="measurement-notes"
                    placeholder="Add any special instructions or notes about these measurements"
                    :rows="5"
                    class="w-full focus:ring-primary-500"
                    size="lg"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Action Buttons -->
        <div class="flex items-center justify-end space-x-4 pt-6 border-t">
          <UButton
            type="button" 
            color="primary"
            variant="outline"
            size="lg"
            :loading="isSaving"
            :disabled="!isFormValid"
            @click="saveAndAddAnother"
            class="flex-shrink-0"
          >
            Save & Add Another
          </UButton>
          
          <UButton
            type="button"
            color="primary"
            variant="solid"
            size="lg"
            :loading="isSaving"
            :disabled="!isFormValid"
            @click="saveAndCreateOrder"
            class="flex-shrink-0"
          >
            Save & Create Order
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

// Track which accordion items are open - initialized before client data
const openItems = ref(['upper']);

// Client data
const client = ref({
  name: '',
  phone: '',
  notes: '',
});

// Measurement data
const measurements = ref({
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
});

// Accordion sections for measurements
const measurementSections = ref([
  { 
    label: 'Upper Body Measurements',
    value: 'upper'
  },
  { 
    label: 'Lower Body Measurements',
    value: 'lower'
  },
  { 
    label: 'Custom Measurements',
    value: 'custom'
  },
  { 
    label: 'Measurement Notes',
    value: 'notes'
  }
]);

// For custom measurements
const customMeasurementKeys = ref({});
const customMeasurementCounter = ref(0);

const addCustomMeasurement = () => {
  const newKey = `custom_${customMeasurementCounter.value}`;
  customMeasurementCounter.value++;
  measurements.value.additionalMeasurements[newKey] = null;
  customMeasurementKeys.value[newKey] = '';
};

const removeCustomMeasurement = (key) => {
  delete measurements.value.additionalMeasurements[key];
  delete customMeasurementKeys.value[key];
};

const isSaving = ref(false);

// Add computed property for form validation
const isFormValid = computed(() => {
  return client.value.name && client.value.name.trim() !== '' && 
         client.value.phone && client.value.phone.trim() !== '';
});

// Process measurements for saving
const processMeasurements = () => {
  if (Object.keys(measurements.value.additionalMeasurements).length > 0) {
    const processedAdditionalMeasurements = {};
    for (const [key, value] of Object.entries(measurements.value.additionalMeasurements)) {
      const customName = customMeasurementKeys.value[key] || key;
      processedAdditionalMeasurements[customName] = value;
    }
    
    return {
      ...measurements.value,
      additionalMeasurements: processedAdditionalMeasurements
    };
  }
  
  return measurements.value;
};

// Update the validateClient function to check both fields
const validateClient = () => {
  const errors = [];
  
  if (!client.value.name || client.value.name.trim() === '') {
    errors.push('Please enter the client name');
  }
  
  if (!client.value.phone || client.value.phone.trim() === '') {
    errors.push('Please enter the client phone number');
  }
  
  if (errors.length > 0) {
    useToast().add({
      title: 'Missing information',
      description: errors.join(', '),
      color: 'red'
    });
    return false;
  }
  
  return true;
};

// Save client to API
const saveClientToApi = async () => {
  try {
    // Get auth token from the auth store
    const auth = useSessionAuth();
    const token = auth.token.value;
    
    if (!token) {
      useToast().add({
        title: 'Authentication required',
        description: 'Please log in to add clients',
        color: 'orange'
      });
      navigateTo('/auth/login');
      return null;
    }
    
    const processedMeasurements = processMeasurements();
    
    // Call API to save client
    const newClient = await $fetch('/api/clients', {
      method: 'POST',
      body: {
        ...client.value,
        measurements: processedMeasurements
      },
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    return newClient;
    
  } catch (error) {
    console.error('Failed to save client:', error);
    console.log('Error details:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.data,
      message: error.message
    });
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
    
    return null;
  }
};

// Save client function
const saveClient = async () => {
  if (!validateClient()) return;
  
  isSaving.value = true;
  const newClient = await saveClientToApi();
  isSaving.value = false;
  
  if (newClient) {
    // Show success notification
    useToast().add({
      title: 'Client saved',
      description: 'The client and measurements have been added successfully',
      color: 'green'
    });
    
    // Redirect to client detail page
    navigateTo(`/clients/${newClient.id}`);
  }
};

// Save and add another
const saveAndAddAnother = async () => {
  if (!validateClient()) return;
  
  isSaving.value = true;
  const newClient = await saveClientToApi();
  isSaving.value = false;
  
  if (newClient) {
    // Show success notification
    useToast().add({
      title: 'Client saved',
      description: 'Client added. You can now add another client.',
      color: 'green'
    });
    
    // Reset form for new client
    client.value = { name: '', phone: '', notes: '' };
    measurements.value = {
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
    };
    customMeasurementKeys.value = {};
    customMeasurementCounter.value = 0;
    
    // Reset the accordion to open only the first section
    openItems.value = ['upper'];
  }
};

// Save and create order
const saveAndCreateOrder = async () => {
  if (!validateClient()) return;
  
  isSaving.value = true;
  const newClient = await saveClientToApi();
  isSaving.value = false;
  
  if (newClient) {
    // Show success notification
    useToast().add({
      title: 'Client saved',
      description: 'Client added. Creating new order...',
      color: 'green'
    });
    
    // Redirect to create order page for this client
    navigateTo(`/orders/new?clientId=${newClient.id}`);
  }
};

// Function to toggle measurement sections 
const toggleMeasurementSection = (sectionValue) => {
  if (!openItems.value.includes(sectionValue)) {
    openItems.value.push(sectionValue);
  } else {
    openItems.value = openItems.value.filter(item => item !== sectionValue);
  }
};

// Add this function in the script section
const getMeasurementIcon = (sectionValue) => {
  switch(sectionValue) {
    case 'upper':
      return 'i-heroicons-user-circle';
    case 'lower':
      return 'i-heroicons-variable';
    case 'custom':
      return 'i-heroicons-pencil-square';
    case 'notes':
      return 'i-heroicons-document-text';
    default:
      return 'i-heroicons-square-3-stack-3d';
  }
};
</script>