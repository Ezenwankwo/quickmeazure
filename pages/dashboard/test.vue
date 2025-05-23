<template>
  <div class="p-4">
    <h1 class="text-2xl font-bold mb-4">Dashboard Test Page</h1>
    <p class="mb-4">If you can see this page, navigation to the dashboard directory is working.</p>
    <p class="mb-4">The issue might be specific to the dashboard index page.</p>

    <div class="flex space-x-4">
      <UButton to="/" color="gray">Go Home</UButton>
      <UButton to="/dashboard" color="primary">Try Dashboard Again</UButton>
    </div>
  </div>
</template>

<script setup>
// Minimal setup to avoid potential errors
definePageMeta({
  layout: 'dashboard',
})
</script>
