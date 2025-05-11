import { defineNuxtConfig } from 'nuxt/config'

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  devtools: { enabled: true },
  modules: ['@nuxt/ui', 'nuxt-auth-utils', '@nuxt/image'],
  css: ['~/assets/css/main.css'],
  runtimeConfig: {
    // Keys within public are also exposed client-side
    public: {
      appName: 'QuickMeazure',
      appUrl: process.env.APP_URL || 'http://localhost:3000',
      supabaseUrl: process.env.SUPABASE_URL,
      supabaseKey: process.env.SUPABASE_KEY,
      paystackKey: process.env.PAYSTACK_PUBLIC_KEY || 'pk_test_your_paystack_public_key'
    },
    // Add auth secret for nuxt-auth-utils
    authSecret: process.env.AUTH_SECRET || 'your-secret-key',
    jwtSecret: process.env.JWT_SECRET,
    brevoApiKey: process.env.BREVO_API_KEY,
  },
  build: {
    transpile: ['@nuxt/ui']
  },
  vite: {
    optimizeDeps: {
      include: ['vue', '@nuxt/ui']
    },
    build: {
      sourcemap: false
    },
    // Disable service worker registration
    worker: {
      plugins: () => []
    }
  },
  nitro: {
    preset: 'vercel',
    sourceMap: false
  },
  sourcemap: false,
  compatibilityDate: '2025-04-08',
  components: [
    { path: '~/components', pathPrefix: false }
  ],
})