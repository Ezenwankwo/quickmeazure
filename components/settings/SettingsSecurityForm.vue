<template>
  <div class="space-y-6">
    <UCard>
      <template #header>
        <div class="flex items-center">
          <UIcon name="i-heroicons-shield-check" class="mr-2 text-primary-500 h-5 w-5" />
          <h2 class="text-xl font-semibold text-gray-900">Security Settings</h2>
        </div>
        <p class="mt-1 text-sm text-gray-500">
          Manage your account security and authentication settings.
        </p>
      </template>

      <div class="space-y-6">
        <!-- Password Section -->
        <div>
          <h3 class="text-base font-medium text-gray-900 mb-4">Password</h3>
          
          <UForm :state="passwordForm" class="space-y-4" @submit="updatePassword">
            <UFormGroup label="Current Password" name="currentPassword">
              <UInput 
                v-model="passwordForm.currentPassword" 
                type="password" 
                placeholder="Enter your current password" 
              />
            </UFormGroup>
            
            <UFormGroup label="New Password" name="newPassword">
              <UInput 
                v-model="passwordForm.newPassword" 
                type="password" 
                placeholder="Enter a new password" 
              />
            </UFormGroup>
            
            <UFormGroup label="Confirm New Password" name="confirmPassword">
              <UInput 
                v-model="passwordForm.confirmPassword" 
                type="password" 
                placeholder="Confirm your new password" 
              />
            </UFormGroup>
            
            <div class="flex justify-end">
              <UButton 
                type="submit" 
                :loading="isUpdatingPassword"
                color="primary"
              >
                Update Password
              </UButton>
            </div>
          </UForm>
        </div>
        
        <!-- Two-Factor Authentication -->
        <div class="pt-6 border-t border-gray-200">
          <div class="flex items-center justify-between mb-4">
            <div>
              <h3 class="text-base font-medium text-gray-900">Two-Factor Authentication</h3>
              <p class="text-sm text-gray-500 mt-1">
                Add an extra layer of security to your account by requiring a verification code.
              </p>
            </div>
            <UToggle v-model="twoFactorEnabled" @change="toggleTwoFactor" />
          </div>
          
          <div v-if="twoFactorEnabled" class="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <p class="text-sm text-gray-700 mb-3">
              Two-factor authentication is currently <span class="font-semibold text-green-600">enabled</span>.
            </p>
            <UButton 
              size="sm" 
              color="gray" 
              variant="soft"
              @click="showDisableTwoFactorModal = true"
            >
              Disable Two-Factor Authentication
            </UButton>
          </div>
          
          <div v-else class="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <p class="text-sm text-gray-700 mb-3">
              Two-factor authentication is currently <span class="font-semibold text-red-600">disabled</span>.
            </p>
            <UButton 
              size="sm" 
              color="primary" 
              variant="soft"
              @click="showEnableTwoFactorModal = true"
            >
              Enable Two-Factor Authentication
            </UButton>
          </div>
        </div>
        
        <!-- Session Management -->
        <div class="pt-6 border-t border-gray-200">
          <div class="flex items-center justify-between mb-4">
            <div>
              <h3 class="text-base font-medium text-gray-900">Active Sessions</h3>
              <p class="text-sm text-gray-500 mt-1">
                Manage your active sessions across different devices.
              </p>
            </div>
            <UButton 
              size="sm" 
              color="red" 
              variant="soft"
              icon="i-heroicons-power"
              @click="logoutAllSessions"
              :loading="isLoggingOut"
            >
              Logout All Devices
            </UButton>
          </div>
          
          <div class="mt-4 space-y-3">
            <div v-for="(session, index) in activeSessions" :key="index" class="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
              <div class="flex items-center">
                <UIcon :name="getDeviceIcon(session.device)" class="h-5 w-5 text-gray-500 mr-3" />
                <div>
                  <p class="text-sm font-medium text-gray-900">{{ session.device }}</p>
                  <p class="text-xs text-gray-500">{{ session.location }} • Last active {{ session.lastActive }}</p>
                </div>
              </div>
              <UButton 
                v-if="session.current" 
                size="xs" 
                color="green" 
                variant="soft"
                disabled
              >
                Current
              </UButton>
              <UButton 
                v-else
                size="xs" 
                color="red" 
                variant="soft"
                icon="i-heroicons-x-mark"
                @click="terminateSession(session.id)"
              >
                Terminate
              </UButton>
            </div>
          </div>
        </div>
      </div>
    </UCard>
    
    <!-- Enable 2FA Modal -->
    <UModal v-model="showEnableTwoFactorModal">
      <UCard>
        <template #header>
          <h3 class="text-lg font-semibold text-gray-900">Enable Two-Factor Authentication</h3>
        </template>
        
        <div class="space-y-4">
          <p class="text-sm text-gray-700">
            Scan the QR code below with your authenticator app to enable two-factor authentication.
          </p>
          
          <div class="flex justify-center py-4">
            <div class="h-48 w-48 bg-gray-100 flex items-center justify-center border border-gray-300 rounded-lg">
              <UIcon name="i-heroicons-qr-code" class="h-24 w-24 text-gray-400" />
            </div>
          </div>
          
          <UFormGroup label="Verification Code" help="Enter the code from your authenticator app">
            <UInput v-model="twoFactorCode" placeholder="Enter 6-digit code" />
          </UFormGroup>
        </div>
        
        <template #footer>
          <div class="flex justify-end gap-3">
            <UButton
              color="gray"
              variant="ghost"
              @click="showEnableTwoFactorModal = false"
            >
              Cancel
            </UButton>
            <UButton
              color="primary"
              :loading="isEnablingTwoFactor"
              @click="enableTwoFactor"
            >
              Verify and Enable
            </UButton>
          </div>
        </template>
      </UCard>
    </UModal>
    
    <!-- Disable 2FA Modal -->
    <UModal v-model="showDisableTwoFactorModal">
      <UCard>
        <template #header>
          <div class="flex items-center">
            <UIcon name="i-heroicons-exclamation-triangle" class="mr-2 text-yellow-500 h-5 w-5" />
            <h3 class="text-lg font-semibold text-gray-900">Disable Two-Factor Authentication</h3>
          </div>
        </template>
        
        <div class="space-y-4">
          <p class="text-sm text-gray-700">
            Are you sure you want to disable two-factor authentication? This will make your account less secure.
          </p>
          
          <UFormGroup label="Password" help="Confirm your password to continue">
            <UInput v-model="disableTwoFactorPassword" type="password" placeholder="Enter your password" />
          </UFormGroup>
        </div>
        
        <template #footer>
          <div class="flex justify-end gap-3">
            <UButton
              color="gray"
              variant="ghost"
              @click="showDisableTwoFactorModal = false"
            >
              Cancel
            </UButton>
            <UButton
              color="red"
              :loading="isDisablingTwoFactor"
              @click="disableTwoFactor"
            >
              Disable Two-Factor
            </UButton>
          </div>
        </template>
      </UCard>
    </UModal>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';

// Password form
const passwordForm = ref({
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
});

// Two-factor auth
const twoFactorEnabled = ref(false);
const twoFactorCode = ref('');
const showEnableTwoFactorModal = ref(false);
const showDisableTwoFactorModal = ref(false);
const disableTwoFactorPassword = ref('');

// Loading states
const isUpdatingPassword = ref(false);
const isEnablingTwoFactor = ref(false);
const isDisablingTwoFactor = ref(false);
const isLoggingOut = ref(false);

// Sessions
const activeSessions = ref([
  {
    id: '1',
    device: 'MacBook Pro (Chrome)',
    location: 'New York, USA',
    lastActive: 'Just now',
    current: true,
  },
  {
    id: '2',
    device: 'iPhone 13 (Safari)',
    location: 'New York, USA',
    lastActive: '2 hours ago',
    current: false,
  },
  {
    id: '3',
    device: 'Windows PC (Firefox)',
    location: 'Chicago, USA',
    lastActive: '3 days ago',
    current: false,
  },
]);

// Fetch security settings
const fetchSecuritySettings = async () => {
  try {
    // In a real app, you would fetch these from an API
    // For now, we'll just use the mock data
    twoFactorEnabled.value = false;
  } catch (err) {
    console.error('Error fetching security settings:', err);
    useToast().add({
      title: 'Error loading security settings',
      description: 'Please try refreshing the page',
      color: 'red',
      icon: 'i-heroicons-exclamation-triangle',
    });
  }
};

// Update password
const updatePassword = async () => {
  isUpdatingPassword.value = true;
  
  try {
    // Validate passwords match
    if (passwordForm.value.newPassword !== passwordForm.value.confirmPassword) {
      throw new Error('New passwords do not match');
    }
    
    // In a real app, you would call an API here
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    useToast().add({
      title: 'Password updated',
      description: 'Your password has been successfully changed',
      icon: 'i-heroicons-check-circle',
      color: 'green',
    });
    
    // Reset form
    passwordForm.value = {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    };
  } catch (err) {
    console.error('Error updating password:', err);
    useToast().add({
      title: 'Error updating password',
      description: err.message || 'Please try again',
      color: 'red',
      icon: 'i-heroicons-exclamation-triangle',
    });
  } finally {
    isUpdatingPassword.value = false;
  }
};

// Toggle two-factor auth
const toggleTwoFactor = () => {
  if (twoFactorEnabled.value) {
    showDisableTwoFactorModal.value = true;
  } else {
    showEnableTwoFactorModal.value = true;
  }
  // Reset the toggle to its previous state until the action is confirmed
  twoFactorEnabled.value = !twoFactorEnabled.value;
};

// Enable two-factor auth
const enableTwoFactor = async () => {
  isEnablingTwoFactor.value = true;
  
  try {
    // In a real app, you would call an API here
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    twoFactorEnabled.value = true;
    showEnableTwoFactorModal.value = false;
    twoFactorCode.value = '';
    
    useToast().add({
      title: 'Two-factor authentication enabled',
      description: 'Your account is now more secure',
      icon: 'i-heroicons-check-circle',
      color: 'green',
    });
  } catch (err) {
    console.error('Error enabling 2FA:', err);
    useToast().add({
      title: 'Error enabling two-factor authentication',
      description: 'Please try again',
      color: 'red',
      icon: 'i-heroicons-exclamation-triangle',
    });
  } finally {
    isEnablingTwoFactor.value = false;
  }
};

// Disable two-factor auth
const disableTwoFactor = async () => {
  isDisablingTwoFactor.value = true;
  
  try {
    // In a real app, you would call an API here
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    twoFactorEnabled.value = false;
    showDisableTwoFactorModal.value = false;
    disableTwoFactorPassword.value = '';
    
    useToast().add({
      title: 'Two-factor authentication disabled',
      description: 'Two-factor authentication has been turned off',
      icon: 'i-heroicons-check-circle',
      color: 'yellow',
    });
  } catch (err) {
    console.error('Error disabling 2FA:', err);
    useToast().add({
      title: 'Error disabling two-factor authentication',
      description: 'Please try again',
      color: 'red',
      icon: 'i-heroicons-exclamation-triangle',
    });
  } finally {
    isDisablingTwoFactor.value = false;
  }
};

// Terminate session
const terminateSession = async (sessionId) => {
  try {
    // In a real app, you would call an API here
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Remove the session from the list
    activeSessions.value = activeSessions.value.filter(session => session.id !== sessionId);
    
    useToast().add({
      title: 'Session terminated',
      description: 'The device has been logged out',
      icon: 'i-heroicons-check-circle',
      color: 'green',
    });
  } catch (err) {
    console.error('Error terminating session:', err);
    useToast().add({
      title: 'Error terminating session',
      description: 'Please try again',
      color: 'red',
      icon: 'i-heroicons-exclamation-triangle',
    });
  }
};

// Logout all sessions
const logoutAllSessions = async () => {
  isLoggingOut.value = true;
  
  try {
    // In a real app, you would call an API here
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Keep only the current session
    activeSessions.value = activeSessions.value.filter(session => session.current);
    
    useToast().add({
      title: 'All devices logged out',
      description: 'All other devices have been logged out',
      icon: 'i-heroicons-check-circle',
      color: 'green',
    });
  } catch (err) {
    console.error('Error logging out all sessions:', err);
    useToast().add({
      title: 'Error logging out devices',
      description: 'Please try again',
      color: 'red',
      icon: 'i-heroicons-exclamation-triangle',
    });
  } finally {
    isLoggingOut.value = false;
  }
};

// Get device icon
const getDeviceIcon = (device) => {
  if (device.includes('iPhone') || device.includes('iPad')) {
    return 'i-heroicons-device-phone-mobile';
  } else if (device.includes('Android')) {
    return 'i-heroicons-device-phone-mobile';
  } else if (device.includes('Mac')) {
    return 'i-heroicons-computer-desktop';
  } else {
    return 'i-heroicons-computer-desktop';
  }
};

// Lifecycle
onMounted(async () => {
  await fetchSecuritySettings();
});
</script>
