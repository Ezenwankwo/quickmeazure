<template>
  <section id="features" class="py-[3rem]">
    <h2 class="text-[1.875rem] font-bold text-center mb-[3rem]">Everything You Need to Run Your Tailor Business</h2>
    
    <div class="grid md:grid-cols-3 gap-[2rem]">
      <div v-for="(feature, index) in features" :key="index" class="bg-white p-[1.5rem] rounded-lg shadow-md">
        <div class="w-[3rem] h-[3rem] bg-primary-100 rounded-full flex items-center justify-center mb-[1rem]">
          <UIcon :name="feature.icon" class="text-primary-600 text-[1.25rem]" />
        </div>
        <h3 class="text-[1.25rem] font-semibold mb-[0.5rem]">{{ feature.title }}</h3>
        <p class="text-[#4B5563]">{{ feature.description }}</p>
      </div>
    </div>
  </section>
</template>

<script setup>
const features = [
  {
    icon: 'i-heroicons-user-group',
    title: 'Client Management',
    description: 'Store all your clients\' personal details in one secure place for easy access.'
  },
  {
    icon: 'i-heroicons-variable',
    title: 'Measurement Tracking',
    description: 'Record and access detailed measurements for each client with just a few clicks.'
  },
  {
    icon: 'i-heroicons-swatch',
    title: 'Style Catalog',
    description: 'Create a catalog of your styles and designs to show clients and track orders.'
  },
  {
    icon: 'i-heroicons-shopping-bag',
    title: 'Order Management',
    description: 'Keep track of all your orders, their status, and due dates in one organized system.'
  },
  {
    icon: 'i-heroicons-currency-dollar',
    title: 'Payment Tracking',
    description: 'Record deposits and balances, and keep your finances organized with ease.'
  },
  {
    icon: 'i-heroicons-device-phone-mobile',
    title: 'Mobile Friendly',
    description: 'Access your client data and measurements from anywhere on any device.'
  }
];
</script> 