<template>
  <div>
    <div class="max-w-5xl mx-auto space-y-6 py-6">
      <div class="flex items-center justify-between mb-8">
        <div class="flex items-center">
          <UButton
            icon="i-heroicons-arrow-left"
            color="gray"
            variant="ghost"
            :to="`/clients/${clientId}`"
            class="mr-2"
          />
          <h1 class="text-2xl font-bold">Edit Client</h1>
        </div>
        <UBadge
color="primary"
variant="soft"
size="lg"
class="text-sm">
          Client Information
        </UBadge>
      </div>

      <div v-if="isLoading" class="flex justify-center py-12">
        <USkeleton class="h-32 w-full" />
      </div>

      <template v-else-if="client">
        <UCard class="bg-white shadow border-0">
          <form class="space-y-8" @submit.prevent="updateClient">
            <!-- Client Detail Section -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div class="space-y-2">
                <label
for="clientName"
class="block text-sm font-medium text-gray-700"
                  >Full Name <span class="text-red-500">*</span></label
                >
                <UInput
                  id="clientName"
                  v-model="form.name"
                  placeholder="Client name"
                  class="w-full"
                  icon="i-heroicons-user"
                  size="lg"
                  autocomplete="name"
                  required
                />
              </div>

              <div class="space-y-2">
                <label
for="clientPhone"
class="block text-sm font-medium text-gray-700"
                  >Phone Number</label
                >
                <UInput
                  id="clientPhone"
                  v-model="form.phone"
                  placeholder="Phone number"
                  class="w-full"
                  icon="i-heroicons-phone"
                  size="lg"
                  type="tel"
                  autocomplete="tel"
                />
              </div>

              <div class="space-y-2">
                <label
for="clientEmail"
class="block text-sm font-medium text-gray-700"
                  >Email</label
                >
                <UInput
                  id="clientEmail"
                  v-model="form.email"
                  placeholder="Email address"
                  class="w-full"
                  icon="i-heroicons-envelope"
                  size="lg"
                  type="email"
                  autocomplete="email"
                />
              </div>

              <div class="space-y-2">
                <label
for="clientAddress"
class="block text-sm font-medium text-gray-700"
                  >Address</label
                >
                <UInput
                  id="clientAddress"
                  v-model="form.address"
                  placeholder="Physical address"
                  class="w-full"
                  icon="i-heroicons-home"
                  size="lg"
                  autocomplete="address-line1"
                />
              </div>
            </div>

            <!-- Measurement Tabs -->
            <div class="mt-6">
              <div
                v-for="item in measurementSections"
                :key="item.value"
                class="mb-4 border rounded-lg overflow-hidden shadow-sm transition-all hover:shadow-md"
              >
                <div
                  class="flex justify-between items-center p-4 cursor-pointer transition-colors"
                  :class="
                    openItems.includes(item.value)
                      ? 'bg-primary-50 border-b border-primary-100'
                      : 'bg-white'
                  "
                  @click="toggleMeasurementSection(item.value)"
                >
                  <div class="font-medium flex items-center">
                    <UIcon
                      :name="getMeasurementIcon(item.value)"
                      class="h-5 w-5 mr-2 text-primary-500"
                    />
                    {{ item.label }}
                  </div>
                  <UIcon
                    :name="
                      openItems.includes(item.value)
                        ? 'i-heroicons-chevron-up'
                        : 'i-heroicons-chevron-down'
                    "
                    class="h-5 w-5 transition-transform text-primary-500"
                  />
                </div>

                <div
                  v-show="openItems.includes(item.value)"
                  class="p-6 bg-gray-50 rounded-b-lg space-y-6 border-t border-primary-100"
                >
                  <!-- Upper Body Content -->
                  <div v-if="item.value === 'upper'">
                    <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      <div class="space-y-2">
                        <label
for="edit-bust"
class="block text-sm font-medium text-gray-700"
                          >Bust</label
                        >
                        <div class="flex">
                          <UInput
                            id="edit-bust"
                            v-model="form.measurements.bust"
                            type="number"
                            step="0.1"
                            placeholder="0.0"
                            class="w-full rounded-r-none focus:ring-primary-500"
                            size="lg"
                          />
                          <span
                            class="inline-flex items-center px-3 border border-l-0 border-gray-300 bg-primary-50 text-primary-700 text-sm font-medium rounded-r-md"
                          >
                            in
                          </span>
                        </div>
                      </div>

                      <div class="space-y-2">
                        <label
for="edit-shoulder"
class="block text-sm font-medium text-gray-700"
                          >Shoulder</label
                        >
                        <div class="flex">
                          <UInput
                            id="edit-shoulder"
                            v-model="form.measurements.shoulder"
                            type="number"
                            step="0.1"
                            placeholder="0.0"
                            class="w-full rounded-r-none focus:ring-primary-500"
                            size="lg"
                          />
                          <span
                            class="inline-flex items-center px-3 border border-l-0 border-gray-300 bg-primary-50 text-primary-700 text-sm font-medium rounded-r-md"
                          >
                            in
                          </span>
                        </div>
                      </div>

                      <div class="space-y-2">
                        <label
for="edit-sleeve"
class="block text-sm font-medium text-gray-700"
                          >Sleeve</label
                        >
                        <div class="flex">
                          <UInput
                            id="edit-sleeve"
                            v-model="form.measurements.sleeve"
                            type="number"
                            step="0.1"
                            placeholder="0.0"
                            class="w-full rounded-r-none focus:ring-primary-500"
                            size="lg"
                          />
                          <span
                            class="inline-flex items-center px-3 border border-l-0 border-gray-300 bg-primary-50 text-primary-700 text-sm font-medium rounded-r-md"
                          >
                            in
                          </span>
                        </div>
                      </div>

                      <div class="space-y-2">
                        <label
for="edit-neck"
class="block text-sm font-medium text-gray-700"
                          >Neck</label
                        >
                        <div class="flex">
                          <UInput
                            id="edit-neck"
                            v-model="form.measurements.neck"
                            type="number"
                            step="0.1"
                            placeholder="0.0"
                            class="w-full rounded-r-none focus:ring-primary-500"
                            size="lg"
                          />
                          <span
                            class="inline-flex items-center px-3 border border-l-0 border-gray-300 bg-primary-50 text-primary-700 text-sm font-medium rounded-r-md"
                          >
                            in
                          </span>
                        </div>
                      </div>

                      <div class="space-y-2">
                        <label
for="edit-chest"
class="block text-sm font-medium text-gray-700"
                          >Chest</label
                        >
                        <div class="flex">
                          <UInput
                            id="edit-chest"
                            v-model="form.measurements.chest"
                            type="number"
                            step="0.1"
                            placeholder="0.0"
                            class="w-full rounded-r-none focus:ring-primary-500"
                            size="lg"
                          />
                          <span
                            class="inline-flex items-center px-3 border border-l-0 border-gray-300 bg-primary-50 text-primary-700 text-sm font-medium rounded-r-md"
                          >
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
                        <label
for="edit-waist"
class="block text-sm font-medium text-gray-700"
                          >Waist</label
                        >
                        <div class="flex">
                          <UInput
                            id="edit-waist"
                            v-model="form.measurements.waist"
                            type="number"
                            step="0.1"
                            placeholder="0.0"
                            class="w-full rounded-r-none focus:ring-primary-500"
                            size="lg"
                          />
                          <span
                            class="inline-flex items-center px-3 border border-l-0 border-gray-300 bg-primary-50 text-primary-700 text-sm font-medium rounded-r-md"
                          >
                            in
                          </span>
                        </div>
                      </div>

                      <div class="space-y-2">
                        <label
for="edit-hip"
class="block text-sm font-medium text-gray-700"
                          >Hip</label
                        >
                        <div class="flex">
                          <UInput
                            id="edit-hip"
                            v-model="form.measurements.hip"
                            type="number"
                            step="0.1"
                            placeholder="0.0"
                            class="w-full rounded-r-none focus:ring-primary-500"
                            size="lg"
                          />
                          <span
                            class="inline-flex items-center px-3 border border-l-0 border-gray-300 bg-primary-50 text-primary-700 text-sm font-medium rounded-r-md"
                          >
                            in
                          </span>
                        </div>
                      </div>

                      <div class="space-y-2">
                        <label
for="edit-inseam"
class="block text-sm font-medium text-gray-700"
                          >Inseam</label
                        >
                        <div class="flex">
                          <UInput
                            id="edit-inseam"
                            v-model="form.measurements.inseam"
                            type="number"
                            step="0.1"
                            placeholder="0.0"
                            class="w-full rounded-r-none focus:ring-primary-500"
                            size="lg"
                          />
                          <span
                            class="inline-flex items-center px-3 border border-l-0 border-gray-300 bg-primary-50 text-primary-700 text-sm font-medium rounded-r-md"
                          >
                            in
                          </span>
                        </div>
                      </div>

                      <div class="space-y-2">
                        <label
for="edit-thigh"
class="block text-sm font-medium text-gray-700"
                          >Thigh</label
                        >
                        <div class="flex">
                          <UInput
                            id="edit-thigh"
                            v-model="form.measurements.thigh"
                            type="number"
                            step="0.1"
                            placeholder="0.0"
                            class="w-full rounded-r-none focus:ring-primary-500"
                            size="lg"
                          />
                          <span
                            class="inline-flex items-center px-3 border border-l-0 border-gray-300 bg-primary-50 text-primary-700 text-sm font-medium rounded-r-md"
                          >
                            in
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- Custom Measurements -->
                  <div v-if="item.value === 'custom'">
                    <div
                      v-for="(value, key) in form.measurements.additionalMeasurements"
                      :key="key"
                      class="flex gap-4 items-end mb-4 p-3 rounded-lg bg-white border border-gray-200 shadow-sm"
                    >
                      <div class="space-y-2 w-1/2">
                        <label
                          :for="`custom-name-${key}`"
                          class="block text-sm font-medium text-gray-700"
                          >Measurement Name</label
                        >
                        <UInput
                          :id="`custom-name-${key}`"
                          v-model="customMeasurementKeys[key]"
                          placeholder="e.g., Ankle width"
                          class="w-full focus:ring-primary-500"
                          size="lg"
                        />
                      </div>

                      <div class="space-y-2 w-1/3">
                        <label
                          :for="`custom-value-${key}`"
                          class="block text-sm font-medium text-gray-700"
                          >Value</label
                        >
                        <div class="flex">
                          <UInput
                            :id="`custom-value-${key}`"
                            v-model="form.measurements.additionalMeasurements[key]"
                            type="number"
                            step="0.1"
                            placeholder="0.0"
                            class="w-full rounded-r-none focus:ring-primary-500"
                            size="lg"
                          />
                          <span
                            class="inline-flex items-center px-3 border border-l-0 border-gray-300 bg-primary-50 text-primary-700 text-sm font-medium rounded-r-md"
                          >
                            in
                          </span>
                        </div>
                      </div>

                      <UButton
                        type="button"
                        color="red"
                        icon="i-heroicons-trash"
                        variant="soft"
                        class="flex-shrink-0"
                        size="lg"
                        @click="removeCustomMeasurement(key)"
                      />
                    </div>

                    <div class="flex justify-center mt-6">
                      <UButton
                        type="button"
                        color="primary"
                        variant="solid"
                        icon="i-heroicons-plus-circle"
                        class="shadow-sm hover:shadow-md transition-all duration-200 px-6"
                        size="lg"
                        @click="addCustomMeasurement"
                      >
                        <span class="font-medium">Add Custom Measurement</span>
                      </UButton>
                    </div>

                    <div
                      v-if="Object.keys(form.measurements.additionalMeasurements).length === 0"
                      class="text-center py-8 px-4"
                    >
                      <UIcon
                        name="i-heroicons-pencil-square"
                        class="mx-auto h-12 w-12 text-gray-300 mb-3"
                      />
                      <h3 class="text-lg font-medium text-gray-700 mb-1">
                        No custom measurements yet
                      </h3>
                      <p class="text-gray-500 text-sm">
                        Add specific measurements that aren't covered in the standard sections
                      </p>
                    </div>
                  </div>

                  <!-- Notes Content -->
                  <div v-if="item.value === 'notes'">
                    <div class="space-y-2">
                      <label
for="measurement-notes"
class="block text-sm font-medium text-gray-700"
                        >Measurement Notes</label
                      >
                      <UTextarea
                        id="measurement-notes"
                        v-model="form.measurements.notes"
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
            <div class="flex items-center justify-between pt-6 border-t">
              <!-- Delete Button -->
              <UButton
                type="button"
                color="error"
                variant="outline"
                :disabled="isSubmitting"
                size="lg"
                @click="confirmDelete"
              >
                Delete
              </UButton>

              <!-- Save Buttons -->
              <div class="flex space-x-3">
                <UButton
                  type="button"
                  color="neutral"
                  variant="outline"
                  :to="`/clients/${clientId}`"
                  :disabled="isSubmitting"
                  size="lg"
                >
                  Cancel
                </UButton>

                <UButton
                  type="submit"
                  color="primary"
                  variant="solid"
                  :loading="isSubmitting"
                  size="lg"
                >
                  Save Changes
                </UButton>
              </div>
            </div>
          </form>
        </UCard>
      </template>

      <template v-else>
        <UCard class="bg-white">
          <div class="py-12 text-center">
            <UIcon name="i-heroicons-face-frown" class="text-gray-400 mx-auto mb-2" size="xl" />
            <h3 class="text-lg font-medium text-gray-900">Client not found</h3>
            <p class="text-gray-500 mt-1 mb-4">
              This client doesn't exist or you don't have access to it.
            </p>
            <UButton color="primary" to="/clients" icon="i-heroicons-arrow-left">
              Back to Clients
            </UButton>
          </div>
        </UCard>
      </template>
    </div>

    <!-- Replace basic modal with component -->
    <DeleteModal
      v-model="showDeleteModal"
      title="Delete Client"
      :message="`Are you sure you want to delete <strong>${client?.name}</strong>? This action cannot be undone and will also delete all measurements and orders for this client.`"
      :loading="isDeleting"
      @confirm="deleteClient"
    />
  </div>
</template>

<script setup>
import DeleteModal from '~/components/DeleteModal.vue'

// Get client ID from route
const route = useRoute()
const clientId = route.params.id

// State
const client = ref(null)
const isLoading = ref(true)
const isSubmitting = ref(false)
const isDeleting = ref(false)
const showDeleteModal = ref(false)

// Track which accordion items are open - initialized before client data
const openItems = ref(['upper'])

// Measurement sections
const measurementSections = ref([
  {
    label: 'Upper Body Measurements',
    value: 'upper',
  },
  {
    label: 'Lower Body Measurements',
    value: 'lower',
  },
  {
    label: 'Custom Measurements',
    value: 'custom',
  },
  {
    label: 'Measurement Notes',
    value: 'notes',
  },
])

// For custom measurements
const customMeasurementKeys = ref({})
const customMeasurementCounter = ref(0)

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
    additionalMeasurements: {},
  },
})

// Set page metadata
useHead({
  title: 'Edit Client - QuickMeazure',
})

// Function to toggle measurement sections
const toggleMeasurementSection = sectionValue => {
  if (!openItems.value.includes(sectionValue)) {
    openItems.value.push(sectionValue)
  } else {
    openItems.value = openItems.value.filter(item => item !== sectionValue)
  }
}

// Get icon for measurement section
const getMeasurementIcon = sectionValue => {
  switch (sectionValue) {
    case 'upper':
      return 'i-heroicons-user-circle'
    case 'lower':
      return 'i-heroicons-variable'
    case 'custom':
      return 'i-heroicons-pencil-square'
    case 'notes':
      return 'i-heroicons-document-text'
    default:
      return 'i-heroicons-square-3-stack-3d'
  }
}

// Custom measurements functions
const addCustomMeasurement = () => {
  const newKey = `custom_${customMeasurementCounter.value}`
  customMeasurementCounter.value++
  form.value.measurements.additionalMeasurements[newKey] = null
  customMeasurementKeys.value[newKey] = ''
}

const removeCustomMeasurement = key => {
  // Set to undefined instead of deleting to avoid dynamic delete warnings
  form.value.measurements.additionalMeasurements[key] = undefined
  customMeasurementKeys.value[key] = undefined

  // Remove undefined properties during processing before saving
}

// Process measurements for saving
const processMeasurements = () => {
  if (Object.keys(form.value.measurements.additionalMeasurements).length > 0) {
    const processedAdditionalMeasurements = {}
    for (const [key, value] of Object.entries(form.value.measurements.additionalMeasurements)) {
      const customName = customMeasurementKeys.value[key] || key
      processedAdditionalMeasurements[customName] = value
    }

    return {
      ...form.value.measurements,
      additionalMeasurements: processedAdditionalMeasurements,
    }
  }

  return form.value.measurements
}

// Fetch client details
const fetchClient = async () => {
  isLoading.value = true

  try {
    // Get auth token from the auth store
    const auth = useSessionAuth()
    const token = auth.token.value

    if (!token) {
      // Redirect to login if not authenticated
      useToast().add({
        title: 'Authentication required',
        description: 'Please log in to edit client details',
        color: 'orange',
      })
      navigateTo('/auth/login')
      return
    }

    // Fetch client by ID
    const data = await $fetch(`/api/clients/${clientId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    // Set client data
    client.value = data

    // Initialize form with client data
    form.value = {
      name: data.name || '',
      email: data.email || '',
      phone: data.phone || '',
      address: data.address || '',
      notes: data.notes || '',
      measurements: data.measurement
        ? {
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
            additionalMeasurements: data.measurement.additionalMeasurements || {},
          }
        : {
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
            additionalMeasurements: {},
          },
    }

    // Set up custom measurement keys
    if (data.measurement && data.measurement.additionalMeasurements) {
      Object.keys(data.measurement.additionalMeasurements).forEach((key, index) => {
        if (key.startsWith('custom_')) {
          customMeasurementKeys.value[key] = key
        } else {
          const customKey = `custom_${index}`
          customMeasurementKeys.value[customKey] = key
          customMeasurementCounter.value = Math.max(customMeasurementCounter.value, index + 1)

          // If we're reconstructing the keys, make sure the value is transferred
          if (customKey !== key) {
            // Create a new object without the key to avoid dynamic delete
            const newAdditionalMeasurements = {}
            Object.keys(form.value.measurements.additionalMeasurements).forEach(k => {
              if (k !== key) {
                newAdditionalMeasurements[k] = form.value.measurements.additionalMeasurements[k]
              }
            })
            // Add the value with the new key
            newAdditionalMeasurements[customKey] = data.measurement.additionalMeasurements[key]
            // Replace the entire object
            form.value.measurements.additionalMeasurements = newAdditionalMeasurements
          }
        }
      })
    }

    // Update custom measurement counter to avoid conflicts
    if (
      customMeasurementCounter.value === 0 &&
      Object.keys(form.value.measurements.additionalMeasurements).length > 0
    ) {
      customMeasurementCounter.value = Object.keys(
        form.value.measurements.additionalMeasurements
      ).length
    }

    // Show relevant measurement sections based on data
    if (data.measurement) {
      const hasUpperBodyMeasurements =
        data.measurement.bust ||
        data.measurement.shoulder ||
        data.measurement.sleeve ||
        data.measurement.neck ||
        data.measurement.chest

      const hasLowerBodyMeasurements =
        data.measurement.waist ||
        data.measurement.hip ||
        data.measurement.inseam ||
        data.measurement.thigh

      const hasCustomMeasurements =
        data.measurement.additionalMeasurements &&
        Object.keys(data.measurement.additionalMeasurements).length > 0

      const hasMeasurementNotes = data.measurement.notes && data.measurement.notes.trim() !== ''

      // Update open sections based on what data exists
      openItems.value = []
      if (hasUpperBodyMeasurements) openItems.value.push('upper')
      if (hasLowerBodyMeasurements) openItems.value.push('lower')
      if (hasCustomMeasurements) openItems.value.push('custom')
      if (hasMeasurementNotes) openItems.value.push('notes')

      // Ensure at least one section is open
      if (openItems.value.length === 0) openItems.value = ['upper']
    } else {
      // If no measurements exist, only open the first section
      openItems.value = ['upper']
    }

    // Update page title with client name
    useHead({
      title: `Edit ${data.name} - QuickMeazure`,
    })
  } catch (error) {
    console.error('Error fetching client:', error)
    let errorMessage = 'Failed to load client details'

    // Handle specific error cases
    if (error.response?.status === 404) {
      errorMessage = 'Client not found'
    } else if (error.response?.status === 401) {
      errorMessage = 'Your session has expired. Please log in again.'
      // Redirect to login
      navigateTo('/auth/login')
    }

    useToast().add({
      title: 'Error',
      description: errorMessage,
      color: 'red',
    })
  } finally {
    isLoading.value = false
  }
}

// Update client
const updateClient = async () => {
  isSubmitting.value = true

  try {
    // Validate form
    if (!form.value.name) {
      useToast().add({
        title: 'Missing information',
        description: 'Please enter the client name',
        color: 'red',
      })
      isSubmitting.value = false
      return
    }

    // Get auth token from the auth store
    const auth = useSessionAuth()
    const token = auth.token.value

    if (!token) {
      // Redirect to login if not authenticated
      useToast().add({
        title: 'Authentication required',
        description: 'Please log in to edit client details',
        color: 'orange',
      })
      navigateTo('/auth/login')
      return
    }

    // Process measurements for saving
    const processedMeasurements = processMeasurements()

    // Update client
    await $fetch(`/api/clients/${clientId}`, {
      method: 'PUT',
      body: {
        name: form.value.name,
        email: form.value.email,
        phone: form.value.phone,
        address: form.value.address,
        notes: form.value.notes,
        measurements: processedMeasurements,
      },
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    // Show success message
    useToast().add({
      title: 'Client updated',
      description: 'Client information has been updated successfully',
      color: 'green',
    })

    // Navigate back to client details
    navigateTo(`/clients/${clientId}`)
  } catch (error) {
    console.error('Error updating client:', error)
    let errorMessage = 'Failed to update client'

    // Handle specific error cases
    if (error.response?.status === 404) {
      errorMessage = 'Client not found'
    } else if (error.response?.status === 401) {
      errorMessage = 'Your session has expired. Please log in again.'
      // Redirect to login
      navigateTo('/auth/login')
    }

    useToast().add({
      title: 'Error',
      description: errorMessage,
      color: 'red',
    })
  } finally {
    isSubmitting.value = false
  }
}

// Confirm delete
const confirmDelete = () => {
  showDeleteModal.value = true
}

// Delete client
const deleteClient = async () => {
  isDeleting.value = true

  try {
    // Get auth token from the auth store
    const auth = useSessionAuth()
    const token = auth.token.value

    if (!token) {
      // Redirect to login if not authenticated
      useToast().add({
        title: 'Authentication required',
        description: 'Please log in to delete clients',
        color: 'orange',
      })
      navigateTo('/auth/login')
      return
    }

    // Delete client
    await $fetch(`/api/clients/${clientId}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    // Show success message
    useToast().add({
      title: 'Client deleted',
      description: 'Client has been deleted successfully',
      color: 'green',
    })

    // Navigate back to clients list
    navigateTo('/clients')
  } catch (error) {
    console.error('Error deleting client:', error)
    let errorMessage = 'Failed to delete client'

    // Handle specific error cases
    if (error.response?.status === 404) {
      errorMessage = 'Client not found'
    } else if (error.response?.status === 401) {
      errorMessage = 'Your session has expired. Please log in again.'
      // Redirect to login
      navigateTo('/auth/login')
    }

    useToast().add({
      title: 'Error',
      description: errorMessage,
      color: 'red',
    })

    // Close modal
    showDeleteModal.value = false
  } finally {
    isDeleting.value = false
  }
}

// Fetch client data on mount
onMounted(fetchClient)
</script>
