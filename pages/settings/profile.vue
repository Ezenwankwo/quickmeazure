<template>
  <UCard>
    <template #header>
      <h2 class="text-lg font-semibold text-gray-900">Profile</h2>
    </template>

    <div class="space-y-4">
      <UFormGroup label="Full Name">
        <UInput v-model="profileData.name" placeholder="Your full name" />
      </UFormGroup>

      <UFormGroup label="Email">
        <UInput v-model="profileData.email" type="email" placeholder="Your email" />
      </UFormGroup>

      <UFormGroup label="Phone Number">
        <UInput v-model="businessData.phone" type="tel" placeholder="Your phone number" />
      </UFormGroup>

      <div class="flex justify-end">
        <UButton color="primary" :loading="profileSaving" @click="updateProfile">
          Save Changes
        </UButton>
      </div>
    </div>
  </UCard>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

const profileData = ref({
  name: '',
  email: '',
})

const businessData = ref({
  phone: '',
})

const profileSaving = ref(false)

// Load profile data
onMounted(async () => {
  try {
    // TODO: Load user profile data from API
    // const { data } = await useFetch('/api/user/profile');
    // if (data.value) {
    //   profileData.value = data.value;
    // }
  } catch (error) {
    console.error('Error loading profile:', error)
  }
})

// Update profile
const updateProfile = async () => {
  try {
    profileSaving.value = true
    // TODO: Update user profile via API
    // await $fetch('/api/user/profile', {
    //   method: 'PUT',
    //   body: profileData.value
    // });
    useToast().add({
      title: 'Profile updated',
      icon: 'i-heroicons-check-circle',
    })
  } catch (error) {
    console.error('Error updating profile:', error)
    useToast().add({
      title: 'Error updating profile',
      description: error.message || 'Please try again',
      color: 'red',
      icon: 'i-heroicons-exclamation-triangle',
    })
  } finally {
    profileSaving.value = false
  }
}
</script>
