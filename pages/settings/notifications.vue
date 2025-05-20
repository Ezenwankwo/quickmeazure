<template>
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
      
      <UFormGroup label="SMS Notifications">
        <UToggle v-model="notifications.sms" />
      </UFormGroup>
      
      <div class="flex justify-end">
        <UButton 
          color="primary" 
          @click="updateNotifications" 
          :loading="notificationsSaving"
        >
          Save Preferences
        </UButton>
      </div>
    </div>
  </UCard>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';

const notifications = ref({
  email: true,
  push: true,
  sms: false,
});

const notificationsSaving = ref(false);

// Load notification preferences
onMounted(() => {
  // Load from localStorage or API
  const savedNotifications = localStorage.getItem('notificationPreferences');
  if (savedNotifications) {
    try {
      notifications.value = JSON.parse(savedNotifications);
    } catch (e) {
      console.error('Error loading notification preferences:', e);
    }
  }
});

// Update notification preferences
const updateNotifications = () => {
  try {
    notificationsSaving.value = true;
    // Save to localStorage or API
    localStorage.setItem('notificationPreferences', JSON.stringify(notifications.value));
    
    useToast().add({
      title: 'Preferences saved',
      icon: 'i-heroicons-check-circle',
    });
  } catch (error) {
    console.error('Error saving notification preferences:', error);
    useToast().add({
      title: 'Error saving preferences',
      description: error.message || 'Please try again',
      color: 'red',
      icon: 'i-heroicons-exclamation-triangle',
    });
  } finally {
    notificationsSaving.value = false;
  }
};
</script>
