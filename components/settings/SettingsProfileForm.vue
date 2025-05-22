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
          <img
            v-if="form.avatar"
            :src="form.avatar"
            alt="Profile"
            class="h-16 w-16 rounded-full object-cover"
          />
          <div v-else class="h-16 w-16 rounded-full bg-gray-200 flex items-center justify-center">
            <UIcon name="i-heroicons-user" class="h-8 w-8 text-gray-400" />
          </div>
          
          <UButton
            color="gray"
            variant="soft"
            @click="handleAvatarUpload"
          >
            Change avatar
          </UButton>
        </div>

        <!-- Name -->
        <UFormGroup label="Name" name="name">
          <UInput v-model="form.name" placeholder="Your full name" />
        </UFormGroup>

        <!-- Email -->
        <UFormGroup label="Email" name="email">
          <UInput v-model="form.email" type="email" placeholder="your.email@example.com" />
        </UFormGroup>

        <!-- Business Name -->
        <UFormGroup label="Business Name" name="businessName">
          <UInput v-model="form.businessName" placeholder="Your business name" />
        </UFormGroup>

        <!-- Phone -->
        <UFormGroup label="Phone" name="phone">
          <UInput v-model="form.phone" placeholder="Your phone number" />
        </UFormGroup>

        <!-- Specializations -->
        <UFormGroup label="Specializations" name="specializations" help="Select your areas of specialization">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <UCheckbox
              v-for="specialization in specializationOptions"
              :key="specialization.value"
              v-model="form.specializations"
              :value="specialization.value"
              :label="specialization.label"
              class="p-2 rounded-lg hover:bg-gray-50"
            />
          </div>
        </UFormGroup>

        <!-- Services -->
        <UFormGroup label="Services" name="services" help="Select the services you provide">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <UCheckbox
              v-for="service in services"
              :key="service.id"
              v-model="form.services"
              :value="service.id"
              :label="service.name"
              class="p-2 rounded-lg hover:bg-gray-50"
            />
          </div>
        </UFormGroup>

        <!-- Bio -->
        <UFormGroup label="Bio" name="bio" help="Brief description for your profile">
          <UTextarea v-model="form.bio" placeholder="Tell us a little about yourself" />
        </UFormGroup>

        <!-- Form Actions -->
        <div class="flex justify-end pt-6">
          <UButton 
            type="submit" 
            :loading="isSaving"
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
import { ref, onMounted } from 'vue';

// Form state
const form = ref({
  name: '',
  email: '',
  businessName: '',
  phone: '',
  specializations: [],
  services: [],
  bio: '',
  avatar: '',
});

// Specialization options
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
];

// Service options
const services = [
  { id: 'custom_design', name: 'Custom Design' },
  { id: 'alterations', name: 'Alterations' },
  { id: 'repairs', name: 'Repairs' },
  { id: 'measurements', name: 'Measurements' },
  { id: 'consultation', name: 'Consultation' },
  { id: 'rush_orders', name: 'Rush Orders' }
];

const isSaving = ref(false);

// Fetch profile data
const fetchProfile = async () => {
  try {
    const { data } = await useFetch('/api/user/profile');
    
    if (data.value) {
      form.value = {
        ...form.value,
        ...data.value,
      };
    }
  } catch (err) {
    console.error('Error fetching profile:', err);
    useToast().add({
      title: 'Error loading profile',
      description: 'Please try refreshing the page',
      color: 'red',
      icon: 'i-heroicons-exclamation-triangle',
    });
  }
};

// Save profile
const saveProfile = async () => {
  isSaving.value = true;
  
  try {
    const { data, error } = await useFetch('/api/user/profile', {
      method: 'PUT',
      body: form.value,
    });
    
    if (error.value) {
      throw new Error(error.value.message || 'Failed to update profile');
    }
    
    useToast().add({
      title: 'Profile updated',
      description: 'Your profile information has been saved',
      icon: 'i-heroicons-check-circle',
      color: 'green',
    });
  } catch (err) {
    console.error('Error saving profile:', err);
    useToast().add({
      title: 'Error saving profile',
      description: 'Please try again',
      color: 'red',
      icon: 'i-heroicons-exclamation-triangle',
    });
  } finally {
    isSaving.value = false;
  }
};

// Handle avatar upload
const handleAvatarUpload = () => {
  // This would typically open a file picker and handle the upload
  // For now, we'll just show a toast
  useToast().add({
    title: 'Avatar upload',
    description: 'This feature is not implemented yet',
    color: 'blue',
    icon: 'i-heroicons-information-circle',
  });
};

// Lifecycle
onMounted(async () => {
  await fetchProfile();
});
</script>
