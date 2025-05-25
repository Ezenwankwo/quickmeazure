<template>
  <div class="space-y-6">
    <UCard>
      <template #header>
        <div class="flex items-center">
          <UIcon name="i-heroicons-user-circle" class="mr-2 text-primary-500 h-5 w-5" />
          <h2 class="text-xl font-semibold text-gray-900">Profile Information</h2>
        </div>
        <p class="mt-1 text-sm text-gray-500">
          Update your personal information and how others see you on the platform.
        </p>
      </template>

      <UForm :state="form" class="space-y-6" @submit="saveProfile">
        <!-- Avatar -->
        <div class="flex items-center gap-x-6">
          <div class="relative group">
            <img
              v-if="form.avatar"
              :src="form.avatar"
              alt="Profile"
              class="h-20 w-20 rounded-full object-cover border-2 border-primary-100 shadow-sm group-hover:opacity-90 transition-opacity"
            />
            <div
              v-else
              class="h-20 w-20 rounded-full bg-gray-100 flex items-center justify-center border-2 border-primary-100 shadow-sm group-hover:bg-gray-200 transition-colors"
            >
              <UIcon name="i-heroicons-user" class="h-10 w-10 text-gray-400" />
            </div>
            <div
              class="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <UButton
                color="white"
                variant="ghost"
                size="xs"
                class="rounded-full p-1"
                icon="i-heroicons-camera"
                @click="handleAvatarUpload"
              >
                <span class="sr-only">Change avatar</span>
              </UButton>
            </div>
          </div>
          <div class="flex flex-col">
            <span class="text-sm font-medium text-gray-700">Profile Photo</span>
            <span class="text-xs text-gray-500">Upload a professional profile photo</span>
            <div>
              <UBadge
                color="neutral"
                variant="subtle"
                class="mt-2 cursor-pointer hover:bg-neutral-200 transition-colors"
                @click="handleAvatarUpload"
              >
                Change photo
              </UBadge>
            </div>
          </div>
        </div>

        <!-- Form Fields -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
          <!-- Name -->
          <div class="space-y-2">
            <label for="name" class="block text-sm font-medium text-gray-700">Full Name</label>
            <UInput
              id="name"
              v-model="form.name"
              placeholder="Your full name"
              required
              class="w-full"
              size="lg"
            />
          </div>

          <!-- Email -->
          <div class="space-y-2">
            <label for="email" class="block text-sm font-medium text-gray-700">Email Address</label>
            <UInput
              id="email"
              v-model="form.email"
              type="email"
              placeholder="your.email@example.com"
              required
              class="w-full"
              size="lg"
            />
          </div>

          <!-- Business Name -->
          <div class="space-y-2">
            <label
for="businessName"
class="block text-sm font-medium text-gray-700"
              >Business or Company Name</label
            >
            <UInput
              id="businessName"
              v-model="form.businessName"
              placeholder="Your business name"
              class="w-full"
              size="lg"
            />
          </div>

          <!-- Phone -->
          <div class="space-y-2">
            <label for="phone" class="block text-sm font-medium text-gray-700">Phone Number</label>
            <UInput
              id="phone"
              v-model="form.phone"
              placeholder="Your phone number"
              class="w-full"
              size="lg"
            />
          </div>

          <!-- Location -->
          <div class="space-y-2">
            <label for="location" class="block text-sm font-medium text-gray-700">Location</label>
            <UInput
              id="location"
              v-model="form.location"
              placeholder="City, Country"
              class="w-full"
              size="lg"
            />
          </div>
        </div>

        <!-- Specializations -->
        <div class="space-y-3 w-full">
          <label
for="specializations"
class="block text-sm font-medium text-gray-700"
            >Areas of Specialization</label
          >
          <span class="text-xs text-gray-500">Select all the areas you specialize in</span>
          <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 mt-2">
            <div
              v-for="specialization in specializationOptions"
              :key="specialization.value"
              class="p-2 rounded-lg hover:bg-gray-50 border border-gray-100"
            >
              <UCheckbox
                :model-value="form.specializations?.includes(specialization.value)"
                :label="specialization.label"
                @update:model-value="updateSpecialization(specialization.value, $event)"
              />
            </div>
          </div>
        </div>

        <!-- Services -->
        <div class="space-y-3 w-full">
          <label
for="services"
class="block text-sm font-medium text-gray-700"
            >Services Offered</label
          >
          <span class="text-xs text-gray-500">Select all the services your business provides</span>
          <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 mt-2">
            <div
              v-for="service in services"
              :key="service.id"
              class="p-2 rounded-lg hover:bg-gray-50 border border-gray-100"
            >
              <UCheckbox
                :model-value="form.services?.includes(service.id)"
                :label="service.name"
                @update:model-value="updateService(service.id, $event)"
              />
            </div>
          </div>
        </div>

        <!-- Bio -->
        <div class="space-y-2 w-full">
          <label for="bio" class="block text-sm font-medium text-gray-700">Professional Bio</label>
          <UTextarea
            id="bio"
            v-model="form.bio"
            placeholder="Tell us about your experience, specialties, and what makes your services unique..."
            :rows="4"
            class="w-full"
            size="lg"
          />
        </div>

        <!-- Form Actions -->
        <div class="flex justify-end py-2">
          <UButton
            type="submit"
            :loading="isSaving"
            :disabled="!formChanged"
            icon="i-heroicons-check"
            color="primary"
          >
            Save Changes
          </UButton>
        </div>
      </UForm>
    </UCard>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useUserStore } from '~/store/modules/user'
import type { User } from '~/store/types'

// Get the user store
const userStore = useUserStore()

// Original profile data to compare changes
const originalProfile = ref<Partial<User>>({})

// Form state
const form = ref({
  name: '',
  email: '',
  businessName: '',
  phone: '',
  location: '',
  specializations: [] as string[],
  services: [] as string[],
  bio: '',
  avatar: '',
})

// Helper functions for checkbox arrays
const updateSpecialization = (value: string, checked: boolean) => {
  if (!form.value.specializations) {
    form.value.specializations = []
  }

  if (checked) {
    // Add to array if not already present
    if (!form.value.specializations.includes(value)) {
      form.value.specializations.push(value)
    }
  } else {
    // Remove from array
    form.value.specializations = form.value.specializations.filter(item => item !== value)
  }
}

const updateService = (value: string, checked: boolean) => {
  if (!form.value.services) {
    form.value.services = []
  }

  if (checked) {
    // Add to array if not already present
    if (!form.value.services.includes(value)) {
      form.value.services.push(value)
    }
  } else {
    // Remove from array
    form.value.services = form.value.services.filter(item => item !== value)
  }
}

// Track if form has changed
const formChanged = computed(() => {
  if (!originalProfile.value) return false

  return (
    form.value.name !== originalProfile.value.name ||
    form.value.email !== originalProfile.value.email ||
    form.value.businessName !== originalProfile.value.businessName ||
    form.value.phone !== originalProfile.value.phone ||
    form.value.location !== originalProfile.value.location ||
    form.value.bio !== originalProfile.value.bio ||
    form.value.avatar !== originalProfile.value.avatar ||
    JSON.stringify(form.value.specializations) !==
      JSON.stringify(originalProfile.value.specializations) ||
    JSON.stringify(form.value.services) !== JSON.stringify(originalProfile.value.services)
  )
})

// Specialization options
const specializationOptions = [
  { label: 'Menswear', value: 'menswear' },
  { label: 'Womenswear', value: 'womenswear' },
  { label: 'Bridal', value: 'bridal' },
  { label: 'Formal Wear', value: 'formal' },
  { label: 'Casual Wear', value: 'casual' },
  { label: "Children's Clothing", value: 'children' },
  { label: 'Alterations', value: 'alterations' },
  { label: 'Custom Designs', value: 'custom' },
  { label: 'Traditional Attire', value: 'traditional' },
  { label: 'Uniforms', value: 'uniforms' },
]

// Service options
const services = [
  { id: 'custom_design', name: 'Custom Design' },
  { id: 'alterations', name: 'Alterations' },
  { id: 'repairs', name: 'Repairs' },
  { id: 'measurements', name: 'Measurements' },
  { id: 'consultation', name: 'Consultation' },
  { id: 'rush_orders', name: 'Rush Orders' },
]

const isSaving = ref(false)

// Fetch profile data from the user store and API
const fetchProfile = async () => {
  try {
    // First check if we have profile data in the store
    if (userStore.profile) {
      // Use the store data to populate the form
      updateFormFromProfile(userStore.profile)
      originalProfile.value = { ...userStore.profile }
    }

    // Fetch the latest data from the API using the store function
    const result = await userStore.fetchProfile()

    if (!result.success) {
      throw new Error(result.error || 'Failed to fetch profile')
    }

    if (result.data) {
      // Update the form with the latest data
      // (The store is already updated by the fetchProfile function)
      updateFormFromProfile(result.data)
      originalProfile.value = { ...result.data }
    }
  } catch (err) {
    console.error('Error fetching profile:', err)
    useToast().add({
      title: 'Error loading profile',
      description: 'Please try refreshing the page',
      color: 'error',
      icon: 'i-heroicons-exclamation-triangle',
    })
  }
}

// Helper function to update form from profile data
const updateFormFromProfile = (profileData: any) => {
  form.value = {
    name: profileData.name || '',
    email: profileData.email || '',
    businessName: profileData.businessName || '',
    phone: profileData.phone || '',
    location: profileData.location || '',
    specializations: profileData.specializations || [],
    services: profileData.services || [],
    bio: profileData.bio || '',
    avatar: profileData.avatar || '',
  }
}

// Reset form to original values
const resetForm = () => {
  if (originalProfile.value) {
    updateFormFromProfile(originalProfile.value)
  }
}

// Save profile
const saveProfile = async () => {
  isSaving.value = true

  try {
    // Call the store function to update the profile
    const result = await userStore.updateProfileData(form.value)

    if (!result.success) {
      throw new Error(result.error || 'Failed to update profile')
    }

    // Update the original profile data for comparison
    if (result.data) {
      originalProfile.value = { ...result.data }
    }

    useToast().add({
      title: 'Profile updated',
      description: 'Your profile information has been saved',
      icon: 'i-heroicons-check-circle',
      color: 'primary',
    })
  } catch (err) {
    console.error('Error saving profile:', err)
    useToast().add({
      title: 'Error saving profile',
      description: 'Please try again',
      color: 'error',
      icon: 'i-heroicons-exclamation-triangle',
    })
  } finally {
    isSaving.value = false
  }
}

// Handle avatar upload
const handleAvatarUpload = () => {
  // Create a file input element
  const fileInput = document.createElement('input')
  fileInput.type = 'file'
  fileInput.accept = 'image/*'

  // Handle file selection
  fileInput.onchange = async event => {
    const target = event.target as HTMLInputElement
    const file = target.files?.[0]

    if (!file) return

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      useToast().add({
        title: 'File too large',
        description: 'Please select an image under 5MB',
        color: 'error',
        icon: 'i-heroicons-exclamation-triangle',
      })
      return
    }

    try {
      // Show loading state
      isSaving.value = true

      // Use the user store to upload the avatar
      const result = await userStore.uploadAvatar(file)

      if (!result.success) {
        throw new Error(result.error || 'Failed to upload avatar')
      }

      // Update the form with the new avatar URL
      if (result.data?.avatarUrl) {
        form.value.avatar = result.data.avatarUrl

        // The user store is already updated by the uploadAvatar function

        useToast().add({
          title: 'Avatar updated',
          description: 'Your profile photo has been updated',
          color: 'primary',
          icon: 'i-heroicons-check-circle',
        })
      }
    } catch (err) {
      console.error('Error uploading avatar:', err)
      useToast().add({
        title: 'Upload failed',
        description: 'Please try again',
        color: 'error',
        icon: 'i-heroicons-exclamation-triangle',
      })
    } finally {
      isSaving.value = false
    }
  }

  // Trigger the file input click
  fileInput.click()
}

// Lifecycle
onMounted(async () => {
  await fetchProfile()
})
</script>
