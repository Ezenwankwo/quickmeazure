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
            <label class="block text-sm font-medium text-gray-700">Email address</label>
            <UInput
              v-model="email"
              type="email"
              placeholder="Email address"
              required
              class="w-full"
              size="lg"
            />
          </div>
          
          <div class="space-y-2">
            <label class="block text-sm font-medium text-gray-700">Password</label>
            <UInput
              v-model="password"
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
            <div class="flex justify-end mt-1">
              <NuxtLink to="/auth/forgot-password" class="text-sm font-medium text-primary hover:text-primary">
                Forgot your password?
              </NuxtLink>
            </div>
          </div>
        </div>
        
        <UButton
          type="submit"
          block
          size="lg"
          :loading="loading"
          :disabled="!email || !password"
        >
          Sign in with Email
        </UButton>
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

// Explicitly import UI components 
import { UInput, UButton, UIcon } from '#components'

const email = ref('')
const password = ref('')
const loading = ref(false)
const error = ref('')
const showPassword = ref(false)
// Add toast composable
const toast = useToast()

// Use Auth Utils
const { signIn } = useAuth()

async function handleLogin() {
  try {
    error.value = ''
    loading.value = true
    
    // Sign in using Auth Utils
    await signIn('credentials', {
      email: email.value,
      password: password.value,
      redirect: true
    })
  } catch (e) {
    const errorMessage = 'Invalid email or password'
    error.value = errorMessage
    console.error('Login error:', e)
    
    // Show error toast notification (red for errors)
    toast.add({
      title: 'Login Error',
      description: errorMessage,
      color: 'red',
      icon: 'i-heroicons-exclamation-triangle'
    })
  } finally {
    loading.value = false
  }
}

async function handleGoogleLogin() {
  try {
    error.value = ''
    loading.value = true
    
    // Sign in with Google
    await signIn('google', {
      redirect: true,
      callbackUrl: '/dashboard'
    })
  } catch (e) {
    const errorMessage = 'Google login failed'
    error.value = errorMessage
    console.error('Google login error:', e)
    
    // Show error toast notification (red for errors)
    toast.add({
      title: 'Login Error',
      description: errorMessage,
      color: 'red',
      icon: 'i-heroicons-exclamation-triangle'
    })
    
    loading.value = false
  }
}
</script>