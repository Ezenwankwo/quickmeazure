<template>
  <div class="flex min-h-screen items-center justify-center bg-gray-50">
    <div class="w-full max-w-md space-y-8 p-10 bg-white rounded-xl shadow">
      <div class="text-center">
        <h2 class="text-2xl md:text-3xl font-bold">Sign in to your account</h2>
        <p class="mt-2 text-sm text-gray-600">
          to start managing your clients and orders
        </p>
      </div>
      
      <!-- Google Sign In Button -->
      <div class="mt-8">
        <UButton
          block
          size="lg"
          variant="outline"
          @click="handleGoogleLogin"
          class="flex items-center justify-center"
        >
          <UIcon name="i-simple-icons-google" class="mr-2 text-lg" />
          Sign in with Google
        </UButton>
      </div>
      
      <!-- Divider -->
      <div class="relative my-4">
        <div class="absolute inset-0 flex items-center">
          <div class="w-full border-t border-gray-300"></div>
        </div>
        <div class="relative flex justify-center text-sm">
          <span class="px-2 bg-white text-gray-500">or continue with email</span>
        </div>
      </div>
      
      <form class="space-y-6" @submit.prevent="handleLogin">
        <div class="space-y-4 flex flex-col">
          <div class="space-y-2">
            <label for="email" class="block text-sm font-medium text-gray-700">Email address</label>
            <UInput
              v-model="form.email"
              type="email"
              id="email"
              placeholder="Email address"
              required
              class="w-full"
              size="lg"
            />
          </div>
          
          <div class="space-y-2">
            <label for="password" class="block text-sm font-medium text-gray-700">Password</label>
            <UInput
              v-model="form.password"
              id="password"
              :type="showPassword ? 'text' : 'password'"
              placeholder="Password"
              required
              class="w-full"
              size="lg"
            >
              <template #trailing>
                <UButton
                  color="gray"
                  variant="ghost"
                  icon
                  @click="showPassword = !showPassword"
                >
                  <UIcon :name="showPassword ? 'i-heroicons-eye-slash' : 'i-heroicons-eye'" />
                </UButton>
              </template>
            </UInput>
            <div class="flex justify-between mt-1">
              <div class="flex items-center">
                <UCheckbox v-model="form.rememberMe" name="remember" id="remember" color="primary" />
                <label for="remember" class="ml-2 text-sm text-gray-600">Remember me</label>
              </div>
              <NuxtLink to="/auth/forgot-password" class="text-sm font-medium text-primary hover:text-primary">
                Forgot your password?
              </NuxtLink>
            </div>
          </div>
        </div>
        
        <UButton
          type="submit"
          block
          color="primary"
          @click.prevent="handleLogin"
          size="lg"
          :loading="isSubmitting"
          :disabled="!form.email || !form.password"
        >
          Sign in with Email
        </UButton>
        
        <div class="text-center mt-4">
          <p class="text-sm text-gray-600">
            Don't have an account? <ULink to="/auth/register" class="font-medium">Sign up</ULink>
          </p>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
// Set page metadata
useHead({
  title: 'Login - QuickMeazure',
});

// Set layout for this page
definePageMeta({
  layout: 'auth'
});

import { useSessionAuth } from '~/composables/useSessionAuth';

const route = useRoute();
const form = ref({
  email: '',
  password: '',
  rememberMe: false
});
const isSubmitting = ref(false);
const errorMessage = ref('');
const loading = ref(false);
const error = ref('');
const showPassword = ref(false);
// Add toast composable
const toast = useToast()

// Use Auth composable
const { login } = useSessionAuth();

// Form submission handler
const handleLogin = async () => {
  isSubmitting.value = true;
  error.value = ''; // Reset error display
  
  try {
    // Call the login function from our auth composable
    const result = await login(
      form.value.email,
      form.value.password,
      form.value.rememberMe
    );
    
    if (result.success) {
      // Show success notification
      useToast().add({
        title: 'Welcome back!',
        description: 'You have been logged in successfully.',
        color: 'primary',
        icon: 'i-heroicons-check-circle'
      });
      
      // Only redirect if not already redirected by the auth service
      // The auth service redirects users without a subscription to the confirm page
      if (!result.redirected) {
        // Redirect to the intended destination or measure page
        if (route.query.redirect) {
          navigateTo(decodeURIComponent(route.query.redirect.toString()));
        } else {
          navigateTo('/clients/new');
        }
      }
    } else {
      // Set error message for display in the UI
      error.value = result.error || 'Invalid email or password';
      
      // Also show toast notification for the error
      toast.add({
        title: 'Login Failed',
        description: result.error || 'Invalid email or password',
        color: 'error',
        icon: 'i-heroicons-exclamation-triangle'
      });
    }
  } catch (err) {
    console.error('Login error:', err);
    error.value = 'An error occurred. Please try again.';
    
    // Show toast notification for unexpected errors
    toast.add({
      title: 'Login Error',
      description: 'An unexpected error occurred. Please try again.',
      color: 'error',
      icon: 'i-heroicons-exclamation-triangle'
    });
  } finally {
    isSubmitting.value = false;
  }
};

async function handleGoogleLogin() {
  try {
    error.value = '';
    loading.value = true;
    
    // Show notification that Google login is not currently available
    toast.add({
      title: 'Google Login',
      description: 'Google login is currently not available. Please use email and password.',
      color: 'warning',
      icon: 'i-heroicons-information-circle'
    });
  } catch (e) {
    const errorMessage = 'Google login failed';
    error.value = errorMessage;
    console.error('Google login error:', e);
    
    // Show error toast notification
    toast.add({
      title: 'Login Error',
      description: errorMessage,
      color: 'error',
      icon: 'i-heroicons-exclamation-triangle'
    });
  } finally {
    loading.value = false;
  }
}
</script>