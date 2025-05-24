<template>
  <div class="flex min-h-screen flex-col items-center justify-center bg-gray-50 space-y-6">
    <!-- Title and Subtitle - Outside Card -->
    <div class="text-center mb-6 w-full max-w-md">
      <h2 class="text-2xl md:text-3xl font-bold text-gray-900">Sign in to your account</h2>
      <p class="mt-2 text-gray-600">to start managing your clients and orders</p>
    </div>

    <div class="w-full max-w-md space-y-6 p-4 sm:p-8 bg-white rounded-xl shadow">
      <!-- Google Sign In Button -->
      <div class="mt-8">
        <UButton
          block
          size="lg"
          variant="outline"
          class="flex items-center justify-center"
          @click="handleGoogleLogin"
        >
          <UIcon name="i-simple-icons-google" class="mr-2 text-lg" />
          Sign in with Google
        </UButton>
      </div>

      <!-- Divider -->
      <div class="relative my-4">
        <div class="absolute inset-0 flex items-center">
          <div class="w-full border-t border-gray-300" />
        </div>
        <div class="relative flex justify-center text-sm">
          <span class="px-2 bg-white text-gray-500">or continue with email</span>
        </div>
      </div>

      <ClientOnly>
        <form class="space-y-6" @submit.prevent="handleLogin">
          <div class="space-y-4 flex flex-col">
            <div class="space-y-2">
              <label
for="email"
class="block text-sm font-medium text-gray-700"
                >Email address</label
              >
              <UInput
                id="email"
                v-model="form.email"
                type="email"
                placeholder="Email address"
                required
                class="w-full"
                size="lg"
              />
            </div>

            <div class="space-y-2">
              <label for="password" class="block text-sm font-medium text-gray-700">Password</label>
              <UInput
                id="password"
                v-model="form.password"
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
@click="showPassword = !showPassword">
                    <UIcon :name="showPassword ? 'i-heroicons-eye-slash' : 'i-heroicons-eye'" />
                  </UButton>
                </template>
              </UInput>
              <div class="flex justify-between mt-1">
                <div class="flex items-center">
                  <UCheckbox
                    id="remember"
                    v-model="form.rememberMe"
                    name="remember"
                    color="primary"
                  />
                  <label for="remember" class="ml-2 text-sm text-gray-600">Remember me</label>
                </div>
                <NuxtLink
                  to="/auth/forgot-password"
                  class="text-sm font-medium text-primary hover:text-primary"
                >
                  Forgot your password?
                </NuxtLink>
              </div>
            </div>
          </div>

          <UButton
            type="submit"
            block
            color="primary"
            size="lg"
            :loading="isSubmitting"
            :disabled="!form.email || !form.password"
            @click.prevent="handleLogin"
          >
            Sign in with Email
          </UButton>

          <div class="text-center my-4">
            <p class="text-sm text-gray-600">
              Don't have an account? <ULink to="/auth/register" class="font-medium">Sign up</ULink>
            </p>
          </div>
        </form>
      </ClientOnly>
    </div>
  </div>
</template>

<script setup lang="ts">
// Set page metadata
import { useAuthStore } from '~/store'
import type { LoginCredentials } from '~/store/types'

useHead({
  title: 'Login',
})

// Set layout for this page
definePageMeta({
  layout: 'auth',
})

const route = useRoute()

// Initialize form with default empty values - safe for SSR
const form = ref<LoginCredentials>({
  email: '',
  password: '',
  remember: false,
})

// Initialize reactive state
const isSubmitting = ref(false)
const loading = ref(false)
const error = ref('')
const showPassword = ref(false)

// Add toast composable
const toast = useToast()

// Use Auth store
const authStore = useAuthStore()

// Form submission handler
// Make sure the login handler only runs on the client side
const handleLogin = async () => {
  // Skip execution during SSR
  if (import.meta.server) return

  isSubmitting.value = true
  error.value = '' // Reset error display

  try {
    // Log login attempt (safe now that we're client-side only)
    console.log('Attempting login with:', {
      email: form.value.email,
      passwordLength: form.value.password?.length,
    })

    // Call the login function from our auth store with our typed credentials
    const result = await authStore.login(form.value)

    // Log the result
    console.log('Login result:', {
      success: result.success,
      redirected: result.redirected,
      hasError: !!result.error,
    })

    if (result.success) {
      // Show success notification
      useToast().add({
        title: 'Welcome back!',
        description: 'You have been logged in successfully.',
        color: 'primary',
        icon: 'i-heroicons-check-circle',
      })

      // Only redirect if not already redirected by the auth service
      // The auth service redirects users without a subscription to the confirm page
      if (!result.redirected) {
        // Determine redirect destination
        const destination = route.query.redirect
          ? decodeURIComponent(route.query.redirect.toString())
          : '/dashboard' // Changed from '/clients/new' to '/dashboard'

        console.log('Redirecting to:', destination)

        // Use a slight delay to ensure auth state is fully updated before navigation
        setTimeout(() => {
          navigateTo(destination)
        }, 100)
      }
    } else {
      // Set error message for display in the UI
      error.value = result.error || 'Invalid email or password'

      // Also show toast notification for the error
      toast.add({
        title: 'Login Failed',
        description: result.error || 'Invalid email or password',
        color: 'error',
        icon: 'i-heroicons-exclamation-triangle',
      })
    }
  } catch (err) {
    console.error('Login error:', err)
    error.value = 'An error occurred. Please try again.'

    // Show toast notification for unexpected errors
    toast.add({
      title: 'Login Error',
      description: 'An unexpected error occurred. Please try again.',
      color: 'error',
      icon: 'i-heroicons-exclamation-triangle',
    })
  } finally {
    isSubmitting.value = false
  }
}

async function handleGoogleLogin() {
  try {
    error.value = ''
    loading.value = true

    // Show notification that Google login is not currently available
    toast.add({
      title: 'Google Login',
      description: 'Google login is currently not available. Please use email and password.',
      color: 'warning',
      icon: 'i-heroicons-information-circle',
    })
  } catch (e) {
    const errorMessage = 'Google login failed'
    error.value = errorMessage
    console.error('Google login error:', e)

    // Show error toast notification
    toast.add({
      title: 'Login Error',
      description: errorMessage,
      color: 'error',
      icon: 'i-heroicons-exclamation-triangle',
    })
  } finally {
    loading.value = false
  }
}
</script>
