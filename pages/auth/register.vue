<template>
  <div class="min-h-[calc(100vh-80px)] flex items-center justify-center py-12">
    <div class="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow">
      <div class="text-center">
        <h2 class="text-2xl md:text-3xl font-bold text-gray-900">Create your account</h2>
        <p class="mt-2 text-gray-600">Start managing your tailor business.</p>
      </div>
      
      <!-- Google Sign Up Button -->
      <div class="mt-8">
        <UButton
          block
          size="lg"
          variant="outline"
          @click="handleGoogleRegister"
          class="flex items-center justify-center"
        >
          <UIcon name="i-simple-icons-google" class="mr-2 text-lg" />
          Sign up with Google
        </UButton>
      </div>
      
      <!-- Divider -->
      <div class="relative my-4">
        <div class="absolute inset-0 flex items-center">
          <div class="w-full border-t border-gray-300"></div>
        </div>
        <div class="relative flex justify-center text-sm">
          <span class="px-2 bg-white text-gray-500">or sign up with email</span>
        </div>
      </div>
      
      <form @submit.prevent="handleRegister" class="space-y-6">
        <div class="space-y-6">
          <div class="space-y-2">
            <label class="block text-sm font-medium text-gray-700">Full Name</label>
            <UInput
              v-model="name"
              name="name"
              placeholder="Your full name"
              required
              class="w-full"
            />
          </div>
          
          <div class="space-y-2">
            <label class="block text-sm font-medium text-gray-700">Email</label>
            <UInput
              v-model="email"
              name="email"
              type="email"
              placeholder="Your email address"
              required
              class="w-full"
            />
          </div>
          
          <div class="space-y-2">
            <label class="block text-sm font-medium text-gray-700">Password</label>
            <UInput
              v-model="password"
              name="password"
              :type="showPassword ? 'text' : 'password'"
              placeholder="Choose a strong password"
              required
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
          </div>
          
          <div class="space-y-2">
            <label class="block text-sm font-medium text-gray-700">Confirm Password</label>
            <UInput
              v-model="confirmPassword"
              name="confirmPassword"
              :type="showConfirmPassword ? 'text' : 'password'"
              placeholder="Confirm your password"
              required
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
          </div>
        </div>
        
        <div class="flex items-center">
          <div class="flex items-center">
            <UCheckbox 
              v-model="agreeToTerms" 
              name="terms" 
              required
            />
            <label for="terms" class="ml-2 block text-sm text-gray-700">
              I agree to the <ULink to="/legal/terms" class="font-medium">Service</ULink> and <ULink to="/legal/privacy" class="font-medium">Privacy Policies</ULink>
            </label>
          </div>
        </div>
        
        <div>
          <UButton
            type="submit"
            color="primary"
            block
            :loading="isLoading"
            :disabled="!agreeToTerms || !isFormValid"
          >
            Create Account with Email
          </UButton>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
// Set page metadata
useHead({
  title: 'Register - QuickMeazure',
});

// Set layout for this page
definePageMeta({
  layout: 'auth'
});

// Import route composable
const route = useRoute();

// Form data
const name = ref('');
const email = ref('');
const password = ref('');
const confirmPassword = ref('');
const agreeToTerms = ref(false);
const isLoading = ref(false);
const showPassword = ref(false);
const showConfirmPassword = ref(false);

// Use Auth Utils
const { signIn } = useAuth();

// Form validation
const isFormValid = computed(() => {
  return (
    name.value.trim() !== '' &&
    email.value.trim() !== '' &&
    password.value.length >= 8 &&
    password.value === confirmPassword.value
  );
});

const handleRegister = async () => {
  if (!isFormValid.value) return;
  
  isLoading.value = true;
  
  try {
    // Use the register function from useAuth composable
    const auth = useAuth();
    const result = await auth.register(
      name.value,
      email.value,
      password.value
    );

    if (!result.success) {
      throw new Error(result.error || 'Registration failed');
    }

    // Show success message
    useToast().add({
      title: 'Registration successful',
      description: 'Welcome to QuickMeazure!',
      color: 'green'
    });

    // Get plan from URL query params if any
    const plan = route.query.plan || 'free';
    const billing = route.query.billing || 'monthly';

    // Redirect to plan confirmation page
    navigateTo(`/subscription/confirm?plan=${plan}&billing=${billing}`);
  } catch (error) {
    console.error('Registration failed:', error);
    useToast().add({
      title: 'Registration failed',
      description: error.message || 'An error occurred during registration',
      color: 'red'
    });
  } finally {
    isLoading.value = false;
  }
};

const handleGoogleRegister = async () => {
  isLoading.value = true;
  
  try {
    // Get plan from URL query params if any
    const plan = route.query.plan || 'free';
    const billing = route.query.billing || 'monthly';
    
    // Sign in with Google
    await signIn('google', {
      redirect: true,
      callbackUrl: `/subscription/confirm?plan=${plan}&billing=${billing}`
    });
  } catch (error) {
    console.error('Google registration failed:', error);
    useToast().add({
      title: 'Registration failed',
      description: 'An error occurred during Google registration',
      color: 'red'
    });
    isLoading.value = false;
  }
};
</script>