<template>
  <div class="space-y-6">
    <!-- Profile Settings -->
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
          <UButton color="primary" @click="updateProfile" :loading="profileSaving">
            Save Changes
          </UButton>
        </div>
      </div>
    </UCard>
  </div>
</template>

<script setup>
const { user } = useAuth();
const toast = useToast();
const profileSaving = ref(false);
const loading = ref(true);

// Profile data
const profileData = ref({
  name: '',
  email: ''
});

// Business data
const businessData = ref({
  phone: '',
  shopName: '',
  businessType: '',
  yearsInBusiness: 0,
  businessDescription: '',
  address: '',
  city: '',
  state: '',
  specializations: [],
  services: []
});

// Load profile data
onMounted(async () => {
  loading.value = true;
  
  try {
    const response = await $fetch('/api/profile');
    
    if (response && response.user) {
      profileData.value = {
        name: response.user.name || '',
        email: response.user.email || ''
      };
      
      if (response.business) {
        businessData.value = {
          phone: response.business.phone || '',
          shopName: response.business.shopName || '',
          businessType: response.business.businessType || '',
          yearsInBusiness: response.business.yearsInBusiness || 0,
          businessDescription: response.business.businessDescription || '',
          address: response.business.address || '',
          city: response.business.city || '',
          state: response.business.state || '',
          specializations: response.business.specializations || [],
          services: response.business.services || []
        };
      }
    }
  } catch (error) {
    toast.add({
      title: 'Error',
      description: 'Failed to load profile data',
      color: 'red'
    });
  } finally {
    loading.value = false;
  }
});

// Update profile
const updateProfile = async () => {
  profileSaving.value = true;
  
  try {
    const response = await $fetch('/api/profile', {
      method: 'PUT',
      body: {
        ...profileData.value,
        business: businessData.value
      }
    });
    
    toast.add({
      title: 'Success',
      description: 'Profile updated successfully',
      color: 'green'
    });
  } catch (error) {
    toast.add({
      title: 'Error',
      description: error.message || 'Failed to update profile',
      color: 'red'
    });
  } finally {
    profileSaving.value = false;
  }
};
</script>
