<template>
  <div class="min-h-screen bg-gray-50 space-y-6">
    <div class="max-w-4xl mx-auto">
      <!-- Signup Steps - First Item -->
      <div class="max-w-3xl mx-auto mb-8">
        <SignupSteps :current-step="3" />
      </div>

      <div class="text-center mb-6 sm:mb-8">
        <h1 class="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
          Set Up Your Measurement Templates
        </h1>
        <p class="text-sm sm:text-base text-gray-600">
          Create customized templates for male and female clients
        </p>
        <div
          class="mt-4 p-4 bg-primary-50 rounded-lg border border-primary-100 text-sm text-gray-700 max-w-2xl mx-auto shadow-sm"
        >
          <div class="flex items-start">
            <UIcon
              name="i-heroicons-information-circle"
              class="text-primary-500 w-5 h-5 mr-2 flex-shrink-0 mt-0.5"
            />
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
                :id="`${tab.id}-tab`"
                :key="tab.id"
                :class="[
                  'whitespace-nowrap py-3 sm:py-4 px-2 sm:px-6 border-b-2 font-medium text-xs sm:text-sm flex items-center justify-center flex-1 transition-all duration-200',
                  activeTab === tab.id
                    ? 'border-primary-500 text-primary-600 bg-white shadow-sm'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300',
                ]"
                role="tab"
                :aria-selected="activeTab === tab.id"
                :aria-controls="`${tab.id}-panel`"
                @click="switchTab(tab.id)"
              >
                <UIcon
                  :name="tab.icon"
                  class="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2"
                  aria-hidden="true"
                />
                <span>{{ tab.name }}</span>
                <span class="sr-only">Template</span>
                <span
                  v-if="activeTab === tab.id"
                  class="ml-1 sm:ml-2 bg-primary-100 text-primary-700 text-xs px-1 sm:px-2 py-0.5 rounded-full hidden sm:inline-block"
                  >Active</span
                >
                <span
                  v-if="hasUnsavedChanges(tab.id)"
                  class="ml-1 sm:ml-2 bg-amber-100 text-amber-700 text-xs px-1 sm:px-2 py-0.5 rounded-full"
                  >Unsaved</span
                >
              </button>
            </div>
          </nav>
        </div>

        <div class="p-4 sm:p-6 lg:p-8">
          <!-- Loading State - Only show briefly during initial load -->
          <div v-if="loading" class="space-y-6">
            <div class="text-center py-12">
              <div class="animate-pulse space-y-6 max-w-md mx-auto">
                <div class="h-4 bg-gray-200 rounded w-3/4 mx-auto" />
                <div class="h-4 bg-gray-200 rounded w-1/2 mx-auto" />
                <div class="flex justify-center">
                  <div
                    class="w-10 h-10 border-4 border-primary-200 border-t-primary-500 rounded-full animate-spin"
                  />
                </div>
                <p class="text-sm text-gray-500">Loading your templates...</p>
              </div>
            </div>
          </div>

          <!-- We're removing the separate saving state and will show loading in the button instead -->

          <!-- Main Content -->
          <div v-else-if="!loading" class="space-y-6">
            <div class="bg-white p-4 sm:p-5 rounded-lg border border-gray-200 shadow-sm">
              <div class="flex items-center justify-between mb-2">
                <label
for="template-name"
class="block text-sm font-medium text-gray-700"
                  >Template Name</label
                >
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
                :state="
                  formErrors[`${activeTab}-name`] ||
                  (attemptedSave && !templates[activeTab].name.trim())
                    ? 'error'
                    : undefined
                "
                :ui="{ icon: { trailing: { pointer: '' } } }"
                required
                @blur="validateTemplateName(activeTab)"
              >
                <template #leading>
                  <UIcon name="i-heroicons-document-text" class="text-gray-400" />
                </template>
                <template #trailing>
                  <UIcon
                    v-if="templates[activeTab].name"
                    name="i-heroicons-check-circle"
                    class="text-green-500"
                  />
                </template>
              </UInput>
              <p v-if="formErrors[`${activeTab}-name`]" class="mt-1 text-xs text-red-500">
                {{ formErrors[`${activeTab}-name`] }}
              </p>
              <p
                v-else-if="attemptedSave && !templates[activeTab].name.trim()"
                class="mt-1 text-xs text-red-500"
              >
                Template name is required
              </p>
              <p v-else class="mt-1 text-xs text-gray-500">
                <span class="text-red-500">*</span> This name is required and will be used to
                identify this measurement template
              </p>
            </div>

            <div class="space-y-5">
              <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 class="text-base font-medium text-gray-900">Measurement Fields</h3>
                  <p class="text-xs text-gray-500 mt-1">
                    Customize fields for {{ activeTab === 'male' ? 'male' : 'female' }} measurements
                  </p>
                </div>
                <div class="flex flex-wrap gap-2 justify-center sm:justify-start">
                  <button
                    type="button"
                    class="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-primary-700 bg-primary-50 hover:bg-primary-100 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-primary-500 transition-colors"
                    :disabled="templates[activeTab].upperBody.length >= maxFieldsPerSection"
                    :class="{
                      'opacity-50 cursor-not-allowed':
                        templates[activeTab].upperBody.length >= maxFieldsPerSection,
                    }"
                    @click="addField(activeTab, 'upperBody')"
                  >
                    <UIcon name="i-heroicons-plus" class="w-3.5 h-3.5 mr-1.5" />
                    <span>Add Upper Body</span>
                    <span
                      v-if="templates[activeTab].upperBody.length >= maxFieldsPerSection"
                      class="ml-1 text-xs"
                      >(Max)</span
                    >
                  </button>
                  <button
                    type="button"
                    class="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-primary-700 bg-primary-50 hover:bg-primary-100 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-primary-500 transition-colors"
                    :disabled="templates[activeTab].lowerBody.length >= maxFieldsPerSection"
                    :class="{
                      'opacity-50 cursor-not-allowed':
                        templates[activeTab].lowerBody.length >= maxFieldsPerSection,
                    }"
                    @click="addField(activeTab, 'lowerBody')"
                  >
                    <UIcon name="i-heroicons-plus" class="w-3.5 h-3.5 mr-1.5" />
                    <span>Add Lower Body</span>
                    <span
                      v-if="templates[activeTab].lowerBody.length >= maxFieldsPerSection"
                      class="ml-1 text-xs"
                      >(Max)</span
                    >
                  </button>
                </div>
              </div>

              <div class="bg-gray-50/50 rounded-lg p-4 sm:p-5 border border-gray-200 shadow-sm">
                <div
                  class="flex items-start p-3 bg-primary-50/70 rounded-md border border-primary-100 mb-5"
                >
                  <UIcon
                    name="i-heroicons-information-circle"
                    class="text-primary-500 w-5 h-5 mr-2 flex-shrink-0 mt-0.5"
                  />
                  <p class="text-sm text-gray-700">
                    Customize the measurement fields below for your
                    <span class="font-medium">{{ activeTab === 'male' ? 'male' : 'female' }}</span>
                    clients. You can rename, add, or remove fields as needed.
                  </p>
                </div>
                <div class="space-y-6">
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
                    <!-- Upper Body Fields -->
                    <div class="space-y-3">
                      <div class="flex items-center justify-between border-b border-gray-200 pb-2">
                        <div class="flex items-center">
                          <UIcon
                            name="i-heroicons-square-3-stack-3d"
                            class="w-4 h-4 text-primary-500 mr-1.5"
                          />
                          <h4 class="text-sm font-medium text-gray-700">Upper Body Measurements</h4>
                        </div>
                        <span
                          v-if="templates[activeTab]?.upperBody?.length"
                          class="text-xs text-gray-500 bg-gray-100 rounded-full px-2 py-0.5"
                        >
                          {{ templates[activeTab].upperBody.length }}
                          {{ templates[activeTab].upperBody.length === 1 ? 'field' : 'fields' }}
                        </span>
                      </div>
                      <template v-if="templates[activeTab]?.upperBody?.length">
                        <div
                          v-for="(field, index) in templates[activeTab].upperBody"
                          :key="'upper-' + index"
                          class="flex items-center gap-2 group bg-white rounded-md p-3 hover:bg-gray-50 transition-colors border border-gray-100 shadow-sm"
                          :class="{
                            'border-red-200 bg-red-50':
                              !field.name.trim() && (attemptedSave || field.validated),
                          }"
                        >
                          <div class="flex-1">
                            <UInput
                              v-model="field.name"
                              type="text"
                              class="w-full"
                              :placeholder="`Upper body ${index + 1}`"
                              :state="
                                !field.name.trim() &&
                                (formErrors[`${activeTab}-fieldnames`] ||
                                  attemptedSave ||
                                  field.validated)
                                  ? 'error'
                                  : undefined
                              "
                              :ui="{ base: 'relative', input: { base: 'peer w-full' } }"
                              required
                              @blur="validateField(field)"
                            />
                            <p
                              v-if="!field.name.trim() && (attemptedSave || field.validated)"
                              class="text-xs text-red-500 mt-1"
                            >
                              Field name is required
                            </p>
                          </div>
                          <div class="flex items-center">
                            <span
                              class="text-xs font-medium bg-gray-100 text-gray-500 rounded-full w-5 h-5 flex items-center justify-center mr-2"
                              >{{ index + 1 }}</span
                            >
                            <button
                              type="button"
                              class="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                              title="Remove field"
                              @click="removeField(activeTab, 'upperBody', index)"
                            >
                              <UIcon name="i-heroicons-trash" class="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                        <button
                          type="button"
                          class="mt-3 w-full py-2.5 px-3 border border-dashed border-gray-300 rounded-md text-sm text-gray-500 hover:border-primary-300 hover:bg-primary-50/50 hover:text-primary-600 transition-colors flex items-center justify-center group"
                          @click="addField(activeTab, 'upperBody')"
                        >
                          <UIcon name="i-heroicons-plus-circle" class="w-4 h-4 mr-1.5" />
                          <span>Add another upper body measurement</span>
                        </button>
                      </template>
                      <div
                        v-else
                        class="text-center py-8 text-sm text-gray-400 bg-white/50 rounded-lg border-2 border-dashed border-gray-200 hover:border-primary-100 hover:bg-primary-50/30 hover:text-primary-600 transition-colors cursor-pointer"
                        @click="addField(activeTab, 'upperBody')"
                      >
                        <UIcon
                          name="i-heroicons-plus-circle"
                          class="w-6 h-6 mx-auto mb-2 text-gray-300"
                        />
                        <p>Click to add upper body measurements</p>
                      </div>
                    </div>

                    <!-- Lower Body Fields -->
                    <div class="space-y-3">
                      <div class="flex items-center justify-between border-b border-gray-200 pb-2">
                        <div class="flex items-center">
                          <UIcon
                            name="i-heroicons-square-3-stack-3d"
                            class="w-4 h-4 text-primary-500 mr-1.5"
                          />
                          <h4 class="text-sm font-medium text-gray-700">Lower Body Measurements</h4>
                        </div>
                        <span
                          v-if="templates[activeTab]?.lowerBody?.length"
                          class="text-xs text-gray-500 bg-gray-100 rounded-full px-2 py-0.5"
                        >
                          {{ templates[activeTab].lowerBody.length }}
                          {{ templates[activeTab].lowerBody.length === 1 ? 'field' : 'fields' }}
                        </span>
                      </div>
                      <template v-if="templates[activeTab]?.lowerBody?.length">
                        <div
                          v-for="(field, index) in templates[activeTab].lowerBody"
                          :key="'lower-' + index"
                          class="flex items-center gap-2 group bg-white rounded-md p-3 hover:bg-gray-50 transition-colors border border-gray-100 shadow-sm"
                          :class="{
                            'border-red-200 bg-red-50':
                              !field.name.trim() && (attemptedSave || field.validated),
                          }"
                        >
                          <div class="flex-1">
                            <UInput
                              v-model="field.name"
                              type="text"
                              class="w-full"
                              :placeholder="`Lower body ${index + 1}`"
                              :state="
                                !field.name.trim() &&
                                (formErrors[`${activeTab}-fieldnames`] ||
                                  attemptedSave ||
                                  field.validated)
                                  ? 'error'
                                  : undefined
                              "
                              :ui="{ base: 'relative', input: { base: 'peer w-full' } }"
                              required
                              @blur="validateField(field)"
                            />
                            <p
                              v-if="!field.name.trim() && (attemptedSave || field.validated)"
                              class="text-xs text-red-500 mt-1"
                            >
                              Field name is required
                            </p>
                          </div>
                          <div class="flex items-center">
                            <span
                              class="text-xs font-medium bg-gray-100 text-gray-500 rounded-full w-5 h-5 flex items-center justify-center mr-2"
                              >{{ index + 1 }}</span
                            >
                            <button
                              type="button"
                              class="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                              title="Remove field"
                              @click="removeField(activeTab, 'lowerBody', index)"
                            >
                              <UIcon name="i-heroicons-trash" class="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                        <button
                          type="button"
                          class="mt-3 w-full py-2.5 px-3 border border-dashed border-gray-300 rounded-md text-sm text-gray-500 hover:border-primary-300 hover:bg-primary-50/50 hover:text-primary-600 transition-colors flex items-center justify-center group"
                          @click="addField(activeTab, 'lowerBody')"
                        >
                          <UIcon name="i-heroicons-plus-circle" class="w-4 h-4 mr-1.5" />
                          <span>Add another lower body measurement</span>
                        </button>
                      </template>
                      <div
                        v-else
                        class="text-center py-8 text-sm text-gray-400 bg-white/50 rounded-lg border-2 border-dashed border-gray-200 hover:border-primary-100 hover:bg-primary-50/30 hover:text-primary-600 transition-colors cursor-pointer"
                        @click="addField(activeTab, 'lowerBody')"
                      >
                        <UIcon
                          name="i-heroicons-plus-circle"
                          class="w-6 h-6 mx-auto mb-2 text-gray-300"
                        />
                        <p>Click to add lower body measurements</p>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Navigation and Save Buttons -->
                <div
                  class="flex flex-col sm:flex-row justify-between items-center pt-6 mt-4 border-t border-gray-200 gap-5"
                >
                  <div class="flex flex-col sm:flex-row gap-3 w-full sm:w-auto order-2 sm:order-1">
                    <UButton
                      :to="ROUTE_NAMES.AUTH.CONFIRM"
                      variant="outline"
                      color="gray"
                      class="w-full sm:w-auto"
                      :ui="{
                        rounded: 'rounded-lg',
                        padding: { xs: 'px-4 py-2.5', sm: 'px-5 py-2.5' },
                      }"
                    >
                      <UIcon name="i-heroicons-arrow-left" class="w-4 h-4 mr-2" />
                      Back to Plan
                    </UButton>
                  </div>
                  <div class="w-full sm:w-auto order-1 sm:order-2">
                    <UButton
                      type="button"
                      variant="solid"
                      color="primary"
                      class="w-full sm:w-auto"
                      :disabled="isSaving || !isTemplatesValid"
                      :ui="{
                        rounded: 'rounded-lg',
                        padding: { xs: 'px-4 py-2.5', sm: 'px-5 py-2.5' },
                      }"
                      @click="saveTemplates"
                    >
                      <div class="flex items-center justify-center">
                        <div
                          v-if="isSaving"
                          class="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"
                        />
                        <span>{{ isSaving ? 'Saving...' : 'Save Templates and Continue' }}</span>
                      </div>
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
import { ref, computed, onMounted } from 'vue'
import { useToast, useHead, navigateTo } from '#imports'
import { storeToRefs } from 'pinia'
import { ROUTE_NAMES } from '~/constants/routes'
import { useAuthStore, useMeasurementTemplatesStore } from '~/store'
import { _useMeasurementTemplates } from '~/composables/measurements/useMeasurementTemplates'

useHead({
  title: 'Setup Measurements',
})

// Mark component as client-only
const isClient = ref(false)
onMounted(() => {
  isClient.value = true
})

// Define measurement field interface
interface MeasurementField {
  id: string
  name: string
}

// Define measurement template interface
interface MeasurementTemplate {
  name: string
  upperBody: MeasurementField[]
  lowerBody: MeasurementField[]
}

// Initialize auth store
const authStore = useAuthStore()
const { user } = storeToRefs(authStore)
const toast = useToast()

// Initialize API loading state
const _apiLoading = ref(false)

// Define tabs
const tabs = [
  { id: 'male', name: 'Male', icon: 'i-heroicons-user' },
  { id: 'female', name: 'Female', icon: 'i-heroicons-user' },
]

// Active tab
const activeTab = ref('male')

// Form errors
const formErrors = ref<Record<string, string>>({})

// Processing state
const _isProcessing = ref(false)
const isSaving = ref(false)
const loading = ref(true)

// Track if user has attempted to save
const attemptedSave = ref(false)

// Track original template state for detecting changes
const originalTemplates = ref({})

// Maximum number of fields allowed per section
const maxFieldsPerSection = 15

// Validate field on blur
function validateField(field) {
  field.validated = true
  return !!field.name.trim()
}

// Validate template name
function validateTemplateName(gender) {
  if (!templates.value[gender].name.trim()) {
    formErrors.value[`${gender}-name`] = 'Template name is required'
    return false
  }
  // Use object assignment to remove the property instead of delete
  formErrors.value = Object.fromEntries(
    Object.entries(formErrors.value).filter(([key]) => key !== `${gender}-name`)
  )
  return true
}

// Check if template has unsaved changes
function hasUnsavedChanges(tabId) {
  if (!originalTemplates.value[tabId]) return false

  const original = JSON.stringify(originalTemplates.value[tabId])
  const current = JSON.stringify(templates.value[tabId])

  return original !== current
}

// Switch between tabs with confirmation if there are unsaved changes
function switchTab(newTabId) {
  if (activeTab.value === newTabId) return

  if (hasUnsavedChanges(activeTab.value)) {
    // Show confirmation dialog
    if (
      confirm(
        `You have unsaved changes in your ${activeTab.value === 'male' ? 'Male' : 'Female'} template. Save changes before switching?`
      )
    ) {
      // Save current tab first
      saveCurrentTab().then(() => {
        activeTab.value = newTabId
      })
    } else {
      // Discard changes and switch
      if (originalTemplates.value[activeTab.value]) {
        templates.value[activeTab.value] = JSON.parse(
          JSON.stringify(originalTemplates.value[activeTab.value])
        )
      }
      activeTab.value = newTabId
    }
  } else {
    // No unsaved changes, switch directly
    activeTab.value = newTabId
  }
}

// Save just the current tab
async function saveCurrentTab() {
  const gender = activeTab.value

  // Validate template name
  if (!validateTemplateName(gender)) {
    toast.add({
      title: 'Error',
      description: `Please provide a name for your ${gender === 'male' ? 'Male' : 'Female'} template`,
      color: 'red',
    })
    return false
  }

  // Validate all fields have names
  const emptyUpperFields = templates.value[gender].upperBody.filter(
    field => !field.name.trim()
  ).length
  const emptyLowerFields = templates.value[gender].lowerBody.filter(
    field => !field.name.trim()
  ).length

  if (emptyUpperFields > 0 || emptyLowerFields > 0) {
    formErrors.value[`${gender}-fieldnames`] = true
    toast.add({
      title: 'Error',
      description: `Please provide names for all measurement fields`,
      color: 'red',
    })
    return false
  }

  try {
    const templateToSave = templates.value[gender]

    // Prepare template data for the store
    const templateData = {
      name: templateToSave.name,
      gender: gender,
      fields: [
        ...templateToSave.upperBody.map((field, index) => ({
          name: field.name,
          category: 'upperBody',
          order: index,
        })),
        ...templateToSave.lowerBody.map((field, index) => ({
          name: field.name,
          category: 'lowerBody',
          order: index,
        })),
      ],
      setupProcess: true, // Flag to indicate this is part of the setup process
    }

    // Save the template using the store
    await measurementTemplatesStore.createTemplate(templateData)

    // Update the original template reference
    originalTemplates.value[gender] = JSON.parse(JSON.stringify(templateToSave))

    toast.add({
      title: 'Success',
      description: `${gender === 'male' ? 'Male' : 'Female'} template saved successfully`,
      color: 'green',
    })
    return true
  } catch (error) {
    console.error(`Error saving ${gender} template:`, error)
    toast.add({
      title: 'Error',
      description: `Failed to save ${gender === 'male' ? 'Male' : 'Female'} template`,
      color: 'red',
    })
    return false
  }
}

// Generate a unique ID
const generateId = () => {
  return Math.random().toString(36).substring(2, 9)
}

// Get default template structure
const getDefaultTemplate = (gender: 'male' | 'female'): MeasurementTemplate => {
  const template: MeasurementTemplate = {
    name: `Standard ${gender === 'male' ? 'Male' : 'Female'} Measurements`,
    upperBody: [],
    lowerBody: [],
  }

  // Default upper body measurements
  const upperBodyDefaults =
    gender === 'male'
      ? ['Neck', 'Chest', 'Shoulders', 'Biceps', 'Forearms', 'Wrists']
      : ['Neck', 'Shoulders', 'Bust', 'Under Bust', 'Waist', 'Upper Arms']

  // Default lower body measurements
  const lowerBodyDefaults =
    gender === 'male'
      ? ['Waist', 'Hips', 'Thighs', 'Calves', 'Ankles']
      : ['Hips', 'Thighs', 'Calves', 'Ankles']

  // Add default fields
  upperBodyDefaults.forEach(name => {
    template.upperBody.push({ id: generateId(), name })
  })

  lowerBodyDefaults.forEach(name => {
    template.lowerBody.push({ id: generateId(), name })
  })

  return template
}

// Initialize templates with reactive objects
const templates = ref<Record<string, MeasurementTemplate>>({
  male: getDefaultTemplate('male'),
  female: getDefaultTemplate('female'),
})

// Check if templates are valid
const isTemplatesValid = computed(() => {
  return (
    templates.value.male.name.trim() !== '' &&
    templates.value.female.name.trim() !== '' &&
    templates.value.male.upperBody.every(field => field.name.trim() !== '') &&
    templates.value.male.lowerBody.every(field => field.name.trim() !== '') &&
    templates.value.female.upperBody.every(field => field.name.trim() !== '') &&
    templates.value.female.lowerBody.every(field => field.name.trim() !== '')
  )
})

// Initialize loading state and templates
onMounted(async () => {
  // Set loading state
  loading.value = true

  try {
    // Try to fetch existing templates from the API using the store
    console.log('Initializing templates...')

    // Attempt to fetch templates, but don't worry if it fails (user might not have any yet)
    try {
      await measurementTemplatesStore.fetchTemplates()

      // If we have existing templates, we could use them here
      // For now, we'll stick with the default templates for the setup process
    } catch (fetchError) {
      console.log('No existing templates found, using defaults', fetchError)
    }

    // Store original templates to track changes
    originalTemplates.value = {
      male: JSON.parse(JSON.stringify(templates.value.male)),
      female: JSON.parse(JSON.stringify(templates.value.female)),
    }
  } catch (error) {
    console.error('Error initializing templates:', error)
    toast.add({
      title: 'Error',
      description: 'Failed to initialize measurement templates',
      color: 'red',
    })
  } finally {
    // Set loading to false to show the content
    loading.value = false
  }
})

// Add a new field
const addField = (gender: string, section: 'upperBody' | 'lowerBody') => {
  if (!templates.value[gender]) return

  const newField: MeasurementField = {
    id: generateId(),
    name: '',
  }

  templates.value[gender][section].push(newField)

  // Clear any field name errors
  if (formErrors.value[`${gender}-fieldnames`]) {
    // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
    delete formErrors.value[`${gender}-fieldnames`]
  }
}

// Remove a field
const removeField = (gender: string, section: 'upperBody' | 'lowerBody', index: number) => {
  if (!templates.value[gender] || !templates.value[gender][section]) return

  // Don't allow removing all fields
  if (templates.value[gender][section].length <= 1) {
    toast.add({
      title: 'Cannot Remove Field',
      description: 'You must have at least one measurement field in each section.',
      color: 'orange',
      icon: 'i-heroicons-exclamation-triangle',
      timeout: 3000,
    })
    return
  }

  // Remove the field
  templates.value[gender][section].splice(index, 1)

  // Clear any field name errors
  const errorKey = `${gender}-fieldnames`
  if (Object.prototype.hasOwnProperty.call(formErrors.value, errorKey)) {
    formErrors.value[errorKey] = undefined
  }
}

// Initialize the measurement templates store
const measurementTemplatesStore = useMeasurementTemplatesStore()

// Save templates and complete setup
async function saveTemplates() {
  // Set attempted save flag to trigger validation UI
  attemptedSave.value = true

  // Clear previous errors
  formErrors.value = {}

  // Validate template names
  if (!templates.value.male.name.trim()) {
    formErrors.value['male-name'] = 'Please provide a name for your male template'
  }

  if (!templates.value.female.name.trim()) {
    formErrors.value['female-name'] = 'Please provide a name for your female template'
  }

  // Check if all fields have names
  const maleEmptyFields = templates.value.male.upperBody
    .concat(templates.value.male.lowerBody)
    .filter(field => !field.name.trim()).length

  const femaleEmptyFields = templates.value.female.upperBody
    .concat(templates.value.female.lowerBody)
    .filter(field => !field.name.trim()).length

  if (maleEmptyFields > 0) {
    formErrors.value['male-fieldnames'] = 'Please provide names for all measurement fields'
    // Mark all empty fields as validated to show errors
    templates.value.male.upperBody.forEach(field => {
      if (!field.name.trim()) field.validated = true
    })
    templates.value.male.lowerBody.forEach(field => {
      if (!field.name.trim()) field.validated = true
    })
  }

  if (femaleEmptyFields > 0) {
    formErrors.value['female-fieldnames'] = 'Please provide names for all measurement fields'
    // Mark all empty fields as validated to show errors
    templates.value.female.upperBody.forEach(field => {
      if (!field.name.trim()) field.validated = true
    })
    templates.value.female.lowerBody.forEach(field => {
      if (!field.name.trim()) field.validated = true
    })
  }

  // If there are errors, don't proceed
  if (Object.keys(formErrors.value).length > 0) {
    toast.add({
      title: 'Error',
      description: 'Please fix the highlighted errors before continuing.',
      color: 'red',
    })
    return
  }

  // Start saving
  isSaving.value = true

  try {
    // Prepare male template data
    const maleTemplateData = {
      name: templates.value.male.name,
      gender: 'male',
      fields: [
        ...templates.value.male.upperBody.map((field, index) => ({
          name: field.name,
          category: 'upperBody',
          order: index,
        })),
        ...templates.value.male.lowerBody.map((field, index) => ({
          name: field.name,
          category: 'lowerBody',
          order: index,
        })),
      ],
      setupProcess: true, // Flag to indicate this is part of the setup process
    }

    // Prepare female template data
    const femaleTemplateData = {
      name: templates.value.female.name,
      gender: 'female',
      fields: [
        ...templates.value.female.upperBody.map((field, index) => ({
          name: field.name,
          category: 'upperBody',
          order: index,
        })),
        ...templates.value.female.lowerBody.map((field, index) => ({
          name: field.name,
          category: 'lowerBody',
          order: index,
        })),
      ],
      setupProcess: true, // Flag to indicate this is part of the setup process
    }

    // Save both templates using the measurement templates store
    const [maleResponse, femaleResponse] = await Promise.all([
      measurementTemplatesStore.createTemplate(maleTemplateData),
      measurementTemplatesStore.createTemplate(femaleTemplateData),
    ])

    console.log('Templates saved:', { maleResponse, femaleResponse })

    // Save original templates to track changes
    originalTemplates.value = {
      male: JSON.parse(JSON.stringify(templates.value.male)),
      female: JSON.parse(JSON.stringify(templates.value.female)),
    }

    // Refresh templates from the store
    await measurementTemplatesStore.fetchTemplates()

    // Show success message
    toast.add({
      title: 'Success',
      description: 'Your measurement templates have been saved successfully.',
      color: 'green',
    })

    // Navigate to dashboard using direct window.location approach
    console.log('Attempting to navigate to dashboard...')
    console.log('User status:', user.value)
    console.log('Has completed setup:', user.value?.hasCompletedSetup)

    // Force a small delay to ensure state updates are processed
    await new Promise(resolve => setTimeout(resolve, 500))

    // Use the centralized route for navigation
    await navigateTo(ROUTE_NAMES.DASHBOARD.INDEX, { replace: true })
  } catch (error: any) {
    console.error('Error saving templates:', error)

    // Show error message with details if available
    const errorMessage =
      error.data?.message ||
      error.message ||
      'There was a problem saving your templates. Please try again.'
    toast.add({
      title: 'Error',
      description: errorMessage,
      color: 'red',
    })
  } finally {
    isSaving.value = false
  }
}

// Set page metadata
useHead({
  title: 'Setup Measurements - QuickMeazure',
  meta: [
    {
      name: 'description',
      content: 'Set up your measurement templates for male and female clients.',
    },
  ],
})
</script>
