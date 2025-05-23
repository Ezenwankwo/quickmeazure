<template>
  <div class="space-y-6">
    <UCard>
      <template #header>
        <div class="flex items-center">
          <UIcon name="i-heroicons-bell" class="mr-2 text-primary-500 h-5 w-5" />
          <h2 class="text-xl font-semibold text-gray-900">Notification Preferences</h2>
        </div>
        <p class="mt-1 text-sm text-gray-500">
          Manage how and when you receive notifications from the platform.
        </p>
      </template>

      <UForm :state="form" class="space-y-6" @submit="saveSettings">
        <!-- Email Notifications -->
        <div>
          <h3 class="text-base font-medium text-gray-900 mb-4">Email Notifications</h3>

          <div class="space-y-4">
            <UFormGroup>
              <UToggle v-model="form.emailNotifications.orders" name="emailOrders">
                <div class="ml-3">
                  <span class="text-sm font-medium text-gray-900">Order Updates</span>
                  <p class="text-xs text-gray-500">
                    Receive email notifications about order status changes
                  </p>
                </div>
              </UToggle>
            </UFormGroup>

            <UFormGroup>
              <UToggle v-model="form.emailNotifications.clients" name="emailClients">
                <div class="ml-3">
                  <span class="text-sm font-medium text-gray-900">Client Activity</span>
                  <p class="text-xs text-gray-500">
                    Receive email notifications when clients take actions
                  </p>
                </div>
              </UToggle>
            </UFormGroup>

            <UFormGroup>
              <UToggle v-model="form.emailNotifications.marketing" name="emailMarketing">
                <div class="ml-3">
                  <span class="text-sm font-medium text-gray-900">Marketing & Promotions</span>
                  <p class="text-xs text-gray-500">Receive promotional emails and special offers</p>
                </div>
              </UToggle>
            </UFormGroup>
          </div>
        </div>

        <!-- In-App Notifications -->
        <div class="pt-6 border-t border-gray-200">
          <h3 class="text-base font-medium text-gray-900 mb-4">In-App Notifications</h3>

          <div class="space-y-4">
            <UFormGroup>
              <UToggle v-model="form.appNotifications.orders" name="appOrders">
                <div class="ml-3">
                  <span class="text-sm font-medium text-gray-900">Order Updates</span>
                  <p class="text-xs text-gray-500">
                    Receive in-app notifications about order status changes
                  </p>
                </div>
              </UToggle>
            </UFormGroup>

            <UFormGroup>
              <UToggle v-model="form.appNotifications.clients" name="appClients">
                <div class="ml-3">
                  <span class="text-sm font-medium text-gray-900">Client Activity</span>
                  <p class="text-xs text-gray-500">
                    Receive in-app notifications when clients take actions
                  </p>
                </div>
              </UToggle>
            </UFormGroup>

            <UFormGroup>
              <UToggle v-model="form.appNotifications.system" name="appSystem">
                <div class="ml-3">
                  <span class="text-sm font-medium text-gray-900">System Notifications</span>
                  <p class="text-xs text-gray-500">
                    Receive in-app notifications about system updates and maintenance
                  </p>
                </div>
              </UToggle>
            </UFormGroup>
          </div>
        </div>

        <!-- Form Actions -->
        <div class="flex justify-end pt-6 border-t border-gray-200">
          <UButton
type="submit"
:loading="isSaving"
icon="i-heroicons-check"
color="primary">
            Save Changes
          </UButton>
        </div>
      </UForm>
    </UCard>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

// Form state
const form = ref({
  emailNotifications: {
    orders: true,
    clients: true,
    marketing: false,
  },
  appNotifications: {
    orders: true,
    clients: true,
    system: true,
  },
})

const isSaving = ref(false)

// Fetch notification settings
const fetchSettings = async () => {
  try {
    const { data } = await useFetch('/api/user/notification-settings')

    if (data.value) {
      form.value = {
        ...form.value,
        ...data.value,
      }
    }
  } catch (err) {
    console.error('Error fetching notification settings:', err)
    useToast().add({
      title: 'Error loading settings',
      description: 'Please try refreshing the page',
      color: 'red',
      icon: 'i-heroicons-exclamation-triangle',
    })
  }
}

// Save notification settings
const saveSettings = async () => {
  isSaving.value = true

  try {
    const { _data, error } = await useFetch('/api/user/notification-settings', {
      method: 'PUT',
      body: form.value,
    })

    if (error.value) {
      throw new Error(error.value.message || 'Failed to update notification settings')
    }

    useToast().add({
      title: 'Notification preferences saved',
      description: 'Your notification settings have been updated',
      icon: 'i-heroicons-check-circle',
      color: 'green',
    })
  } catch (err) {
    console.error('Error saving notification settings:', err)
    useToast().add({
      title: 'Error saving settings',
      description: 'Please try again',
      color: 'red',
      icon: 'i-heroicons-exclamation-triangle',
    })
  } finally {
    isSaving.value = false
  }
}

// Lifecycle
onMounted(async () => {
  await fetchSettings()
})
</script>
