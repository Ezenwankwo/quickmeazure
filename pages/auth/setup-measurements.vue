<template>
  <div class="min-h-screen bg-gray-50 py-6 sm:py-10 px-4 sm:px-6 lg:px-8">
    <div class="max-w-4xl mx-auto">
      <!-- Signup Steps - First Item -->
      <div class="max-w-3xl mx-auto mb-8">
        <SignupSteps :current-step="3" />
      </div>
      
      <div class="text-center mb-6 sm:mb-8">
        <h1 class="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Set Up Your Measurement Templates</h1>
        <p class="text-sm sm:text-base text-gray-600">Create customized templates for male and female clients</p>
        <div class="mt-4 p-4 bg-primary-50 rounded-lg border border-primary-100 text-sm text-gray-700 max-w-2xl mx-auto shadow-sm">
          <div class="flex items-start">
            <UIcon name="i-heroicons-information-circle" class="text-primary-500 w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />
            <div class="text-left">
              <p class="font-medium mb-1">How to use this page:</p>
              <ul class="list-disc pl-5 space-y-1 text-gray-600">
                <li>Create separate templates for male and female clients</li>
                <li>Customize field names to match your measurement terminology</li>
                <li>Add or remove fields based on what you need to track</li>
                <li>Save your templates when you're done</li>
                <li>You can create more templates later in your account settings</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <div class="bg-white rounded-xl shadow overflow-hidden border border-gray-100">
        <!-- Tab Navigation -->
        <div class="border-b border-gray-200 bg-gray-50/80">
          <nav class="flex -mb-px overflow-x-auto" aria-label="Tabs">
            <div class="flex w-full px-4 sm:px-6">
              <button
                v-for="tab in tabs"
                :key="tab.id"
                @click="activeTab = tab.id"
                :class="[
                  'whitespace-nowrap py-4 px-4 sm:px-6 border-b-2 font-medium text-sm flex items-center justify-center flex-1 transition-all duration-200',
                  activeTab === tab.id
                    ? 'border-primary-500 text-primary-600 bg-white shadow-sm'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                ]"
              >
                <UIcon :name="tab.icon" class="w-5 h-5 mr-2" />
                {{ tab.name }} Template
                <span v-if="activeTab === tab.id" class="ml-2 bg-primary-100 text-primary-700 text-xs px-2 py-0.5 rounded-full hidden sm:inline-block">Active</span>
              </button>
            </div>
          </nav>
        </div>
        
        <div class="p-4 sm:p-6 lg:p-8">
          <!-- Loading State -->
          <div v-if="!isClient || !isTemplatesLoaded" class="space-y-6">
            <div class="text-center py-12">
              <div class="space-y-6 max-w-md mx-auto">
                <div class="h-4 bg-gray-200 rounded w-3/4 mx-auto"></div>
                <div class="h-4 bg-gray-200 rounded w-1/2 mx-auto"></div>
              </div>
            </div>
          </div>

          <!-- Saving State -->
          <div v-else-if="isSaving" class="space-y-6">
            <div class="text-center py-12">
              <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-t-2 border-primary-500 mx-auto"></div>
              <p class="mt-3 text-sm text-gray-500">Saving your measurements...</p>
            </div>
          </div>
          
          <!-- Main Content -->
          <div v-else class="space-y-6">
            <div class="bg-white p-4 sm:p-5 rounded-lg border border-gray-200 shadow-sm">
              <div class="flex items-center justify-between mb-2">
                <label for="template-name" class="block text-sm font-medium text-gray-700">Template Name</label>
                <span class="text-xs text-gray-500 bg-gray-100 rounded-full px-2 py-0.5">
                  {{ activeTab === 'male' ? 'Male' : 'Female' }} Template
                </span>
              </div>
              <UInput
                id="template-name"
                v-model="templates[activeTab].name"
                type="text"
                class="w-full"
                :placeholder="`Standard ${activeTab === 'male' ? 'Male' : 'Female'} Measurements`"
                :state="formErrors[`${activeTab}-name`] ? 'error' : undefined"
                :ui="{ icon: { trailing: { pointer: '' } } }"
                required
              >
                <template #leading>
                  <UIcon name="i-heroicons-document-text" class="text-gray-400" />
                </template>
                <template #trailing>
                  <UIcon v-if="templates[activeTab].name" name="i-heroicons-check-circle" class="text-green-500" />
                </template>
              </UInput>
              <p v-if="formErrors[`${activeTab}-name`]" class="mt-1 text-xs text-red-500">
                {{ formErrors[`${activeTab}-name`] }}
              </p>
              <p v-else class="mt-1 text-xs text-gray-500">
                This name will be used to identify this measurement template
              </p>
            </div>

            <div class="space-y-5">
              <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 class="text-base font-medium text-gray-900">Measurement Fields</h3>
                  <p class="text-xs text-gray-500 mt-1">Customize fields for {{ activeTab === 'male' ? 'male' : 'female' }} measurements</p>
                </div>
                <div class="flex flex-wrap gap-2 justify-center sm:justify-start">
                  <button
                    type="button"
                    @click="addField(activeTab, 'upperBody')"
                    class="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-primary-700 bg-primary-50 hover:bg-primary-100 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-primary-500 transition-colors"
                  >
                    <UIcon name="i-heroicons-plus" class="w-3.5 h-3.5 mr-1.5" />
                    <span>Add Upper Body</span>
                  </button>
                  <button
                    type="button"
                    @click="addField(activeTab, 'lowerBody')"
                    class="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-primary-700 bg-primary-50 hover:bg-primary-100 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-primary-500 transition-colors"
                  >
                    <UIcon name="i-heroicons-plus" class="w-3.5 h-3.5 mr-1.5" />
                    <span>Add Lower Body</span>
                  </button>
                </div>
              </div>
            
              <div class="bg-gray-50/50 rounded-lg p-4 sm:p-5 border border-gray-200 shadow-sm">
                <div class="flex items-start p-3 bg-primary-50/70 rounded-md border border-primary-100 mb-5">
                  <UIcon name="i-heroicons-information-circle" class="text-primary-500 w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />
                  <p class="text-sm text-gray-700">
                    Customize the measurement fields below for your <span class="font-medium">{{ activeTab === 'male' ? 'male' : 'female' }}</span> clients. You can rename, add, or remove fields as needed.
                  </p>
                </div>
                <div class="space-y-6">
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
                    <!-- Upper Body Fields -->
                    <div class="space-y-3">
                      <div class="flex items-center justify-between border-b border-gray-200 pb-2">
                        <div class="flex items-center">
                          <UIcon name="i-heroicons-square-3-stack-3d" class="w-4 h-4 text-primary-500 mr-1.5" />
                          <h4 class="text-sm font-medium text-gray-700">Upper Body Measurements</h4>
                        </div>
                        <span v-if="templates[activeTab]?.upperBody?.length" class="text-xs text-gray-500 bg-gray-100 rounded-full px-2 py-0.5">
                          {{ templates[activeTab].upperBody.length }} {{ templates[activeTab].upperBody.length === 1 ? 'field' : 'fields' }}
                        </span>
                      </div>
                      <template v-if="templates[activeTab]?.upperBody?.length">
                        <div v-for="(field, index) in templates[activeTab].upperBody" :key="'upper-' + index" class="flex items-center gap-2 group bg-white rounded-md p-3 hover:bg-gray-50 transition-colors border border-gray-100 shadow-sm">
                          <div class="flex-1">
                            <UInput
                              v-model="field.name"
                              type="text"
                              class="w-full"
                              :placeholder="`Upper body ${index + 1}`"
                              :state="!field.name.trim() && formErrors[`${activeTab}-fieldnames`] ? 'error' : undefined"
                              :ui="{ base: 'relative', input: { base: 'peer w-full' } }"
                              required
                            />
                          </div>
                          <div class="flex items-center">
                            <span class="text-xs font-medium bg-gray-100 text-gray-500 rounded-full w-5 h-5 flex items-center justify-center mr-2">{{ index + 1 }}</span>
                            <button
                              type="button"
                              @click="removeField(activeTab, 'upperBody', index)"
                              class="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                              title="Remove field"
                            >
                              <UIcon name="i-heroicons-trash" class="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                        <button
                          type="button"
                          @click="addField(activeTab, 'upperBody')"
                          class="mt-3 w-full py-2.5 px-3 border border-dashed border-gray-300 rounded-md text-sm text-gray-500 hover:border-primary-300 hover:bg-primary-50/50 hover:text-primary-600 transition-colors flex items-center justify-center group"
                        >
                          <UIcon name="i-heroicons-plus-circle" class="w-4 h-4 mr-1.5" />
                          <span>Add another upper body measurement</span>
                        </button>
                      </template>
                      <div v-else class="text-center py-8 text-sm text-gray-400 bg-white/50 rounded-lg border-2 border-dashed border-gray-200 hover:border-primary-100 hover:bg-primary-50/30 hover:text-primary-600 transition-colors cursor-pointer" @click="addField(activeTab, 'upperBody')">
                        <UIcon name="i-heroicons-plus-circle" class="w-6 h-6 mx-auto mb-2 text-gray-300" />
                        <p>Click to add upper body measurements</p>
                      </div>
                    </div>

                    <!-- Lower Body Fields -->
                    <div class="space-y-3">
                      <div class="flex items-center justify-between border-b border-gray-200 pb-2">
                        <div class="flex items-center">
                          <UIcon name="i-heroicons-square-3-stack-3d" class="w-4 h-4 text-primary-500 mr-1.5" />
                          <h4 class="text-sm font-medium text-gray-700">Lower Body Measurements</h4>
                        </div>
                        <span v-if="templates[activeTab]?.lowerBody?.length" class="text-xs text-gray-500 bg-gray-100 rounded-full px-2 py-0.5">
                          {{ templates[activeTab].lowerBody.length }} {{ templates[activeTab].lowerBody.length === 1 ? 'field' : 'fields' }}
                        </span>
                      </div>
                      <template v-if="templates[activeTab]?.lowerBody?.length">
                        <div v-for="(field, index) in templates[activeTab].lowerBody" :key="'lower-' + index" class="flex items-center gap-2 group bg-white rounded-md p-3 hover:bg-gray-50 transition-colors border border-gray-100 shadow-sm">
                          <div class="flex-1">
                            <UInput
                              v-model="field.name"
                              type="text"
                              class="w-full"
                              :placeholder="`Lower body ${index + 1}`"
                              :state="!field.name.trim() && formErrors[`${activeTab}-fieldnames`] ? 'error' : undefined"
                              :ui="{ base: 'relative', input: { base: 'peer w-full' } }"
                              required
                            />
                          </div>
                          <div class="flex items-center">
                            <span class="text-xs font-medium bg-gray-100 text-gray-500 rounded-full w-5 h-5 flex items-center justify-center mr-2">{{ index + 1 }}</span>
                            <button
                              type="button"
                              @click="removeField(activeTab, 'lowerBody', index)"
                              class="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                              title="Remove field"
                            >
                              <UIcon name="i-heroicons-trash" class="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                        <button
                          type="button"
                          @click="addField(activeTab, 'lowerBody')"
                          class="mt-3 w-full py-2.5 px-3 border border-dashed border-gray-300 rounded-md text-sm text-gray-500 hover:border-primary-300 hover:bg-primary-50/50 hover:text-primary-600 transition-colors flex items-center justify-center group"
                        >
                          <UIcon name="i-heroicons-plus-circle" class="w-4 h-4 mr-1.5" />
                          <span>Add another lower body measurement</span>
                        </button>
                      </template>
                      <div v-else class="text-center py-8 text-sm text-gray-400 bg-white/50 rounded-lg border-2 border-dashed border-gray-200 hover:border-primary-100 hover:bg-primary-50/30 hover:text-primary-600 transition-colors cursor-pointer" @click="addField(activeTab, 'lowerBody')">
                        <UIcon name="i-heroicons-plus-circle" class="w-6 h-6 mx-auto mb-2 text-gray-300" />
                        <p>Click to add lower body measurements</p>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Navigation and Save Buttons -->
                <div class="flex flex-col sm:flex-row justify-between items-center pt-6 mt-4 border-t border-gray-200 gap-5">
                  <div class="flex flex-col sm:flex-row gap-3 w-full sm:w-auto order-2 sm:order-1">
                    <UButton
                      to="/auth/confirm"
                      variant="outline"
                      color="gray"
                      class="w-full sm:w-auto"
                      :ui="{ rounded: 'rounded-lg', padding: { xs: 'px-4 py-2.5', sm: 'px-5 py-2.5' } }"
                    >
                      <UIcon name="i-heroicons-arrow-left" class="w-4 h-4 mr-2" />
                      Back to Plan
                    </UButton>
                  </div>
                  <div class="w-full sm:w-auto order-1 sm:order-2">
                    <UButton
                      type="button"
                      @click="saveTemplates"
                      variant="solid"
                      color="primary"
                      class="w-full sm:w-auto"
                      :disabled="isSaving || !isTemplatesValid"
                      :ui="{ rounded: 'rounded-lg', padding: { xs: 'px-4 py-2.5', sm: 'px-5 py-2.5' } }"
                    >
                      {{ isSaving ? 'Saving...' : 'Save Templates and Continue' }}
                    </UButton>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useToast, useHead, useRouter, useSessionAuth } from '#imports';
import { useMeasurementTemplates } from '~/composables/measurements/useMeasurementTemplates';

// Mark component as client-only
const isClient = ref(false);
onMounted(() => {
  isClient.value = true;
});

// Define measurement field interface
interface MeasurementField {
  id: string;
  name: string;
}

// Define measurement template interface
interface MeasurementTemplate {
  name: string;
  upperBody: MeasurementField[];
  lowerBody: MeasurementField[];
}

const { user } = useSessionAuth();
const toast = useToast();
const router = useRouter();

// Initialize measurement templates API
const { createTemplate, loading: apiLoading } = useMeasurementTemplates();

// Define tabs
const tabs = [
  { id: 'male', name: 'Male', icon: 'i-heroicons-user' },
  { id: 'female', name: 'Female', icon: 'i-heroicons-user' }
];

// Active tab
const activeTab = ref('male');

// Loading state
const isTemplatesLoaded = ref(false);
const isSaving = ref(false);

// Form errors
const formErrors = ref<Record<string, string>>({});

// Generate a unique ID
const generateId = () => {
  return Math.random().toString(36).substring(2, 9);
};

// Get default template structure
const getDefaultTemplate = (gender: 'male' | 'female'): MeasurementTemplate => {
  const template: MeasurementTemplate = {
    name: `Standard ${gender === 'male' ? 'Male' : 'Female'} Measurements`,
    upperBody: [],
    lowerBody: []
  };

  // Default upper body measurements
  const upperBodyDefaults = gender === 'male' 
    ? ['Neck', 'Chest', 'Shoulders', 'Biceps', 'Forearms', 'Wrists'] 
    : ['Neck', 'Shoulders', 'Bust', 'Under Bust', 'Waist', 'Upper Arms'];

  // Default lower body measurements
  const lowerBodyDefaults = gender === 'male'
    ? ['Waist', 'Hips', 'Thighs', 'Calves', 'Ankles']
    : ['Hips', 'Thighs', 'Calves', 'Ankles'];

  // Add default fields
  upperBodyDefaults.forEach(name => {
    template.upperBody.push({ id: generateId(), name });
  });

  lowerBodyDefaults.forEach(name => {
    template.lowerBody.push({ id: generateId(), name });
  });

  return template;
};

// Initialize templates with reactive objects
const templates = ref<Record<string, MeasurementTemplate>>({
  male: getDefaultTemplate('male'),
  female: getDefaultTemplate('female')
});

// Check if templates are valid
const isTemplatesValid = computed(() => {
  return templates.value.male.name.trim() !== '' && 
         templates.value.female.name.trim() !== '' &&
         templates.value.male.upperBody.every(field => field.name.trim() !== '') &&
         templates.value.male.lowerBody.every(field => field.name.trim() !== '') &&
         templates.value.female.upperBody.every(field => field.name.trim() !== '') &&
         templates.value.female.lowerBody.every(field => field.name.trim() !== '');
});

// Simulate loading templates
onMounted(async () => {
  // In a real app, you would fetch templates from the API here
  setTimeout(() => {
    isTemplatesLoaded.value = true;
  }, 1000);
});

// Add a new field
const addField = (gender: string, section: 'upperBody' | 'lowerBody') => {
  if (!templates.value[gender]) return;
  
  const newField: MeasurementField = {
    id: generateId(),
    name: ''
  };
  
  templates.value[gender][section].push(newField);
  
  // Clear any field name errors
  if (formErrors.value[`${gender}-fieldnames`]) {
    delete formErrors.value[`${gender}-fieldnames`];
  }
};

// Remove a field
const removeField = (gender: string, section: 'upperBody' | 'lowerBody', index: number) => {
  if (!templates.value[gender] || !templates.value[gender][section]) return;
  
  // Don't allow removing all fields
  if (templates.value[gender][section].length <= 1) {
    toast.add({
      title: 'Cannot Remove Field',
      description: 'You must have at least one measurement field in each section.',
      color: 'orange',
      icon: 'i-heroicons-exclamation-triangle',
      timeout: 3000
    });
    return;
  }
  
  // Remove the field
  templates.value[gender][section].splice(index, 1);
  
  // Clear any field name errors
  if (formErrors.value[`${gender}-fieldnames`]) {
    delete formErrors.value[`${gender}-fieldnames`];
  }
};

// Save templates and complete setup
const saveTemplates = async () => {
  // Reset errors
  formErrors.value = {};
  
  // Validate template names
  if (!templates.value.male.name.trim()) {
    formErrors.value['male-name'] = 'Please enter a name for the male template';
  }
  
  if (!templates.value.female.name.trim()) {
    formErrors.value['female-name'] = 'Please enter a name for the female template';
  }
  
  // Validate field names
  let hasEmptyMaleFields = false;
  let hasEmptyFemaleFields = false;
  
  // Check male fields
  templates.value.male.upperBody.forEach(field => {
    if (!field.name.trim()) hasEmptyMaleFields = true;
  });
  
  templates.value.male.lowerBody.forEach(field => {
    if (!field.name.trim()) hasEmptyMaleFields = true;
  });
  
  // Check female fields
  templates.value.female.upperBody.forEach(field => {
    if (!field.name.trim()) hasEmptyFemaleFields = true;
  });
  
  templates.value.female.lowerBody.forEach(field => {
    if (!field.name.trim()) hasEmptyFemaleFields = true;
  });
  
  if (hasEmptyMaleFields) {
    formErrors.value['male-fieldnames'] = 'All field names must be filled in';
  }
  
  if (hasEmptyFemaleFields) {
    formErrors.value['female-fieldnames'] = 'All field names must be filled in';
  }
  
  // If there are errors, don't proceed
  if (Object.keys(formErrors.value).length > 0) {
    toast.add({
      title: 'Validation Error',
      description: 'Please fix the highlighted errors before continuing.',
      color: 'red',
      icon: 'i-heroicons-x-circle',
      timeout: 3000
    });
    return;
  }
  
  // Start saving
  isSaving.value = true;
  
  try {
    // Save male template
    await createTemplate({
      name: templates.value.male.name,
      gender: 'male',
      fields: [
        ...templates.value.male.upperBody.map(field => ({
          name: field.name,
          category: 'upperBody',
          order: templates.value.male.upperBody.indexOf(field)
        })),
        ...templates.value.male.lowerBody.map(field => ({
          name: field.name,
          category: 'lowerBody',
          order: templates.value.male.lowerBody.indexOf(field)
        }))
      ]
    });
    
    // Save female template
    await createTemplate({
      name: templates.value.female.name,
      gender: 'female',
      fields: [
        ...templates.value.female.upperBody.map(field => ({
          name: field.name,
          category: 'upperBody',
          order: templates.value.female.upperBody.indexOf(field)
        })),
        ...templates.value.female.lowerBody.map(field => ({
          name: field.name,
          category: 'lowerBody',
          order: templates.value.female.lowerBody.indexOf(field)
        }))
      ]
    });
    
    // Show success message
    toast.add({
      title: 'Templates Saved',
      description: 'Your measurement templates have been saved successfully.',
      color: 'green',
      icon: 'i-heroicons-check-circle',
      timeout: 3000
    });
    
    // Navigate to dashboard
    router.push('/dashboard');
  } catch (error: any) {
    // Show error message
    toast.add({
      title: 'Error Saving Templates',
      description: error.message || 'There was a problem saving your templates. Please try again.',
      color: 'red',
      icon: 'i-heroicons-x-circle',
      timeout: 3000
    });
  } finally {
    isSaving.value = false;
  }
};

// Set page metadata
useHead({
  title: 'Setup Measurements - QuickMeazure',
  meta: [
    {
      name: 'description',
      content: 'Set up your measurement templates for male and female clients.'
    }
  ]
});
</script>
