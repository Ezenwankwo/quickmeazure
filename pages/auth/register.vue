<template>
  <div class="min-h-[calc(100vh-80px)] flex items-center justify-center py-12 px-4">
    <div class="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-md">
      <div class="text-center">
        <h2 class="text-3xl font-bold text-gray-900">Create your account</h2>
        <p class="mt-2 text-gray-600">Start managing your tailor business today</p>
      </div>
      
      <form @submit.prevent="handleRegister" class="mt-8 space-y-6">
        <div class="space-y-4">
          <UFormGroup label="Full Name" name="name">
            <UInput
              v-model="name"
              placeholder="Your full name"
              autocomplete="name"
              required
            />
          </UFormGroup>
          
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
              autocomplete="new-password"
              required
            />
          </UFormGroup>
          
          <UFormGroup label="Confirm Password" name="confirmPassword">
            <UInput
              v-model="confirmPassword"
              type="password"
              placeholder="••••••••"
              autocomplete="new-password"
              required
            />
          </UFormGroup>
          
          <UFormGroup label="Subscription Plan" name="plan">
            <URadioGroup
              v-model="selectedPlan"
              :options="subscriptionPlans"
              class="space-y-3"
            >
              <template #label="{ option }">
                <div class="flex justify-between w-full">
                  <div>
                    <span class="font-medium">{{ option.label }}</span>
                    <p class="text-sm text-gray-500">{{ option.description }}</p>
                  </div>
                  <span class="font-medium">{{ option.price }}</span>
                </div>
              </template>
            </URadioGroup>
          </UFormGroup>
        </div>
        
        <div class="flex items-center">
          <UCheckbox v-model="agreeToTerms" name="terms" required>
            I agree to the <a href="#" class="text-primary-600 hover:text-primary-500">Terms of Service</a> and <a href="#" class="text-primary-600 hover:text-primary-500">Privacy Policy</a>
          </UCheckbox>
        </div>
        
        <div>
          <UButton
            type="submit"
            color="primary"
            block
            :loading="isLoading"
            :disabled="!agreeToTerms || !isFormValid"
          >
            Create Account
          </UButton>
        </div>
      </form>
      
      <div class="text-center mt-4">
        <p class="text-sm text-gray-600">
          Already have an account?
          <NuxtLink to="/auth/login" class="font-medium text-primary-600 hover:text-primary-500">
            Sign in
          </NuxtLink>
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
// Set page metadata
useHead({
  title: 'Register - QuickMeazure',
});

// Form data
const name = ref('');
const email = ref('');
const password = ref('');
const confirmPassword = ref('');
const agreeToTerms = ref(false);
const isLoading = ref(false);

// Get plan from query params if available
const route = useRoute();
const initialPlan = route.query.plan || 'free';

// Subscription plans
const subscriptionPlans = [
  {
    value: 'free',
    label: 'Free Plan',
    description: 'Up to 100 clients',
    price: '₦0/month',
  },
  {
    value: 'standard',
    label: 'Standard Plan',
    description: 'Up to 500 clients',
    price: '₦5,000/month',
  },
  {
    value: 'premium',
    label: 'Premium Plan',
    description: 'Unlimited clients',
    price: '₦10,000/month',
  },
];

const selectedPlan = ref(initialPlan);

// Form validation
const isFormValid = computed(() => {
  return (
    name.value.trim() !== '' &&
    email.value.trim() !== '' &&
    password.value.length >= 8 &&
    password.value === confirmPassword.value
  );
});

// Mock register function - will be replaced with actual API call
const handleRegister = async () => {
  if (!isFormValid.value) return;
  
  isLoading.value = true;
  
  try {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // For demo purposes, we'll just redirect to dashboard
    // In a real app, this would create a user account and set auth state
    navigateTo('/dashboard');
  } catch (error) {
    console.error('Registration failed:', error);
    // Show error notification
  } finally {
    isLoading.value = false;
  }
};
</script>