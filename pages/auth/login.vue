<template>
  <div class="min-h-[calc(100vh-80px)] flex items-center justify-center py-12 px-4">
    <div class="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-md">
      <div class="text-center">
        <h2 class="text-3xl font-bold text-gray-900">Welcome back</h2>
        <p class="mt-2 text-gray-600">Sign in to your QuickMeazure account</p>
      </div>
      
      <form @submit.prevent="handleLogin" class="mt-8 space-y-6">
        <div class="space-y-4">
          <UFormGroup label="Email" name="email">
            <UInput
              v-model="email"
              type="email"
              placeholder="your@email.com"
              autocomplete="email"
              required
            />
          </UFormGroup>
          
          <UFormGroup label="Password" name="password">
            <UInput
              v-model="password"
              type="password"
              placeholder="••••••••"
              autocomplete="current-password"
              required
            />
          </UFormGroup>
        </div>
        
        <div class="flex items-center">
          <div class="flex items-center">
            <UCheckbox 
              v-model="rememberMe" 
              name="remember-me"
            />
            <label for="remember-me" class="ml-2 block text-sm text-gray-700">
              Remember me
            </label>
          </div>
        </div>
        
        <div>
          <UButton
            type="submit"
            color="primary"
            block
            :loading="isLoading"
          >
            Sign in
          </UButton>
          
          <div class="text-center mt-3">
            <NuxtLink to="/auth/forgot-password" class="text-sm text-primary-600 hover:text-primary-500">
              Forgot your password?
            </NuxtLink>
          </div>
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

// Form data
const email = ref('');
const password = ref('');
const rememberMe = ref(false);
const isLoading = ref(false);

// Import auth composable
const { login, isLoggedIn } = useAuth();
const router = useRouter();

// Reset auth interceptor flag on login page load
onMounted(() => {
  // Reset any previous error states when visiting the login page
  // This is done here rather than in the plugin to ensure a clean login state
  if (process.client) {
    // Clear all auth-related error flags to ensure clean login
    localStorage.removeItem('isHandlingAuthError');
    localStorage.removeItem('lastLoginTime');
  }
});

// Redirect if already logged in
watchEffect(() => {
  if (isLoggedIn.value) {
    router.push('/dashboard');
  }
});

// Handle login form submission
const handleLogin = async () => {
  if (!email.value || !password.value) {
    useToast().add({
      title: 'Error',
      description: 'Please enter both email and password',
      color: 'red',
      icon: 'i-heroicons-exclamation-circle',
    });
    return;
  }
  
  isLoading.value = true;
  
  try {
    // Clear any pending auth errors before login attempt
    if (process.client) {
      localStorage.removeItem('isHandlingAuthError');
    }
    
    const result = await login(email.value, password.value, rememberMe.value);
    
    if (result.success) {
      // Set login time marker to prevent immediate logout
      if (process.client) {
        localStorage.setItem('lastLoginTime', Date.now().toString());
      }
      
      useToast().add({
        title: 'Success',
        description: 'You have been logged in successfully',
        color: 'green',
        icon: 'i-heroicons-check-circle',
      });
      
      // Redirect to dashboard on successful login
      router.push('/dashboard');
    } else {
      useToast().add({
        title: 'Error',
        description: result.error || 'Login failed. Please try again.',
        color: 'red',
        icon: 'i-heroicons-exclamation-circle',
      });
    }
  } catch (error) {
    console.error('Login error:', error);
    useToast().add({
      title: 'Error',
      description: 'An unexpected error occurred. Please try again.',
      color: 'red',
      icon: 'i-heroicons-exclamation-circle',
    });
  } finally {
    isLoading.value = false;
  }
};
</script>