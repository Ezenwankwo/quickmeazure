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
      <h1 class="text-2xl font-bold">Add New Measurement</h1>
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

// Mock client data
const clients = [
  { id: '1', name: 'John Doe' },
  { id: '2', name: 'Jane Smith' },
  { id: '3', name: 'Robert Johnson' },
  { id: '4', name: 'Sarah Williams' },
  { id: '5', name: 'Michael Brown' },
  { id: '6', name: 'Emily Davis' },
  { id: '7', name: 'David Wilson' },
  { id: '8', name: 'Olivia Taylor' },
  { id: '9', name: 'James Anderson' },
  { id: '10', name: 'Sophia Martinez' },
];

// Client options for select dropdown
const clientOptions = clients.map(client => ({
  label: client.name,
  value: client.id,
}));

// Form data
const selectedClientId = ref('');
const measurements = ref({
  bust: '',
  waist: '',
  hip: '',
  shoulder: '',
  sleeve: '',
  back: '',
  neck: '',
  armhole: '',
  wrist: '',
  inseam: '',
  thigh: '',
  calf: '',
  ankle: '',
  notes: '',
});

const customMeasurements = ref([]);
const isSaving = ref(false);

// Add custom measurement field
const addCustomMeasurement = () => {
  customMeasurements.value.push({ name: '', value: '' });
};

// Remove custom measurement field
const removeCustomMeasurement = (index) => {
  customMeasurements.value.splice(index, 1);
};

// Save measurement function
const saveMeasurement = async () => {
  isSaving.value = true;
  
  try {
    // Validate required fields
    if (!selectedClientId.value) {
      // Show error notification
      return;
    }
    
    // Prepare data for saving
    const measurementData = {
      clientId: selectedClientId.value,
      ...measurements.value,
      customMeasurements: customMeasurements.value.reduce((acc, item) => {
        if (item.name && item.value) {
          acc[item.name] = item.value;
        }
        return acc;
      }, {}),
    };
    
    // Simulate API call to save measurements
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // In a real app, this would save to the database
    // For now, we'll just redirect to the measurements page
    navigateTo('/measurements');
  } catch (error) {
    console.error('Failed to save measurements:', error);
    // Show error notification
  } finally {
    isSaving.value = false;
  }
};
</script>