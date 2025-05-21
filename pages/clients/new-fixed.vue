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
              <!-- Template Selection Content -->
              <div v-if="item.value === 'template'">
                <div v-if="templatesLoading" class="flex justify-center py-8">
                  <UIcon name="i-heroicons-arrow-path" class="animate-spin h-8 w-8 text-primary-500" />
                  <span class="ml-2 text-gray-600">Loading templates...</span>
                </div>
                
                <div v-else-if="templates.length === 0" class="text-center py-8 bg-gray-50 rounded-lg border border-gray-200">
                  <UIcon name="i-heroicons-document-text" class="h-12 w-12 mx-auto text-gray-400 mb-3" />
                  <p class="text-gray-600 mb-4">No measurement templates found.</p>
                  <p class="text-sm text-gray-500">You can create templates in your account settings.</p>
                </div>
                
                <div v-else>
                  <p class="text-sm text-gray-600 mb-4">Select a measurement template to use for this client:</p>
                  
                  <div class="space-y-3">
                    <div v-for="template in templates" :key="template.id" 
                      class="p-4 border rounded-lg cursor-pointer transition-all" 
                      :class="selectedTemplateId === template.id ? 'border-primary-500 bg-primary-50' : 'border-gray-200 bg-white hover:border-primary-300 hover:bg-primary-50/30'"
                      @click="selectTemplate(template.id)">
                      <div class="flex justify-between items-center">
                        <div>
                          <h3 class="font-medium text-gray-900">{{ template.name }}</h3>
                          <div class="flex items-center mt-1">
                            <UBadge :color="template.gender === 'male' ? 'blue' : template.gender === 'female' ? 'pink' : 'gray'" size="sm" class="mr-2">
                              {{ template.gender.charAt(0).toUpperCase() + template.gender.slice(1) }}
                            </UBadge>
                            <span class="text-xs text-gray-500">{{ template.fields?.length || 0 }} measurements</span>
                          </div>
                        </div>
                        <UIcon 
                          :name="selectedTemplateId === template.id ? 'i-heroicons-check-circle' : 'i-heroicons-circle'" 
                          class="h-6 w-6" 
                          :class="selectedTemplateId === template.id ? 'text-primary-500' : 'text-gray-300'" 
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

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
            to="/clients"
            class="px-6"
          >
            Cancel
          </UButton>
          
          <UButton
            type="button" 
            color="primary"
            variant="solid"
            @click="saveAndAddAnother"
            class="px-6"
            :loading="isSaving"
            :disabled="!isFormValid"
          >
            Save & Add Another
          </UButton>
          
          <UButton
            type="submit" 
            color="primary"
            variant="solid"
            class="px-6"
            :loading="isSaving"
            :disabled="!isFormValid"
          >
            Save Client
          </UButton>
        </div>
      </form>
    </UCard>
  </div>
</template>

<script setup>
import { useMeasurementTemplates } from '~/composables/measurements/useMeasurementTemplates';

// Set page metadata
useHead({
  title: 'Add New Client - QuickMeazure',
});

// Initialize measurement templates
const { templates, fetchTemplates, loading: templatesLoading } = useMeasurementTemplates();

// Fetch templates on component mount
onMounted(async () => {
  try {
    await fetchTemplates();
  } catch (error) {
    console.error('Failed to fetch measurement templates:', error);
  }
});

// Selected template
const selectedTemplateId = ref(null);

// Track which accordion items are open - initialized before client data
const openItems = ref(['template', 'upper']);

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
});

// Accordion sections for measurements
const measurementSections = ref([
  { 
    label: 'Template Selection',
    value: 'template'
  },
  { 
    label: 'Upper Body Measurements',
    value: 'upper'
  },
  { 
    label: 'Lower Body Measurements',
    value: 'lower'
  },
  { 
    label: 'Measurement Notes',
    value: 'notes'
  }
]);

const isSaving = ref(false);

// Add computed property for form validation
const isFormValid = computed(() => {
  return client.value.name && client.value.name.trim() !== '' && 
         client.value.phone && client.value.phone.trim() !== '';
});

// Function to select a template
const selectTemplate = (templateId) => {
  selectedTemplateId.value = templateId;
  
  // Find the selected template
  const template = templates.value.find(t => t.id === templateId);
  
  if (template) {
    // Reset current measurements
    Object.keys(measurements.value).forEach(key => {
      if (key !== 'notes') {
        measurements.value[key] = null;
      }
    });
    
    // Apply template fields to measurements
    if (template.fields && template.fields.length > 0) {
      template.fields.forEach(field => {
        if (measurements.value.hasOwnProperty(field.name.toLowerCase())) {
          measurements.value[field.name.toLowerCase()] = null;
        }
      });
    }
  }
};

// Process measurements for saving
const processMeasurements = () => {
  const processedMeasurements = { ...measurements.value };
  
  // Add template ID if selected
  if (selectedTemplateId.value) {
    processedMeasurements.templateId = selectedTemplateId.value;
  }
  
  return processedMeasurements;
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
        Authorization: `Bearer ${token}`
      }
    });
    
    useToast().add({
      title: 'Success',
      description: 'Client added successfully',
      color: 'green'
    });
    
    return newClient;
  } catch (error) {
    console.error('Error saving client:', error);
    
    useToast().add({
      title: 'Error',
      description: error.message || 'Failed to add client',
      color: 'red'
    });
    
    return null;
  }
};

// Save client function
const saveClient = async () => {
  if (!validateClient()) return;
  
  isSaving.value = true;
  
  try {
    const newClient = await saveClientToApi();
    
    if (newClient) {
      // Navigate to client detail page
      navigateTo(`/clients/${newClient.id}`);
    }
  } finally {
    isSaving.value = false;
  }
};

// Save and add another
const saveAndAddAnother = async () => {
  if (!validateClient()) return;
  
  isSaving.value = true;
  
  try {
    const newClient = await saveClientToApi();
    
    if (newClient) {
      // Reset form
      client.value = {
        name: '',
        phone: '',
        notes: '',
      };
      
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
      };
      
      selectedTemplateId.value = null;
      
      // Show success message
      useToast().add({
        title: 'Success',
        description: 'Client added successfully. You can now add another client.',
        color: 'green'
      });
    }
  } finally {
    isSaving.value = false;
  }
};

// Function to toggle measurement sections
const toggleMeasurementSection = (sectionValue) => {
  if (openItems.value.includes(sectionValue)) {
    openItems.value = openItems.value.filter(item => item !== sectionValue);
  } else {
    openItems.value.push(sectionValue);
  }
};

// Get measurement icon based on section
const getMeasurementIcon = (sectionValue) => {
  switch (sectionValue) {
    case 'template':
      return 'i-heroicons-document-text';
    case 'upper':
      return 'i-heroicons-user-circle';
    case 'lower':
      return 'i-heroicons-rectangle-stack';
    case 'notes':
      return 'i-heroicons-pencil-square';
    default:
      return 'i-heroicons-document-text';
  }
};
</script>
