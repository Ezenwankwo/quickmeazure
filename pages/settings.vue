<template>
  <div class="space-y-6">
    <!-- Page Header -->
    <PageHeader title="Settings" />

    <!-- Settings Sections -->
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

      <!-- Notification Preferences -->
      <UCard>
        <template #header>
          <h2 class="text-lg font-semibold text-gray-900">Notification Preferences</h2>
        </template>
        
        <div class="space-y-4">
          <UFormGroup label="Email Notifications">
            <UToggle v-model="notifications.email" />
          </UFormGroup>
          
          <UFormGroup label="Push Notifications">
            <UToggle v-model="notifications.push" />
          </UFormGroup>
          
          <div class="flex justify-end">
            <UButton color="primary" @click="updateNotifications" :loading="notificationsSaving">
              Save Preferences
            </UButton>
          </div>
        </div>
      </UCard>

      <!-- Security Settings -->
      <UCard>
        <template #header>
          <h2 class="text-lg font-semibold text-gray-900">Security</h2>
        </template>
        
        <div class="space-y-4">
          <UFormGroup label="Change Password">
            <div class="space-y-4">
              <UInput 
                v-model="security.currentPassword" 
                type="password" 
                placeholder="Current password" 
                help="Enter your current password"
              />
              <UInput 
                v-model="security.newPassword" 
                type="password" 
                placeholder="New password" 
                help="Enter your new password"
              />
              <UInput 
                v-model="security.confirmPassword" 
                type="password" 
                placeholder="Confirm new password" 
                :color="passwordsMatch ? undefined : 'red'"
                :help="passwordsMatch ? 'Confirm your new password' : 'Passwords do not match'"
              />
            </div>
          </UFormGroup>
          
          <div class="flex justify-end">
            <UButton 
              color="primary" 
              @click="updatePassword" 
              :loading="passwordSaving"
              :disabled="!canUpdatePassword"
            >
              Update Password
            </UButton>
          </div>
        </div>
      </UCard>
    </div>
  </div>
</template>

<script setup>
import PageHeader from '~/components/PageHeader.vue';

const { user } = useAuth();
const toast = useToast();
const profileSaving = ref(false);
const notificationsSaving = ref(false);
const passwordSaving = ref(false);
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

// Notification preferences
const notifications = ref({
  email: true,
  push: true
});

// Security settings
const security = ref({
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
});

// Load profile data and saved preferences
onMounted(async () => {
  loading.value = true;
  
  // Load saved notification preferences from localStorage if available
  try {
    const savedNotifications = localStorage.getItem('userNotifications');
    if (savedNotifications) {
      const parsedNotifications = JSON.parse(savedNotifications);
      notifications.value = {
        email: parsedNotifications.email,
        push: parsedNotifications.push
      };
    }
  } catch (error) {
    console.error('Error loading saved notification preferences:', error);
  }
  
  // Load profile data
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

// Methods
const updateProfile = async () => {
  profileSaving.value = true;
  try {
    // Update user profile
    await $fetch('/api/profile', {
      method: 'PUT',
      body: {
        name: profileData.value.name,
        email: profileData.value.email
      }
    });
    
    // Update business profile
    await $fetch('/api/business-profile', {
      method: 'PUT',
      body: {
        shopName: businessData.value.shopName,
        businessType: businessData.value.businessType,
        yearsInBusiness: businessData.value.yearsInBusiness,
        businessDescription: businessData.value.businessDescription,
        phone: businessData.value.phone,
        address: businessData.value.address,
        city: businessData.value.city,
        state: businessData.value.state,
        specializations: businessData.value.specializations,
        services: businessData.value.services
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
      description: 'Failed to update profile',
      color: 'red'
    });
  } finally {
    profileSaving.value = false;
  }
};

const updateNotifications = async () => {
  notificationsSaving.value = true;
  try {
    // Update user profile with notification preferences
    await $fetch('/api/profile', {
      method: 'PUT',
      body: {
        name: profileData.value.name,
        email: profileData.value.email,
        notifications: {
          email: notifications.value.email,
          push: notifications.value.push
        }
      }
    });
    
    // Store in localStorage for persistence between page refreshes
    localStorage.setItem('userNotifications', JSON.stringify({
      email: notifications.value.email,
      push: notifications.value.push
    }));
    
    // Update the user object if available
    if (user.value) {
      user.value.notifications = {
        email: notifications.value.email,
        push: notifications.value.push
      };
    }
    
    toast.add({
      title: 'Success',
      description: 'Notification preferences updated',
      color: 'green'
    });
  } catch (error) {
    toast.add({
      title: 'Error',
      description: 'Failed to update notification preferences',
      color: 'red'
    });
  } finally {
    notificationsSaving.value = false;
  }
};

const updatePassword = async () => {
  if (security.value.newPassword !== security.value.confirmPassword) {
    toast.add({
      title: 'Error',
      description: 'Passwords do not match',
      color: 'red'
    });
    return;
  }

  passwordSaving.value = true;
  try {
    // Update user profile with new password
    const response = await $fetch('/api/profile', {
      method: 'PUT',
      body: {
        name: profileData.value.name,
        email: profileData.value.email,
        currentPassword: security.value.currentPassword,
        newPassword: security.value.newPassword
      }
    });
    
    if (response.success) {
      toast.add({
        title: 'Success',
        description: 'Password updated successfully',
        color: 'green'
      });
      
      security.value = {
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      };
    }
  } catch (error) {
    // Handle specific error cases
    const errorMessage = error.response?.data?.message || error.message || 'Failed to update password';
    
    if (errorMessage.includes('Current password is incorrect')) {
      toast.add({
        title: 'Error',
        description: 'Your current password is incorrect',
        color: 'red'
      });
    } else {
      toast.add({
        title: 'Error',
        description: errorMessage,
        color: 'red'
      });
    }
  } finally {
    passwordSaving.value = false;
  }
};

// Computed properties for password validation
const passwordsMatch = computed(() => {
  return !security.value.confirmPassword || 
    security.value.newPassword === security.value.confirmPassword;
});

const canUpdatePassword = computed(() => {
  return security.value.currentPassword && 
    security.value.newPassword && 
    security.value.confirmPassword && 
    security.value.newPassword === security.value.confirmPassword;
});
</script> 