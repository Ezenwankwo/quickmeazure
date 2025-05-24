<template>
  <div class="flex min-h-screen flex-col items-center justify-center bg-gray-50 space-y-6">
    <!-- Signup Steps - First Item -->
    <div class="max-w-3xl w-full mb-6">
      <SignupSteps :current-step="1" />
    </div>

    <!-- Title and Subtitle - Outside Card -->
    <div class="text-center mb-6 w-full max-w-md">
      <h2 class="text-2xl md:text-3xl font-bold text-gray-900">Create your account</h2>
      <p class="mt-2 text-gray-600">Start managing your tailor business.</p>
    </div>

    <div class="max-w-md w-full space-y-6 bg-white p-4 sm:p-8 rounded-xl shadow">
      <!-- Google Sign Up Button -->
      <div class="mt-8">
        <UButton
          block
          size="lg"
          variant="outline"
          class="flex items-center justify-center"
          @click="handleGoogleRegister"
        >
          <UIcon name="i-simple-icons-google" class="mr-2 text-lg" />
          Sign up with Google
        </UButton>
      </div>

      <!-- Divider -->
      <div class="relative my-4">
        <div class="absolute inset-0 flex items-center">
          <div class="w-full border-t border-gray-300" />
        </div>
        <div class="relative flex justify-center text-sm">
          <span class="px-2 bg-white text-gray-500">or sign up with email</span>
        </div>
      </div>

      <form class="space-y-6" @submit.prevent="handleRegister">
        <div class="space-y-6">
          <div class="space-y-2">
            <label for="fullName" class="block text-sm font-medium text-gray-700">
              Full Name <span class="text-red-500">*</span>
            </label>
            <UInput
              id="fullName"
              v-model="name"
              name="name"
              placeholder="Your full name"
              required
              size="lg"
              class="w-full"
              :state="formErrors.name ? 'error' : undefined"
              :ui="{ icon: { trailing: { pointer: '' } } }"
            >
              <template #trailing>
                <UIcon v-if="name" name="i-heroicons-check-circle" class="text-green-500" />
              </template>
            </UInput>
            <p v-if="formErrors.name" class="mt-1 text-sm text-red-600">
              {{ formErrors.name }}
            </p>
          </div>

          <div class="space-y-2">
            <label for="email" class="block text-sm font-medium text-gray-700">
              Email <span class="text-red-500">*</span>
            </label>
            <UInput
              id="email"
              v-model="email"
              name="email"
              type="email"
              placeholder="Your email address"
              required
              size="lg"
              class="w-full"
              :state="formErrors.email ? 'error' : undefined"
              :ui="{ icon: { trailing: { pointer: '' } } }"
            >
              <template #trailing>
                <UIcon
                  v-if="email && email.includes('@')"
                  name="i-heroicons-check-circle"
                  class="text-green-500"
                />
              </template>
            </UInput>
            <p v-if="formErrors.email" class="mt-1 text-sm text-red-600">
              {{ formErrors.email }}
            </p>
          </div>

          <div class="space-y-2">
            <label for="password" class="block text-sm font-medium text-gray-700">
              Password <span class="text-red-500">*</span>
            </label>
            <UInput
              id="password"
              v-model="password"
              name="password"
              :type="showPassword ? 'text' : 'password'"
              placeholder="Choose a strong password"
              required
              size="lg"
              class="w-full"
              :ui="{ trailing: 'pe-1' }"
            >
              <template #trailing>
                <UButton
                  color="neutral"
                  variant="link"
                  size="sm"
                  :icon="showPassword ? 'i-lucide-eye-off' : 'i-lucide-eye'"
                  :aria-label="showPassword ? 'Hide password' : 'Show password'"
                  @click="showPassword = !showPassword"
                />
              </template>
            </UInput>
            <div v-if="password" class="mt-2">
              <div class="flex items-center gap-2">
                <div
                  class="h-1 flex-grow rounded-full"
                  :class="[passwordStrength >= 1 ? 'bg-green-500' : 'bg-gray-200']"
                />
                <div
                  class="h-1 flex-grow rounded-full"
                  :class="[passwordStrength >= 2 ? 'bg-green-500' : 'bg-gray-200']"
                />
                <div
                  class="h-1 flex-grow rounded-full"
                  :class="[passwordStrength >= 3 ? 'bg-green-500' : 'bg-gray-200']"
                />
                <div
                  class="h-1 flex-grow rounded-full"
                  :class="[passwordStrength >= 4 ? 'bg-green-500' : 'bg-gray-200']"
                />
              </div>

              <!-- Password criteria checklist -->
              <div class="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-x-2 gap-y-1">
                <div class="flex items-center">
                  <UIcon
                    :name="
                      password.length >= 8 ? 'i-heroicons-check-circle' : 'i-heroicons-x-circle'
                    "
                    class="mr-1.5 text-xs"
                    :class="password.length >= 8 ? 'text-green-500' : 'text-gray-400'"
                  />
                  <span
                    class="text-xs"
                    :class="password.length >= 8 ? 'text-green-600' : 'text-gray-500'"
                    >8+ characters</span
                  >
                </div>
                <div class="flex items-center">
                  <UIcon
                    :name="
                      hasUpperCase(password) ? 'i-heroicons-check-circle' : 'i-heroicons-x-circle'
                    "
                    class="mr-1.5 text-xs"
                    :class="hasUpperCase(password) ? 'text-green-500' : 'text-gray-400'"
                  />
                  <span
                    class="text-xs"
                    :class="hasUpperCase(password) ? 'text-green-600' : 'text-gray-500'"
                    >Uppercase letter</span
                  >
                </div>
                <div class="flex items-center">
                  <UIcon
                    :name="
                      hasLowerCase(password) ? 'i-heroicons-check-circle' : 'i-heroicons-x-circle'
                    "
                    class="mr-1.5 text-xs"
                    :class="hasLowerCase(password) ? 'text-green-500' : 'text-gray-400'"
                  />
                  <span
                    class="text-xs"
                    :class="hasLowerCase(password) ? 'text-green-600' : 'text-gray-500'"
                    >Lowercase letter</span
                  >
                </div>
                <div class="flex items-center">
                  <UIcon
                    :name="
                      hasNumber(password) ? 'i-heroicons-check-circle' : 'i-heroicons-x-circle'
                    "
                    class="mr-1.5 text-xs"
                    :class="hasNumber(password) ? 'text-green-500' : 'text-gray-400'"
                  />
                  <span
                    class="text-xs"
                    :class="hasNumber(password) ? 'text-green-600' : 'text-gray-500'"
                    >Number</span
                  >
                </div>
                <div class="flex items-center col-span-2">
                  <UIcon
                    :name="
                      hasSpecialChar(password) ? 'i-heroicons-check-circle' : 'i-heroicons-x-circle'
                    "
                    class="mr-1.5 text-xs"
                    :class="hasSpecialChar(password) ? 'text-green-500' : 'text-gray-400'"
                  />
                  <span
                    class="text-xs"
                    :class="hasSpecialChar(password) ? 'text-green-600' : 'text-gray-500'"
                    >Special character</span
                  >
                </div>
              </div>
            </div>
            <p v-if="formErrors.password" class="mt-1 text-sm text-red-600">
              {{ formErrors.password }}
            </p>
          </div>

          <div class="space-y-2">
            <label for="confirmPassword" class="block text-sm font-medium text-gray-700">
              Confirm Password <span class="text-red-500">*</span>
            </label>
            <UInput
              id="confirmPassword"
              v-model="confirmPassword"
              name="confirmPassword"
              :type="showConfirmPassword ? 'text' : 'password'"
              placeholder="Confirm your password"
              required
              size="lg"
              class="w-full"
              :ui="{ trailing: 'pe-1' }"
            >
              <template #trailing>
                <UButton
                  color="neutral"
                  variant="link"
                  size="sm"
                  :icon="showConfirmPassword ? 'i-lucide-eye-off' : 'i-lucide-eye'"
                  :aria-label="showConfirmPassword ? 'Hide password' : 'Show password'"
                  @click="showConfirmPassword = !showConfirmPassword"
                />
              </template>
            </UInput>
            <p v-if="formErrors.confirmPassword" class="mt-1 text-sm text-red-600">
              {{ formErrors.confirmPassword }}
            </p>
          </div>
        </div>

        <div class="flex items-center">
          <div class="flex items-center">
            <UCheckbox
id="terms"
v-model="agreeToTerms"
name="terms"
required
size="lg" />
            <label for="terms" class="ml-2 block text-sm text-gray-700">
              I agree to the <ULink to="/legal/terms" class="font-medium">terms</ULink> and
              <ULink to="/legal/privacy" class="font-medium">privacy policies</ULink>
              <span class="text-red-500">*</span>
            </label>
          </div>
        </div>
        <p v-if="formErrors.terms" class="mt-1 text-sm text-red-600">
          {{ formErrors.terms }}
        </p>

        <div>
          <UButton
            type="submit"
            color="primary"
            block
            size="lg"
            :loading="isLoading"
            :disabled="!isFormValid"
            aria-label="Create account with email"
          >
            Create Account with Email
          </UButton>
        </div>

        <div class="text-center my-4">
          <p class="text-sm text-gray-600">
            Already have an account? <ULink to="/auth/login" class="font-medium">Sign in</ULink>
          </p>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
// Set page metadata
import { useAuthStore } from '~/store'
import type { RegistrationData } from '~/store/types'

useHead({
  title: 'Register',
})

// Set layout for this page
definePageMeta({
  layout: 'auth',
})

// Import route composable
const _route = useRoute()
const router = useRouter()
const toast = useToast()

// Form data
const name = ref('')
const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const agreeToTerms = ref(false)
const isLoading = ref(false)
const showPassword = ref(false)
const showConfirmPassword = ref(false)
const formErrors = ref({})
// Get auth store
const authStore = useAuthStore()

// Password validation
const hasLowerCase = str => /[a-z]/.test(str)
const hasUpperCase = str => /[A-Z]/.test(str)
const hasNumber = str => /\d/.test(str)
const hasSpecialChar = str => /[!@#$%^&*()_+\-={}();':"\\|,.<>/?]/.test(str)

const passwordStrength = computed(() => {
  if (!password.value) return 0

  let strength = 0
  if (password.value.length >= 8) strength++
  if (hasLowerCase(password.value) && hasUpperCase(password.value)) strength++
  if (hasNumber(password.value)) strength++
  if (hasSpecialChar(password.value)) strength++

  return strength
})

// Form validation
// Validate form fields in real-time
const isFormValid = computed(() => {
  // Check if all required fields are filled
  const fieldsValid =
    !!name.value &&
    !!email.value &&
    !!password.value &&
    password.value === confirmPassword.value &&
    agreeToTerms.value

  // Check if password meets all criteria
  const passwordValid =
    password.value.length >= 8 &&
    hasUpperCase(password.value) &&
    hasLowerCase(password.value) &&
    hasNumber(password.value) &&
    hasSpecialChar(password.value)

  return fieldsValid && passwordValid
})

const validateForm = () => {
  const errors = {}

  // Validate name
  if (!name.value.trim()) {
    errors.name = 'Name is required'
  }

  // Validate email
  if (!email.value.trim()) {
    errors.email = 'Email is required'
  } else if (!/^\S+@\S+\.\S+$/.test(email.value)) {
    errors.email = 'Please enter a valid email address'
  }

  // Validate password
  if (!password.value) {
    errors.password = 'Password is required'
  } else {
    const passwordIssues = []

    if (password.value.length < 8) {
      passwordIssues.push('at least 8 characters')
    }
    if (!hasUpperCase(password.value)) {
      passwordIssues.push('an uppercase letter')
    }
    if (!hasLowerCase(password.value)) {
      passwordIssues.push('a lowercase letter')
    }
    if (!hasNumber(password.value)) {
      passwordIssues.push('a number')
    }
    if (!hasSpecialChar(password.value)) {
      passwordIssues.push('a special character')
    }

    if (passwordIssues.length > 0) {
      errors.password = `Password must include ${passwordIssues.join(', ')}`
    }
  }

  // Validate password confirmation
  if (password.value !== confirmPassword.value) {
    errors.confirmPassword = 'Passwords do not match'
  }

  // Validate terms agreement
  if (!agreeToTerms.value) {
    errors.terms = 'You must agree to the terms and privacy policy'
  }

  formErrors.value = errors
  return Object.keys(errors).length === 0
}

// Handle registration
async function handleRegister() {
  // Reset form errors
  formErrors.value = {}

  // Validate form
  if (!validateForm()) {
    return
  }

  // Submit the form
  isLoading.value = true

  try {
    // Create registration data object with our typed interface
    const registrationData: RegistrationData = {
      name: name.value,
      email: email.value,
      password: password.value,
    }

    // Register using the auth store with our typed data
    const result = await authStore.register(registrationData)

    if (result.success) {
      // Show success toast
      toast.add({
        title: 'Registration Successful',
        description: 'Your account has been created!',
        color: 'primary',
        icon: 'i-heroicons-check-circle',
      })

      // Navigate to subscription confirmation page instead of dashboard
      router.push('/auth/confirm')
    } else {
      // Handle registration failure
      const errorMessage = result.error || 'Registration failed'

      // Determine which field has the error
      if (
        errorMessage.toLowerCase().includes('email is already registered') ||
        errorMessage.toLowerCase().includes('email already exists') ||
        errorMessage.toLowerCase().includes('email already registered')
      ) {
        formErrors.value.email =
          'This email is already registered. Please use a different email or login instead.'
      } else if (errorMessage.toLowerCase().includes('email')) {
        formErrors.value.email = errorMessage
      } else if (errorMessage.toLowerCase().includes('password')) {
        formErrors.value.password = errorMessage
      } else {
        // Show general error toast
        toast.add({
          title: 'Registration Error',
          description: errorMessage,
          color: 'error',
          icon: 'i-heroicons-exclamation-triangle',
        })
      }
    }
  } catch (error) {
    console.error('Registration error:', error)

    // Show error toast
    toast.add({
      title: 'Registration Error',
      description: 'An unexpected error occurred. Please try again.',
      color: 'error',
      icon: 'i-heroicons-exclamation-triangle',
    })
  } finally {
    isLoading.value = false
  }
}

// Handle Google registration (same as login)
async function handleGoogleRegister() {
  try {
    // Show notification that Google sign-up is not currently available
    toast.add({
      title: 'Google Sign-up',
      description: 'Google sign-up is currently not available. Please use email and password.',
      color: 'warning',
      icon: 'i-heroicons-information-circle',
    })
  } catch (error) {
    console.error('Google registration error:', error)
  }
}
</script>
