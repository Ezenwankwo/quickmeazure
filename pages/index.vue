<template>
  <div class="space-y-[3rem] py-[2rem]">
    <!-- Hero Section -->
    <HeroSection />

    <!-- Features Section -->
    <FeaturesSection />

    <!-- Pricing Section -->
    <PricingSection :monthly-plans="monthlyPlans" :annual-plans="annualPlans" />

    <!-- Testimonials Section -->
    <TestimonialsSection />

    <!-- CTA Section -->
    <CtaSection />
  </div>
</template>

<script setup>// Set page metadata
useHead({
  title: 'QuickMeazure - Tailor Measurement Management',
  meta: [
    { name: 'description', content: 'QuickMeazure helps tailors store client measurements, track orders, and manage payments all in one place.' }
  ]
});

// Default plans - will use these if API fetch fails
const monthlyPlans = [
  {
      "id": 1,
      "name": "Growth",
      "description": "Basic plan for solo tailors just getting started",
      "price": 0,
      "features": [
        "Up to 50 clients",
        "Up to 200 styles",
        "Unlimited orders"
      ],
      "isFeatured": false
  },
  {
      "id": 2,
      "name": "Professional",
      "description": "Perfect for growing tailor businesses",
      "price": 3000,
      "features": [
        "Up to 200 clients",
        "Unlimited styles",
        "Unlimited orders"
      ],
      "isFeatured": true
  },
  {
      "id": 3,
      "name": "Enterprise",
      "description": "For established tailoring businesses with larger clientele",
      "price": 5000,
      "features": [
        "Unlimited clients",
        "Unlimited styles",
        "Unlimited orders",
        "Team management"
      ],
      "isFeatured": false
  },
];

const annualPlans = [
  {
      "id": 1,
      "name": "Growth",
      "description": "Basic plan for solo tailors just getting started",
      "price": 0,
      "features": [
        "Up to 50 clients",
        "Up to 200 styles",
        "Unlimited orders"
      ],
      "isFeatured": false
  },
  {
      "id": 4,
      "name": "Professional",
      "description": "Standard plan with annual billing (save 15%)",
      "price": 30000,
      "features": [
        "Up to 200 clients",
        "Unlimited styles",
        "Unlimited orders"
      ],
      "isFeatured": true
  },
  {
      "id": 5,
      "name": "Enterprise",
      "description": "Premium plan with annual billing (save 15%)",
      "price": 50000,
      "features": [
        "Unlimited clients",
        "Unlimited styles",
        "Unlimited orders",
        "Team management"
      ],
      "isFeatured": false
  },
];
</script>