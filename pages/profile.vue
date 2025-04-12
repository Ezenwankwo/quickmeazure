<template>
  <div class="min-h-screen bg-gray-50">
    <PageHeader title="Profile" />
    
    <div>
      <UCard class="overflow-hidden">
        <!-- Profile Header -->
        <template #header>
          <div class="flex items-center space-x-6">
            <UAvatar
              :text="userInitials"
              size="xl"
              class="bg-primary-100 text-primary-600 ring-4 ring-white"
            />
            <div>
              <h3 class="text-xl font-semibold text-gray-900">
                {{ user.name }}
              </h3>
              <p class="text-sm text-gray-500">
                {{ user.shopName }}
              </p>
              <div class="mt-2 flex items-center space-x-2">
                <UBadge
                  v-if="user.businessType"
                  :label="businessTypes.find(t => t.value === user.businessType)?.label"
                  color="primary"
                  variant="soft"
                />
                <UBadge
                  v-if="user.yearsInBusiness"
                  :label="`${user.yearsInBusiness} years experience`"
                  color="gray"
                  variant="soft"
                />
              </div>
            </div>
          </div>
        </template>

        <div class="grid grid-cols-1 gap-8 sm:grid-cols-2">
          <!-- Business Information -->
          <div class="space-y-6">
            <div class="flex items-center space-x-2">
              <UIcon name="i-heroicons-building-storefront" class="text-primary-500" />
              <h4 class="text-lg font-medium text-gray-900">Business Information</h4>
            </div>
            <div class="space-y-4">
              <UFormGroup label="Shop Name">
                <UInput
                  v-model="user.shopName"
                  placeholder="Enter your shop name"
                  icon="i-heroicons-building-storefront"
                />
              </UFormGroup>

              <UFormGroup label="Business Type">
                <USelect
                  v-model="user.businessType"
                  :options="businessTypes"
                  placeholder="Select business type"
                  icon="i-heroicons-briefcase"
                />
              </UFormGroup>

              <UFormGroup label="Years in Business">
                <UInput
                  v-model="user.yearsInBusiness"
                  type="number"
                  placeholder="Enter years in business"
                  icon="i-heroicons-calendar"
                />
              </UFormGroup>

              <UFormGroup label="Business Description">
                <UTextarea
                  v-model="user.businessDescription"
                  placeholder="Tell clients about your business, your style, and what makes you unique"
                  :rows="3"
                  icon="i-heroicons-document-text"
                />
              </UFormGroup>
            </div>
          </div>

          <!-- Contact Information -->
          <div class="space-y-6">
            <div class="flex items-center space-x-2">
              <UIcon name="i-heroicons-envelope" class="text-primary-500" />
              <h4 class="text-lg font-medium text-gray-900">Contact Information</h4>
            </div>
            <div class="space-y-4">
              <UFormGroup label="Email">
                <UInput
                  v-model="user.email"
                  type="email"
                  placeholder="Enter your email"
                  icon="i-heroicons-envelope"
                  disabled
                />
              </UFormGroup>

              <UFormGroup label="Phone Number">
                <UInput
                  v-model="user.phone"
                  type="tel"
                  placeholder="Enter your phone number"
                  icon="i-heroicons-phone"
                />
              </UFormGroup>

              <UFormGroup label="Location">
                <div class="grid grid-cols-2 gap-4">
                  <UInput
                    v-model="user.location.city"
                    placeholder="City"
                    icon="i-heroicons-map"
                  />
                  <UInput
                    v-model="user.location.state"
                    placeholder="State"
                    icon="i-heroicons-map"
                  />
                </div>
                <UInput
                  v-model="user.location.address"
                  placeholder="Full Address"
                  class="mt-2"
                  icon="i-heroicons-map-pin"
                />
              </UFormGroup>
            </div>
          </div>

          <!-- Specializations -->
          <div class="space-y-6">
            <div class="flex items-center space-x-2">
              <UIcon name="i-heroicons-star" class="text-primary-500" />
              <h4 class="text-lg font-medium text-gray-900">Specializations</h4>
            </div>
            <div class="space-y-4">
              <UFormGroup>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <UCheckbox
                    v-for="specialization in specializationOptions"
                    :key="specialization.value"
                    v-model="user.specializations"
                    :value="specialization.value"
                    :label="specialization.label"
                    class="p-2 rounded-lg hover:bg-gray-50"
                  />
                </div>
              </UFormGroup>
            </div>
          </div>

          <!-- Services -->
          <div class="space-y-6">
            <div class="flex items-center space-x-2">
              <UIcon name="i-heroicons-wrench-screwdriver" class="text-primary-500" />
              <h4 class="text-lg font-medium text-gray-900">Services</h4>
            </div>
            <div class="space-y-4">
              <UFormGroup>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <UCheckbox
                    v-for="service in services"
                    :key="service.id"
                    v-model="user.services"
                    :value="service.id"
                    :label="service.name"
                    class="p-2 rounded-lg hover:bg-gray-50"
                  />
                </div>
              </UFormGroup>
            </div>
          </div>
        </div>

        <template #footer>
          <div class="flex justify-end space-x-4">
            <UButton
              color="gray"
              variant="soft"
              @click="resetForm"
            >
              Reset
            </UButton>
            <UButton
              color="primary"
              @click="saveProfile"
              :loading="saving"
            >
              Save Changes
            </UButton>
          </div>
        </template>
      </UCard>
    </div>

    <!-- Notifications -->
    <UNotifications />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import type { NuxtApp } from 'nuxt/app'

// Extend the NuxtApp type to include toast functionality
declare module 'nuxt/app' {
  interface NuxtApp {
    $toast: {
      add: (options: {
        severity: 'success' | 'error' | 'info' | 'warn';
        summary: string;
        detail: string;
        life?: number;
      }) => void;
    };
  }
}

const saving = ref(false)
const loading = ref(true)
const error = ref('')

const businessTypes = [
  { label: 'Boutique', value: 'boutique' },
  { label: 'Studio', value: 'studio' },
  { label: 'Home-based', value: 'home-based' },
  { label: 'Fashion House', value: 'fashion-house' }
]

const specializationOptions = [
  { label: 'Menswear', value: 'menswear' },
  { label: 'Womenswear', value: 'womenswear' },
  { label: 'Bridal', value: 'bridal' },
  { label: 'Formal Wear', value: 'formal' },
  { label: 'Casual Wear', value: 'casual' },
  { label: 'Children\'s Clothing', value: 'children' },
  { label: 'Alterations', value: 'alterations' },
  { label: 'Custom Designs', value: 'custom' },
  { label: 'Traditional Attire', value: 'traditional' },
  { label: 'Uniforms', value: 'uniforms' }
]

const services = [
  { id: 'custom_design', name: 'Custom Design' },
  { id: 'alterations', name: 'Alterations' },
  { id: 'repairs', name: 'Repairs' },
  { id: 'measurements', name: 'Measurements' },
  { id: 'consultation', name: 'Consultation' },
  { id: 'rush_orders', name: 'Rush Orders' }
]

const defaultUser = {
  name: '',
  email: '',
  phone: '',
  shopName: '',
  businessType: 'boutique',
  yearsInBusiness: 0,
  businessDescription: '',
  location: {
    address: '',
    city: '',
    state: ''
  },
  specializations: [],
  services: []
}

const user = ref({ ...defaultUser })

const userInitials = computed(() => {
  return user.value.name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
})

const fetchProfile = async () => {
  try {
    loading.value = true;
    const response = await $fetch('/api/profile');
    // Map the API response to our user object structure
    user.value = {
      ...user.value,
      name: response.user.name,
      email: response.user.email,
      shopName: response.business?.shopName || '',
      businessType: response.business?.businessType || 'boutique',
      yearsInBusiness: response.business?.yearsInBusiness || 0,
      businessDescription: response.business?.businessDescription || '',
      phone: response.business?.phone || '',
      location: {
        address: response.business?.address || '',
        city: response.business?.city || '',
        state: response.business?.state || ''
      },
      specializations: response.business?.specializations || [],
      services: response.business?.services || []
    };
  } catch (err: any) {
    error.value = err.message || 'Failed to load profile';
    // Show error notification
    useToast().add({
      title: 'Error',
      description: error.value,
      color: 'red',
      icon: 'i-heroicons-exclamation-circle'
    });
  } finally {
    loading.value = false;
  }
};

const resetForm = () => {
  user.value = { ...defaultUser }
}

const saveProfile = async () => {
  saving.value = true
  try {
    const { data } = await useFetch('/api/business-profile', {
      method: 'PUT',
      body: {
        shopName: user.value.shopName,
        businessType: user.value.businessType,
        yearsInBusiness: user.value.yearsInBusiness,
        businessDescription: user.value.businessDescription,
        phone: user.value.phone,
        address: user.value.location.address,
        city: user.value.location.city,
        state: user.value.location.state,
        specializations: user.value.specializations,
        services: user.value.services
      }
    })

    if (data.value?.success) {
      const response = data.value.data
      // Update the user object with the response data
      user.value = {
        ...user.value,
        shopName: response.shopName || '',
        businessType: response.businessType || 'boutique',
        yearsInBusiness: response.yearsInBusiness || 0,
        businessDescription: response.businessDescription || '',
        phone: response.phone || '',
        location: {
          address: response.address || '',
          city: response.city || '',
          state: response.state || ''
        },
        specializations: response.specializations || [],
        services: response.services || []
      }
      
      useToast().add({
        title: 'Success',
        description: 'Profile updated successfully',
        color: 'green'
      })
    }
  } catch (error: any) {
    useToast().add({
      title: 'Error',
      description: error.message || 'Failed to update profile',
      color: 'red'
    })
  } finally {
    saving.value = false
  }
}

onMounted(() => {
  fetchProfile();
});
</script> 