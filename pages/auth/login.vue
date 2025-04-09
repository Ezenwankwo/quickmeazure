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
        
        <div class="flex items-center justify-between">
          <UCheckbox v-model="rememberMe" name="remember-me">
            Remember me
          </UCheckbox>
          
          <NuxtLink to="/auth/forgot-password" class="text-sm text-primary-600 hover:text-primary-500">
            Forgot your password?
          </NuxtLink>
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
        </div>
      </form>
      
      <div class="text-center mt-4">
        <p class="text-sm text-gray-600">
          Don't have an account?
          <NuxtLink to="/auth/register" class="font-medium text-primary-600 hover:text-primary-500">
            Sign up
          </NuxtLink>
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
// Set page metadata
useHead({
  title: 'Login - QuickMeazure',
});

// Form data
const email = ref('');
const password = ref('');
const rememberMe = ref(false);
const isLoading = ref(false);

// Import auth composable
const { login, isLoggedIn } = useAuth();
const router = useRouter();
const error = ref('');

// Redirect if already logged in
watchEffect(() => {
  if (isLoggedIn.value) {
    router.push('/dashboard');
  }
});

// Handle login form submission
const handleLogin = async () => {
  if (!email.value || !password.value) {
    error.value = 'Please enter both email and password';
    return;
  }
  
  error.value = '';
  isLoading.value = true;
  
  try {
    const result = await login(email.value, password.value);
    
    if (result.success) {
      // Redirect to dashboard on successful login
      router.push('/dashboard');
    } else {
      error.value = result.error || 'Login failed. Please try again.';
    }
  } catch (e) {
    console.error('Login error:', e);
    error.value = 'An unexpected error occurred. Please try again.';
  } finally {
    isLoading.value = false;
  }
};
</script>