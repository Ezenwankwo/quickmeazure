<template>
  <div>
    <!-- Hero Section -->
    <section class="py-12 sm:py-16 text-center">
      <h1 class="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
        Manage Your Tailoring Business <span class="text-primary-600">Efficiently</span>
      </h1>
      <p class="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
        QuickMeazure helps you track clients, measurements, orders, and more - all in one place.
      </p>
      <div class="flex flex-col sm:flex-row gap-4 justify-center">
        <UButton
          v-if="!isLoggedIn"
          to="/auth/register"
          color="primary"
          size="xl"
        >
          Get Started Free
        </UButton>
        <UButton
          v-else
          to="/dashboard"
          color="primary"
          size="xl"
        >
          Go to Dashboard
        </UButton>
        <UButton
          to="#features"
          color="gray"
          variant="outline"
          size="xl"
        >
          Learn More
        </UButton>
      </div>
    </section>

    <!-- Features Section -->
    <section id="features" class="py-12 bg-gray-50">
      <div class="text-center mb-12">
        <h2 class="text-3xl font-bold text-gray-900 mb-4">
          Everything You Need to Run Your Tailoring Business
        </h2>
        <p class="text-xl text-gray-600 max-w-3xl mx-auto">
          Our all-in-one platform simplifies your workflow and helps you deliver exceptional service.
        </p>
      </div>
      
      <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div class="bg-white p-6 rounded-xl shadow-sm">
          <div class="h-12 w-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4">
            <UIcon name="i-heroicons-users" class="text-primary-600 text-xl" />
          </div>
          <h3 class="text-xl font-bold mb-2">Client Management</h3>
          <p class="text-gray-600">
            Keep track of all your clients and their contact information in one centralized database.
          </p>
        </div>
        
        <div class="bg-white p-6 rounded-xl shadow-sm">
          <div class="h-12 w-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4">
            <UIcon name="i-heroicons-variable" class="text-primary-600 text-xl" />
          </div>
          <h3 class="text-xl font-bold mb-2">Measurement Tracking</h3>
          <p class="text-gray-600">
            Record and organize all your client measurements with our easy-to-use digital system.
          </p>
        </div>
        
        <div class="bg-white p-6 rounded-xl shadow-sm">
          <div class="h-12 w-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4">
            <UIcon name="i-heroicons-shopping-bag" class="text-primary-600 text-xl" />
          </div>
          <h3 class="text-xl font-bold mb-2">Order Management</h3>
          <p class="text-gray-600">
            Create and track orders from start to finish, including payment status and delivery dates.
          </p>
        </div>
        
        <div class="bg-white p-6 rounded-xl shadow-sm">
          <div class="h-12 w-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4">
            <UIcon name="i-heroicons-swatch" class="text-primary-600 text-xl" />
          </div>
          <h3 class="text-xl font-bold mb-2">Style Catalog</h3>
          <p class="text-gray-600">
            Create a digital catalog of your designs and styles to easily reference during client consultations.
          </p>
        </div>
        
        <div class="bg-white p-6 rounded-xl shadow-sm">
          <div class="h-12 w-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4">
            <UIcon name="i-heroicons-currency-dollar" class="text-primary-600 text-xl" />
          </div>
          <h3 class="text-xl font-bold mb-2">Payment Tracking</h3>
          <p class="text-gray-600">
            Record full and partial payments, and keep track of outstanding balances for each order.
          </p>
        </div>
        
        <div class="bg-white p-6 rounded-xl shadow-sm">
          <div class="h-12 w-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4">
            <UIcon name="i-heroicons-chart-bar" class="text-primary-600 text-xl" />
          </div>
          <h3 class="text-xl font-bold mb-2">Business Insights</h3>
          <p class="text-gray-600">
            Gain valuable insights into your business performance with our analytics dashboard.
          </p>
        </div>
      </div>
    </section>

    <!-- Pricing Section -->
    <section id="pricing" class="py-12">
      <div class="text-center mb-12">
        <h2 class="text-3xl font-bold text-gray-900 mb-4">
          Simple, Transparent Pricing
        </h2>
        <p class="text-xl text-gray-600 max-w-3xl mx-auto">
          Choose the plan that works best for your business needs
        </p>
      </div>
      
      <div class="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
        <UCard class="h-full">
          <template #header>
            <h3 class="text-xl font-bold">Free</h3>
            <div class="mt-2">
              <span class="text-3xl font-bold">₦0</span>
              <span class="text-gray-600">/month</span>
            </div>
          </template>
          
          <div class="space-y-4">
            <div class="flex items-start">
              <UIcon name="i-heroicons-check-circle" class="text-green-500 mt-1 mr-2" />
              <span>Up to 100 clients</span>
            </div>
            <div class="flex items-start">
              <UIcon name="i-heroicons-check-circle" class="text-green-500 mt-1 mr-2" />
              <span>Unlimited measurements</span>
            </div>
            <div class="flex items-start">
              <UIcon name="i-heroicons-check-circle" class="text-green-500 mt-1 mr-2" />
              <span>Basic reporting</span>
            </div>
            <div class="flex items-start">
              <UIcon name="i-heroicons-x-circle" class="text-gray-300 mt-1 mr-2" />
              <span class="text-gray-500">Style catalog</span>
            </div>
            <div class="flex items-start">
              <UIcon name="i-heroicons-x-circle" class="text-gray-300 mt-1 mr-2" />
              <span class="text-gray-500">Payment integrations</span>
            </div>
          </div>
          
          <template #footer>
            <UButton
              to="/auth/register"
              color="gray"
              variant="outline"
              block
            >
              Start Free
            </UButton>
          </template>
        </UCard>
        
        <UCard class="h-full border-primary-500 relative">
          <div class="absolute top-0 right-0 left-0 bg-primary-500 text-white text-xs font-bold py-1 px-3 text-center rounded-t-lg">
            MOST POPULAR
          </div>
          <template #header>
            <h3 class="text-xl font-bold">Standard</h3>
            <div class="mt-2">
              <span class="text-3xl font-bold">₦2,500</span>
              <span class="text-gray-600">/month</span>
            </div>
          </template>
          
          <div class="space-y-4">
            <div class="flex items-start">
              <UIcon name="i-heroicons-check-circle" class="text-green-500 mt-1 mr-2" />
              <span>Up to 500 clients</span>
            </div>
            <div class="flex items-start">
              <UIcon name="i-heroicons-check-circle" class="text-green-500 mt-1 mr-2" />
              <span>Unlimited measurements</span>
            </div>
            <div class="flex items-start">
              <UIcon name="i-heroicons-check-circle" class="text-green-500 mt-1 mr-2" />
              <span>Advanced reporting</span>
            </div>
            <div class="flex items-start">
              <UIcon name="i-heroicons-check-circle" class="text-green-500 mt-1 mr-2" />
              <span>Style catalog</span>
            </div>
            <div class="flex items-start">
              <UIcon name="i-heroicons-x-circle" class="text-gray-300 mt-1 mr-2" />
              <span class="text-gray-500">Payment integrations</span>
            </div>
          </div>
          
          <template #footer>
            <UButton
              to="/auth/register"
              color="primary"
              block
            >
              Get Started
            </UButton>
          </template>
        </UCard>
        
        <UCard class="h-full">
          <template #header>
            <h3 class="text-xl font-bold">Premium</h3>
            <div class="mt-2">
              <span class="text-3xl font-bold">₦5,000</span>
              <span class="text-gray-600">/month</span>
            </div>
          </template>
          
          <div class="space-y-4">
            <div class="flex items-start">
              <UIcon name="i-heroicons-check-circle" class="text-green-500 mt-1 mr-2" />
              <span>Unlimited clients</span>
            </div>
            <div class="flex items-start">
              <UIcon name="i-heroicons-check-circle" class="text-green-500 mt-1 mr-2" />
              <span>Unlimited measurements</span>
            </div>
            <div class="flex items-start">
              <UIcon name="i-heroicons-check-circle" class="text-green-500 mt-1 mr-2" />
              <span>Complete business analytics</span>
            </div>
            <div class="flex items-start">
              <UIcon name="i-heroicons-check-circle" class="text-green-500 mt-1 mr-2" />
              <span>Style catalog</span>
            </div>
            <div class="flex items-start">
              <UIcon name="i-heroicons-check-circle" class="text-green-500 mt-1 mr-2" />
              <span>Payment integrations</span>
            </div>
          </div>
          
          <template #footer>
            <UButton
              to="/auth/register"
              color="gray"
              variant="outline"
              block
            >
              Get Started
            </UButton>
          </template>
        </UCard>
      </div>
    </section>

    <!-- CTA Section -->
    <section class="py-12 bg-primary-500 text-white text-center">
      <h2 class="text-3xl font-bold mb-4">Ready to streamline your tailoring business?</h2>
      <p class="text-xl max-w-3xl mx-auto mb-8">
        Join thousands of tailors who are using QuickMeazure to manage their clients, orders, and measurements.
      </p>
      <UButton
        to="/auth/register"
        color="white"
        size="xl"
      >
        Get Started Today
      </UButton>
    </section>
  </div>
</template>

<script setup>
definePageMeta({
  layout: 'default'
});

const { isLoggedIn } = useSessionAuth();

// Check if user is logged in, if so redirect to dashboard
onMounted(() => {
  if (isLoggedIn.value) {
    console.log('User is logged in, redirecting to dashboard');
    navigateTo('/dashboard');
  }
});
</script>