<template>
  <div class="min-h-screen bg-gray-50 py-6 sm:py-10 px-4 sm:px-6 lg:px-8">
    <div class="max-w-4xl mx-auto">
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
          <div class="space-y-6">
            <div v-if="!isClient || !isTemplatesLoaded" class="text-center py-12">
              <div class="animate-pulse space-y-4 max-w-md mx-auto">
                <div class="h-4 bg-gray-200 rounded w-3/4 mx-auto"></div>
                <div class="h-4 bg-gray-200 rounded w-1/2 mx-auto"></div>
              </div>
            </div>

            <div v-else>
              <div v-if="isSaving" class="text-center py-12">
                <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-t-2 border-primary-500 mx-auto"></div>
                <p class="mt-3 text-sm text-gray-500">Saving your measurements...</p>
              </div>

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
                            v-if="activeTab === 'female'"
                            type="button"
                            @click="activeTab = 'male'"
                            color="gray"
                            variant="outline"
                            icon="i-heroicons-arrow-left"
                            class="w-full sm:w-auto shadow-sm"
                          >
                            Back to Male Template
                          </UButton>
                          <UButton
                            v-else
                            type="button"
                            @click="activeTab = 'female'"
                            color="gray"
                            variant="outline"
                            :trailing-icon="'i-heroicons-arrow-right'"
                            class="w-full sm:w-auto shadow-sm"
                          >
                            Continue to Female Template
                          </UButton>
                        </div>
                        <div class="w-full sm:w-auto mb-3 sm:mb-0 order-1 sm:order-2">
                          <UButton
                            type="button"
                            @click="saveTemplates"
                            :loading="isSaving"
                            :disabled="isSaving"
                            color="primary"
                            size="lg"
                            class="w-full sm:w-auto shadow-sm"
                            icon="i-heroicons-check"
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
      </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useToast, useHead, useRouter, useSessionAuth } from '#imports';

// Mark component as client-only
const isClient = ref(process.client);
const isSaving = ref(false);

definePageMeta({
  layout: 'auth',
  middleware: 'auth',
  auth: {
    unauthenticatedOnly: false,
    navigateAuthenticatedTo: '/dashboard'
  }
});

interface MeasurementField {
  name: string;
  type?: 'upper' | 'lower';
}

interface MeasurementTemplate {
  name: string;
  upperBody: MeasurementField[];
  lowerBody: MeasurementField[];
}

const { user } = useSessionAuth();
const toast = useToast();
const router = useRouter();

// Tabs configuration
const tabs = [
  { id: 'male', name: 'Male', icon: 'i-heroicons-user' },
  { id: 'female', name: 'Female', icon: 'i-heroicons-user' }
];

const activeTab = ref<string>('male');

// Initialize active tab on client side
if (process.client) {
  activeTab.value = tabs[0]?.id || 'male';
}

// Default template structure
const getDefaultTemplate = (gender: 'male' | 'female'): MeasurementTemplate => ({
  name: gender === 'male' ? 'Standard Male Measurements' : 'Standard Female Measurements',
  upperBody: gender === 'male' 
    ? [
        { name: 'Neck' },
        { name: 'Shoulder Width' },
        { name: 'Chest' },
        { name: 'Sleeve' },
        { name: 'Shirt Length' },
        { name: 'Bicep' },
        { name: 'Wrist' }
      ]
    : [
        { name: 'Bust' },
        { name: 'Underbust' },
        { name: 'Shoulder Width' },
        { name: 'Sleeve Length' },
        { name: 'Upper Arm' },
        { name: 'Wrist' },
        { name: 'Back Width' }
      ],
  lowerBody: gender === 'male'
    ? [
        { name: 'Waist' },
        { name: 'Hips' },
        { name: 'Inseam' },
        { name: 'Thigh' },
        { name: 'Knee' },
        { name: 'Ankle' },
        { name: 'Outseam' }
      ]
    : [
        { name: 'Waist' },
        { name: 'Hips' },
        { name: 'Thigh' },
        { name: 'Knee' },
        { name: 'Ankle' },
        { name: 'Dress Length' },
        { name: 'Inseam' }
      ]
});

// Initialize templates with reactive objects
const templates = ref<Record<string, MeasurementTemplate>>({
  male: getDefaultTemplate('male'),
  female: getDefaultTemplate('female')
});

// Ensure activeTab is always valid and templates are properly initialized
onMounted(() => {
  isClient.value = true;
  
  // Initialize templates if needed
  if (Object.keys(templates.value).length === 0) {
    templates.value = {
      male: getDefaultTemplate('male'),
      female: getDefaultTemplate('female')
    };
  }
  
  // Set active tab if not valid
  if (!activeTab.value || !templates.value[activeTab.value]) {
    activeTab.value = Object.keys(templates.value)[0] || 'male';
  }
});

// Computed property to check if templates are loaded
const isTemplatesLoaded = computed(() => {
  return Object.keys(templates.value).length > 0;
});

// Form validation with detailed error tracking
const formErrors = ref<Record<string, string>>({});

const isFormValid = computed(() => {
  // Clear previous errors
  formErrors.value = {};
  
  return Object.entries(templates.value).every(([gender, template]) => {
    if (!template || typeof template !== 'object') {
      formErrors.value[gender] = 'Invalid template structure';
      return false;
    }
    
    // Check template name
    const hasValidName = template.name?.trim() !== '';
    if (!hasValidName) {
      formErrors.value[`${gender}-name`] = 'Template name is required';
    }
    
    // Check if at least one field exists
    const hasFields = (template.upperBody?.length || 0) > 0 || (template.lowerBody?.length || 0) > 0;
    if (!hasFields) {
      formErrors.value[`${gender}-fields`] = 'At least one measurement field is required';
    }
    
    // Check if all field names are valid
    const emptyFields = [
      ...(template.upperBody || []),
      ...(template.lowerBody || [])
    ].filter(field => !field?.name?.trim());
    
    if (emptyFields.length > 0) {
      formErrors.value[`${gender}-fieldnames`] = `${emptyFields.length} field${emptyFields.length > 1 ? 's' : ''} missing a name`;
    }
    
    return hasValidName && hasFields && emptyFields.length === 0;
  });
});

// Add a new field
function addField(gender: string, section: 'upperBody' | 'lowerBody') {
  if (!gender || !templates.value[gender]) {
    console.error(`Invalid gender: ${gender}`);
    return;
  }
  
  // Create a new array to trigger reactivity
  const newFields = [
    ...(templates.value[gender][section] || []),
    { name: '' }
  ];
  
  // Update the reactive object
  templates.value = {
    ...templates.value,
    [gender]: {
      ...templates.value[gender],
      [section]: newFields
    }
  };
}

// Remove a field
function removeField(gender: string, section: 'upperBody' | 'lowerBody', index: number) {
  if (!gender || !templates.value[gender] || !templates.value[gender][section]) {
    console.error(`Invalid gender or section: ${gender}.${section}`);
    return;
  }
  
  const currentFields = templates.value[gender][section] || [];
  
  // Prevent removing the last field in a section
  if (currentFields.length <= 1) {
    toast.add({
      title: 'Cannot remove',
      description: 'At least one measurement field is required',
      color: 'yellow',
      icon: 'i-heroicons-exclamation-triangle',
      timeout: 2000
    });
    return;
  }
  
  // Create a new array without the item to remove
  const newFields = [
    ...currentFields.slice(0, index),
    ...currentFields.slice(index + 1)
  ];
  
  // Update the reactive object
  templates.value = {
    ...templates.value,
    [gender]: {
      ...templates.value[gender],
      [section]: newFields
    }
  };
}

// Save templates and complete setup
async function saveTemplates() {
  if (!activeTab.value) return;
  
  // Validate form before submission
  if (!isFormValid.value) {
    toast.add({
      title: 'Validation Error',
      description: 'Please fix the errors in the form before continuing.',
      color: 'red',
      icon: 'i-heroicons-exclamation-circle',
      timeout: 3000
    });
    return;
  }
  
  try {
    isSaving.value = true;
    
    // Save templates for each gender
    for (const [gender, template] of Object.entries(templates.value) as [string, MeasurementTemplate][]) {
      if (!template) continue;
      
      const fields = [
        ...(template.upperBody || []).map(f => ({ ...f, type: 'upper' as const })),
        ...(template.lowerBody || []).map(f => ({ ...f, type: 'lower' as const }))
      ];
      
      if (fields.length === 0) {
        throw new Error(`Please add at least one measurement for ${gender} template`);
      }
      
      // Filter out empty field names before sending
      const validFields = fields.filter(f => f?.name?.trim());
      
      await $fetch('/api/measurements/templates', {
        method: 'POST',
        body: {
          gender,
          name: template.name,
          fields: validFields
        }
      });
    }
    
    // Mark setup as complete
    await $fetch('/api/auth/complete-setup', {
      method: 'POST'
    });
    
    // Show success message
    toast.add({
      title: 'Setup Complete',
      description: 'Your measurement templates have been saved successfully.',
      color: 'green',
      icon: 'i-heroicons-check-circle',
      timeout: 2000
    });
    
    // Redirect to dashboard
    navigateTo('/dashboard');
  } catch (error: any) {
    console.error('Error saving templates:', error);
    toast.add({
      title: 'Error',
      description: error.message || 'Failed to save measurement templates. Please try again.',
      color: 'red',
      icon: 'i-heroicons-x-circle',
      timeout: 3000
    });
  } finally {
    isSaving.value = false;
  }
}

// Set page metadata
useHead({
  title: 'Setup Measurements - QuickMeazure',
  meta: [
    { name: 'description', content: 'Set up your measurement template to get started with QuickMeazure' }
  ]
});

// Redirect if already completed setup
onMounted(() => {
  if (user?.value?.hasCompletedSetup) {
    navigateTo('/dashboard');
  }
});
</script>
