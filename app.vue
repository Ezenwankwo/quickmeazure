<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>

<script setup>
// Set page metadata
useHead({
  title: 'QuickMeazure - Tailor Measurement Management',
  meta: [
    { name: 'description', content: 'Easily manage your clients\'s measurements, styles, and payments with QuickMeazure.' }
  ],
  link: [
    { rel: 'icon', type: 'image/svg+xml', href: '/favicon.ico' }
  ]
});
</script>
