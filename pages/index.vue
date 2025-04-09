<template>
  <div class="space-y-12 py-8">
    <!-- Hero Section -->
    <section class="text-center space-y-6">
      <h1 class="text-4xl md:text-5xl font-bold text-gray-900">
        Manage Your Tailor Business <span class="text-primary-600">Effortlessly</span>
      </h1>
      <p class="text-xl text-gray-600 max-w-3xl mx-auto">
        QuickMeazure helps tailors store client measurements, track orders, and manage payments all in one place.
      </p>
      <div class="flex justify-center gap-4">
        <UButton
          to="/auth/register"
          color="primary"
          size="xl"
        >
          Get Started Free
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
      <div class="mt-8">
        <img src="https://placehold.co/1200x600/e2e8f0/475569?text=QuickMeazure+Dashboard" alt="QuickMeazure Dashboard" class="rounded-lg shadow-xl mx-auto" />
      </div>
    </section>

    <!-- Features Section -->
    <section id="features" class="py-12">
      <h2 class="text-3xl font-bold text-center mb-12">Everything You Need to Run Your Tailor Business</h2>
      
      <div class="grid md:grid-cols-3 gap-8">
        <div class="bg-white p-6 rounded-lg shadow-md">
          <div class="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mb-4">
            <UIcon name="i-heroicons-user-group" class="text-primary-600 text-xl" />
          </div>
          <h3 class="text-xl font-semibold mb-2">Client Management</h3>
          <p class="text-gray-600">Store all your clients' personal details in one secure place for easy access.</p>
        </div>
        
        <div class="bg-white p-6 rounded-lg shadow-md">
          <div class="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mb-4">
            <UIcon name="i-heroicons-variable" class="text-primary-600 text-xl" />
          </div>
          <h3 class="text-xl font-semibold mb-2">Measurement Tracking</h3>
          <p class="text-gray-600">Record and access detailed measurements for each client with just a few clicks.</p>
        </div>
        
        <div class="bg-white p-6 rounded-lg shadow-md">
          <div class="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mb-4">
            <UIcon name="i-heroicons-swatch" class="text-primary-600 text-xl" />
          </div>
          <h3 class="text-xl font-semibold mb-2">Style Catalog</h3>
          <p class="text-gray-600">Create a catalog of your styles and designs to show clients and track orders.</p>
        </div>
        
        <div class="bg-white p-6 rounded-lg shadow-md">
          <div class="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mb-4">
            <UIcon name="i-heroicons-shopping-bag" class="text-primary-600 text-xl" />
          </div>
          <h3 class="text-xl font-semibold mb-2">Order Management</h3>
          <p class="text-gray-600">Keep track of all your orders, their status, and due dates in one organized system.</p>
        </div>
        
        <div class="bg-white p-6 rounded-lg shadow-md">
          <div class="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mb-4">
            <UIcon name="i-heroicons-currency-dollar" class="text-primary-600 text-xl" />
          </div>
          <h3 class="text-xl font-semibold mb-2">Payment Tracking</h3>
          <p class="text-gray-600">Record deposits and balances, and keep your finances organized with ease.</p>
        </div>
        
        <div class="bg-white p-6 rounded-lg shadow-md">
          <div class="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mb-4">
            <UIcon name="i-heroicons-device-phone-mobile" class="text-primary-600 text-xl" />
          </div>
          <h3 class="text-xl font-semibold mb-2">Mobile Friendly</h3>
          <p class="text-gray-600">Access your client data and measurements from anywhere on any device.</p>
        </div>
      </div>
    </section>

    <!-- Pricing Section -->
    <section id="pricing" class="py-12 bg-gray-50 rounded-xl p-8">
      <h2 class="text-3xl font-bold text-center mb-4">Simple, Transparent Pricing</h2>
      <p class="text-center text-gray-600 mb-12 max-w-2xl mx-auto">Choose the plan that fits your business needs. Start with our free plan and upgrade as your business grows.</p>
      
      <div class="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
        <!-- Free Plan -->
        <div class="bg-white rounded-lg shadow-md overflow-hidden">
          <div class="p-6">
            <h3 class="text-2xl font-bold mb-2">Free</h3>
            <p class="text-gray-600 mb-4">Perfect for small tailoring businesses</p>
            <div class="text-4xl font-bold mb-6">₦0<span class="text-lg text-gray-500 font-normal">/month</span></div>
            
            <ul class="space-y-3 mb-6">
              <li class="flex items-center">
                <UIcon name="i-heroicons-check-circle" class="text-green-500 mr-2" />
                <span>Up to 100 clients</span>
              </li>
              <li class="flex items-center">
                <UIcon name="i-heroicons-check-circle" class="text-green-500 mr-2" />
                <span>Basic measurements</span>
              </li>
              <li class="flex items-center">
                <UIcon name="i-heroicons-check-circle" class="text-green-500 mr-2" />
                <span>Payment tracking</span>
              </li>
            </ul>
          </div>
          
          <div class="p-6 bg-gray-50">
            <UButton
              to="/auth/register"
              color="primary"
              variant="outline"
              block
            >
              Get Started
            </UButton>
          </div>
        </div>
        
        <!-- Standard Plan -->
        <div class="bg-white rounded-lg shadow-md overflow-hidden transform scale-105 border-2 border-primary-500">
          <div class="bg-primary-500 text-white text-center py-2 text-sm font-medium">
            MOST POPULAR
          </div>
          <div class="p-6">
            <h3 class="text-2xl font-bold mb-2">Standard</h3>
            <p class="text-gray-600 mb-4">For growing tailoring businesses</p>
            <div class="text-4xl font-bold mb-6">₦5,000<span class="text-lg text-gray-500 font-normal">/month</span></div>
            
            <ul class="space-y-3 mb-6">
              <li class="flex items-center">
                <UIcon name="i-heroicons-check-circle" class="text-green-500 mr-2" />
                <span>Up to 500 clients</span>
              </li>
              <li class="flex items-center">
                <UIcon name="i-heroicons-check-circle" class="text-green-500 mr-2" />
                <span>Advanced measurements</span>
              </li>
              <li class="flex items-center">
                <UIcon name="i-heroicons-check-circle" class="text-green-500 mr-2" />
                <span>Payment tracking</span>
              </li>
              <li class="flex items-center">
                <UIcon name="i-heroicons-check-circle" class="text-green-500 mr-2" />
                <span>Style catalog</span>
              </li>
              <li class="flex items-center">
                <UIcon name="i-heroicons-check-circle" class="text-green-500 mr-2" />
                <span>Email notifications</span>
              </li>
            </ul>
          </div>
          
          <div class="p-6 bg-gray-50">
            <UButton
              to="/auth/register?plan=standard"
              color="primary"
              block
            >
              Choose Standard
            </UButton>
          </div>
        </div>
        
        <!-- Premium Plan -->
        <div class="bg-white rounded-lg shadow-md overflow-hidden">
          <div class="p-6">
            <h3 class="text-2xl font-bold mb-2">Premium</h3>
            <p class="text-gray-600 mb-4">For established tailoring businesses</p>
            <div class="text-4xl font-bold mb-6">₦10,000<span class="text-lg text-gray-500 font-normal">/month</span></div>
            
            <ul class="space-y-3 mb-6">
              <li class="flex items-center">
                <UIcon name="i-heroicons-check-circle" class="text-green-500 mr-2" />
                <span>Unlimited clients</span>
              </li>
              <li class="flex items-center">
                <UIcon name="i-heroicons-check-circle" class="text-green-500 mr-2" />
                <span>Advanced measurements</span>
              </li>
              <li class="flex items-center">
                <UIcon name="i-heroicons-check-circle" class="text-green-500 mr-2" />
                <span>Payment tracking</span>
              </li>
              <li class="flex items-center">
                <UIcon name="i-heroicons-check-circle" class="text-green-500 mr-2" />
                <span>Style catalog</span>
              </li>
              <li class="flex items-center">
                <UIcon name="i-heroicons-check-circle" class="text-green-500 mr-2" />
                <span>Email notifications</span>
              </li>
              <li class="flex items-center">
                <UIcon name="i-heroicons-check-circle" class="text-green-500 mr-2" />
                <span>Analytics dashboard</span>
              </li>
              <li class="flex items-center">
                <UIcon name="i-heroicons-check-circle" class="text-green-500 mr-2" />
                <span>Priority support</span>
              </li>
            </ul>
          </div>
          
          <div class="p-6 bg-gray-50">
            <UButton
              to="/auth/register?plan=premium"
              color="primary"
              variant="outline"
              block
            >
              Choose Premium
            </UButton>
          </div>
        </div>
      </div>
    </section>

    <!-- Testimonials Section -->
    <section class="py-12">
      <h2 class="text-3xl font-bold text-center mb-12">Trusted by Tailors Everywhere</h2>
      
      <div class="grid md:grid-cols-3 gap-8">
        <div class="bg-white p-6 rounded-lg shadow-md">
          <div class="flex items-center mb-4">
            <div class="text-yellow-400 flex">
              <UIcon name="i-heroicons-star" v-for="i in 5" :key="i" />
            </div>
          </div>
          <p class="text-gray-600 mb-4">"QuickMeazure has transformed how I manage my tailoring business. I can access client measurements instantly and never mix up orders anymore."</p>
          <div class="flex items-center">
            <div class="w-10 h-10 bg-gray-300 rounded-full mr-3"></div>
            <div>
              <h4 class="font-medium">Adebayo Johnson</h4>
              <p class="text-sm text-gray-500">Fashion Designer, Lagos</p>
            </div>
          </div>
        </div>
        
        <div class="bg-white p-6 rounded-lg shadow-md">
          <div class="flex items-center mb-4">
            <div class="text-yellow-400 flex">
              <UIcon name="i-heroicons-star" v-for="i in 5" :key="i" />
            </div>
          </div>
          <p class="text-gray-600 mb-4">"The payment tracking feature has helped me stay on top of my finances. I know exactly who has paid and who still owes a balance."</p>
          <div class="flex items-center">
            <div class="w-10 h-10 bg-gray-300 rounded-full mr-3"></div>
            <div>
              <h4 class="font-medium">Chioma Okafor</h4>
              <p class="text-sm text-gray-500">Tailor, Abuja</p>
            </div>
          </div>
        </div>
        
        <div class="bg-white p-6 rounded-lg shadow-md">
          <div class="flex items-center mb-4">
            <div class="text-yellow-400 flex">
              <UIcon name="i-heroicons-star" v-for="i in 5" :key="i" />
            </div>
          </div>
          <p class="text-gray-600 mb-4">"As my business grew, I upgraded to the Premium plan. The unlimited client capacity and analytics have been worth every penny."</p>
          <div class="flex items-center">
            <div class="w-10 h-10 bg-gray-300 rounded-full mr-3"></div>
            <div>
              <h4 class="font-medium">Emmanuel Nwachukwu</h4>
              <p class="text-sm text-gray-500">Fashion House Owner, Port Harcourt</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- CTA Section -->
    <section class="py-12 bg-primary-50 rounded-xl p-8 text-center">
      <h2 class="text-3xl font-bold mb-4">Ready to Streamline Your Tailor Business?</h2>
      <p class="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">Join thousands of tailors who are saving time and growing their business with QuickMeazure.</p>
      <UButton
        to="/auth/register"
        color="primary"
        size="xl"
      >
        Get Started for Free
      </UButton>
    </section>
  </div>
</template>

<script setup>
// Set page metadata
useHead({
  title: 'QuickMeazure - Tailor Measurement Management',
  meta: [
    { name: 'description', content: 'QuickMeazure helps tailors store client measurements, track orders, and manage payments all in one place.' }
  ]
});
</script>