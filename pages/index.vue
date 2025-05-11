<template>
  <div>
    <HeroSection />
    <FeaturesSection />
    <PricingSection />
    <TestimonialsSection />
    <CtaSection />
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