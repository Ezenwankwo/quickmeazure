<template>
  <div class="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
    <div class="w-full max-w-md space-y-8">
      <div class="text-center">
        <h2 class="mt-6 text-3xl font-bold tracking-tight text-gray-900">
          Forgot your password?
        </h2>
        <p class="mt-2 text-sm text-gray-600">
          Enter your email address and we'll send you a link to reset your password.
        </p>
      </div>

      <div class="mt-8">
        <div class="rounded-md shadow-sm">
          <div class="space-y-6">
            <UFormGroup label="Email address">
              <UInput
                v-model="email"
                type="email"
                autocomplete="email"
                required
                placeholder="your@email.com"
              />
            </UFormGroup>

            <div>
              <UButton
                type="submit"
                block
                color="primary"
                :loading="loading"
                :disabled="!email || loading"
                @click="sendResetLink"
              >
                Send Reset Link
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
  title: 'Forgot Password - QuickMeazure',
});

// Set layout for this page
definePageMeta({
  layout: 'auth'
});

const email = ref('');
const loading = ref(false);
const toast = useToast();

const sendResetLink = async () => {
  if (!email.value) return;
  
  loading.value = true;
  try {
    // Send request to reset password
    const response = await $fetch('/api/auth/forgot-password', {
      method: 'POST',
      body: { email: email.value }
    });
    
    if (response.success) {
      toast.add({
        title: 'Success',
        description: 'If there is an account with that email, we have sent a password reset link.',
        color: 'green'
      });
      
      // For development, log the reset URL to the console
      if (response.resetUrl) {
        console.log('Reset URL:', response.resetUrl);
      }
      
      // Clear email
      email.value = '';
    }
  } catch (error) {
    // Don't reveal if the email exists or not for security
    toast.add({
      title: 'Success',
      description: 'If there is an account with that email, we have sent a password reset link.',
      color: 'green'
    });
  } finally {
    loading.value = false;
  }
};
</script> 