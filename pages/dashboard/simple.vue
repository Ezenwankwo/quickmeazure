<template>
  <div class="p-4">
    <h1 class="text-2xl font-bold mb-4">Simplified Dashboard</h1>
    <p class="mb-4">This is a simplified version of the dashboard with minimal functionality.</p>

    <!-- Basic Stats Cards -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      <UCard>
        <div class="text-xl font-bold">Clients</div>
        <div class="text-3xl font-bold mt-2">0</div>
      </UCard>

      <UCard>
        <div class="text-xl font-bold">Orders</div>
        <div class="text-3xl font-bold mt-2">0</div>
      </UCard>

      <UCard>
        <div class="text-xl font-bold">Revenue</div>
        <div class="text-3xl font-bold mt-2">₦0</div>
      </UCard>

      <UCard>
        <div class="text-xl font-bold">Plan</div>
        <div class="text-3xl font-bold mt-2">Free</div>
      </UCard>
    </div>

    <div class="flex space-x-4">
      <UButton to="/dashboard/test" color="gray">Test Page</UButton>
      <UButton to="/" color="primary">Go Home</UButton>
    </div>
  </div>
</template>

<script setup>
// Minimal setup without any API calls or complex logic
definePageMeta({
  layout: 'dashboard',
})

console.log('Simple dashboard page loaded')
</script>
