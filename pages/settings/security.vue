<template>
  <UCard>
    <template #header>
      <h2 class="text-lg font-semibold text-gray-900">Security</h2>
    </template>

    <div class="space-y-6">
      <!-- Change Password -->
      <div class="space-y-4 pb-6 border-b border-gray-200">
        <h3 class="text-md font-medium text-gray-900">Change Password</h3>

        <UFormGroup label="Current Password">
          <UInput
            v-model="security.currentPassword"
            type="password"
            placeholder="Enter current password"
          />
        </UFormGroup>

        <UFormGroup label="New Password">
          <UInput v-model="security.newPassword" type="password" placeholder="Enter new password" />
        </UFormGroup>

        <UFormGroup
          label="Confirm New Password"
          :error="!passwordsMatch ? 'Passwords do not match' : ''"
        >
          <UInput
            v-model="security.confirmPassword"
            type="password"
            placeholder="Confirm new password"
            :ui="{
              input: {
                color: {
                  red: 'ring-red-500 dark:ring-red-400',
                },
              },
            }"
            :class="{
              'ring-1 ring-red-500 dark:ring-red-400': !passwordsMatch && security.confirmPassword,
            }"
          />
        </UFormGroup>

        <div class="flex justify-end">
          <UButton
            color="primary"
            :loading="passwordSaving"
            :disabled="!passwordsMatch || !security.newPassword || !security.confirmPassword"
            @click="updatePassword"
          >
            Update Password
          </UButton>
        </div>
      </div>

      <!-- Two-Factor Authentication -->
      <div class="space-y-4">
        <h3 class="text-md font-medium text-gray-900">Two-Factor Authentication</h3>

        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-gray-700">Two-factor authentication</p>
            <p class="text-sm text-gray-500">Add an extra layer of security to your account</p>
          </div>
          <UToggle v-model="twoFactorEnabled" />
        </div>

        <div v-if="twoFactorEnabled" class="mt-4 p-4 bg-blue-50 rounded-lg">
          <h4 class="text-sm font-medium text-blue-800">Set up two-factor authentication</h4>
          <p class="mt-1 text-sm text-blue-700">
            Scan the QR code with your authenticator app or enter the code manually.
          </p>

          <div class="mt-4 flex items-start space-x-6">
            <!-- QR Code Placeholder -->
            <div class="flex-shrink-0 p-2 bg-white rounded border border-gray-200">
              <div class="w-32 h-32 flex items-center justify-center bg-gray-100 text-gray-400">
                <UIcon name="i-heroicons-qr-code" class="w-20 h-20" />
              </div>
            </div>

            <div class="space-y-4">
              <div>
                <p class="text-sm font-medium text-gray-700">
                  Enter this code in your authenticator app:
                </p>
                <div
                  class="mt-1 px-3 py-2 bg-white border border-gray-300 rounded-md text-sm font-mono"
                >
                  JBSWY3DPEHPK3PXP
                </div>
              </div>

              <div>
                <p class="text-sm font-medium text-gray-700">Or enter this code manually:</p>
                <p class="mt-1 text-sm font-mono text-gray-600">JBSW Y3DP EHPK 3PXP</p>
              </div>
            </div>
            <UButton size="sm" color="white"> Copy code </UButton>
          </div>
        </div>
      </div>
    </div>
  </UCard>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

const security = ref({
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
})

const twoFactorEnabled = ref(false)
const passwordSaving = ref(false)

// Check if passwords match
const passwordsMatch = computed(() => {
  return (
    !security.value.confirmPassword || security.value.newPassword === security.value.confirmPassword
  )
})

// Update password
const updatePassword = async () => {
  if (!passwordsMatch.value) return

  try {
    passwordSaving.value = true

    // TODO: Call API to update password
    // await $fetch('/api/user/update-password', {
    //   method: 'POST',
    //   body: {
    //     currentPassword: security.value.currentPassword,
    //     newPassword: security.value.newPassword
    //   }
    // });

    // Reset form
    security.value = {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    }

    useToast().add({
      title: 'Password updated',
      icon: 'i-heroicons-check-circle',
    })
  } catch (error) {
    console.error('Error updating password:', error)
    useToast().add({
      title: 'Error updating password',
      description: error.message || 'Please check your current password and try again',
      color: 'red',
      icon: 'i-heroicons-exclamation-triangle',
    })
  } finally {
    passwordSaving.value = false
  }
}
</script>
