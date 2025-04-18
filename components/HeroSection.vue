<template>
  <section class="text-center space-y-[1.5rem]">
    <h1 class="text-[2.25rem] md:text-[3rem] font-bold text-[#111827]">
      Manage Your Tailor Business <span class="text-primary-600">Effortlessly</span>
    </h1>
    <p class="text-[1.25rem] text-[#4B5563] max-w-[48rem] mx-auto">
      QuickMeazure helps tailors store client measurements, track orders, and manage payments all in one place.
    </p>
    <div class="flex justify-center gap-[1rem]">
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
    <div class="mt-[2rem]">
      <NuxtImg src="/dashboard.png" alt="QuickMeazure Dashboard" class="rounded-lg shadow-xl mx-auto" style="max-width: 100%; height: auto; display: block;" />
    </div>
  </section>
</template>

<script setup>
// No props needed for this component
</script> 