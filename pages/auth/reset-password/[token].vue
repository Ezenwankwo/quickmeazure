<template>
  <div class="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
    <div class="w-full max-w-md space-y-8">
      <div class="text-center">
        <h2 class="mt-6 text-3xl font-bold tracking-tight text-gray-900">
          Reset your password
        </h2>
        <p class="mt-2 text-sm text-gray-600">
          Enter your new password below
        </p>
      </div>

      <div class="mt-8">
        <div class="rounded-md shadow-sm">
          <div class="space-y-6">
            <UFormGroup label="New Password">
              <UInput
                v-model="password"
                type="password"
                autocomplete="new-password"
                required
                placeholder="New password"
              />
            </UFormGroup>

            <UFormGroup label="Confirm Password">
              <UInput
                v-model="confirmPassword"
                type="password"
                autocomplete="new-password"
                required
                placeholder="Confirm new password"
                :color="passwordsMatch ? undefined : 'red'"
                :help="!passwordsMatch && confirmPassword ? 'Passwords do not match' : undefined"
              />
            </UFormGroup>

            <div>
              <UButton
                type="submit"
                block
                color="primary"
                :loading="loading"
                :disabled="!canSubmit"
                @click="resetPassword"
              >
                Reset Password
              </UButton>
            </div>
            
            <div class="flex items-center justify-center">
              <NuxtLink to="/auth/login" class="text-sm text-primary hover:underline">
                Back to Login
              </NuxtLink>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
// Set page metadata
useHead({
  title: 'Reset Password - QuickMeazure',
});

// Set layout for this page
definePageMeta({
  layout: 'auth'
});

const route = useRoute();
const router = useRouter();
const toast = useToast();

const password = ref('');
const confirmPassword = ref('');
const loading = ref(false);
const token = ref(route.params.token);

// Computed properties for password validation
const passwordsMatch = computed(() => {
  return !confirmPassword.value || password.value === confirmPassword.value;
});

const canSubmit = computed(() => {
  return password.value && 
    confirmPassword.value && 
    password.value === confirmPassword.value;
});

const resetPassword = async () => {
  if (!canSubmit.value) return;
  
  loading.value = true;
  try {
    // Send request to reset password
    const response = await $fetch('/api/auth/reset-password', {
      method: 'POST',
      body: { 
        token: token.value,
        password: password.value
      }
    });
    
    if (response.success) {
      toast.add({
        title: 'Success',
        description: 'Your password has been reset successfully.',
        color: 'green'
      });
      
      // Clear fields
      password.value = '';
      confirmPassword.value = '';
      
      // Redirect to login
      setTimeout(() => {
        router.push('/auth/login');
      }, 2000);
    }
  } catch (error) {
    toast.add({
      title: 'Error',
      description: error.response?.data?.message || 'Failed to reset password. The link may be invalid or expired.',
      color: 'red'
    });
  } finally {
    loading.value = false;
  }
};
</script> 